import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Paper, Button, TextField, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  MenuItem, Select, FormControl, InputLabel, Card, CardContent, 
  Alert, Divider, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Stack, Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import { 
  AssignmentTurnedIn as AuditIcon, 
  Add as AddIcon, 
  CheckCircle as CompleteIcon,
  WarningAmber as WarningIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Group as PeopleIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const AuditCycles: React.FC = () => {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();

  // Data State
  const [cycles, setCycles] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Form
  const [cycleName, setCycleName] = useState('');
  const [assignedAuditors, setAssignedAuditors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [scopeDeptId, setScopeDeptId] = useState('All');
  const [scopeLocation, setScopeLocation] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Conduct Audit Modal/View
  const [activeCycle, setActiveCycle] = useState<any | null>(null);
  const [conductOpen, setConductOpen] = useState(false);
  const [auditNotes, setAuditNotes] = useState<{ [assetId: string]: string }>({});
  const [auditLocations, setAuditLocations] = useState<{ [assetId: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cyc = await api.getAuditCycles();
      const ast = await api.getAssets();
      const usr = await api.getUsers();
      const depts = await api.getDepartments();
      const items = await api.getAuditItems();

      setCycles(cyc);
      setAssets(ast);
      setUsers(usr.filter((u: any) => u.role === 'Asset Manager' || u.role === 'Admin'));
      setDepartments(depts);
      setAuditItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || assignedAuditors.length === 0 || !startDate) {
      addNotification('⚠️ Fields Required', 'Please provide a cycle name, date range, and assign at least one auditor.', 'warning');
      return;
    }

    try {
      await api.createAuditCycle({
        name: cycleName,
        start_date: startDate,
        end_date: endDate || null,
        scope_department_id: scopeDeptId === 'All' ? null : scopeDeptId,
        scope_location: scopeLocation || null,
        assigned_auditor_ids: assignedAuditors
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Audit Scheduled', `Cycle "${cycleName}" has been successfully scheduled.`, 'success');
      setCycleName('');
      setAssignedAuditors([]);
      setScopeDeptId('All');
      setScopeLocation('');
      setEndDate('');
      setScheduleOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to create audit cycle.', 'error');
    }
  };

  // Get assets currently matching the cycle scope
  const getAssetsInScope = (cycle: any) => {
    return assets.filter(a => {
      // 1. Department Scope check
      if (cycle.scope_department_id) {
        // Match allocations or asset department (if any)
        if (a.department_id !== cycle.scope_department_id) {
          // Check if allocated to this department
          const hasAlloc = getAssetAllocation(a.id);
          if (!hasAlloc || hasAlloc.department_id !== cycle.scope_department_id) {
            return false;
          }
        }
      }
      // 2. Location Scope check
      if (cycle.scope_location) {
        if (!a.location.toLowerCase().includes(cycle.scope_location.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  };

  const getAssetAllocation = (assetId: string) => {
    // Helper to find active allocation of asset
    return auditItems.find(item => item.asset_id === assetId); // simplified representation
  };

  const handleRecordInspection = async (assetId: string, statusChecked: 'Verified' | 'Missing' | 'Damaged') => {
    const locationChecked = auditLocations[assetId] || assets.find(a => a.id === assetId)?.location || '';
    const notes = auditNotes[assetId] || '';

    try {
      await api.createAuditItem({
        audit_cycle_id: activeCycle.id,
        asset_id: assetId,
        status_checked: statusChecked,
        location_checked: locationChecked,
        notes
      }, role, user?.email || 'admin@assetflow.com');

      addNotification(
        statusChecked === 'Verified' ? '✅ Verification Logged' : '⚠️ Discrepancy Flagged',
        `Asset has been recorded as ${statusChecked}.`,
        statusChecked === 'Verified' ? 'success' : 'warning'
      );
      loadData();
    } catch (err: any) {
      addNotification('❌ Failed to log check', err.message || 'Error occurred.', 'error');
    }
  };

  const handleCloseCycle = async (id: string) => {
    if (window.confirm('Are you sure you want to close this audit cycle? This will lock all checking records and auto-update missing asset statuses to Lost, and damaged assets to Under Maintenance (with auto-generated tickets).')) {
      try {
        await api.closeAuditCycle(id, role, user?.email || 'admin@assetflow.com');
        addNotification('🎉 Audit Cycle Closed', 'Physical audit cycle marked as completed and locked.', 'info');
        loadData();
      } catch (err: any) {
        addNotification('❌ Action Failed', err.message || 'Failed to close cycle.', 'error');
      }
    }
  };

  const handleDownloadReport = (cycle: any) => {
    const cycleItems = auditItems.filter(item => item.audit_cycle_id === cycle.id);
    const discrepancies = cycleItems.filter(item => item.discrepancy_found || item.status_checked === 'Missing' || item.status_checked === 'Damaged');

    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Audit Discrepancy Report: ${cycle.name}`, 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    const auditorsList = cycle.assigned_auditor_ids?.map((id: string) => getAuditorName(id)).join(', ') || getAuditorName(cycle.assigned_auditor_id);
    doc.text(`Status: ${cycle.status} | Auditors: ${auditorsList}`, 14, 21);
    doc.text(`Scope Location: ${cycle.scope_location || 'All Locations'} | Scope Dept: ${cycle.scope_department_id ? getDeptName(cycle.scope_department_id) : 'All Departments'}`, 14, 26);
    doc.text(`Cycle Range: ${cycle.start_date} to ${cycle.end_date || 'Ongoing'}`, 14, 31);

    const rows = discrepancies.map(item => {
      const asset = assets.find(a => a.id === item.asset_id);
      return [
        asset ? asset.name : 'Unknown',
        asset ? asset.asset_tag : 'N/A',
        asset ? asset.location : 'N/A',
        item.location_checked,
        asset ? asset.status : 'N/A',
        item.status_checked,
        item.notes || 'No remarks'
      ];
    });

    (doc as any).autoTable({
      head: [['Asset', 'Tag', 'DB Location', 'Audited Loc', 'DB Status', 'Audited Status', 'Remarks']],
      body: rows,
      startY: 37,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] } // Rose-red header for discrepancies
    });

    doc.save(`${cycle.name.replace(/\s+/g, '_')}_Discrepancy_Report.pdf`);
    addNotification('📄 PDF Report Generated', `Discrepancy file downloaded for ${cycle.name}.`, 'success');
  };

  // Helpers
  const getAuditorName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : id;
  };

  const getDeptName = (id: string) => {
    const found = departments.find(d => d.id === id);
    return found ? found.name : id;
  };

  const getDiscrepancyCount = (cycleId: string) => {
    return auditItems.filter(item => item.audit_cycle_id === cycleId && (item.discrepancy_found || item.status_checked === 'Missing' || item.status_checked === 'Damaged')).length;
  };

  const getCheckedCount = (cycleId: string) => {
    return auditItems.filter(item => item.audit_cycle_id === cycleId).length;
  };

  const isAssetAuditedInCycle = (cycleId: string, assetId: string) => {
    return auditItems.some(item => item.audit_cycle_id === cycleId && item.asset_id === assetId);
  };

  const getAssetAuditStateInCycle = (cycleId: string, assetId: string) => {
    const found = auditItems.find(item => item.audit_cycle_id === cycleId && item.asset_id === assetId);
    return found ? found.status_checked : '';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AuditIcon color="primary" sx={{ fontSize: '2.2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Asset Auditing & Verification</Typography>
            <Typography variant="caption" color="text.secondary">Run structured inventory cycles, assign auditors, and resolve flagged discrepancies</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setScheduleOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        >
          Initialize Audit Cycle
        </Button>
      </Box>

      {/* Audit cycle tables */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Active & Completed Inspection Cycles</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cycle Scope & Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Auditors Assigned</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Target</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Completion</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Discrepancies</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No audit cycles scheduled yet. Click 'Initialize Audit Cycle'.
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((c) => {
                    const scopeAssets = getAssetsInScope(c);
                    const checkedCount = getCheckedCount(c.id);
                    const discrepanciesCount = getDiscrepancyCount(c.id);
                    const totalInScope = scopeAssets.length;
                    
                    const auditorsList = c.assigned_auditor_ids 
                      ? c.assigned_auditor_ids.map((id: string) => getAuditorName(id)).join(', ') 
                      : getAuditorName(c.assigned_auditor_id);

                    return (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {c.name}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                            📍 Scope: {c.scope_location || 'All Locations'} | 🏢 Dept: {c.scope_department_id ? getDeptName(c.scope_department_id) : 'All'}
                          </Typography>
                        </TableCell>
                        <TableCell>{auditorsList}</TableCell>
                        <TableCell>{c.start_date}</TableCell>
                        <TableCell>{c.end_date || 'Ongoing'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={c.status} 
                            size="small"
                            color={c.status === 'Completed' ? 'success' : c.status === 'In Progress' ? 'warning' : 'default'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <strong>{checkedCount} / {totalInScope}</strong> Assets Checked
                        </TableCell>
                        <TableCell>
                          {discrepanciesCount > 0 ? (
                            <Chip 
                              label={`${discrepanciesCount} Flags`} 
                              size="small" 
                              color="error" 
                              icon={<WarningIcon fontSize="small" />}
                              sx={{ fontWeight: 'bold' }}
                            />
                          ) : (
                            <Typography variant="body2" color="success.main" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>0 Issues</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {c.status === 'In Progress' && (
                              <>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="primary" 
                                  onClick={() => {
                                    setActiveCycle(c);
                                    setConductOpen(true);
                                  }}
                                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  Audit Deck
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="success" 
                                  startIcon={<CompleteIcon />}
                                  onClick={() => handleCloseCycle(c.id)}
                                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                  Close & Update
                                </Button>
                              </>
                            )}
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error" 
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadReport(c)}
                              disabled={discrepanciesCount === 0}
                              sx={{ textTransform: 'none', borderRadius: 1.5 }}
                            >
                              PDF Report
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Schedule Audit Modal */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Schedule Structured Inventory Cycle</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField 
              fullWidth
              label="Cycle Name *"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g. 2026 Q3 Facilities Audit"
            />
            
            {/* Multi auditor select */}
            <FormControl fullWidth>
              <InputLabel>Assign Auditor(s) *</InputLabel>
              <Select
                multiple
                value={assignedAuditors}
                onChange={(e) => setAssignedAuditors(e.target.value as string[])}
                input={<OutlinedInput label="Assign Auditor(s) *" />}
                renderValue={(selected) => selected.map(id => getAuditorName(id)).join(', ')}
              >
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    <Checkbox checked={assignedAuditors.includes(u.id)} />
                    <ListItemText primary={`${u.first_name} ${u.last_name} (${u.role})`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider>Cycle Scope</Divider>

            <FormControl fullWidth size="small">
              <InputLabel>Department Scope</InputLabel>
              <Select
                value={scopeDeptId}
                label="Department Scope"
                onChange={(e) => setScopeDeptId(e.target.value)}
              >
                <MenuItem value="All">All Departments</MenuItem>
                {departments.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField 
              fullWidth
              label="Location Scope Filter"
              value={scopeLocation}
              onChange={(e) => setScopeLocation(e.target.value)}
              placeholder="e.g. Warehouse B"
              size="small"
            />

            <Divider />

            <TextField 
              fullWidth
              label="Start Date *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField 
              fullWidth
              label="End Target Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setScheduleOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleScheduleSubmit} variant="contained" sx={{ borderRadius: 2 }}>Initialize Cycle</Button>
        </DialogActions>
      </Dialog>

      {/* Conduct Verification Audits Modal / Dashboard Deck */}
      <Dialog 
        open={conductOpen} 
        onClose={() => setConductOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '85vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          🕵️ Auditor Inspection Console ({activeCycle?.name})
        </DialogTitle>
        <DialogContent dividers>
          {activeCycle && (
            <Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Scope: **{activeCycle.scope_location || 'All Locations'}** | Department: **{activeCycle.scope_department_id ? getDeptName(activeCycle.scope_department_id) : 'All'}**
              </Alert>

              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Target Assets list for physical scanning & checking:
              </Typography>

              <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                {getAssetsInScope(activeCycle).map((asset) => {
                  const isChecked = isAssetAuditedInCycle(activeCycle.id, asset.id);
                  const checkState = getAssetAuditStateInCycle(activeCycle.id, asset.id);

                  return (
                    <Paper 
                      key={asset.id} 
                      variant="outlined" 
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 2.5, 
                        bgcolor: isChecked ? 'action.hover' : 'background.paper',
                        borderColor: isChecked ? 'divider' : 'primary.light',
                        borderWidth: isChecked ? 1 : 1.5
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {asset.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Tag: {asset.asset_tag} | SN: {asset.serial_number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            📍 DB Location: <strong>{asset.location}</strong>
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <TextField 
                            label="Physical Location Found" 
                            size="small"
                            fullWidth
                            disabled={isChecked}
                            value={auditLocations[asset.id] !== undefined ? auditLocations[asset.id] : asset.location}
                            onChange={(e) => setAuditLocations({ ...auditLocations, [asset.id]: e.target.value })}
                            sx={{ mb: 1.5 }}
                          />
                          <TextField 
                            label="Auditor remarks" 
                            size="small"
                            fullWidth
                            disabled={isChecked}
                            placeholder="Add notes / serial match"
                            value={auditNotes[asset.id] || ''}
                            onChange={(e) => setAuditNotes({ ...auditNotes, [asset.id]: e.target.value })}
                          />
                        </Grid>

                        <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                          {isChecked ? (
                            <Chip 
                              label={`Audited: ${checkState}`} 
                              color={checkState === 'Verified' ? 'success' : checkState === 'Missing' ? 'error' : 'warning'}
                              sx={{ fontWeight: 'bold' }} 
                            />
                          ) : (
                            <Stack spacing={1} direction="row" justifyContent="flex-end">
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success" 
                                onClick={() => handleRecordInspection(asset.id, 'Verified')}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Verify
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                onClick={() => handleRecordInspection(asset.id, 'Missing')}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Missing
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="warning" 
                                onClick={() => handleRecordInspection(asset.id, 'Damaged')}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Damaged
                              </Button>
                            </Stack>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConductOpen(false)} sx={{ color: 'text.secondary' }}>Close Deck</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditCycles;
