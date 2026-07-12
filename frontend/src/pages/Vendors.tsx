import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem, Rating, Avatar, Stack, TableContainer, Paper
} from '@mui/material';
import { 
  Store as VendorIcon, 
  VerifiedUser as WarrantyIcon, 
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Vendors: React.FC = () => {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();

  // Data states
  const [vendors, setVendors] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false);

  // Forms states
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vExpiry, setVExpiry] = useState(new Date(Date.now() + 3600000 * 24 * 365).toISOString().split('T')[0]);

  const [wAsset, setWAsset] = useState('');
  const [wVendor, setWVendor] = useState('');
  const [wPolicy, setWPolicy] = useState('');
  const [wStart, setWStart] = useState(new Date().toISOString().split('T')[0]);
  const [wEnd, setWEnd] = useState(new Date(Date.now() + 3600000 * 24 * 365 * 2).toISOString().split('T')[0]);
  const [wDetails, setWDetails] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const v = await api.getVendors();
      const w = await api.getWarranties();
      const a = await api.getAssets();
      setVendors(v);
      setWarranties(w);
      setAssets(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!vName || !vEmail) {
      addNotification('⚠️ Fields Required', 'Please complete the vendor name and email.', 'warning');
      return;
    }

    const payload = {
      name: vName,
      contact_name: vContact,
      contact_email: vEmail,
      phone: vPhone,
      status: 'Active',
      rating: 5.0,
      contract_expiry: vExpiry
    };

    const res = await api.createVendor(payload);
    if (res) {
      addNotification('🏢 Vendor Contract Registered', `${vName} registered as active enterprise partner.`, 'success');
      setVendorDialogOpen(false);
      setVName('');
      setVContact('');
      setVEmail('');
      setVPhone('');
      loadData();
    }
  };

  const handleCreateWarranty = async () => {
    if (!wAsset || !wVendor || !wPolicy) {
      addNotification('⚠️ Fields Required', 'Please complete asset, vendor, and policy number.', 'warning');
      return;
    }

    const payload = {
      asset_id: wAsset,
      vendor_id: wVendor,
      policy_number: wPolicy,
      start_date: wStart,
      end_date: wEnd,
      coverage_details: wDetails
    };

    const res = await api.createWarranty(payload);
    if (res) {
      addNotification('🛡️ Warranty Registered', `Policy ${wPolicy} linked to asset.`, 'success');
      setWarrantyDialogOpen(false);
      setWAsset('');
      setWVendor('');
      setWPolicy('');
      setWDetails('');
      loadData();
    }
  };

  // Check days remaining for warranty expiration
  const getWarrantyStatusChip = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const today = new Date();
    const msDiff = end.getTime() - today.getTime();
    const daysDiff = Math.ceil(msDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return <Chip label="Expired" color="error" size="small" />;
    } else if (daysDiff <= 30) {
      return <Chip label={`Expiring in ${daysDiff} days`} color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
    } else {
      return <Chip label="Active" color="success" size="small" />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Partner & Warranty Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage corporate logistics contractors and hardware warranty coverage records
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {(role as string) !== 'Inventory Clerk' && (
            <>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setVendorDialogOpen(true)}>
                Add Vendor
              </Button>
              <Button variant="contained" startIcon={<WarrantyIcon />} onClick={() => setWarrantyDialogOpen(true)}>
                Add Warranty
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* Vendors grid */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VendorIcon color="primary" /> Enterprise Vendor Partners
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {vendors.map((vendor) => (
          <Grid item xs={12} sm={6} md={3} key={vendor.id}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                    {vendor.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{vendor.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Expiry: {vendor.contract_expiry}</Typography>
                  </Box>
                </Box>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="inherit" /> {vendor.contact_email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="inherit" /> {vendor.phone || 'N/A'}
                  </Typography>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Rating value={Number(vendor.rating)} precision={0.1} readOnly size="small" />
                  <Chip label={vendor.status} color="success" size="small" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Warranties Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarrantyIcon color="primary" /> Hardware Warranty Logs
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Vendor Partner</TableCell>
                  <TableCell>Policy Number</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Coverage Scope</TableCell>
                  <TableCell>Coverage Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                ) : warranties.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>No warranty policies registered.</TableCell></TableRow>
                ) : (
                  warranties.map((w) => {
                    const asset = assets.find(a => a.id === w.asset_id);
                    const vendor = vendors.find(v => v.id === w.vendor_id);
                    return (
                      <TableRow key={w.id}>
                        <TableCell><strong>{asset ? asset.name : 'Unknown Asset'}</strong></TableCell>
                        <TableCell>{vendor ? vendor.name : 'Unknown Vendor'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.policy_number}</TableCell>
                        <TableCell>{w.start_date}</TableCell>
                        <TableCell>{w.end_date}</TableCell>
                        <TableCell>{w.coverage_details}</TableCell>
                        <TableCell>{getWarrantyStatusChip(w.end_date)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={vendorDialogOpen} onClose={() => setVendorDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Register Vendor Partner</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Company Name *" fullWidth size="small" value={vName} onChange={(e) => setVName(e.target.value)} />
            <TextField label="Contact Person" fullWidth size="small" value={vContact} onChange={(e) => setVContact(e.target.value)} />
            <TextField label="Contact Email *" fullWidth size="small" value={vEmail} onChange={(e) => setVEmail(e.target.value)} />
            <TextField label="Phone Number" fullWidth size="small" value={vPhone} onChange={(e) => setVPhone(e.target.value)} />
            <TextField label="Contract Expiry" type="date" fullWidth size="small" value={vExpiry} onChange={(e) => setVExpiry(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setVendorDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateVendor} variant="contained" color="primary">Register Vendor</Button>
        </DialogActions>
      </Dialog>

      {/* Add Warranty Dialog */}
      <Dialog open={warrantyDialogOpen} onClose={() => setWarrantyDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Register Warranty policy</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Asset *</InputLabel>
              <Select value={wAsset} onChange={(e) => setWAsset(e.target.value)} label="Asset *">
                {assets.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Vendor Provider *</InputLabel>
              <Select value={wVendor} onChange={(e) => setWVendor(e.target.value)} label="Vendor Provider *">
                {vendors.map(v => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Policy / Certificate Number *" fullWidth size="small" value={wPolicy} onChange={(e) => setWPolicy(e.target.value)} />
            <TextField label="Start Date" type="date" fullWidth size="small" value={wStart} onChange={(e) => setWStart(e.target.value)} />
            <TextField label="End Date" type="date" fullWidth size="small" value={wEnd} onChange={(e) => setWEnd(e.target.value)} />
            <TextField label="Coverage Details" fullWidth size="small" multiline rows={3} value={wDetails} onChange={(e) => setWDetails(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setWarrantyDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateWarranty} variant="contained" color="primary">Activate Policy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Vendors;
