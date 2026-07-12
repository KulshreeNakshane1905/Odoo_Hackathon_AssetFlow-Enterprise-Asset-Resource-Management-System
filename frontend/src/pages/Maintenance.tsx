import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, TextField, 
  Button, MenuItem, Table, TableBody, TableCell, TableHead, 
  TableRow, Chip, Slider, Stack, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  IconButton, Alert, TableContainer, Paper
} from '@mui/material';
import { 
  Build as MaintenanceIcon, 
  CalendarMonth as CalendarIcon, 
  Warning as WarningIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
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
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Anomaly asset state
  const [activeAsset, setActiveAsset] = useState<any | null>(null);
  const [temp, setTemp] = useState<number>(35.0);
  const [vibration, setVibration] = useState<number>(1.0);
  const [hours, setHours] = useState<number>(0);

  // Maintenance form state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDateCell, setSelectedDateCell] = useState<string>('');
  const [formAsset, setFormAsset] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formVendor, setFormVendor] = useState('TechCorp Solutions');

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
      setAssets(a);
      setMaintenance(m);
      setUsers(u);

      if (a.length > 0) {
        const hvac = a.find(x => x.category === 'Facilities') || a[0];
        setActiveAsset(hvac);
        setTemp(Number(hvac.telemetry_temp));
        setVibration(Number(hvac.telemetry_vibration));
        setHours(Number(hvac.telemetry_hours));
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

    const autoApprove = role === 'Admin' || role === 'Asset Manager';
    const payload = {
      asset_id: formAsset,
      description: formDesc,
      cost: Number(formCost),
      status: autoApprove ? 'Scheduled' : 'Scheduled',
      approval_status: autoApprove ? 'Approved' : 'Pending Approval',
      scheduled_date: selectedDateCell,
      performed_by: formVendor,
      requested_by: user?.id || null
    };

    const log = await api.createMaintenanceLog(payload, role, user?.email || 'admin@assetflow.com');
    if (log) {
      if (autoApprove) {
        addNotification('🛠️ Repair Cycle Scheduled', 'Added to system calendar.', 'success');
      } else {
        addNotification('⏳ Request Submitted', 'Maintenance ticket submitted for manager approval.', 'info');
      }
      setScheduleDialogOpen(false);
      setFormAsset('');
      setFormDesc('');
      setFormCost('');
      loadData();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const updates = {
      status: newStatus,
      completion_date: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null
    };

    await api.updateMaintenanceLog(id, updates);
    addNotification('🔧 Maintenance Status Updated', `Log ticket marked as ${newStatus}.`, 'success');
    loadData();
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await api.approveMaintenanceRequest(id, user?.id || 'admin', role, user?.email || 'admin@assetflow.com');
      addNotification('✅ Ticket Approved', 'Maintenance request has been scheduled for repair.', 'success');
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
    // Show only Approved active schedules in the calendar
    return maintenance.filter(m => m.scheduled_date === dateStr && m.approval_status === 'Approved');
  };

  // Group tickets
  const pendingRequests = maintenance.filter(m => m.approval_status === 'Pending Approval');
  const activeSchedules = maintenance.filter(m => m.approval_status === 'Approved');

  const getRequesterName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : 'Unknown';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Maintenance & Telemetry Controls
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Request repairs, route approvals, simulate telemetry anomaly risks, and schedule work orders
          </Typography>
        </Box>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Telemetry Simulator & Predictive maintenance */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" /> Predictive AI Anomaly Simulator
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select an asset and drag sliders to alter operating environments. The AI algorithms dynamically project system breakdown risks in real-time.
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
                  <Box sx={{ mb: 3.5 }}>
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

                  <Box sx={{ mb: 3.5 }}>
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

                  <Box sx={{ mb: 4 }}>
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
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Calculated Failure Likelihood:</Typography>
                      </Grid>
                      <Grid item xs={5} sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={`${calculatePredictedRisk(temp, vibration, hours)}%`}
                          color={calculatePredictedRisk(temp, vibration, hours) > 75 ? 'error' : calculatePredictedRisk(temp, vibration, hours) > 40 ? 'warning' : 'success'}
                          sx={{ fontWeight: 'bold', fontSize: '1rem', px: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={handleTelemetryUpdate}
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
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="primary" /> Approved Work Order Calendar
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
                                bgcolor: t.status === 'Completed' ? 'success.main' : t.status === 'In Progress' ? 'warning.main' : 'primary.main',
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
        <Card sx={{ border: '1px solid', borderColor: 'primary.main', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              🔧 Pending Maintenance Approvals Queue ({pendingRequests.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Est. Cost</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Workflow Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                        No pending maintenance approvals. All tickets routed.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests.map((req) => {
                      const asset = assets.find(a => a.id === req.asset_id);
                      return (
                        <TableRow key={req.id}>
                          <TableCell><strong>{asset ? asset.name : 'Unknown Asset'}</strong></TableCell>
                          <TableCell>{getRequesterName(req.requested_by)}</TableCell>
                          <TableCell>{req.description}</TableCell>
                          <TableCell>${Number(req.cost).toFixed(2)}</TableCell>
                          <TableCell>{req.scheduled_date}</TableCell>
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

      {/* Maintenance Logs List */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2.5 }}>Active Service Log Tickets</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Asset Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Problem Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned Vendor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Scheduled Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Approval</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Controls</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                ) : activeSchedules.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>No logs recorded.</TableCell></TableRow>
                ) : (
                  activeSchedules.map((m) => {
                    const asset = assets.find(a => a.id === m.asset_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell><strong>{asset ? asset.name : 'Unknown Asset'}</strong></TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell>${Number(m.cost).toFixed(2)}</TableCell>
                        <TableCell>{m.performed_by || 'Unassigned'}</TableCell>
                        <TableCell>{m.scheduled_date}</TableCell>
                        <TableCell>
                          <Chip 
                            label={m.approval_status} 
                            color={m.approval_status === 'Approved' ? 'success' : m.approval_status === 'Rejected' ? 'error' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={m.status} 
                            color={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'warning' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {m.status !== 'Completed' && role !== 'Employee' && (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {m.status === 'Scheduled' && (
                                <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(m.id, 'In Progress')}>
                                  Start
                                </Button>
                              )}
                              {m.status === 'In Progress' && (
                                <Button size="small" variant="contained" color="success" onClick={() => handleUpdateStatus(m.id, 'Completed')}>
                                  Close Ticket
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

      {/* Schedule from Calendar Click Dialog */}
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
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
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

            <FormControl fullWidth size="small">
              <InputLabel>Vendor Partner</InputLabel>
              <Select value={formVendor} onChange={(e) => setFormVendor(e.target.value)} label="Vendor Partner">
                <MenuItem value="TechCorp Solutions">TechCorp Solutions</MenuItem>
                <MenuItem value="OfficeDepot Ltd">OfficeDepot Ltd</MenuItem>
                <MenuItem value="HeavyMachinery Inc">HeavyMachinery Inc</MenuItem>
                <MenuItem value="Global Logistics">Global Logistics</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateMaintenance} variant="contained" color="primary">
            {role === 'Admin' || role === 'Asset Manager' ? 'Create Schedule' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;
