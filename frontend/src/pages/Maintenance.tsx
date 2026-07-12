import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, TextField, 
  Button, MenuItem, Table, TableBody, TableCell, TableHead, 
  TableRow, Chip, Slider, Stack, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  IconButton, Alert, TableContainer, Paper, Divider, Avatar
} from '@mui/material';
import { 
  Build as MaintenanceIcon, 
  CalendarMonth as CalendarIcon, 
  Warning as WarningIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AssignmentInd as TechIcon,
  PlayArrow as StartIcon,
  DoneAll as ResolveIcon,
  History as HistoryIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Maintenance: React.FC = () => {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();

  // Data state
  const [assets, setAssets] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Anomaly asset state
  const [activeAsset, setActiveAsset] = useState<any | null>(null);
  const [temp, setTemp] = useState<number>(35.0);
  const [vibration, setVibration] = useState<number>(1.0);
  const [hours, setHours] = useState<number>(0);

  // Maintenance Form State
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDateCell, setSelectedDateCell] = useState<string>('');
  const [formAsset, setFormAsset] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formVendor, setFormVendor] = useState('TechCorp Solutions');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

  // Workflow Dialog States
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState('');
  const [assignedTech, setAssignedTech] = useState('');

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvedCost, setResolvedCost] = useState('');

  // History state
  const [historyAssetId, setHistoryAssetId] = useState('');

  // Calendar state (Current Month)
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await api.getAssets();
      const m = await api.getMaintenanceLogs();
      const u = await api.getUsers();
      const v = await api.getVendors();
      
      setAssets(a);
      setMaintenance(m);
      setUsers(u);
      setVendors(v);

      if (a.length > 0) {
        const hvac = a.find(x => x.category === 'Facilities') || a[0];
        setActiveAsset(hvac);
        setTemp(Number(hvac.telemetry_temp));
        setVibration(Number(hvac.telemetry_vibration));
        setHours(Number(hvac.telemetry_hours));
        setHistoryAssetId(hvac.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePredictedRisk = (t: number, v: number, h: number): number => {
    let score = 5;
    if (t > 50) score += (t - 50) * 1.2;
    if (v > 2) score += (v - 2) * 8.5;
    if (h > 5000) score += Math.min(25, (h - 5000) / 1000);
    return Number(Math.min(99.5, Math.max(5.0, score)).toFixed(1));
  };

  const handleTelemetryUpdate = async () => {
    if (!activeAsset) return;

    const risk = calculatePredictedRisk(temp, vibration, hours);
    const updates = {
      telemetry_temp: temp,
      telemetry_vibration: vibration,
      telemetry_hours: hours,
      risk_score: risk
    };

    const updated = await api.updateAsset(activeAsset.id, updates, role, user?.email || 'admin@assetflow.com');
    if (updated) {
      addNotification(
        risk > 75 ? '🚨 High Failure Risk Flagged' : '📊 Telemetry Calibrated',
        `${activeAsset.name} risk index is now ${risk}% (Temp: ${temp}°C, Vibration: ${vibration} mm/s).`,
        risk > 75 ? 'error' : 'info'
      );
      loadData();
    }
  };

  const handleSelectAssetSlider = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setActiveAsset(asset);
      setTemp(Number(asset.telemetry_temp));
      setVibration(Number(asset.telemetry_vibration));
      setHours(Number(asset.telemetry_hours));
    }
  };

  const handleCreateMaintenance = async () => {
    if (!formAsset || !formDesc || !formCost || !selectedDateCell) {
      addNotification('⚠️ Fields Required', 'Please complete all required fields.', 'warning');
      return;
    }

    const isManager = role === 'Admin' || role === 'Asset Manager';
    const payload = {
      asset_id: formAsset,
      description: formDesc,
      cost: Number(formCost),
      status: isManager ? 'Approved' : 'Pending', // Pending approval if raised by Employee
      approval_status: isManager ? 'Approved' : 'Pending Approval',
      scheduled_date: selectedDateCell,
      performed_by: isManager ? formVendor : null,
      requested_by: user?.id || null,
      priority: formPriority,
      photo_url: formPhotoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
    };

    const log = await api.createMaintenanceLog(payload, role, user?.email || 'admin@assetflow.com');
    if (log) {
      if (isManager) {
        addNotification('🛠️ Repair Cycle Scheduled', 'Added and scheduled in system calendar.', 'success');
      } else {
        addNotification('⏳ Request Submitted', 'Maintenance ticket submitted for Manager review.', 'info');
      }
      setScheduleDialogOpen(false);
      setFormAsset('');
      setFormDesc('');
      setFormCost('');
      setFormPhotoUrl('');
      loadData();
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await api.approveMaintenanceRequest(id, user?.id || 'admin', role, user?.email || 'admin@assetflow.com');
      // Set status to Approved
      await api.updateMaintenanceLog(id, { status: 'Approved' });
      addNotification('✅ Ticket Approved', 'Maintenance request has been approved and is ready for technician assignment.', 'success');
      loadData();
    } catch (err: any) {
      addNotification('❌ Approval Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await api.rejectMaintenanceRequest(id, role, user?.email || 'admin@assetflow.com');
      addNotification('❌ Ticket Rejected', 'Maintenance request was rejected and cancelled.', 'warning');
      loadData();
    } catch (err: any) {
      addNotification('❌ Rejection Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleAssignTechnicianClick = (id: string) => {
    setActiveTicketId(id);
    const ticket = maintenance.find(m => m.id === id);
    setAssignedTech(ticket?.performed_by || 'TechCorp Solutions');
    setAssignDialogOpen(true);
  };

  const handleAssignTechSubmit = async () => {
    if (!assignedTech) return;
    try {
      await api.updateMaintenanceLog(activeTicketId, { 
        status: 'Technician Assigned',
        performed_by: assignedTech
      });
      addNotification('🔧 Technician Assigned', `Work assigned to ${assignedTech}.`, 'success');
      setAssignDialogOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Assignment Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleStartWork = async (id: string) => {
    try {
      await api.updateMaintenanceLog(id, { status: 'In Progress' });
      addNotification('⚡ Repair In Progress', 'Technician has started repair work.', 'info');
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleResolveClick = (id: string) => {
    setActiveTicketId(id);
    const ticket = maintenance.find(m => m.id === id);
    setResolvedCost(ticket?.cost?.toString() || '0');
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = async () => {
    try {
      await api.updateMaintenanceLog(activeTicketId, { 
        status: 'Completed', // 'Completed' in storage maps to Resolved
        cost: Number(resolvedCost),
        completion_date: new Date().toISOString().split('T')[0]
      });
      
      const ticket = maintenance.find(m => m.id === activeTicketId);
      const asset = assets.find(a => a.id === ticket?.asset_id);
      
      addNotification(
        '🎉 Maintenance Resolved', 
        `Repair for "${asset ? asset.name : 'Asset'}" is resolved and asset status updated back to Available.`, 
        'success'
      );
      setResolveDialogOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Resolution Failed', err.message || 'Error occurred.', 'error');
    }
  };

  // Calendar rendering math
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfMonth(year, month);

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const handleCellClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateCell(dateStr);
    setScheduleDialogOpen(true);
  };

  const getTicketsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return maintenance.filter(m => m.scheduled_date === dateStr && m.approval_status === 'Approved' && m.status !== 'Completed');
  };

  // Get Priority Color
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return '#991b1b';
      case 'High': return '#ea580c';
      case 'Medium': return '#eab308';
      case 'Low': return '#2563eb';
      default: return '#71717a';
    }
  };

  // Workflow states: Pending Approval, Approved, Technician Assigned, In Progress, Completed (Resolved)
  const getWorkflowChipColor = (m: any) => {
    if (m.approval_status === 'Pending Approval' || m.status === 'Pending') return 'warning';
    if (m.status === 'Approved') return 'primary';
    if (m.status === 'Technician Assigned') return 'secondary';
    if (m.status === 'In Progress') return 'info';
    if (m.status === 'Completed' || m.status === 'Resolved') return 'success';
    if (m.status === 'Cancelled' || m.approval_status === 'Rejected') return 'error';
    return 'default';
  };

  const getWorkflowLabel = (m: any) => {
    if (m.approval_status === 'Pending Approval' || m.status === 'Pending') return 'Pending Approval';
    if (m.status === 'Approved') return 'Approved (Needs Tech)';
    if (m.status === 'Completed') return 'Resolved';
    return m.status;
  };

  // Group tickets
  const pendingRequests = maintenance.filter(m => m.status === 'Pending' || m.approval_status === 'Pending Approval');
  const activeSchedules = maintenance.filter(m => m.status !== 'Pending' && m.approval_status !== 'Pending Approval');

  const getRequesterName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : 'Employee';
  };

  const getHistoryLogsForAsset = () => {
    return maintenance
      .filter(m => m.asset_id === historyAssetId)
      .sort((a, b) => new Date(b.created_at || b.scheduled_date).getTime() - new Date(a.created_at || a.scheduled_date).getTime());
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Maintenance & Telemetry Control Deck
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit repair tickets, route supervisor approvals, assign technicians, and track maintenance lifecycles
          </Typography>
        </Box>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Telemetry Simulator & Predictive maintenance */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" /> Telemetry Anomaly Simulator
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Calibrate mechanical operating environments to project machine breakdowns in real-time.
              </Typography>

              {/* Asset Select */}
              <FormControl fullWidth size="small" sx={{ mb: 3.5 }}>
                <InputLabel>Asset telemetry stream</InputLabel>
                <Select
                  value={activeAsset?.id || ''}
                  label="Asset telemetry stream"
                  onChange={(e) => handleSelectAssetSlider(e.target.value)}
                >
                  {assets.map(a => (
                    <MenuItem key={a.id} value={a.id}>{a.name} ({a.serial_number})</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {activeAsset && (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Temperature Gauge</Typography>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>{temp}°C</Typography>
                    </Stack>
                    <Slider 
                      min={20} 
                      max={130} 
                      step={0.5} 
                      value={temp} 
                      onChange={(e, val) => setTemp(val as number)}
                      valueLabelDisplay="auto"
                      color={temp > 75 ? 'error' : temp > 50 ? 'warning' : 'primary'}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Vibration Index (G-Force)</Typography>
                      <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>{vibration} mm/s</Typography>
                    </Stack>
                    <Slider 
                      min={0.1} 
                      max={12} 
                      step={0.1} 
                      value={vibration} 
                      onChange={(e, val) => setVibration(val as number)}
                      valueLabelDisplay="auto"
                      color={vibration > 5 ? 'error' : vibration > 2 ? 'warning' : 'primary'}
                    />
                  </Box>

                  <Box sx={{ mb: 3.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Operating Hours</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{hours} hrs</Typography>
                    </Stack>
                    <Slider 
                      min={0} 
                      max={40000} 
                      step={50} 
                      value={hours} 
                      onChange={(e, val) => setHours(val as number)}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 3, border: '1px dashed', borderColor: 'divider' }}>
                    <Grid container alignItems="center">
                      <Grid item xs={7}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Likelihood of Mechanical Failure:</Typography>
                      </Grid>
                      <Grid item xs={5} sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={`${calculatePredictedRisk(temp, vibration, hours)}%`}
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '0.9rem', 
                            px: 0.5,
                            bgcolor: calculatePredictedRisk(temp, vibration, hours) > 75 ? 'error.main' : calculatePredictedRisk(temp, vibration, hours) > 40 ? 'warning.main' : 'success.main',
                            color: '#fff'
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={handleTelemetryUpdate}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Commit Telemetry Updates
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule Calendar */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="primary" /> Maintenance Work Calendar
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton onClick={handlePrevMonth} size="small"><PrevIcon /></IconButton>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mx: 1.5, minWidth: 100, textAlign: 'center' }}>
                    {monthYearStr}
                  </Typography>
                  <IconButton onClick={handleNextMonth} size="small"><NextIcon /></IconButton>
                </Box>
              </Box>

              <Grid container spacing={1} sx={{ textAlign: 'center', mb: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <Grid item xs={12/7} key={d}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{d}</Typography>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={1}>
                {cells.map((day, idx) => {
                  const tickets = day ? getTicketsForDate(day) : [];
                  return (
                    <Grid 
                      item 
                      xs={12/7} 
                      key={idx}
                      onClick={() => day && handleCellClick(day)}
                    >
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          height: 72, 
                          p: 0.5, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          bgcolor: day ? 'background.paper' : 'action.disabledBackground',
                          borderColor: day ? 'divider' : 'transparent',
                          cursor: day ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          '&:hover': day ? { bgcolor: 'action.hover' } : {}
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: day ? 'text.primary' : 'text.disabled',
                            alignSelf: 'flex-start'
                          }}
                        >
                          {day}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, width: '100%', overflow: 'hidden' }}>
                          {tickets.slice(0, 2).map((t, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                bgcolor: t.status === 'Completed' ? 'success.main' : t.status === 'In Progress' ? 'info.main' : 'warning.main',
                                height: 5,
                                borderRadius: 1
                              }} 
                              title={t.description}
                            />
                          ))}
                          {tickets.length > 2 && (
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', alignSelf: 'flex-end', fontWeight: 'bold' }}>
                              +{tickets.length - 2}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approvals Queue (Only seen by Admins, Asset Managers, and Department Heads) */}
      {role !== 'Employee' && (
        <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: 'warning.light', mb: 4, boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
              ⏳ Pending Maintenance Approvals Queue ({pendingRequests.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Asset Tag</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Est. Cost</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Photo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                        No pending maintenance approvals. All tickets routed.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests.map((req) => {
                      const asset = assets.find(a => a.id === req.asset_id);
                      return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <strong>{asset ? asset.name : 'Unknown Asset'}</strong>
                            <Typography variant="caption" sx={{ display: 'block' }}>{asset?.asset_tag}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  {req.priority === 'Critical' && <span className="pulse-red" />}
                                  <span>{req.priority || 'Medium'}</span>
                                </Stack>
                              } 
                              size="small" 
                              sx={{ 
                                bgcolor: `${getPriorityColor(req.priority || 'Medium')}15`, 
                                color: getPriorityColor(req.priority || 'Medium'),
                                fontWeight: 'bold',
                                fontSize: '0.72rem'
                              }} 
                            />
                          </TableCell>
                          <TableCell>{getRequesterName(req.requested_by)}</TableCell>
                          <TableCell>{req.description}</TableCell>
                          <TableCell>${Number(req.cost).toFixed(2)}</TableCell>
                          <TableCell>{req.scheduled_date}</TableCell>
                          <TableCell>
                            {req.photo_url ? (
                              <Avatar variant="rounded" src={req.photo_url} sx={{ width: 34, height: 34, cursor: 'pointer' }} onClick={() => window.open(req.photo_url, '_blank')} />
                            ) : (
                              <ImageIcon color="action" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success" 
                                startIcon={<ApproveIcon />}
                                onClick={() => handleApproveRequest(req.id)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error" 
                                startIcon={<RejectIcon />}
                                onClick={() => handleRejectRequest(req.id)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Reject
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
      )}

      {/* Active Workorders & Live Logs */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Active Work Orders & Lifecycle Management</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Asset Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Issue Details</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Technician / Vendor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Target Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Workflow Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Control Handles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                ) : activeSchedules.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>No active maintenance workorders.</TableCell></TableRow>
                ) : (
                  [...activeSchedules].sort((a,b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((m) => {
                    const asset = assets.find(a => a.id === m.asset_id);
                    return (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <strong>{asset ? asset.name : 'Unknown Asset'}</strong>
                          <Typography variant="caption" sx={{ display: 'block' }}>Tag: {asset?.asset_tag} | Loc: {asset?.location}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                {m.priority === 'Critical' && <span className="pulse-red" />}
                                <span>{m.priority || 'Medium'}</span>
                              </Stack>
                            } 
                            size="small" 
                            sx={{ 
                              bgcolor: `${getPriorityColor(m.priority || 'Medium')}15`, 
                              color: getPriorityColor(m.priority || 'Medium'),
                              fontWeight: 'bold',
                              fontSize: '0.72rem'
                            }} 
                          />
                        </TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell>{m.performed_by || 'Unassigned'}</TableCell>
                        <TableCell>${Number(m.cost).toFixed(2)}</TableCell>
                        <TableCell>{m.scheduled_date}</TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                {m.status === 'In Progress' && <span className="pulse-green" />}
                                {(m.status === 'Technician Assigned' || m.status === 'Approved') && <span className="pulse-amber" />}
                                <span>{getWorkflowLabel(m)}</span>
                              </Stack>
                            } 
                            color={getWorkflowChipColor(m) as any}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {m.status !== 'Completed' && m.status !== 'Cancelled' && role !== 'Employee' && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {/* Workflow State transitions */}
                              {m.status === 'Approved' && (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="secondary"
                                  startIcon={<TechIcon />}
                                  onClick={() => handleAssignTechnicianClick(m.id)}
                                >
                                  Assign Tech
                                </Button>
                              )}
                              {m.status === 'Technician Assigned' && (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="info"
                                  startIcon={<StartIcon />}
                                  onClick={() => handleStartWork(m.id)}
                                >
                                  Start Work
                                </Button>
                              )}
                              {m.status === 'In Progress' && (
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="success"
                                  startIcon={<ResolveIcon />}
                                  onClick={() => handleResolveClick(m.id)}
                                >
                                  Resolve
                                </Button>
                              )}
                            </Stack>
                          )}
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

      {/* Asset Maintenance History Panel */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="action" /> Comprehensive Asset Maintenance History
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 260, mb: 3 }}>
            <InputLabel>Select Asset to View History</InputLabel>
            <Select
              value={historyAssetId}
              label="Select Asset to View History"
              onChange={(e) => setHistoryAssetId(e.target.value)}
            >
              {assets.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.asset_tag})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Service Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Vendor / Technician</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Resolved Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getHistoryLogsForAsset().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                      No maintenance records listed for this asset.
                    </TableCell>
                  </TableRow>
                ) : (
                  getHistoryLogsForAsset().map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{h.scheduled_date}</TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={h.priority || 'Medium'} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${getPriorityColor(h.priority || 'Medium')}15`, 
                            color: getPriorityColor(h.priority || 'Medium'),
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }} 
                        />
                      </TableCell>
                      <TableCell>{h.performed_by || 'N/A'}</TableCell>
                      <TableCell>${Number(h.cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getWorkflowLabel(h)} 
                          color={getWorkflowChipColor(h) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{h.completion_date || 'Ongoing'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Schedule Maintenance Dialog (Called from calendar cell click) */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {role === 'Admin' || role === 'Asset Manager' ? 'Schedule Maintenance' : 'Request Maintenance'} ({selectedDateCell})
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Asset *</InputLabel>
              <Select value={formAsset} onChange={(e) => setFormAsset(e.target.value)} label="Asset *">
                {assets.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name} ({a.asset_tag})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority *</InputLabel>
              <Select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} label="Priority *">
                <MenuItem value="Low">🟢 Low</MenuItem>
                <MenuItem value="Medium">🟡 Medium</MenuItem>
                <MenuItem value="High">🟠 High</MenuItem>
                <MenuItem value="Critical">🔴 Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField 
              label="Service Description *" 
              fullWidth 
              size="small"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />

            <TextField 
              label="Estimated Cost ($) *" 
              type="number"
              fullWidth 
              size="small"
              value={formCost}
              onChange={(e) => setFormCost(e.target.value)}
            />

            <TextField 
              label="Photo URL (Attachment)" 
              placeholder="Paste photo link or leave blank"
              fullWidth 
              size="small"
              value={formPhotoUrl}
              onChange={(e) => setFormPhotoUrl(e.target.value)}
            />

            {(role === 'Admin' || role === 'Asset Manager') && (
              <FormControl fullWidth size="small">
                <InputLabel>Vendor Partner</InputLabel>
                <Select value={formVendor} onChange={(e) => setFormVendor(e.target.value)} label="Vendor Partner">
                  {vendors.map(v => (
                    <MenuItem key={v.id} value={v.name}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateMaintenance} variant="contained" color="primary" sx={{ borderRadius: 1.5 }}>
            {role === 'Admin' || role === 'Asset Manager' ? 'Create Workorder' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Assign Technician / Partner</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Technician / Partner *</InputLabel>
              <Select value={assignedTech} onChange={(e) => setAssignedTech(e.target.value)} label="Technician / Partner *">
                {vendors.map(v => (
                  <MenuItem key={v.id} value={v.name}>{v.name} (⭐ {v.rating})</MenuItem>
                ))}
                <MenuItem value="Internal Facilities Team">Internal Facilities Team</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAssignTechSubmit} variant="contained" color="primary">Assign Tech</Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Resolve Maintenance Ticket</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField 
              label="Actual Final Cost ($) *" 
              type="number"
              fullWidth 
              size="small"
              value={resolvedCost}
              onChange={(e) => setResolvedCost(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleResolveSubmit} variant="contained" color="success">Resolve Ticket</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;
