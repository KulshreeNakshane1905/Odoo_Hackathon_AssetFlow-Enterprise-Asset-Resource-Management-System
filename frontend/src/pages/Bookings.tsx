import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Paper, Button, TextField, Typography, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  MenuItem, Select, FormControl, InputLabel, Card, CardContent, 
  Alert, Divider, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Stack
} from '@mui/material';
import { 
  CalendarMonth as BookingsIcon, 
  Add as AddIcon, 
  WarningAmber as WarningIcon,
  Cancel as CancelIcon
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

  // Form state
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await api.getAssets();
      const b = await api.getBookings();
      const u = await api.getUsers();
      
      // Filter assets to focus on shareable resource categories (e.g. IT, AV, Vehicles, Facilities)
      setAssets(a);
      setBookings(b);
      setUsers(u);
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
      await api.createBooking({
        asset_id: selectedAssetId,
        employee_id: user?.id || 'u4',
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        purpose
      }, role, user?.email || 'employee@assetflow.com');

      addNotification('🎉 Resource Booked', 'Your reservation was confirmed successfully!', 'success');
      
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

  const handleCancelBooking = async (id: string) => {
    try {
      await api.cancelBooking(id, role, user?.email || 'employee@assetflow.com');
      addNotification('💼 Booking Cancelled', 'The resource booking has been cancelled.', 'warning');
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to cancel booking.', 'error');
    }
  };

  // Helper getters
  const getAssetName = (id: string) => {
    const found = assets.find(a => a.id === id);
    return found ? `${found.name} (${found.serial_number})` : id;
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : id;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BookingsIcon color="primary" sx={{ fontSize: '2.2rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Resource Bookings</Typography>
            <Typography variant="caption" color="text.secondary">Schedule shared assets and manage time-slot bookings</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setFormOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Book a Resource
        </Button>
      </Box>

      {/* Grid containing list and calendar logs */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Resource / Asset</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Booked By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                  bookings.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{getAssetName(b.asset_id)}</TableCell>
                      <TableCell>{getUserName(b.employee_id)}</TableCell>
                      <TableCell>{new Date(b.start_time).toLocaleString()}</TableCell>
                      <TableCell>{new Date(b.end_time).toLocaleString()}</TableCell>
                      <TableCell>{b.purpose}</TableCell>
                      <TableCell>
                        <Chip 
                          label={b.status} 
                          size="small" 
                          color={b.status === 'Confirmed' ? 'success' : b.status === 'Cancelled' ? 'error' : 'default'} 
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        {b.status === 'Confirmed' && (
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
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

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

          <Stack spacing={2} sx={{ mt: 1 }}>
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
                      {a.name} {a.asset_tag ? `[${a.asset_tag}]` : ''} ({a.category} - {a.location}) - Status: {a.status}
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
          <Button onClick={handleCreateBooking} variant="contained" sx={{ borderRadius: 2 }}>
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
