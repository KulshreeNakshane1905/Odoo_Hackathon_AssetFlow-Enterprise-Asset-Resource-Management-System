import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Paper, Button, TextField, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  MenuItem, Select, FormControl, InputLabel, Card, CardContent, 
  Alert, Divider, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Stack, IconButton, Badge
} from '@mui/material';
import { 
  CalendarMonth as BookingsIcon, 
  Add as AddIcon, 
  WarningAmber as WarningIcon,
  Cancel as CancelIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Bookings: React.FC = () => {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();

  // Data state
  const [assets, setAssets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [selectedAssetIdForCalendar, setSelectedAssetIdForCalendar] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reschedule Form states
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');

  // Reminders state
  const [reminderBooking, setReminderBooking] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await api.getAssets();
      const b = await api.getBookings();
      const u = await api.getUsers();
      
      setAssets(a);
      setBookings(b);
      setUsers(u);

      // Auto-select first shared resource for calendar view
      const shareable = a.filter((item: any) => item.is_shared === true || item.is_shared === 'true');
      if (shareable.length > 0) {
        setSelectedAssetIdForCalendar(shareable[0].id);
      } else if (a.length > 0) {
        setSelectedAssetIdForCalendar(a[0].id);
      }

      // Check upcoming reminders (within next 30 minutes)
      const now = Date.now();
      const soon = now + 30 * 60 * 1000;
      const myUpcoming = b.find((bk: any) => {
        if (bk.status !== 'Confirmed') return false;
        if (bk.employee_id !== user?.id) return false;
        const bkStart = new Date(bk.start_time).getTime();
        return bkStart > now && bkStart <= soon;
      });
      if (myUpcoming) {
        setReminderBooking(myUpcoming);
      } else {
        setReminderBooking(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !startTime || !endTime || !purpose) {
      setErrorMsg('Please fill in all booking fields.');
      return;
    }
    
    setErrorMsg(null);
    try {
      const startIso = new Date(startTime).toISOString();
      const endIso = new Date(endTime).toISOString();

      await api.createBooking({
        asset_id: selectedAssetId,
        employee_id: user?.id || 'u4',
        start_time: startIso,
        end_time: endIso,
        purpose
      }, role, user?.email || 'employee@assetflow.com');

      const asset = assets.find(a => a.id === selectedAssetId);
      addNotification(
        '📆 Booking Confirmed', 
        `Your reservation for Room/Resource "${asset ? asset.name : selectedAssetId}" was confirmed successfully!`, 
        'success'
      );
      
      // Reset form
      setSelectedAssetId('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Overlap booking collision detected or failed request.');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleStart || !rescheduleEnd) {
      setErrorMsg('Please select rescheduled times.');
      return;
    }

    setErrorMsg(null);
    try {
      await api.updateBooking(rescheduleBookingId, {
        start_time: new Date(rescheduleStart).toISOString(),
        end_time: new Date(rescheduleEnd).toISOString()
      }, role, user?.email || 'employee@assetflow.com');

      addNotification('🔄 Booking Rescheduled', 'The time slot has been updated successfully.', 'success');
      setRescheduleOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Time slot conflict detected.');
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.cancelBooking(id, role, user?.email || 'employee@assetflow.com');
        addNotification('💼 Booking Cancelled', 'The resource booking has been cancelled.', 'warning');
        loadData();
      } catch (err: any) {
        addNotification('❌ Action Failed', err.message || 'Failed to cancel booking.', 'error');
      }
    }
  };

  // Helper dynamic status getter
  const getBookingStatus = (b: any) => {
    if (b.status === 'Cancelled') return 'Cancelled';
    const now = Date.now();
    const start = new Date(b.start_time).getTime();
    const end = new Date(b.end_time).getTime();
    if (now < start) return 'Upcoming';
    if (now >= start && now <= end) return 'Ongoing';
    return 'Completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'primary';
      case 'Ongoing': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getAssetName = (id: string) => {
    const found = assets.find(a => a.id === id);
    return found ? `${found.name} (${found.location})` : id;
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : id;
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

  const getBookingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => {
      if (b.status === 'Cancelled') return false;
      if (selectedAssetIdForCalendar && b.asset_id !== selectedAssetIdForCalendar) return false;
      const bDateStr = new Date(b.start_time).toISOString().split('T')[0];
      return bDateStr === dateStr;
    });
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  // Filtered bookings for the selected asset and date
  const activeSelectedBookings = bookings.filter(b => {
    if (selectedAssetIdForCalendar && b.asset_id !== selectedAssetIdForCalendar) return false;
    const bDateStr = new Date(b.start_time).toISOString().split('T')[0];
    return bDateStr === selectedDate;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Reminder Alert Banner */}
      {reminderBooking && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Alert 
            severity="warning" 
            icon={<AlertIcon />}
            action={
              <Button color="inherit" size="small" onClick={() => handleCancelBooking(reminderBooking.id)}>
                Cancel booking
              </Button>
            }
            sx={{ mb: 3, borderRadius: 3, fontWeight: 'bold' }}
          >
            ⏰ Reminder: You have an upcoming reservation for **{getAssetName(reminderBooking.asset_id)}** starting at **{new Date(reminderBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}** ({getBookingStatus(reminderBooking)})!
          </Alert>
        </motion.div>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BookingsIcon color="primary" sx={{ fontSize: '2.2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Resource Schedule & Bookings</Typography>
            <Typography variant="caption" color="text.secondary">Schedule rooms or shared resources without time conflicts</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => {
            setErrorMsg(null);
            setFormOpen(true);
          }}
          sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        >
          Book a Resource
        </Button>
      </Box>

      {/* Dynamic Schedulers Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Visual Monthly Calendar Selector */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Resource to View</InputLabel>
                  <Select
                    value={selectedAssetIdForCalendar}
                    label="Resource to View"
                    onChange={(e) => setSelectedAssetIdForCalendar(e.target.value)}
                  >
                    {assets.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        🏢 {a.name} ({a.location})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

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
                  const dayBookings = day ? getBookingsForDate(day) : [];
                  const isToday = day && 
                    new Date().getDate() === day && 
                    new Date().getMonth() === month && 
                    new Date().getFullYear() === year;

                  const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                  const isSelected = day && dateStr === selectedDate;

                  return (
                    <Grid item xs={12/7} key={idx} onClick={() => day && handleDayClick(day)}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          height: 75, 
                          p: 0.5, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          bgcolor: isSelected 
                            ? 'primary.light' 
                            : isToday 
                              ? 'action.hover' 
                              : day ? 'background.paper' : 'action.disabledBackground',
                          borderColor: isSelected 
                            ? 'primary.main' 
                            : day ? 'divider' : 'transparent',
                          borderWidth: isSelected ? 2 : 1,
                          cursor: day ? 'pointer' : 'default',
                          transition: 'all 0.15s ease',
                          '&:hover': day ? { bgcolor: isSelected ? 'primary.light' : 'action.selected' } : {}
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: isSelected ? 'primary.contrastText' : isToday ? 'primary.main' : day ? 'text.primary' : 'text.disabled',
                            alignSelf: 'flex-start'
                          }}
                        >
                          {day}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, width: '100%', overflow: 'hidden' }}>
                          {dayBookings.slice(0, 2).map((bk, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                bgcolor: bk.employee_id === user?.id ? 'secondary.main' : 'primary.main',
                                height: 4,
                                borderRadius: 1
                              }} 
                              title={`${new Date(bk.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${bk.purpose}`}
                            />
                          ))}
                          {dayBookings.length > 2 && (
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', alignSelf: 'flex-end', fontWeight: 'bold', color: isSelected ? 'primary.contrastText' : 'text.secondary' }}>
                              +{dayBookings.length - 2} more
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

        {/* Selected Date Bookings Detail Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Daily Schedule
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Inspecting bookings on: **{new Date(selectedDate).toLocaleDateString([], { dateStyle: 'long' })}**
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 310 }}>
                {activeSelectedBookings.length === 0 ? (
                  <Box sx={{ my: 'auto', textAlign: 'center', py: 4 }}>
                    <TimeIcon sx={{ color: 'text.secondary', fontSize: '2.5rem', opacity: 0.4, mb: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      No bookings registered for this day.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<AddIcon />} 
                      onClick={() => {
                        const dateStart = new Date(selectedDate);
                        dateStart.setHours(9, 0, 0); // Default to 9:00 AM
                        const dateEnd = new Date(selectedDate);
                        dateEnd.setHours(10, 0, 0); // Default to 10:00 AM

                        // format to YYYY-MM-DDTHH:mm
                        const offset = dateStart.getTimezoneOffset();
                        dateStart.setMinutes(dateStart.getMinutes() - offset);
                        dateEnd.setMinutes(dateEnd.getMinutes() - offset);

                        setStartTime(dateStart.toISOString().slice(0, 16));
                        setEndTime(dateEnd.toISOString().slice(0, 16));
                        setSelectedAssetId(selectedAssetIdForCalendar);
                        setErrorMsg(null);
                        setFormOpen(true);
                      }}
                      sx={{ mt: 2, textTransform: 'none', borderRadius: 2 }}
                    >
                      Book this date
                    </Button>
                  </Box>
                ) : (
                  activeSelectedBookings.map((b) => {
                    const status = getBookingStatus(b);
                    return (
                      <Paper key={b.id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: b.employee_id === user?.id ? 'action.hover' : 'background.paper' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                              By: {getUserName(b.employee_id)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 1 }}>
                              "{b.purpose}"
                            </Typography>
                          </Box>
                          <Chip 
                            label={
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                {status === 'Ongoing' && <span className="pulse-green" />}
                                {status === 'Upcoming' && <span className="pulse-amber" />}
                                <span>{status}</span>
                              </Stack>
                            } 
                            size="small" 
                            color={getStatusColor(status)} 
                            sx={{ fontWeight: 'bold', fontSize: '0.72rem' }} 
                          />
                        </Stack>

                        {b.status === 'Confirmed' && b.employee_id === user?.id && (
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="flex-end">
                            <Button 
                              size="small" 
                              variant="text" 
                              startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
                              onClick={() => {
                                setRescheduleBookingId(b.id);
                                setRescheduleStart(new Date(b.start_time).toISOString().slice(0, 16));
                                setRescheduleEnd(new Date(b.end_time).toISOString().slice(0, 16));
                                setErrorMsg(null);
                                setRescheduleOpen(true);
                              }}
                              sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                            >
                              Reschedule
                            </Button>
                            <Button 
                              size="small" 
                              variant="text" 
                              color="error"
                              startIcon={<CancelIcon sx={{ fontSize: '0.9rem' }} />}
                              onClick={() => handleCancelBooking(b.id)}
                              sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        )}
                      </Paper>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Bookings List Grid */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>All Historical Bookings</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Resource / Asset</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Booked By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No resource bookings scheduled. Click 'Book a Resource' to make a reservation.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...bookings].sort((a,b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).map((b) => {
                    const status = getBookingStatus(b);
                    return (
                      <TableRow key={b.id} hover>
                        <TableCell sx={{ fontWeight: 'medium' }}>{getAssetName(b.asset_id)}</TableCell>
                        <TableCell>{getUserName(b.employee_id)}</TableCell>
                        <TableCell>{new Date(b.start_time).toLocaleString()}</TableCell>
                        <TableCell>{new Date(b.end_time).toLocaleString()}</TableCell>
                        <TableCell>{b.purpose}</TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                {status === 'Ongoing' && <span className="pulse-green" />}
                                {status === 'Upcoming' && <span className="pulse-amber" />}
                                <span>{status}</span>
                              </Stack>
                            } 
                            size="small" 
                            color={getStatusColor(status)} 
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {b.status === 'Confirmed' && b.employee_id === user?.id && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => {
                                  setRescheduleBookingId(b.id);
                                  setRescheduleStart(new Date(b.start_time).toISOString().slice(0, 16));
                                  setRescheduleEnd(new Date(b.end_time).toISOString().slice(0, 16));
                                  setErrorMsg(null);
                                  setRescheduleOpen(true);
                                }}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Reschedule
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelBooking(b.id)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Cancel
                              </Button>
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

      {/* Book Resource Dialog Form */}
      <Dialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>New Resource Reservation</DialogTitle>
        <DialogContent>
          {errorMsg && (
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="select-res-label">Choose Resource</InputLabel>
              <Select
                labelId="select-res-label"
                value={selectedAssetId}
                label="Choose Resource"
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {(() => {
                  const bookable = assets.filter(a => a.is_shared === true || a.is_shared === 'true');
                  const list = bookable.length > 0 ? bookable : assets;
                  return list.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      🏢 {a.name} ({a.category} - {a.location}) - Status: {a.status}
                    </MenuItem>
                  ));
                })()}
              </Select>
            </FormControl>

            <TextField 
              fullWidth
              label="Start Date & Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField 
              fullWidth
              label="End Date & Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField 
              fullWidth
              label="Purpose of Booking"
              multiline
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Explain why this shared asset is needed"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleCreateBooking} variant="contained" sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Booking Dialog */}
      <Dialog 
        open={rescheduleOpen} 
        onClose={() => setRescheduleOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Reschedule Reservation</DialogTitle>
        <DialogContent>
          {errorMsg && (
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              fullWidth
              label="New Start Date & Time"
              type="datetime-local"
              value={rescheduleStart}
              onChange={(e) => setRescheduleStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField 
              fullWidth
              label="New End Date & Time"
              type="datetime-local"
              value={rescheduleEnd}
              onChange={(e) => setRescheduleEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRescheduleOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleRescheduleSubmit} variant="contained" sx={{ borderRadius: 2 }}>
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bookings;
