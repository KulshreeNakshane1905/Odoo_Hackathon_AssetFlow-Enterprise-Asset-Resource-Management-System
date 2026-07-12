import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Paper, Button, TextField, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  MenuItem, Select, FormControl, InputLabel, Card, CardContent, 
  Alert, Divider, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Stack
} from '@mui/material';
import { 
  AssignmentTurnedIn as AuditIcon, 
  Add as AddIcon, 
  CheckCircle as CompleteIcon,
  WarningAmber as WarningIcon,
  Download as DownloadIcon
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
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Form
  const [cycleName, setCycleName] = useState('');
  const [assignedAuditorId, setAssignedAuditorId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Conduct Audit Modal
  const [activeCycle, setActiveCycle] = useState<any | null>(null);
  const [conductOpen, setConductOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [statusChecked, setStatusChecked] = useState('Available');
  const [locationChecked, setLocationChecked] = useState('');
  const [notes, setNotes] = useState('');

  // Report Modal
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cyc = await api.getAuditCycles();
      const ast = await api.getAssets();
      const usr = await api.getUsers();
      const items = await api.getAuditItems();

      setCycles(cyc);
      setAssets(ast);
      setUsers(usr.filter((u: any) => u.role === 'Asset Manager' || u.role === 'Admin'));
      setAuditItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || !assignedAuditorId || !startDate) {
      addNotification('⚠️ Fields Required', 'Please complete all audit scheduling inputs.', 'warning');
      return;
    }
    try {
      await api.createAuditCycle({
        name: cycleName,
        start_date: startDate,
        assigned_auditor_id: assignedAuditorId
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Audit Scheduled', `Cycle ${cycleName} initialized successfully.`, 'success');
      setCycleName('');
      setAssignedAuditorId('');
      setScheduleOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to create audit cycle.', 'error');
    }
  };

  const handleConductClick = (cycle: any) => {
    setActiveCycle(cycle);
    setSelectedAssetId('');
    setStatusChecked('Available');
    setLocationChecked('');
    setNotes('');
    setConductOpen(true);
  };

  const handleAuditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !statusChecked || !locationChecked) {
      addNotification('⚠️ Missing Selection', 'Please select asset, status, and verify location.', 'warning');
      return;
    }

    try {
      await api.createAuditItem({
        audit_cycle_id: activeCycle.id,
        asset_id: selectedAssetId,
        status_checked: statusChecked,
        location_checked: locationChecked,
        notes
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('✅ Verification Recorded', 'Physically audited asset state has been logged.', 'success');
      
      // Reset verification form inputs
      setSelectedAssetId('');
      setStatusChecked('Available');
      setLocationChecked('');
      setNotes('');
      loadData();
    } catch (err: any) {
      addNotification('❌ Submission Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleCloseCycle = async (id: string) => {
    if (window.confirm('Are you sure you want to close this audit cycle? This compiles findings.')) {
      try {
        await api.updateAuditCycle(id, {
          status: 'Completed',
          end_date: new Date().toISOString().split('T')[0]
        });
        addNotification('🎉 Audit Cycle Closed', 'Physical audit cycle marked as complete.', 'info');
        loadData();
      } catch (err: any) {
        addNotification('❌ Action Failed', err.message || 'Failed to close cycle.', 'error');
      }
    }
  };

  const handleDownloadReport = (cycle: any) => {
    const cycleItems = auditItems.filter(item => item.audit_cycle_id === cycle.id);
    const discrepancies = cycleItems.filter(item => item.discrepancy_found);

    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Discrepancy Report: ${cycle.name}`, 14, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Status: Completed | Auditor Assigned: ${getAuditorName(cycle.assigned_auditor_id)}`, 14, 21);
    doc.text(`Run Date: ${cycle.start_date} | Resolved: ${cycle.end_date || 'In Progress'}`, 14, 26);

    const rows = discrepancies.map(item => {
      const asset = assets.find(a => a.id === item.asset_id);
      return [
        asset ? asset.name : 'Unknown',
        asset ? asset.serial_number : 'N/A',
        asset ? asset.location : 'N/A',
        item.location_checked,
        asset ? asset.status : 'N/A',
        item.status_checked,
        item.notes || 'No remarks'
      ];
    });

    (doc as any).autoTable({
      head: [['Asset', 'Serial #', 'DB Location', 'Checked Loc', 'DB Status', 'Checked Status', 'Remarks']],
      body: rows,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] } // Crimson header for discrepancies
    });

    doc.save(`${cycle.name.replace(/\s+/g, '_')}_Discrepancies.pdf`);
    addNotification('📄 PDF Report Generated', `Discrepancy file downloaded for ${cycle.name}.`, 'success');
  };

  // Helpers
  const getAuditorName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : 'Unassigned';
  };

  const getDiscrepancyCount = (cycleId: string) => {
    return auditItems.filter(item => item.audit_cycle_id === cycleId && item.discrepancy_found).length;
  };

  const getCheckedCount = (cycleId: string) => {
    return auditItems.filter(item => item.audit_cycle_id === cycleId).length;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AuditIcon color="primary" sx={{ fontSize: '2.2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Audit Cycles</Typography>
            <Typography variant="caption" color="text.secondary">Plan, conduct physical inventory inspections, and generate discrepancy reports</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setScheduleOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Schedule Audit Cycle
        </Button>
      </Box>

      {/* Audit cycle tables */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2.5 }}>Active & Historical Inspection Cycles</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cycle Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned Auditor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Audited Items</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Discrepancies</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No audit cycles scheduled yet. Click 'Schedule Audit Cycle'.
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{c.name}</TableCell>
                      <TableCell>{getAuditorName(c.assigned_auditor_id)}</TableCell>
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
                      <TableCell>{getCheckedCount(c.id)} Checked</TableCell>
                      <TableCell>
                        {getDiscrepancyCount(c.id) > 0 ? (
                          <Chip 
                            label={`${getDiscrepancyCount(c.id)} Warnings`} 
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
                                onClick={() => handleConductClick(c)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Audit Items
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="success" 
                                startIcon={<CompleteIcon />}
                                onClick={() => handleCloseCycle(c.id)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Close Cycle
                              </Button>
                            </>
                          )}
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="error" 
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadReport(c)}
                            disabled={getDiscrepancyCount(c.id) === 0}
                            sx={{ textTransform: 'none', borderRadius: 1.5 }}
                          >
                            PDF Report
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Schedule Audit Modal */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Schedule New Inventory Audit</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField 
              fullWidth
              label="Cycle Name *"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g. 2026 Q3 Hardware Audit"
            />
            <FormControl fullWidth>
              <InputLabel>Assigned Auditor *</InputLabel>
              <Select
                value={assignedAuditorId}
                label="Assigned Auditor *"
                onChange={(e) => setAssignedAuditorId(e.target.value)}
              >
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              fullWidth
              label="Start Date *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setScheduleOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleScheduleSubmit} variant="contained">Schedule Cycle</Button>
        </DialogActions>
      </Dialog>

      {/* Conduct Verification Audits Modal */}
      <Dialog open={conductOpen} onClose={() => setConductOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Inspect & Verify Assets ({activeCycle?.name})</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }} component="form" onSubmit={handleAuditItemSubmit}>
            <FormControl fullWidth>
              <InputLabel>Select Asset to Verify</InputLabel>
              <Select
                value={selectedAssetId}
                label="Select Asset to Verify"
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  const selectedAssetObj = assets.find(a => a.id === e.target.value);
                  if (selectedAssetObj) {
                    setLocationChecked(selectedAssetObj.location);
                    setStatusChecked(selectedAssetObj.status);
                  }
                }}
              >
                {assets.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name} (SN: {a.serial_number} | expected: {a.location})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Physical Status Found</InputLabel>
              <Select
                value={statusChecked}
                label="Physical Status Found"
                onChange={(e) => setStatusChecked(e.target.value)}
              >
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Allocated">Allocated</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
                <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                <MenuItem value="Lost">Lost</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
                <MenuItem value="Disposed">Disposed</MenuItem>
              </Select>
            </FormControl>

            <TextField 
              fullWidth
              label="Physical Location Found"
              value={locationChecked}
              onChange={(e) => setLocationChecked(e.target.value)}
              placeholder="e.g. Warehouse B, Room 204"
            />

            <TextField 
              fullWidth
              label="Auditor Remarks / Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder="Record any physical discrepancies or asset health conditions found"
            />

            <Button type="submit" variant="contained" color="secondary" fullWidth sx={{ py: 1.2 }}>
              Record Verification Check
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConductOpen(false)} sx={{ color: 'text.secondary' }}>Close Inspection Panel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditCycles;
