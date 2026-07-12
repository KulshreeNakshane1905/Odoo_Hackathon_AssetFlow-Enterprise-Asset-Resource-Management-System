import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, Button, Card, Checkbox, Drawer, Dialog, DialogActions, 
  DialogContent, DialogTitle, TextField, Typography, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Chip, MenuItem, Select, FormControl, InputLabel,
  Grid, Paper, Stack, Tooltip, Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  CloudUpload as UploadIcon, 
  Download as DownloadIcon, 
  QrCode as QrIcon, 
  Delete as DeleteIcon, 
  Visibility as ViewIcon,
  Search as SearchIcon,
  AssignmentInd as AllocateIcon,
  AssignmentReturn as ReturnIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { QRGenerator } from '../components/QRGenerator';
import { BarcodeGenerator } from '../components/BarcodeGenerator';
import { AssetTimeline } from '../components/AssetTimeline';

export const Assets: React.FC = () => {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();

  // Data State
  const [assets, setAssets] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Table State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Drawer / Modal State
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [bulkQRDialogOpen, setBulkQRDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Form Fields (Register Asset)
  const [newName, setNewName] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newLifespan, setNewLifespan] = useState('5');
  const [newVendor, setNewVendor] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCondition, setNewCondition] = useState('Good');
  const [isShared, setIsShared] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  // Form Fields (Allocate Asset)
  const [allocToType, setAllocToType] = useState<'Employee' | 'Department'>('Employee');
  const [allocTargetId, setAllocTargetId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [allocError, setAllocError] = useState<string | null>(null);

  // Form Fields (Return Asset Check-in)
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  // Form Fields (Request Transfer)
  const [transferRequesterType, setTransferRequesterType] = useState<'Employee' | 'Department'>('Employee');
  const [transferRequesterId, setTransferRequesterId] = useState('');
  const [transferExpectedReturn, setTransferExpectedReturn] = useState('');
  const [transferComments, setTransferComments] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Bulk Upload File ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await api.getAssets();
      const v = await api.getVendors();
      const m = await api.getMaintenanceLogs();
      const w = await api.getWarranties();
      const u = await api.getUsers();
      const d = await api.getDepartments();
      const al = await api.getAllocations();
      const cats = await api.getCategories();

      setAssets(a);
      setVendors(v);
      setMaintenance(m);
      setWarranties(w);
      setUsers(u);
      setDepartments(d);
      setAllocations(al);
      setCategories(cats);
      
      // Default new asset category to first active category if available
      if (cats && cats.length > 0) {
        setNewCategory(cats[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredAssets.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleCreateAsset = async () => {
    if (!newName || !newSerial || !newLocation || !newCost) {
      addNotification('⚠️ Validation Failed', 'Please complete all required fields.', 'warning');
      return;
    }

    try {
      const payload = {
        name: newName,
        serial_number: newSerial,
        model_number: newModel || 'N/A',
        category: newCategory,
        location: newLocation,
        purchase_value: Number(newCost),
        purchase_date: newPurchaseDate,
        lifespan_years: Number(newLifespan),
        depreciation_method: 'Straight-Line',
        current_value: Number(newCost),
        vendor_id: newVendor || null,
        status: 'Available',
        condition: newCondition,
        is_shared: isShared,
        photo_url: photoUrl,
        documents: uploadedDocs
      };

      const newAsset = await api.createAsset(payload, role, user?.email || 'admin@assetflow.com');
      if (newAsset) {
        addNotification('🎉 Asset Registered', `${newName} added to inventory.`, 'success');
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      }
    } catch (err) {
      addNotification('❌ Database Error', 'Failed to save the asset. Serial number may already exist.', 'error');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (role === 'Employee') {
      addNotification('🚫 Access Denied', 'Employees do not have permission to delete assets.', 'warning');
      return;
    }
    if (window.confirm('Are you sure you want to retire and remove this asset?')) {
      await api.deleteAsset(id);
      addNotification('🗑️ Asset Retired', 'Asset has been removed from ERP active databases.', 'info');
      if (selectedAsset && selectedAsset.id === id) {
        setDrawerOpen(false);
      }
      loadData();
    }
  };

  const handleLifecycleTransition = async (newStatus: string) => {
    if (!selectedAsset) return;
    try {
      const updated = await api.updateAsset(selectedAsset.id, { status: newStatus }, role, user?.email || 'admin@assetflow.com');
      if (updated) {
        setSelectedAsset(updated);
        addNotification('🔄 State Updated', `Asset state transitioned to ${newStatus}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addNotification('❌ Transition Failed', err.message || 'Failed to update asset state.', 'error');
    }
  };

  const handleAllocateClick = () => {
    setAllocError(null);
    setAllocTargetId('');
    setExpectedReturnDate('');
    setAllocateDialogOpen(true);
  };

  const handleAllocateSubmit = async () => {
    if (!selectedAsset || !allocTargetId) {
      setAllocError('Please select an employee or department.');
      return;
    }
    
    setAllocError(null);
    try {
      await api.createAllocation({
        asset_id: selectedAsset.id,
        allocated_to_type: allocToType,
        employee_id: allocToType === 'Employee' ? allocTargetId : null,
        department_id: allocToType === 'Department' ? allocTargetId : null,
        expected_return_date: expectedReturnDate || null
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Asset Allocated', 'Asset allocation recorded successfully.', 'success');
      setAllocateDialogOpen(false);
      setDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setAllocError(err.message || 'Allocation request failed.');
    }
  };

  const handleReturnClick = () => {
    if (!selectedAsset) return;
    setReturnCondition(selectedAsset.condition || 'Good');
    setReturnNotes('');
    setReturnDialogOpen(true);
  };

  const handleReturnSubmit = async () => {
    if (!selectedAsset) return;
    const activeAlloc = allocations.find(al => al.asset_id === selectedAsset.id && al.status === 'Active');
    if (!activeAlloc) return;

    try {
      await api.returnAllocation(
        activeAlloc.id, 
        returnCondition, 
        returnNotes, 
        role, 
        user?.email || 'admin@assetflow.com'
      );
      addNotification('🎉 Asset Returned', `Asset returned in ${returnCondition} condition.`, 'success');
      setReturnDialogOpen(false);
      setDrawerOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Return Failed', err.message || 'Failed to return asset.', 'error');
    }
  };

  const handleTransferClick = () => {
    setTransferError(null);
    setTransferRequesterId('');
    setTransferExpectedReturn('');
    setTransferComments('');
    setTransferDialogOpen(true);
  };

  const handleTransferSubmit = async () => {
    if (!selectedAsset || !transferRequesterId) {
      setTransferError('Please select a requester.');
      return;
    }
    setTransferError(null);
    try {
      await api.createTransferRequest({
        asset_id: selectedAsset.id,
        requester_id: transferRequesterId,
        allocated_to_type: transferRequesterType,
        expected_return_date: transferExpectedReturn || null,
        comments: transferComments
      }, role, user?.email || 'admin@assetflow.com');

      addNotification('🎉 Transfer Requested', 'Transfer request has been routed to approvals queue.', 'success');
      setTransferDialogOpen(false);
      setDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setTransferError(err.message || 'Failed to request transfer.');
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewSerial('');
    setNewModel('');
    setNewCategory(categories.length > 0 ? categories[0].name : '');
    setNewLocation('');
    setNewCost('');
    setNewLifespan('5');
    setNewVendor('');
    setNewPurchaseDate(new Date().toISOString().split('T')[0]);
    setNewCondition('Good');
    setIsShared(false);
    setPhotoUrl('');
    setUploadedDocs([]);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        if (cols.length >= 6) {
          try {
            await api.createAsset({
              name: cols[0].trim(),
              serial_number: cols[1].trim(),
              model_number: cols[2].trim() || 'N/A',
              category: cols[3].trim(),
              location: cols[4].trim(),
              purchase_value: Number(cols[5].trim()),
              purchase_date: new Date().toISOString().split('T')[0],
              lifespan_years: Number(cols[6]?.trim() || 5),
              depreciation_method: 'Straight-Line',
              current_value: Number(cols[5].trim()),
              vendor_id: null,
              status: 'Available'
            }, role, user?.email || 'admin@assetflow.com');
            successCount++;
          } catch (err) {
            console.error('Row insert error:', err);
          }
        }
      }

      addNotification('📥 Bulk Import Complete', `Imported ${successCount} assets from CSV.`, 'success');
      loadData();
    };
    reader.readAsText(file);
  };

  const handleExportExcel = () => {
    const exportData = assets.map(a => ({
      ID: a.id,
      Name: a.name,
      'Serial Number': a.serial_number,
      'Model Number': a.model_number,
      Category: a.category,
      Location: a.location,
      'Purchase Value ($)': Number(a.purchase_value),
      'Purchase Date': a.purchase_date,
      'Estimated Lifespan (Years)': a.lifespan_years,
      Status: a.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets Database");
    XLSX.writeFile(wb, "AssetFlow_Inventory.xlsx");
    addNotification('📁 Excel Spreadsheet Exported', 'Downloaded asset database copy.', 'success');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica");
    doc.setFontSize(18);
    doc.text("AssetFlow ERP - Enterprise Asset Inventory", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Session Email: ${user?.email}`, 14, 21);
    
    (doc as any).autoTable({
      head: [['Asset Name', 'Serial #', 'Category', 'Location', 'Cost', 'Status']],
      body: assets.map(a => [
        a.name, 
        a.serial_number, 
        a.category, 
        a.location, 
        `$${Number(a.purchase_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
        a.status
      ]),
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save("AssetFlow_Inventory_Report.pdf");
    addNotification('📄 PDF Document Generated', 'Downloaded detailed inventory report.', 'success');
  };

  const handleGenerateBulkQR = async () => {
    if (selected.length === 0) {
      addNotification('⚠️ Action Required', 'Select one or more assets to generate QR sheets.', 'warning');
      return;
    }

    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text("AssetFlow ERP - Printable QR Labels", 14, 15);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);

    let col = 0;
    let row = 0;
    const padding = 15;
    const cardW = 55;
    const cardH = 50;
    const qrSize = 30;

    for (let i = 0; i < selected.length; i++) {
      const asset = assets.find(a => a.id === selected[i]);
      if (!asset) continue;

      const x = padding + col * (cardW + 10);
      const y = 25 + row * (cardH + 10);

      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, cardW, cardH);

      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, asset.serial_number, { width: 100, margin: 1 });
      const imgData = canvas.toDataURL('image/png');

      doc.addImage(imgData, 'PNG', x + (cardW - qrSize) / 2, y + 5, qrSize, qrSize);

      doc.setFontSize(8);
      doc.setFont("Helvetica", "bold");
      const truncatedName = asset.name.length > 18 ? `${asset.name.substring(0, 18)}...` : asset.name;
      doc.text(truncatedName, x + 4, y + qrSize + 10);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`SN: ${asset.serial_number}`, x + 4, y + qrSize + 14);
      doc.text(`Loc: ${asset.location}`, x + 4, y + qrSize + 18);

      col++;
      if (col >= 3) {
        col = 0;
        row++;
      }
      if (row >= 4 && i < selected.length - 1) {
        doc.addPage();
        row = 0;
        col = 0;
      }
    }

    doc.save("AssetFlow_QR_Labels.pdf");
    addNotification('🖨️ QR Label Sheet Generated', `Print sheet containing ${selected.length} QR labels.`, 'success');
    setBulkQRDialogOpen(false);
  };

  const handleOpenDrawer = (asset: any) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  };

  // Filter Logic
  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(search.toLowerCase()) || 
      a.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      (a.asset_tag && a.asset_tag.toLowerCase().includes(search.toLowerCase())) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesDepartment = departmentFilter === 'All' || (() => {
      const alloc = allocations.find(al => al.asset_id === a.id && al.status === 'Active');
      if (!alloc) return false;
      if (alloc.allocated_to_type === 'Department') {
        const dept = departments.find(d => d.id === alloc.department_id);
        return dept?.name === departmentFilter;
      } else {
        const emp = users.find(u => u.id === alloc.employee_id);
        const dept = departments.find(d => d.id === emp?.department_id);
        return dept?.name === departmentFilter;
      }
    })();

    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAssets = filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Status color codes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Allocated': return 'primary';
      case 'Reserved': return 'info';
      case 'Under Maintenance': return 'warning';
      case 'Lost': return 'error';
      case 'Retired': case 'Disposed': return 'default';
      default: return 'default';
    }
  };

  const getActiveAllocationDetails = (assetId: string) => {
    const active = allocations.find(al => al.asset_id === assetId && al.status === 'Active');
    if (!active) return null;
    
    if (active.allocated_to_type === 'Employee') {
      const u = users.find(usr => usr.id === active.employee_id);
      return u ? `Employee: ${u.first_name} ${u.last_name}` : 'Employee (Unassigned)';
    } else {
      const d = departments.find(dept => dept.id === active.department_id);
      return d ? `Dept: ${d.name}` : 'Dept (Unassigned)';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Enterprise Asset Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage corporate resources, track flexible lifecycles, and perform asset allocations
          </Typography>
        </Box>

        {/* Global Toolbar buttons */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".csv" 
            onChange={handleCSVUpload} 
          />
          
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={role === 'Employee'}
          >
            Bulk Import CSV
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>

          {role !== 'Employee' && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Add Asset
            </Button>
          )}
        </Stack>
      </Box>

      {/* Filter and Search Panel */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by tag, serial, or QR code.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="All">All Categories</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Lifecycle Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Lifecycle Status"
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Allocated">Allocated</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
                <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                <MenuItem value="Lost">Lost</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
                <MenuItem value="Disposed">Disposed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Department"
              >
                <MenuItem value="All">All Departments</MenuItem>
                {departments.map(d => (
                  <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<QrIcon />}
              onClick={() => setBulkQRDialogOpen(true)}
              disabled={selected.length === 0}
            >
              Print ({selected.length})
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Asset Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < filteredAssets.length}
                  checked={filteredAssets.length > 0 && selected.length === filteredAssets.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Asset Tag</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Asset Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Serial Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Current Book Value</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Allocation</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">Fetching database connections...</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No matching assets registered.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAssets.map((asset) => {
                const isItemSelected = selected.indexOf(asset.id) !== -1;
                const allocationDetails = getActiveAllocationDetails(asset.id);
                return (
                  <TableRow 
                    key={asset.id} 
                    hover
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => { e.stopPropagation(); handleSelectOne(asset.id); }}>
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)} sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main', fontSize: '0.85rem' }}>
                      {asset.asset_tag || 'N/A'}
                    </TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)} sx={{ fontWeight: 'bold' }}>
                      {asset.name}
                    </TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {asset.serial_number}
                    </TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)}>{asset.category}</TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)}>{asset.location}</TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)}>${Number(asset.current_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)}>
                      <Chip 
                        label={asset.status} 
                        color={getStatusColor(asset.status) as any}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleOpenDrawer(asset)}>
                      {allocationDetails ? (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
                          {allocationDetails}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">None</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details / Manage">
                        <IconButton size="small" onClick={() => handleOpenDrawer(asset)} color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {role !== 'Employee' && (
                        <Tooltip title="Retire Asset">
                          <IconButton size="small" onClick={() => handleDeleteAsset(asset.id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAssets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Asset Lifecycle / Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 550 }, p: 3, borderLeft: '1px solid', borderColor: 'divider' } }}
      >
        {selectedAsset && (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{selectedAsset.name}</Typography>
                  {selectedAsset.asset_tag && (
                    <Chip 
                      label={selectedAsset.asset_tag} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontFamily: 'monospace', fontWeight: 'bold' }} 
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">{selectedAsset.category} | {selectedAsset.location}</Typography>
              </Box>
              <Chip label={selectedAsset.status} color={getStatusColor(selectedAsset.status) as any} />
            </Box>

            {/* Quick Actions for Lifecycle and Allocation */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: 'primary.main', borderStyle: 'dashed' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Lifecycle Controls</Typography>
              
              <Grid container spacing={2}>
                {role !== 'Employee' && (
                  <Grid item xs={selectedAsset.status === 'Allocated' ? 12 : 6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Transition State</InputLabel>
                      <Select
                        value={selectedAsset.status}
                        label="Transition State"
                        onChange={(e) => handleLifecycleTransition(e.target.value)}
                      >
                        <MenuItem value="Available">Available</MenuItem>
                        <MenuItem value="Reserved">Reserved</MenuItem>
                        <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                        <MenuItem value="Lost">Lost</MenuItem>
                        <MenuItem value="Retired">Retired</MenuItem>
                        <MenuItem value="Disposed">Disposed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={selectedAsset.status === 'Allocated' || role === 'Employee' ? 12 : 6}>
                  {selectedAsset.status === 'Available' ? (
                    role !== 'Employee' ? (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AllocateIcon />}
                        onClick={handleAllocateClick}
                        sx={{ textTransform: 'none' }}
                      >
                        Allocate Asset
                      </Button>
                    ) : (
                      <Button fullWidth disabled variant="outlined" sx={{ textTransform: 'none' }}>
                        Ready in Inventory
                      </Button>
                    )
                  ) : selectedAsset.status === 'Allocated' ? (
                    <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                      {role !== 'Employee' && (
                        <Button
                          fullWidth
                          variant="contained"
                          color="secondary"
                          startIcon={<ReturnIcon />}
                          onClick={handleReturnClick}
                          sx={{ textTransform: 'none' }}
                        >
                          Return Asset
                        </Button>
                      )}
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        startIcon={<ReturnIcon sx={{ transform: 'rotate(180deg)' }} />}
                        onClick={handleTransferClick}
                        sx={{ textTransform: 'none' }}
                      >
                        Request Transfer
                      </Button>
                    </Stack>
                  ) : (
                    <Button fullWidth disabled variant="outlined" sx={{ textTransform: 'none' }}>
                      Allocation Locked
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Asset Photo Preview */}
            {selectedAsset.photo_url && (
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Physical Appearance</Typography>
                <Box 
                  component="img" 
                  src={selectedAsset.photo_url} 
                  alt={selectedAsset.name} 
                  sx={{ 
                    width: '100%', 
                    maxHeight: 180, 
                    objectFit: 'cover', 
                    borderRadius: 2.5, 
                    border: '1px solid',
                    borderColor: 'divider' 
                  }} 
                />
              </Box>
            )}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              {/* Telemetry info */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>Core Telemetry</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Risk Index</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: Number(selectedAsset.risk_score) > 50 ? 'error.main' : 'text.primary' }}>
                        {selectedAsset.risk_score}%
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Condition</Typography>
                      <Chip 
                        label={selectedAsset.condition || 'Good'} 
                        size="small" 
                        color={selectedAsset.condition === 'Broken' || selectedAsset.condition === 'Poor' ? 'error' : selectedAsset.condition === 'Fair' ? 'warning' : 'success'} 
                        sx={{ fontWeight: 'bold', height: 20, fontSize: '0.7rem' }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Usage Type</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedAsset.is_shared ? 'Shared' : 'Individual'}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Hours</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedAsset.telemetry_hours} hrs</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Barcode & QR code references */}
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Inventory Barcode</Typography>
                <BarcodeGenerator value={selectedAsset.serial_number} height={40} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Physical Scan Label</Typography>
                <QRGenerator value={selectedAsset.serial_number} size={90} showDownload />
              </Grid>
            </Grid>

            {/* Document attachments list */}
            {selectedAsset.documents && selectedAsset.documents.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>Linked Documents & Manuals</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedAsset.documents.map((docName: string, index: number) => (
                    <Chip
                      key={index}
                      label={docName}
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => alert(`Simulated document download for file: ${docName}`)}
                      sx={{ cursor: 'pointer', mb: 0.8, fontSize: '0.75rem' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Amortization calculator */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Depreciation Projection Schedule</Typography>
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.75rem' }}>Year</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>Method</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>Expense</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>Book Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { year: 2025, method: 'Straight-Line', exp: selectedAsset.purchase_value / selectedAsset.lifespan_years, val: selectedAsset.purchase_value - (selectedAsset.purchase_value / selectedAsset.lifespan_years) },
                      { year: 2026, method: 'Straight-Line', exp: selectedAsset.purchase_value / selectedAsset.lifespan_years, val: selectedAsset.purchase_value - 2 * (selectedAsset.purchase_value / selectedAsset.lifespan_years) },
                      { year: 2027, method: 'Straight-Line', exp: selectedAsset.purchase_value / selectedAsset.lifespan_years, val: selectedAsset.purchase_value - 3 * (selectedAsset.purchase_value / selectedAsset.lifespan_years) }
                    ].map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.year}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{row.method}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>${row.exp.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>${Math.max(0, row.val).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            {/* Lifecycle Timeline */}
            <AssetTimeline 
              asset={selectedAsset} 
              maintenanceLogs={maintenance} 
              warranties={warranties} 
              allocations={allocations}
              users={users}
              departments={departments}
            />
          </Box>
        )}
      </Drawer>

      {/* Allocate Asset Dialog */}
      <Dialog open={allocateDialogOpen} onClose={() => setAllocateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Allocate Asset</DialogTitle>
        <DialogContent dividers>
          {allocError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{allocError}</Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
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

          {allocToType === 'Employee' ? (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Employee</InputLabel>
              <Select
                value={allocTargetId}
                label="Select Employee"
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Department</InputLabel>
              <Select
                value={allocTargetId}
                label="Select Department"
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

          <TextField
            fullWidth
            label="Expected Return Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocateDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAllocateSubmit} variant="contained" color="primary">Confirm Allocation</Button>
        </DialogActions>
      </Dialog>

      {/* Register Asset Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Register New Asset</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Asset Name *" 
                fullWidth 
                size="small" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Serial Number (Unique) *" 
                fullWidth 
                size="small" 
                value={newSerial} 
                onChange={(e) => setNewSerial(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Model Number" 
                fullWidth 
                size="small" 
                value={newModel} 
                onChange={(e) => setNewModel(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} label="Category">
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Location *" 
                fullWidth 
                size="small" 
                value={newLocation} 
                onChange={(e) => setNewLocation(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Acquisition Value ($) *" 
                type="number" 
                fullWidth 
                size="small" 
                value={newCost} 
                onChange={(e) => setNewCost(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Lifespan (Years)" 
                type="number" 
                fullWidth 
                size="small" 
                value={newLifespan} 
                onChange={(e) => setNewLifespan(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendor</InputLabel>
                <Select value={newVendor} onChange={(e) => setNewVendor(e.target.value)} label="Vendor">
                  {vendors.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Initial Condition</InputLabel>
                <Select value={newCondition} onChange={(e) => setNewCondition(e.target.value)} label="Initial Condition">
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Poor">Poor</MenuItem>
                  <MenuItem value="Broken">Broken</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Photo URL (Optional)" 
                fullWidth 
                size="small" 
                value={photoUrl} 
                onChange={(e) => setPhotoUrl(e.target.value)} 
                placeholder="https://example.com/photo.jpg"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Asset Tag" 
                fullWidth 
                size="small" 
                disabled
                value="Auto-generated (AF-XXXX)" 
                helperText="Will be generated sequentially upon saving"
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox 
                checked={isShared} 
                onChange={(e) => setIsShared(e.target.checked)} 
                id="is-shared-checkbox" 
              />
              <Typography variant="body2" component="label" htmlFor="is-shared-checkbox" sx={{ cursor: 'pointer', userSelect: 'none' }}>
                Shared / Bookable Resource
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Purchase Date" 
                type="date" 
                fullWidth 
                size="small" 
                value={newPurchaseDate} 
                onChange={(e) => setNewPurchaseDate(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Documents & Manuals (Simulated)</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      const name = prompt('Enter document file name (e.g. Purchase_Invoice.pdf):');
                      if (name) setUploadedDocs([...uploadedDocs, name]);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    + Add Document
                  </Button>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {uploadedDocs.map((doc, idx) => (
                    <Chip key={idx} label={doc} size="small" onDelete={() => setUploadedDocs(uploadedDocs.filter((_, i) => i !== idx))} />
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateAsset} variant="contained" color="primary">Save Asset</Button>
        </DialogActions>
      </Dialog>

      {/* Return Asset Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Return Asset to Inventory</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please log the asset check-in details below to revert its status to **Available**.
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
            label="Condition Check-in Notes"
            multiline
            rows={3}
            size="small"
            placeholder="e.g. Scratches on lid, working perfectly otherwise"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleReturnSubmit} variant="contained" color="secondary">Confirm Return</Button>
        </DialogActions>
      </Dialog>

      {/* Request Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Request Asset Transfer</DialogTitle>
        <DialogContent dividers>
          {transferError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{transferError}</Alert>
          )}
          {selectedAsset && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              This asset is currently allocated. Requesting this will route a transfer proposal to supervisors.
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel>Transfer To Type</InputLabel>
            <Select
              value={transferRequesterType}
              label="Transfer To Type"
              onChange={(e) => {
                setTransferRequesterType(e.target.value as any);
                setTransferRequesterId('');
              }}
            >
              <MenuItem value="Employee">Employee</MenuItem>
              <MenuItem value="Department">Department</MenuItem>
            </Select>
          </FormControl>

          {transferRequesterType === 'Employee' ? (
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Select Requester *</InputLabel>
              <Select
                value={transferRequesterId}
                label="Select Requester *"
                onChange={(e) => setTransferRequesterId(e.target.value)}
              >
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Select Department *</InputLabel>
              <Select
                value={transferRequesterId}
                label="Select Department *"
                onChange={(e) => setTransferRequesterId(e.target.value)}
              >
                {departments.map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Expected Return Date"
            type="date"
            size="small"
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            value={transferExpectedReturn}
            onChange={(e) => setTransferExpectedReturn(e.target.value)}
          />

          <TextField
            fullWidth
            label="Comments / Reason for Transfer *"
            multiline
            rows={3}
            size="small"
            placeholder="Why do you need to transfer this laptop?"
            value={transferComments}
            onChange={(e) => setTransferComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleTransferSubmit} variant="contained" color="primary">Submit Transfer Request</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk QR Sheet Dialog */}
      <Dialog open={bulkQRDialogOpen} onClose={() => setBulkQRDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Generate QR Printable Sheet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You have selected **{selected.length}** asset(s). This utility will generate a print-ready grid sheet containing scannable QR stickers with associated descriptions for physical labeling.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBulkQRDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleGenerateBulkQR} variant="contained" color="primary">Generate Labels (PDF)</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;
