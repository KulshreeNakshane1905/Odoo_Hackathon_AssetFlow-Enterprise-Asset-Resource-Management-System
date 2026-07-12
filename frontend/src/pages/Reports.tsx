import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, 
  useTheme, Paper, Divider, Stack, Chip
} from '@mui/material';
import { 
  TrendingUp as UtilizationIcon, 
  Build as MaintenanceIcon, 
  EventBusy as RetirementIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  PieChart as ChartIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const Reports: React.FC = () => {
  const theme = useTheme();
  const { addNotification } = useNotifications();

  // Data states
  const [assets, setAssets] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await api.getAssets();
      const m = await api.getMaintenanceLogs();
      const b = await api.getBookings();
      const al = await api.getAllocations();
      const d = await api.getDepartments();

      setAssets(a);
      setMaintenance(m);
      setBookings(b);
      setAllocations(al);
      setDepartments(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. UTILIZATION ANALYSIS ---
  // Count allocations + bookings per asset to find most used vs idle
  const getUtilizationData = () => {
    const counts: { [assetId: string]: number } = {};
    assets.forEach(a => { counts[a.id] = 0; });

    allocations.forEach(al => {
      if (counts[al.asset_id] !== undefined) counts[al.asset_id]++;
    });
    bookings.forEach(bk => {
      if (bk.status === 'Confirmed' && counts[bk.asset_id] !== undefined) {
        counts[bk.asset_id]++;
      }
    });

    const data = assets.map(a => ({
      id: a.id,
      name: a.name,
      tag: a.asset_tag,
      category: a.category,
      count: counts[a.id]
    }));

    const sorted = [...data].sort((a, b) => b.count - a.count);
    const mostUsed = sorted.slice(0, 5);
    const idle = sorted.filter(item => item.count === 0);

    return { mostUsed, idle };
  };

  const { mostUsed: mostUsedAssets, idle: idleAssets } = getUtilizationData();

  // --- 2. MAINTENANCE FREQUENCY BY CATEGORY ---
  const getMaintenanceFreqData = () => {
    const categoryCounts: { [cat: string]: number } = {};
    maintenance.forEach(m => {
      const asset = assets.find(a => a.id === m.asset_id);
      if (asset) {
        categoryCounts[asset.category] = (categoryCounts[asset.category] || 0) + 1;
      }
    });

    return Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat]
    }));
  };

  const maintFreqData = getMaintenanceFreqData();

  // --- 3. RETIREMENT & DUE FOR MAINTENANCE ---
  const getNearingRetirement = () => {
    const currentYear = new Date().getFullYear();
    return assets.filter(a => {
      if (!a.purchase_date || !a.lifespan_years) return false;
      const purchaseYear = new Date(a.purchase_date).getFullYear();
      const retirementYear = purchaseYear + a.lifespan_years;
      return retirementYear - currentYear <= 1; // Within 1 year of retirement
    });
  };

  const getDueForMaintenance = () => {
    // Assets with high telemetry risk score (> 70%) or under Poor condition
    return assets.filter(a => Number(a.risk_score) > 70 || a.condition === 'Poor');
  };

  const retirementList = getNearingRetirement();
  const dueMaintenanceList = getDueForMaintenance();

  // --- 4. DEPARTMENT ALLOCATION SUMMARY ---
  const getDeptAllocationData = () => {
    const deptValue: { [deptName: string]: number } = {};
    
    allocations.forEach(al => {
      if (al.status === 'Active') {
        const asset = assets.find(a => a.id === al.asset_id);
        const dept = departments.find(d => d.id === al.department_id);
        const deptName = dept ? dept.name : 'Individual/Other';
        if (asset) {
          deptValue[deptName] = (deptValue[deptName] || 0) + Number(asset.purchase_value);
        }
      }
    });

    return Object.keys(deptValue).map(name => ({
      name,
      value: Number(deptValue[name].toFixed(2))
    }));
  };

  const deptAllocData = getDeptAllocationData();

  // --- 5. RESOURCE BOOKING HEATMAP ---
  // Hour windows: 9 AM (9:00) to 5 PM (17:00), Days: Sun(0) to Sat(6)
  const getBookingHeatmapData = () => {
    const matrix: number[][] = Array(7).fill(0).map(() => Array(9).fill(0));
    
    bookings.forEach(b => {
      if (b.status !== 'Confirmed') return;
      const start = new Date(b.start_time);
      const day = start.getDay();
      const hour = start.getHours();

      // If falls inside business hours (9 to 17)
      if (hour >= 9 && hour <= 17) {
        matrix[day][hour - 9]++;
      }
    });

    return matrix;
  };

  const heatmapMatrix = getBookingHeatmapData();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hoursOfDay = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  // Find max value in heatmap to calculate scale
  const maxHeat = Math.max(...heatmapMatrix.map(row => Math.max(...row)), 1);

  // --- 6. EXPORTS HANDLING ---
  const exportInventoryExcel = () => {
    const formatted = assets.map(a => ({
      'Asset Tag': a.asset_tag,
      'Name': a.name,
      'Category': a.category,
      'Condition': a.condition,
      'Location': a.location,
      'Status': a.status,
      'Purchase Value ($)': a.purchase_value,
      'Current Book Value ($)': a.current_value,
      'Risk Index (%)': a.risk_score
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asset Inventory");
    XLSX.writeFile(workbook, "AssetFlow_Inventory_Report.xlsx");
    addNotification('📁 Excel Export Complete', 'Downloaded Asset Inventory report workbook.', 'success');
  };

  const exportMaintenanceCSV = () => {
    const headers = ['Ticket ID', 'Asset Tag', 'Asset Name', 'Priority', 'Issue Description', 'Vendor Partner', 'Estimated Cost', 'Scheduled Date', 'Resolved Date', 'Workflow Status'];
    const rows = maintenance.map(m => {
      const asset = assets.find(a => a.id === m.asset_id);
      return [
        m.id,
        asset ? asset.asset_tag : 'N/A',
        asset ? asset.name : 'Unknown',
        m.priority || 'Medium',
        m.description,
        m.performed_by || 'Unassigned',
        m.cost,
        m.scheduled_date,
        m.completion_date || 'N/A',
        m.status
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "AssetFlow_Maintenance_Logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('📁 CSV Export Complete', 'Downloaded Maintenance Logs CSV file.', 'success');
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UtilizationIcon color="primary" sx={{ fontSize: '2.2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Reports & Advanced Analytics</Typography>
            <Typography variant="caption" color="text.secondary">Deep-dive enterprise intelligence on utilization, depreciation, and service frequencies</Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={exportInventoryExcel}
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            Export Inventory Excel
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<DownloadIcon />} 
            onClick={exportMaintenanceCSV}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Export Maintenance CSV
          </Button>
        </Stack>
      </Box>

      {/* Grid of charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Utilization Trend Bar Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <UtilizationIcon color="primary" /> Asset Utilization Trends
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Top 5 most-active shared resources by allocations & booking events.
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={mostUsedAssets}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" fontSize={11} stroke={theme.palette.text.secondary} />
                    <YAxis fontSize={11} stroke={theme.palette.text.secondary} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                    <Legend />
                    <Bar dataKey="count" name="Allocations & Bookings" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Idle Assets card */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                💤 Idle Assets list ({idleAssets.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Assets registered in the system with 0 historical usages or booking locks.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 250 }}>
                {idleAssets.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Great! All assets have active allocation/booking data.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Asset Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tag</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {idleAssets.map((asset) => (
                        <TableRow key={asset.id} hover>
                          <TableCell sx={{ fontSize: '0.8rem' }}><strong>{asset.name}</strong></TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{asset.tag}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}><Chip label={asset.category} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Maintenance Categories vs Department allocations */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Maintenance Categories Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MaintenanceIcon color="secondary" /> Maintenance Incidents by Category
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Distribution of maintenance events across asset categories.
              </Typography>
              <Box sx={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {maintFreqData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No maintenance history recorded.</Typography>
                ) : (
                  <ResponsiveContainer width="99%" height="99%">
                    <PieChart>
                      <Pie
                        data={maintFreqData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {maintFreqData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Portfolio allocations */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChartIcon color="primary" /> Department Capital Allocation
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Active allocated portfolio values (original cost sum) split by department.
              </Typography>
              <Box sx={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {deptAllocData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No active department allocations found.</Typography>
                ) : (
                  <ResponsiveContainer width="99%" height="99%">
                    <PieChart>
                      <Pie
                        data={deptAllocData}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {deptAllocData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Heatmap & Due lists */}
      <Grid container spacing={3}>
        
        {/* Heatmap Booking */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" /> Resource Booking Heatmap
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
                Peak usage windows based on business hours (9:00 AM - 5:00 PM) vs. day of the week.
              </Typography>

              {/* Grid representation */}
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 500, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 80, fontWeight: 'bold', fontSize: '0.75rem', p: 1 }} align="center">Day</TableCell>
                      {hoursOfDay.map((h, i) => (
                        <TableCell key={i} sx={{ fontWeight: 'bold', fontSize: '0.75rem', p: 1 }} align="center">{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {daysOfWeek.map((dayName, dayIdx) => (
                      <TableRow key={dayIdx} hover>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', p: 1 }} align="center">
                          {dayName}
                        </TableCell>
                        {hoursOfDay.map((h, hourIdx) => {
                          const count = heatmapMatrix[dayIdx][hourIdx];
                          // Color scaling opacity
                          const opacity = count > 0 ? 0.15 + (count / maxHeat) * 0.85 : 0;
                          const bgColor = `rgba(99, 102, 241, ${opacity})`;

                          return (
                            <TableCell 
                              key={hourIdx} 
                              sx={{ 
                                bgcolor: count > 0 ? bgColor : 'action.hover', 
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 1,
                                height: 38,
                                color: count > 2 ? '#fff' : 'text.primary',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  boxShadow: '0px 0px 8px rgba(99, 102, 241, 0.4) inset',
                                }
                              }} 
                              align="center"
                              title={`${dayName} at ${h}: ${count} Booking(s)`}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                                {count > 0 ? count : ''}
                              </Typography>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Nearing retirement / Due for maintenance warnings */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Retirement warning */}
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RetirementIcon /> Nearing Retirement Warnings ({retirementList.length})
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                {retirementList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No assets nearing active lifespan expiry.</Typography>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 150, overflowY: 'auto' }}>
                    {retirementList.map(a => {
                      const purchaseYear = new Date(a.purchase_date).getFullYear();
                      const expiryYear = purchaseYear + a.lifespan_years;
                      return (
                        <Box key={a.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{a.name}</Typography>
                            <Typography variant="caption" color="text.secondary">Tag: {a.asset_tag} | Lifespan: {a.lifespan_years} yrs</Typography>
                          </Box>
                          <Chip label={`Expires ${expiryYear}`} size="small" color="warning" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.68rem' }} />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* High telemetry risk/maintenance alert */}
            <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: 'error.light', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon /> Due for Maintenance Alert ({dueMaintenanceList.length})
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                {dueMaintenanceList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>All assets operating within nominal tolerances.</Typography>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 150, overflowY: 'auto' }}>
                    {dueMaintenanceList.map(a => (
                      <Box key={a.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{a.name}</Typography>
                          <Typography variant="caption" color="text.secondary">Tag: {a.asset_tag} | Cond: {a.condition}</Typography>
                        </Box>
                        <Chip label={`Risk: ${a.risk_score}%`} size="small" color="error" sx={{ fontWeight: 'bold', fontSize: '0.68rem' }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
