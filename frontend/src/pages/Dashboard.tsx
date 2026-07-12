import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Button, 
  MenuItem, Select, FormControl, InputLabel, 
  Table, TableBody, TableCell, TableHead, TableRow, 
  useTheme, Avatar, Stack, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Alert, TableContainer, Paper
} from '@mui/material';
import { 
  Build as MaintenanceIcon, 
  Warning as WarningIcon,
  QrCodeScanner as ScanIcon,
  LocalShipping as VehicleIcon,
  DesktopWindows as HardwareIcon,
  Apartment as FacilitiesIcon,
  Tv as AVIcon,
  EventBusy as EventBusyIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as AvailableIcon,
  AssignmentInd as AllocateIcon,
  SwapHoriz as TransferIcon,
  HourglassEmpty as PendingIcon,
  ListAlt as ActivityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { 
  AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();
  
  // Data states
  const [assets, setAssets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [depreciationMethod, setDepreciationMethod] = useState<'Straight-Line' | 'Double-Declining'>('Straight-Line');

  // Quick Action Dialogs State
  const [registerOpen, setRegisterOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);

  // Register Asset Form Fields
  const [newName, setNewName] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newVal, setNewVal] = useState<number | ''>('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLifespan, setNewLifespan] = useState<number | ''>(5);
  const [newDepMethod, setNewDepMethod] = useState<'Straight-Line' | 'Double-Declining'>('Straight-Line');
  const [newVendorId, setNewVendorId] = useState('');

  // Booking Form Fields
  const [bookAssetId, setBookAssetId] = useState('');
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookPurpose, setBookPurpose] = useState('');

  // Maintenance Form Fields
  const [maintAssetId, setMaintAssetId] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState<number | ''>('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [depreciationMethod]);

  const loadData = async () => {
    try {
      const fetchedAssets = await api.getAssets();
      const fetchedVendors = await api.getVendors();
      const fetchedMaint = await api.getMaintenanceLogs();
      const fetchedAllocs = await api.getAllocations();
      const fetchedBookings = await api.getBookings();
      const fetchedUsers = await api.getUsers();
      const fetchedCats = await api.getCategories();
      const fetchedDepts = await api.getDepartments();
      const fetchedTransfers = await api.getTransfers ? await api.getTransfers() : [];

      // Calculate current values based on depreciation
      const updatedAssets = await Promise.all(fetchedAssets.map(async (a: any) => {
        const dep = await api.calculateDepreciation(
          Number(a.purchase_value), 
          a.lifespan_years, 
          a.purchase_date, 
          depreciationMethod
        );
        const currentYear = new Date().getFullYear();
        const yearValue = dep.schedule.find((s: any) => s.year === currentYear);
        return {
          ...a,
          current_value: yearValue ? yearValue.bookValue : a.current_value
        };
      }));

      setAssets(updatedAssets);
      setVendors(fetchedVendors);
      setMaintenance(fetchedMaint);
      setAllocations(fetchedAllocs);
      setBookings(fetchedBookings);
      setUsersList(fetchedUsers);
      setCategories(fetchedCats);
      setDepartments(fetchedDepts);
      setTransfers(fetchedTransfers);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // --- STAT CARDS CALCULATIONS ---
  const assetsAvailable = assets.filter(a => a.status === 'Available').length;
  const assetsAllocated = assets.filter(a => a.status === 'Allocated').length;
  const maintenanceToday = maintenance.filter(m => m.status === 'In Progress' || m.status === 'Scheduled').length;
  const activeBookings = bookings.filter(b => b.status === 'Confirmed').length;
  
  const pendingTransfers = transfers.filter(t => t.status === 'Pending').length;

  // Upcoming returns: allocations due within the next 7 days and active
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const upcomingReturns = allocations.filter(al => {
    return al.status === 'Active' && 
      al.expected_return_date && 
      al.expected_return_date >= todayStr && 
      al.expected_return_date <= nextWeekStr;
  });

  const overdueAllocations = allocations.filter(al => {
    return al.status === 'Active' && al.expected_return_date && al.expected_return_date < todayStr;
  });

  const totalValue = assets.reduce((sum, a) => sum + Number(a.purchase_value), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + Number(a.current_value), 0);
  const totalDepreciation = totalValue - totalCurrentValue;
  const highRiskAssets = assets.filter(a => Number(a.risk_score) > 50);

  // --- SUBMISSIONS ---

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSerial || !newCategory || !newLocation || newVal === '') {
      addNotification('⚠️ Fields Required', 'Please complete the required fields.', 'warning');
      return;
    }
    try {
      await api.createAsset({
        name: newName,
        serial_number: newSerial,
        model_number: newModel,
        category: newCategory,
        location: newLocation,
        purchase_value: Number(newVal),
        purchase_date: newDate,
        lifespan_years: Number(newLifespan),
        depreciation_method: newDepMethod,
        vendor_id: newVendorId || null,
        status: 'Available'
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Asset Registered', `Successfully added ${newName} to the inventory.`, 'success');
      setRegisterOpen(false);
      
      // Reset Form Fields
      setNewName('');
      setNewSerial('');
      setNewModel('');
      setNewCategory('');
      setNewLocation('');
      setNewVal('');
      setNewVendorId('');
      loadData();
    } catch (err: any) {
      addNotification('❌ Registration Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookAssetId || !bookStart || !bookEnd) {
      addNotification('⚠️ Fields Required', 'Please fill booking times and asset details.', 'warning');
      return;
    }
    try {
      await api.createBooking({
        asset_id: bookAssetId,
        employee_id: user?.id || 'u4',
        start_time: new Date(bookStart).toISOString(),
        end_time: new Date(bookEnd).toISOString(),
        purpose: bookPurpose
      }, role, user?.email || 'clerk@assetflow.com');

      addNotification('🎉 Resource Booked', 'Resource reservation created successfully.', 'success');
      setBookOpen(false);
      
      // Reset Form Fields
      setBookAssetId('');
      setBookStart('');
      setBookEnd('');
      setBookPurpose('');
      loadData();
    } catch (err: any) {
      addNotification('❌ Booking Collision', err.message || 'Reservation scheduling overlap detected.', 'error');
    }
  };

  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintAssetId || !maintDesc) {
      addNotification('⚠️ Fields Required', 'Please select asset and describe faults.', 'warning');
      return;
    }
    try {
      await api.createMaintenanceLog({
        asset_id: maintAssetId,
        description: maintDesc,
        cost: maintCost !== '' ? Number(maintCost) : 0,
        status: 'Scheduled',
        approval_status: role === 'Admin' || role === 'Asset Manager' || role === 'Department Head' ? 'Approved' : 'Pending Approval',
        requested_by: user?.id || 'u4',
        scheduled_date: maintDate
      }, role, user?.email || 'clerk@assetflow.com');

      addNotification('🎉 Request Submitted', 'Maintenance ticket submitted and routed to approval queue.', 'success');
      setMaintOpen(false);
      
      // Reset Form Fields
      setMaintAssetId('');
      setMaintDesc('');
      setMaintCost('');
      loadData();
    } catch (err: any) {
      addNotification('❌ Request Failed', err.message || 'Error occurred.', 'error');
    }
  };

  // Anomaly slider triggers
  const handleSimulateAnomaly = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const updated = await api.updateAsset(assetId, {
      telemetry_temp: 112.5,
      telemetry_vibration: 7.8,
      risk_score: 92.0
    }, role, user?.email || 'admin@assetflow.com');

    if (updated) {
      addNotification(
        '🚨 Telemetry Crisis Triggered',
        `Critical vibration anomaly simulated on asset: ${asset.name}. Risk index spiked to 92%.`,
        'error'
      );
      loadData();
    }
  };

  // --- HELPERS ---
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'it hardware': return <HardwareIcon />;
      case 'heavy equipment': return <FacilitiesIcon />;
      case 'av equipment': return <AVIcon />;
      case 'vehicles': return <VehicleIcon />;
      default: return <FacilitiesIcon />;
    }
  };

  const getAssetName = (id: string) => {
    const found = assets.find(a => a.id === id);
    return found ? found.name : 'Unknown Asset';
  };

  const getUserName = (id: string) => {
    const found = usersList.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : 'Unknown';
  };

  const getDeptName = (id: string) => {
    const found = departments.find(d => d.id === id);
    return found ? found.name : 'Corporate';
  };

  // Compile recent activities list dynamically
  const getRecentActivities = () => {
    const activities: any[] = [];
    
    // Add allocations
    allocations.forEach(al => {
      activities.push({
        text: `Asset "${getAssetName(al.asset_id)}" allocated to ${getUserName(al.employee_id)} (${getDeptName(al.department_id)})`,
        date: new Date(al.allocated_at),
        type: 'allocation'
      });
    });

    // Add bookings
    bookings.forEach(b => {
      activities.push({
        text: `Confirmed booking for "${getAssetName(b.asset_id)}" by ${getUserName(b.employee_id)}`,
        date: new Date(b.created_at),
        type: 'booking'
      });
    });

    // Add maintenance
    maintenance.forEach(m => {
      activities.push({
        text: `Maintenance scheduled for "${getAssetName(m.asset_id)}" - "${m.description}"`,
        date: new Date(m.created_at),
        type: 'maintenance'
      });
    });

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  // Chart cost mappings
  const categoryDataMap: { [key: string]: { cost: number; current: number; count: number } } = {};
  assets.forEach(a => {
    if (!categoryDataMap[a.category]) {
      categoryDataMap[a.category] = { cost: 0, current: 0, count: 0 };
    }
    categoryDataMap[a.category].cost += Number(a.purchase_value);
    categoryDataMap[a.category].current += Number(a.current_value);
    categoryDataMap[a.category].count += 1;
  });

  const categoryChartData = Object.keys(categoryDataMap).map(cat => ({
    name: cat,
    Cost: Number(categoryDataMap[cat].cost.toFixed(2)),
    Valuation: Number(categoryDataMap[cat].current.toFixed(2)),
    Count: categoryDataMap[cat].count
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Today's Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Operational snapshot for <strong>{user?.first_name} {user?.last_name} ({role})</strong>
          </Typography>
        </Box>

        {/* Global Controls */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="dep-select-label">Depreciation Index</InputLabel>
          <Select
            labelId="dep-select-label"
            value={depreciationMethod}
            label="Depreciation Index"
            onChange={(e) => setDepreciationMethod(e.target.value as any)}
          >
            <MenuItem value="Straight-Line">Straight-Line Method</MenuItem>
            <MenuItem value="Double-Declining">Double-Declining Balance</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI Stats Cards (Grid matching Screen 2) */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { title: 'Available', val: assetsAvailable, icon: <AvailableIcon />, color: '#10b981', subtitle: 'Ready for use' },
          { title: 'Allocated', val: assetsAllocated, icon: <AllocateIcon />, color: '#6366f1', subtitle: 'Currently deployed' },
          { title: 'Maintenance Today', val: maintenanceToday, icon: <MaintenanceIcon />, color: '#ec4899', subtitle: 'Scheduled repairs' },
          { title: 'Active Bookings', val: activeBookings, icon: <CalendarIcon />, color: '#3b82f6', subtitle: 'Time slot locks' },
          { title: 'Pending Transfers', val: pendingTransfers, icon: <TransferIcon />, color: '#f59e0b', subtitle: 'Routing authorizations' },
          { title: 'Upcoming Returns', val: upcomingReturns.length, icon: <PendingIcon />, color: '#8b5cf6', subtitle: 'Due within 7 days' }
        ].map((kpi, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: `${kpi.color}15`, color: kpi.color, width: 44, height: 44, mb: 1.5 }}>
                    {kpi.icon}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5 }}>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', my: 0.5 }}>
                    {kpi.val}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                    {kpi.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Overdue returns high-visibility banner (Past expected date) */}
      {overdueAllocations.length > 0 && (
        <Alert 
          severity="error" 
          icon={<EventBusyIcon color="error" />}
          sx={{ 
            mb: 3, 
            borderRadius: 2.5, 
            fontWeight: 'bold', 
            bgcolor: '#fef2f2', 
            color: '#b91c1c', 
            border: '1px solid #fee2e2' 
          }}
        >
          {overdueAllocations.length} assets overdue for return - flagged for follow-up
        </Alert>
      )}

      {/* Quick Action Buttons (Matching Screen 2) */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ mb: 4 }}>
        <Button 
          variant="contained" 
          fullWidth 
          startIcon={<AddIcon />} 
          onClick={() => {
            if (role !== 'Admin' && role !== 'Asset Manager') {
              addNotification('⚠️ Access Denied', 'Only Admins or Managers can register assets.', 'error');
              return;
            }
            setRegisterOpen(true);
          }}
          sx={{ py: 1.2, textTransform: 'none', borderRadius: 2.5, fontWeight: 'bold' }}
        >
          + Register Asset
        </Button>
        <Button 
          variant="outlined" 
          fullWidth 
          color="primary"
          startIcon={<CalendarIcon />} 
          onClick={() => setBookOpen(true)}
          sx={{ py: 1.2, textTransform: 'none', borderRadius: 2.5, fontWeight: 'bold' }}
        >
          Book Resource
        </Button>
        <Button 
          variant="outlined" 
          fullWidth 
          color="secondary"
          startIcon={<MaintenanceIcon />} 
          onClick={() => setMaintOpen(true)}
          sx={{ py: 1.2, textTransform: 'none', borderRadius: 2.5, fontWeight: 'bold' }}
        >
          Raise Requests
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Activity Log Feed */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ActivityIcon color="primary" /> Recent Activity Feed
              </Typography>
              <Stack spacing={2} divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                {getRecentActivities().map((act, i) => (
                  <Box key={i} sx={{ pb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      {act.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {act.date.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolios Cost Valuations */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Cost vs Valuation Balance</Typography>
              <Box sx={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <AreaChart data={categoryChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                    <Area type="monotone" dataKey="Cost" stroke={theme.palette.primary.main} fillOpacity={0.15} fill={theme.palette.primary.main} />
                    <Area type="monotone" dataKey="Valuation" stroke={theme.palette.secondary.main} fillOpacity={0.15} fill={theme.palette.secondary.main} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Telemetry Anomaly Simulator */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon /> Predictive Telemetry Failures Alert
              </Typography>
              
              {highRiskAssets.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    All core systems telemetry indicators operating within safety envelopes.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Temp (°C)</TableCell>
                        <TableCell>Risk Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {highRiskAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <strong>{asset.name}</strong>
                          </TableCell>
                          <TableCell color="error">{asset.telemetry_temp}°C</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                {asset.risk_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScanIcon color="primary" /> Telemetry Anomaly Simulator
              </Typography>
              <Grid container spacing={1.5}>
                {assets.slice(0, 3).map((asset) => (
                  <Grid item xs={12} key={asset.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{asset.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Current Temp: {asset.telemetry_temp}°C</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="error"
                      onClick={() => handleSimulateAnomaly(asset.id)}
                      disabled={Number(asset.risk_score) > 50}
                    >
                      Simulate Fault
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- QUICK ACTION DIALOGS --- */}

      {/* 1. Register Asset Dialog */}
      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Quick Register Asset</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }} component="form" onSubmit={handleRegisterSubmit}>
            <TextField 
              fullWidth
              label="Asset Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Dell Monitor 27"
            />
            <TextField 
              fullWidth
              label="Serial Number *"
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              placeholder="e.g. SN-DELL-8991"
            />
            <TextField 
              fullWidth
              label="Model Number"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="e.g. D-27-2026"
            />
            <FormControl fullWidth>
              <InputLabel>Asset Category *</InputLabel>
              <Select
                value={newCategory}
                label="Asset Category *"
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              fullWidth
              label="Asset Location *"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Bangalore Head Office"
            />
            <TextField 
              fullWidth
              label="Purchase Value ($) *"
              type="number"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="e.g. 500.00"
            />
            <TextField 
              fullWidth
              label="Purchase Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRegisterOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleRegisterSubmit} variant="contained">Register Asset</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Book Resource Dialog */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Quick Book Resource</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }} component="form" onSubmit={handleBookSubmit}>
            <FormControl fullWidth>
              <InputLabel>Select Shared Resource</InputLabel>
              <Select
                value={bookAssetId}
                label="Select Shared Resource"
                onChange={(e) => setBookAssetId(e.target.value)}
              >
                {assets.filter(a => a.status === 'Available').map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name} (SN: {a.serial_number})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              fullWidth
              label="Booking Start Time"
              type="datetime-local"
              value={bookStart}
              onChange={(e) => setBookStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField 
              fullWidth
              label="Booking End Time"
              type="datetime-local"
              value={bookEnd}
              onChange={(e) => setBookEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField 
              fullWidth
              label="Booking Purpose"
              value={bookPurpose}
              onChange={(e) => setBookPurpose(e.target.value)}
              placeholder="e.g. Client presentation"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setBookOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleBookSubmit} variant="contained" color="primary">Confirm Reservation</Button>
        </DialogActions>
      </Dialog>

      {/* 3. Raise Maintenance Dialog */}
      <Dialog open={maintOpen} onClose={() => setMaintOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Raise Maintenance Request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }} component="form" onSubmit={handleMaintSubmit}>
            <FormControl fullWidth>
              <InputLabel>Select Malfunctioning Asset</InputLabel>
              <Select
                value={maintAssetId}
                label="Select Malfunctioning Asset"
                onChange={(e) => setMaintAssetId(e.target.value)}
              >
                {assets.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name} (SN: {a.serial_number})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              fullWidth
              label="Description of Malfunction"
              value={maintDesc}
              onChange={(e) => setMaintDesc(e.target.value)}
              multiline
              rows={2}
              placeholder="Describe what is broken or needs servicing..."
            />
            <TextField 
              fullWidth
              label="Estimated Cost ($)"
              type="number"
              value={maintCost}
              onChange={(e) => setMaintCost(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="e.g. 250"
            />
            <TextField 
              fullWidth
              label="Scheduled Service Date"
              type="date"
              value={maintDate}
              onChange={(e) => setMaintDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setMaintOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleMaintSubmit} variant="contained" color="secondary">Submit Request</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
