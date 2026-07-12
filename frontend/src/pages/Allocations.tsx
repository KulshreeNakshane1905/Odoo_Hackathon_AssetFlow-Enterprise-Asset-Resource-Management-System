import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, 
  Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, Typography, Grid, Alert, 
  IconButton, Tooltip, Divider
} from '@mui/material';
import { 
  AssignmentInd as AllocateIcon,
  AssignmentReturn as ReturnIcon,
  SwapHoriz as TransferIcon,
  Warning as OverdueIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Send as NudgeIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Allocations: React.FC = () => {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();

  // Navigation State (Tab index: 0 = Handover & Transfer Form, 1 = Active Table, 2 = Pending Queue, 3 = Overdue Returns)
  const [tabValue, setTabValue] = useState(0);

  // Data States
  const [assets, setAssets] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Return Dialog State (used for active table returns)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  // Tab 0 Handover / Transfer Form State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [allocToType, setAllocToType] = useState<'Employee' | 'Department'>('Employee');
  const [allocTargetId, setAllocTargetId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [transferComments, setTransferComments] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await api.getAssets();
      const al = await api.getAllocations();
      const t = await api.getTransfers ? await api.getTransfers() : [];
      const u = await api.getUsers();
      const d = await api.getDepartments();

      setAssets(a);
      setAllocations(al);
      setTransfers(t);
      setUsers(u);
      setDepartments(d);
    } catch (err) {
      console.error('Error loading allocations page data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handovers/Allocation Form Submit (Tab 0 Available state)
  const handleDirectAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !allocTargetId) {
      setFormError('Please select both an asset and an allocation target.');
      return;
    }
    setFormError(null);
    try {
      await api.createAllocation({
        asset_id: selectedAssetId,
        allocated_to_type: allocToType,
        employee_id: allocToType === 'Employee' ? allocTargetId : null,
        department_id: allocToType === 'Department' ? allocTargetId : null,
        expected_return_date: expectedReturnDate || null
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Allocation Recorded', 'Asset allocated successfully.', 'success');
      // Reset form
      setAllocTargetId('');
      setExpectedReturnDate('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Checkout failed.');
    }
  };

  // Transfer Request Form Submit (Tab 0 Allocated state)
  const handleTransferRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !allocTargetId || !transferComments) {
      setFormError('Please complete all required fields and provide transfer reasoning.');
      return;
    }
    setFormError(null);
    try {
      await api.createTransferRequest({
        asset_id: selectedAssetId,
        requester_id: allocTargetId,
        allocated_to_type: allocToType,
        expected_return_date: expectedReturnDate || null,
        comments: transferComments
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Transfer Requested', 'Transfer request created successfully.', 'success');
      // Reset form
      setAllocTargetId('');
      setExpectedReturnDate('');
      setTransferComments('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Transfer request failed.');
    }
  };

  const handleReturnClick = (alloc: any) => {
    const assetObj = assets.find(a => a.id === alloc.asset_id);
    setSelectedAlloc(alloc);
    setReturnCondition(assetObj?.condition || 'Good');
    setReturnNotes('');
    setReturnDialogOpen(true);
  };

  const handleReturnSubmit = async () => {
    if (!selectedAlloc) return;
    try {
      await api.returnAllocation(
        selectedAlloc.id,
        returnCondition,
        returnNotes,
        role,
        user?.email || 'admin@assetflow.com'
      );
      addNotification('🎉 Return Logged', 'Asset returned and set to Available.', 'success');
      setReturnDialogOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Return Failed', err.message || 'Failed to process return.', 'error');
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await api.approveTransferRequest(transferId, role, user?.email || 'admin@assetflow.com');
      addNotification('🎉 Transfer Approved', 'Asset re-allocated to requester.', 'success');
      loadData();
    } catch (err: any) {
      addNotification('❌ Approval Failed', err.message || 'Action failed.', 'error');
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    try {
      await api.rejectTransferRequest(transferId, role, user?.email || 'admin@assetflow.com');
      addNotification('🗑️ Transfer Rejected', 'Request removed from queue.', 'info');
      loadData();
    } catch (err: any) {
      addNotification('❌ Rejection Failed', err.message || 'Action failed.', 'error');
    }
  };

  const handleNudgeAlert = (alloc: any) => {
    const assetObj = assets.find(a => a.id === alloc.asset_id);
    const holderName = alloc.allocated_to_type === 'Employee'
      ? (() => {
          const u = users.find(usr => usr.id === alloc.employee_id);
          return u ? `${u.first_name} ${u.last_name}` : 'Employee';
        })()
      : (() => {
          const d = departments.find(dept => dept.id === alloc.department_id);
          return d ? d.name : 'Department';
        })();

    addNotification(
      '⚠️ Overdue return reminder',
      `Sent email warning to ${holderName} regarding overdue asset ${assetObj?.name} [${assetObj?.asset_tag || 'No Tag'}].`,
      'warning'
    );
  };

  // Helper resolvers
  const getAssetName = (id: string) => {
    const found = assets.find(a => a.id === id);
    return found ? found.name : 'Unknown Asset';
  };

  const getAssetTag = (id: string) => {
    const found = assets.find(a => a.id === id);
    return found ? found.asset_tag : 'N/A';
  };

  const getHolderName = (alloc: any) => {
    if (alloc.allocated_to_type === 'Employee') {
      const u = users.find(usr => usr.id === alloc.employee_id);
      return u ? `${u.first_name} ${u.last_name}` : 'Unassigned Employee';
    } else {
      const d = departments.find(dept => dept.id === alloc.department_id);
      return d ? `${d.name} Dept` : 'Unassigned Department';
    }
  };

  const getHolderDeptName = (alloc: any) => {
    if (alloc.allocated_to_type === 'Employee') {
      const u = users.find(usr => usr.id === alloc.employee_id);
      const d = departments.find(dept => dept.id === u?.department_id);
      return d ? d.name : 'Engineering';
    } else {
      const d = departments.find(dept => dept.id === alloc.department_id);
      return d ? d.name : 'Engineering';
    }
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? `${found.first_name} ${found.last_name}` : 'Corporate';
  };

  const getDepartmentName = (id: string) => {
    const found = departments.find(d => d.id === id);
    return found ? found.name : 'Corporate';
  };

  const getOverdueDays = (dateStr: string) => {
    const due = new Date(dateStr);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = today.getTime() - due.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Filter lists
  const activeAllocationsList = allocations.filter(al => al.status === 'Active');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueAllocationsList = allocations.filter(al => {
    return al.status === 'Active' && al.expected_return_date && al.expected_return_date < todayStr;
  });

  // Tab 0 helper assets selected states
  const currentSelectedAsset = assets.find(a => a.id === selectedAssetId);
  const currentAssetActiveAlloc = allocations.find(al => al.asset_id === selectedAssetId && al.status === 'Active');
  
  // Specific Selected Asset Allocation Timeline History
  const selectedAssetAllocHistory = allocations
    .filter(al => al.asset_id === selectedAssetId)
    .sort((a, b) => new Date(b.allocated_at).getTime() - new Date(a.allocated_at).getTime());

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Asset Handovers & Transfers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Perform new asset checkouts, resolve department checkout conflicts, and process transfer authorizations
          </Typography>
        </Box>
      </Box>

      {/* Tabs Layout */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, val) => setTabValue(val)} textColor="primary" indicatorColor="primary">
          <Tab 
            icon={<TransferIcon fontSize="small" />} 
            iconPosition="start" 
            label="Handover & Transfer Form" 
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
          <Tab 
            icon={<AllocateIcon fontSize="small" />} 
            iconPosition="start" 
            label={`Active Handovers (${activeAllocationsList.length})`} 
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
          <Tab 
            icon={<ApprovedIcon fontSize="small" />} 
            iconPosition="start" 
            label={`Pending Approvals (${transfers.filter(t => t.status === 'Pending').length})`} 
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          />
          <Tab 
            icon={<AlertIcon fontSize="small" color={overdueAllocationsList.length > 0 ? 'error' : 'inherit'} />} 
            iconPosition="start" 
            label={`Overdue returns (${overdueAllocationsList.length})`} 
            sx={{ fontWeight: 'bold', textTransform: 'none', color: overdueAllocationsList.length > 0 ? 'error.main' : 'inherit' }}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {tabValue === 0 && (
          <motion.div
            key="tab-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <Grid container spacing={3.5}>
              {/* Screen 5 Handover Form Layout */}
              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2.5 }}>Handovers Form Setup</Typography>

                  {formError && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{formError}</Alert>
                  )}

                  {/* Asset Dropdown Selector */}
                  <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel id="form-asset-label">Asset</InputLabel>
                    <Select
                      labelId="form-asset-label"
                      value={selectedAssetId}
                      label="Asset"
                      onChange={(e) => {
                        setSelectedAssetId(e.target.value);
                        setAllocTargetId('');
                        setExpectedReturnDate('');
                        setTransferComments('');
                        setFormError(null);
                      }}
                    >
                      {assets.map(a => (
                        <MenuItem key={a.id} value={a.id}>
                          {a.asset_tag ? `${a.asset_tag} - ` : ''}{a.name} ({a.category} | Status: {a.status})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Dynamic Handover State Resolution */}
                  {!selectedAssetId ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Choose an asset from the dropdown list to initiate checkouts or request transfers.
                    </Alert>
                  ) : currentSelectedAsset?.status === 'Allocated' ? (
                    // --- SCREEN 5 Conflict Double Checkout Red Alert ---
                    <Box>
                      <Alert 
                        severity="error" 
                        icon={<OverdueIcon />}
                        sx={{ 
                          mb: 3, 
                          borderRadius: 2.5, 
                          border: '1px solid', 
                          borderColor: '#fca5a5', 
                          backgroundColor: '#fef2f2',
                          color: '#b91c1c',
                          '& .MuiAlert-message': { width: '100%' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Already Allocated to {currentAssetActiveAlloc ? getHolderName(currentAssetActiveAlloc) : 'another user'} ({currentAssetActiveAlloc ? getHolderDeptName(currentAssetActiveAlloc) : 'Engineering'})
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          Direct re-allocation is blocked - submit a transfer request below
                        </Typography>
                      </Alert>

                      {/* Transfer Form Box */}
                      <form onSubmit={handleTransferRequestSubmit}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Transfer Request</Typography>
                        
                        <Grid container spacing={2}>
                          {/* From Field */}
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="From"
                              disabled
                              value={currentAssetActiveAlloc ? getHolderName(currentAssetActiveAlloc) : 'Current Holder'}
                            />
                          </Grid>

                          {/* Target Type Selector */}
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Transfer To Type</InputLabel>
                              <Select
                                value={allocToType}
                                label="Transfer To Type"
                                onChange={(e) => {
                                  setAllocToType(e.target.value as any);
                                  setAllocTargetId('');
                                }}
                              >
                                <MenuItem value="Employee">Employee</MenuItem>
                                <MenuItem value="Department">Department</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* To Dropdown Selection */}
                          <Grid item xs={12}>
                            {allocToType === 'Employee' ? (
                              <FormControl fullWidth size="small">
                                <InputLabel>To *</InputLabel>
                                <Select
                                  value={allocTargetId}
                                  label="To *"
                                  onChange={(e) => setAllocTargetId(e.target.value)}
                                >
                                  {users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>
                                      {u.first_name} {u.last_name} ({u.email})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <FormControl fullWidth size="small">
                                <InputLabel>To *</InputLabel>
                                <Select
                                  value={allocTargetId}
                                  label="To *"
                                  onChange={(e) => setAllocTargetId(e.target.value)}
                                >
                                  {departments.map(d => (
                                    <MenuItem key={d.id} value={d.id}>
                                      {d.name} ({d.code})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </Grid>

                          {/* Optional Expected Return Date */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Expected Return Date"
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={expectedReturnDate}
                              onChange={(e) => setExpectedReturnDate(e.target.value)}
                            />
                          </Grid>

                          {/* Reason/Comments Box */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Reason *"
                              multiline
                              rows={3}
                              size="small"
                              placeholder="Please write down why this transfer is required..."
                              value={transferComments}
                              onChange={(e) => setTransferComments(e.target.value)}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Button 
                              type="submit" 
                              variant="contained" 
                              color="success" 
                              fullWidth
                              sx={{ textTransform: 'none', borderRadius: 2, py: 1 }}
                            >
                              Submit Request
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                    </Box>
                  ) : currentSelectedAsset?.status === 'Available' ? (
                    // --- Standard Handover Allocation Form ---
                    <form onSubmit={handleDirectAllocation}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Allocate Asset</Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Allocation Target</InputLabel>
                            <Select
                              value={allocToType}
                              label="Allocation Target"
                              onChange={(e) => {
                                  setAllocToType(e.target.value as any);
                                  setAllocTargetId('');
                              }}
                            >
                              <MenuItem value="Employee">Employee</MenuItem>
                              <MenuItem value="Department">Department</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          {allocToType === 'Employee' ? (
                            <FormControl fullWidth size="small">
                              <InputLabel>Select Employee *</InputLabel>
                              <Select
                                value={allocTargetId}
                                label="Select Employee *"
                                onChange={(e) => setAllocTargetId(e.target.value)}
                              >
                                {users.map(u => (
                                  <MenuItem key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <FormControl fullWidth size="small">
                              <InputLabel>Select Department *</InputLabel>
                              <Select
                                value={allocTargetId}
                                label="Select Department *"
                                onChange={(e) => setAllocTargetId(e.target.value)}
                              >
                                {departments.map(d => (
                                  <MenuItem key={d.id} value={d.id}>
                                    {d.name} ({d.code})
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Expected Return Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            fullWidth
                            sx={{ textTransform: 'none', borderRadius: 2, py: 1 }}
                          >
                            Confirm Allocation
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  ) : (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Asset <strong>{currentSelectedAsset?.name}</strong> is currently {currentSelectedAsset?.status} and is locked for allocation.
                    </Alert>
                  )}
                </Card>
              </Grid>

              {/* Sidebar Asset Details & Allocation History */}
              <Grid item xs={12} md={5}>
                {selectedAssetId ? (
                  <Box>
                    {/* Selected Asset Core Details Card */}
                    <Card variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Asset Details</Typography>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Name:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{currentSelectedAsset?.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Category:</Typography>
                          <Typography variant="body2">{currentSelectedAsset?.category}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Asset Tag:</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                            {currentSelectedAsset?.asset_tag || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Serial Number:</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{currentSelectedAsset?.serial_number}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Status:</Typography>
                          <Chip label={currentSelectedAsset?.status} size="small" color={currentSelectedAsset?.status === 'Available' ? 'success' : currentSelectedAsset?.status === 'Allocated' ? 'primary' : 'warning'} sx={{ fontWeight: 'bold', height: 20 }} />
                        </Box>
                      </Stack>
                    </Card>

                    {/* Timeline History Section */}
                    <Card variant="outlined" sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2.5 }}>Allocation history</Typography>
                      <Divider sx={{ mb: 2.5 }} />

                      {selectedAssetAllocHistory.length === 0 ? (
                        <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 2 }}>
                          No allocation handover records logged yet.
                        </Typography>
                      ) : (
                        <Stack spacing={2.5}>
                          {selectedAssetAllocHistory.map((h, index) => {
                            const isReturned = h.status === 'Returned';
                            const formattedAllocDate = new Date(h.allocated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const formattedReturnDate = h.returned_at ? new Date(h.returned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                            
                            return (
                              <Box key={h.id} sx={{ borderLeft: '2px solid', borderColor: isReturned ? 'divider' : 'primary.light', pl: 2, position: 'relative' }}>
                                {/* bullet point */}
                                <Box sx={{
                                  position: 'absolute',
                                  left: -6,
                                  top: 4,
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: isReturned ? 'text.disabled' : 'primary.main'
                                }} />
                                
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {isReturned ? (
                                    <>
                                      {formattedReturnDate} - Returned by {getHolderName(h)} - condition: <span style={{ color: h.returned_condition === 'Broken' ? 'red' : 'green', fontWeight: 'bold' }}>{h.returned_condition || 'good'}</span>
                                      {h.check_in_notes && (
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                                          Notes: "{h.check_in_notes}"
                                        </Typography>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {formattedAllocDate} - Allocated to {getHolderName(h)} - {getHolderDeptName(h)}
                                    </>
                                  )}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </Card>
                  </Box>
                ) : (
                  <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
                    <Typography variant="body2" color="text.secondary">Select an asset from the Handover form to view details and history timeline.</Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </motion.div>
        )}

        {tabValue === 1 && (
          <motion.div
            key="tab-active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Asset Tag</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Asset Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Allocated To</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Checkout Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Expected Return Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">Loading allocations...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : activeAllocationsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">No assets currently allocated.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeAllocationsList.map((alloc) => {
                      const isOverdue = alloc.expected_return_date && alloc.expected_return_date < todayStr;
                      return (
                        <TableRow key={alloc.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                            {getAssetTag(alloc.asset_id)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{getAssetName(alloc.asset_id)}</TableCell>
                          <TableCell>{getHolderName(alloc)}</TableCell>
                          <TableCell>{new Date(alloc.allocated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {alloc.expected_return_date ? new Date(alloc.expected_return_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={isOverdue ? 'Overdue' : 'Active'} 
                              color={isOverdue ? 'error' : 'success'} 
                              size="small" 
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {role !== 'Employee' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                startIcon={<ReturnIcon />}
                                onClick={() => handleReturnClick(alloc)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Return Asset
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        )}

        {tabValue === 2 && (
          <motion.div
            key="tab-transfers"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Current Holder</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Requested By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Request Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Expected Return</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reason / Comments</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">No transfer requests logged.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((tf) => {
                      const currentHolder = tf.current_holder_id 
                        ? (tf.current_holder_type === 'Employee' ? getUserName(tf.current_holder_id) : getDepartmentName(tf.current_holder_id))
                        : 'None / Corporate';
                      
                      const requester = tf.allocated_to_type === 'Employee' ? getUserName(tf.requester_id) : getDepartmentName(tf.requester_id);
                      const canProcess = role === 'Admin' || role === 'Asset Manager' || role === 'Department Head';
                      
                      return (
                        <TableRow key={tf.id} hover>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{getAssetName(tf.asset_id)}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {getAssetTag(tf.asset_id)}
                            </Typography>
                          </TableCell>
                          <TableCell>{currentHolder}</TableCell>
                          <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>{requester}</TableCell>
                          <TableCell>{new Date(tf.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{tf.expected_return_date ? new Date(tf.expected_return_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word', fontSize: '0.85rem' }}>{tf.comments}</TableCell>
                          <TableCell>
                            <Chip 
                              label={tf.status} 
                              color={tf.status === 'Approved' ? 'success' : tf.status === 'Rejected' ? 'error' : 'warning'} 
                              size="small" 
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {tf.status === 'Pending' ? (
                              canProcess ? (
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Tooltip title="Approve Transfer & Re-allocate">
                                    <IconButton color="success" size="small" onClick={() => handleApproveTransfer(tf.id)}>
                                      <ApprovedIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject Transfer">
                                    <IconButton color="error" size="small" onClick={() => handleRejectTransfer(tf.id)}>
                                      <RejectedIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              ) : (
                                <Typography variant="caption" color="text.disabled">Awaiting Approval</Typography>
                              )
                            ) : (
                              <Typography variant="caption" color="text.secondary">Closed</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        )}

        {tabValue === 3 && (
          <motion.div
            key="tab-overdue"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {overdueAllocationsList.length > 0 && (
              <Alert severity="error" icon={<OverdueIcon />} sx={{ mb: 3, borderRadius: 2.5, fontWeight: 'bold' }}>
                {overdueAllocationsList.length} assets are currently past their expected return dates and require immediate action.
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#fef2f2' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Asset Tag</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Asset Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Allocated To</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Expected Return Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Days Overdue</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Nudge Holder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueAllocationsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">Excellent! No overdue returns registered.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    overdueAllocationsList.map((alloc) => {
                      const days = getOverdueDays(alloc.expected_return_date);
                      return (
                        <TableRow key={alloc.id} hover sx={{ bgcolor: '#fff5f5' }}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'error.main' }}>
                            {getAssetTag(alloc.asset_id)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{getAssetName(alloc.asset_id)}</TableCell>
                          <TableCell>{getHolderName(alloc)}</TableCell>
                          <TableCell sx={{ fontWeight: 'medium', color: 'error.main' }}>
                            {new Date(alloc.expected_return_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                            {days} days overdue
                          </TableCell>
                          <TableCell align="right">
                            {role !== 'Employee' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<NudgeIcon />}
                                onClick={() => handleNudgeAlert(alloc)}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                Send Nudge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Asset Check-in Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Return Asset to Inventory</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please log the asset condition and check-in comments to return it to active inventory.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel>Returned Condition *</InputLabel>
            <Select
              value={returnCondition}
              label="Returned Condition *"
              onChange={(e) => setReturnCondition(e.target.value)}
            >
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Poor">Poor</MenuItem>
              <MenuItem value="Broken">Broken</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Check-in Comments"
            multiline
            rows={3}
            size="small"
            placeholder="e.g. Scratches on side panel, but clean and fully functional."
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleReturnSubmit} variant="contained" color="secondary">Confirm Return</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
