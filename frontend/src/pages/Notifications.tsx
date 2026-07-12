import React, { useEffect, useState } from 'react';
import { 
  Box, Card, CardContent, Typography, TextField, 
  FormControl, InputLabel, Select, MenuItem, Paper, Stack, Chip,
  Divider, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, Avatar, Grid, Badge
} from '@mui/material';
import { 
  Notifications as NotifIcon,
  Search as SearchIcon,
  Warning as AlertIcon,
  CheckCircle as ConfirmIcon,
  SwapHoriz as TransferIcon,
  Build as MaintenanceIcon,
  AssignmentInd as AssignIcon,
  Dns as DatabaseIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const Notifications: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  // Tab state: 0 = Notifications Feed, 1 = Full Audit Trail
  const [activeScreenTab, setActiveScreenTab] = useState(0);

  // Feed Filter state: 'All' | 'Alerts' | 'Approvals' | 'Bookings'
  const [feedFilter, setFeedFilter] = useState<'All' | 'Alerts' | 'Approvals' | 'Bookings'>('All');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (activeScreenTab === 1) {
      loadAuditLogs();
    }
  }, [activeScreenTab]);

  const loadAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await api.getActivityLogs();
      const asts = await api.getAssets();
      setAuditLogs(logs);
      setAssets(asts);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Mockup relative time seeds if the notification is one of the initial seeds
  const getDisplayTime = (n: any) => {
    if (n.id === 'mn-assigned') return '2m ago';
    if (n.id === 'mn-maint-approved') return '18m ago';
    if (n.id === 'mn-booking-confirmed') return '1h ago';
    if (n.id === 'mn-transfer-approved') return '3h ago';
    if (n.id === 'mn-overdue-alert') return '1d ago';
    if (n.id === 'mn-audit-discrepancy') return '2d ago';
    return getRelativeTime(n.timestamp);
  };

  // Classify notifications for feed tabs
  const getNotificationCategory = (title: string, message: string): 'Alerts' | 'Approvals' | 'Bookings' | 'General' => {
    const text = (title + ' ' + message).toLowerCase();
    if (text.includes('booking') || text.includes('reservation') || text.includes('room')) return 'Bookings';
    if (text.includes('approve') || text.includes('reject') || text.includes('transfer') || text.includes('assigned')) return 'Approvals';
    if (text.includes('overdue') || text.includes('discrepancy') || text.includes('anomaly') || text.includes('risk') || text.includes('alert') || text.includes('warning') || text.includes('lost') || text.includes('damaged')) return 'Alerts';
    return 'General';
  };

  // Filter feed items
  const filteredNotifications = notifications.filter(n => {
    if (feedFilter === 'All') return true;
    const cat = getNotificationCategory(n.title, n.message);
    return cat === feedFilter;
  });

  // Styles for feed items based on categories
  const getNotificationStyles = (n: any) => {
    const cat = getNotificationCategory(n.title, n.message);
    switch (cat) {
      case 'Alerts':
        return {
          icon: <AlertIcon sx={{ color: '#e11d48' }} />,
          bgColor: '#fff1f2',
          borderColor: '#fecdd3'
        };
      case 'Approvals':
        return {
          icon: <TransferIcon sx={{ color: '#2563eb' }} />,
          bgColor: '#eff6ff',
          borderColor: '#bfdbfe'
        };
      case 'Bookings':
        return {
          icon: <ConfirmIcon sx={{ color: '#16a34a' }} />,
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0'
        };
      default:
        return {
          icon: <AssignIcon sx={{ color: '#4b5563' }} />,
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb'
        };
    }
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(l => {
    const matchesSearch = 
      l.user_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase());
    
    const matchesAction = auditActionFilter === 'All' || l.action === auditActionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionChipColor = (action: string) => {
    switch (action) {
      case 'CREATE_ASSET': return 'success';
      case 'UPDATE_ASSET': return 'primary';
      case 'SCHEDULE_MAINTENANCE': return 'warning';
      case 'APPROVE_MAINTENANCE': return 'secondary';
      case 'CLOSE_AUDIT_CYCLE': return 'error';
      case 'BOOK_ASSET': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Tab Navigation for Notifications vs Security Log */}
      <Tabs 
        value={activeScreenTab} 
        onChange={(e, val) => setActiveScreenTab(val)}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 4 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="🔔 Live Notifications Feed" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
        <Tab label="🛡️ Security Audit Trails" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
      </Tabs>

      {/* 1. NOTIFICATIONS FEED TAB (Styled exactly like Screen 10 wireframe) */}
      {activeScreenTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            {/* Styled Filter Buttons from mockup */}
            <Stack direction="row" spacing={1.5}>
              {[
                { id: 'All', label: 'All', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { id: 'Alerts', label: 'Alerts', color: '#be123c', bg: '#fff1f2', border: '#fecdd3' },
                { id: 'Approvals', label: 'Approvals', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                { id: 'Bookings', label: 'Bookings', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5' }
              ].map((btn) => {
                const isSelected = feedFilter === btn.id;
                return (
                  <Button
                    key={btn.id}
                    onClick={() => setFeedFilter(btn.id as any)}
                    variant={isSelected ? 'contained' : 'outlined'}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 3,
                      px: 2.5,
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      borderColor: btn.border,
                      color: isSelected ? '#fff' : btn.color,
                      bgcolor: isSelected ? btn.color : btn.bg,
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: btn.color,
                        color: '#fff',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {btn.label}
                  </Button>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Button size="small" onClick={markAllAsRead} variant="text" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                Mark all read
              </Button>
              <Button size="small" onClick={clearNotifications} variant="text" color="error" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                Clear logs
              </Button>
            </Stack>
          </Box>

          {/* List of Notification Rows */}
          <Stack spacing={1.8}>
            {filteredNotifications.length === 0 ? (
              <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderRadius: 3 }}>
                <NotifIcon sx={{ fontSize: '3rem', color: 'text.secondary', opacity: 0.3, mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  No notifications registered under this category.
                </Typography>
              </Paper>
            ) : (
              filteredNotifications.map((n) => {
                const styles = getNotificationStyles(n);
                return (
                  <Paper
                    key={n.id}
                    variant="outlined"
                    onClick={() => markAsRead(n.id)}
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: n.read ? 'divider' : styles.borderColor,
                      bgcolor: n.read ? 'background.paper' : styles.bgColor,
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      boxShadow: n.read ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                      '&:hover': {
                        bgcolor: n.read ? 'action.hover' : styles.bgColor,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge
                          overlap="rectangular"
                          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                          badgeContent={
                            !n.read && (
                              <span className={
                                getNotificationCategory(n.title, n.message) === 'Alerts' ? 'pulse-red' :
                                getNotificationCategory(n.title, n.message) === 'Approvals' ? 'pulse-amber' :
                                getNotificationCategory(n.title, n.message) === 'Bookings' ? 'pulse-green' :
                                'pulse-green'
                              } style={{ border: '2px solid #fff', borderRadius: '50%' }} />
                            )
                          }
                        >
                          <Box 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: 2, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: n.read ? 'action.hover' : '#ffffff',
                              border: '1px solid',
                              borderColor: n.read ? 'divider' : styles.borderColor
                            }}
                          >
                            {styles.icon}
                          </Box>
                        </Badge>
                      </Grid>
                      <Grid item xs={8} sm={10}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" sx={{ fontWeight: n.read ? 'medium' : 'bold', color: 'text.primary' }}>
                            {n.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                            {getDisplayTime(n)}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4, fontSize: '0.8rem' }}>
                          {n.message}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Box>
      )}

      {/* 2. SECURITY AUDIT TRAIL TAB */}
      {activeScreenTab === 1 && (
        <Box>
          <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Search audit logs by operator email, descriptions..."
                size="small"
                fullWidth
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
              <FormControl size="small" sx={{ minWidth: 220, width: { xs: '100%', sm: 'auto' } }}>
                <InputLabel>Action Category</InputLabel>
                <Select
                  value={auditActionFilter}
                  label="Action Category"
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                >
                  <MenuItem value="All">All Operations</MenuItem>
                  <MenuItem value="CREATE_ASSET">Create Asset</MenuItem>
                  <MenuItem value="UPDATE_ASSET">Update Asset</MenuItem>
                  <MenuItem value="ALLOCATE_ASSET">Allocate Asset</MenuItem>
                  <MenuItem value="RETURN_ASSET">Return Asset</MenuItem>
                  <MenuItem value="SCHEDULE_MAINTENANCE">Schedule Maintenance</MenuItem>
                  <MenuItem value="APPROVE_MAINTENANCE">Approve Maintenance</MenuItem>
                  <MenuItem value="CLOSE_AUDIT_CYCLE">Close Audit Cycle</MenuItem>
                  <MenuItem value="BOOK_ASSET">Book Resource</MenuItem>
                  <MenuItem value="CANCEL_BOOKING">Cancel Booking</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Card>

          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Operator Session</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Security Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Operation Action</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Associated Asset</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Transaction Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Loading audit streams...</TableCell></TableRow>
                  ) : filteredAuditLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No security records registered.</TableCell></TableRow>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const asset = assets.find(a => a.id === log.asset_id);
                      return (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>{log.user_email}</TableCell>
                          <TableCell>
                            <Chip label={log.user_role} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.action} 
                              color={getActionChipColor(log.action) as any} 
                              size="small" 
                              sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            {asset ? (
                              <strong>{asset.name}</strong>
                            ) : (
                              <span style={{ color: 'gray', fontSize: '0.8rem' }}>Global System</span>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>{log.details}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Notifications;
