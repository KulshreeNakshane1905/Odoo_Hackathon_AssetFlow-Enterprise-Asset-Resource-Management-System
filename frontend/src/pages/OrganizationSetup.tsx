import React, { useEffect, useState } from 'react';
import { 
  Box, Tabs, Tab, Card, CardContent, Typography, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Stack, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Select, MenuItem, 
  FormControl, InputLabel, IconButton, Alert, Switch, 
  FormControlLabel
} from '@mui/material';
import { 
  CorporateFare as OrgIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Domain as DeptIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const OrganizationSetup: React.FC = () => {
  const { role, user: loggedUser } = useAuth();
  const { addNotification } = useNotifications();

  // Tab State
  const [tabValue, setTabValue] = useState(0);

  // Data States
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('');
  const [deptParentId, setDeptParentId] = useState('');
  const [deptStatus, setDeptStatus] = useState('Active');

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catWarranty, setCatWarranty] = useState<number | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const depts = await api.getDepartments();
      const cats = await api.getCategories();
      const emps = await api.getUsers();
      setDepartments(depts);
      setCategories(cats);
      setEmployees(emps);
    } catch (err) {
      console.error('Error fetching organization setup data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Tab Switcher ---
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // --- Department Operations ---
  const handleOpenDeptModal = (dept: any | null = null) => {
    if (role !== 'Admin') {
      addNotification('⚠️ Access Denied', 'Only Admins can modify department registers.', 'error');
      return;
    }
    if (dept) {
      setEditingDept(dept);
      setDeptName(dept.name);
      setDeptCode(dept.code);
      setDeptHeadId(dept.department_head_id || '');
      setDeptParentId(dept.parent_id || '');
      setDeptStatus(dept.status || 'Active');
    } else {
      setEditingDept(null);
      setDeptName('');
      setDeptCode('');
      setDeptHeadId('');
      setDeptParentId('');
      setDeptStatus('Active');
    }
    setDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) {
      addNotification('⚠️ Fields Required', 'Please input department name and code.', 'warning');
      return;
    }

    const payload = {
      name: deptName,
      code: deptCode,
      department_head_id: deptHeadId || null,
      parent_id: deptParentId || null,
      status: deptStatus
    };

    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, payload);
        addNotification('🎉 Department Updated', `Successfully updated division: ${deptName}.`, 'success');
      } else {
        await api.createDepartment(payload);
        addNotification('🎉 Department Added', `Initialized division: ${deptName}.`, 'success');
      }
      setDeptModalOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Save Failed', err.message || 'Error occurred.', 'error');
    }
  };

  const handleToggleDeptStatus = async (dept: any) => {
    if (role !== 'Admin') return;
    const nextStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.updateDepartment(dept.id, { ...dept, status: nextStatus });
      addNotification('ℹ️ Status Toggled', `Department ${dept.name} is now ${nextStatus}.`, 'info');
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to update department.', 'error');
    }
  };

  // --- Category Operations ---
  const handleOpenCatModal = (cat: any | null = null) => {
    if (role !== 'Admin') {
      addNotification('⚠️ Access Denied', 'Only Admins can modify category registries.', 'error');
      return;
    }
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatCode(cat.code);
      setCatDesc(cat.description || '');
      setCatWarranty(cat.warranty_period || '');
    } else {
      setEditingCat(null);
      setCatName('');
      setCatCode('');
      setCatDesc('');
      setCatWarranty('');
    }
    setCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCode) {
      addNotification('⚠️ Validation Failed', 'Please specify category name and code.', 'warning');
      return;
    }

    const payload = {
      name: catName,
      code: catCode,
      description: catDesc,
      warranty_period: catWarranty !== '' ? Number(catWarranty) : null
    };

    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, payload);
        addNotification('🎉 Category Updated', `Successfully updated category: ${catName}.`, 'success');
      } else {
        await api.createCategory(payload);
        addNotification('🎉 Category Added', `Successfully registered category: ${catName}.`, 'success');
      }
      setCatModalOpen(false);
      loadData();
    } catch (err: any) {
      addNotification('❌ Save Failed', err.message || 'Error occurred.', 'error');
    }
  };

  // --- Employee Directory Operations ---
  const handleEmployeeRoleChange = async (userId: string, newRole: any) => {
    if (role !== 'Admin') {
      addNotification('⚠️ Access Denied', 'Only system administrators can assign corporate roles.', 'error');
      return;
    }
    try {
      await api.promoteUser(userId, newRole, loggedUser?.email || 'admin@assetflow.com');
      addNotification('🎉 Role Changed', `Employee promoted to ${newRole} successfully.`, 'success');
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to change role.', 'error');
    }
  };

  const handleEmployeeDeptChange = async (userId: string, deptId: string) => {
    if (role !== 'Admin') return;
    try {
      await api.updateUser(userId, { department_id: deptId === 'None' ? null : deptId });
      addNotification('🎉 Department Re-assigned', 'Employee department updated successfully.', 'success');
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to update department.', 'error');
    }
  };

  const handleEmployeeStatusToggle = async (emp: any) => {
    if (role !== 'Admin') return;
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.updateUser(emp.id, { status: nextStatus });
      addNotification('ℹ️ Status Changed', `Employee is now marked as ${nextStatus}.`, 'info');
      loadData();
    } catch (err: any) {
      addNotification('❌ Action Failed', err.message || 'Failed to change status.', 'error');
    }
  };

  // --- Helpers ---
  const getEmployeeName = (id: string) => {
    const found = employees.find(e => e.id === id);
    return found ? `${found.first_name} ${found.last_name}` : 'Unassigned';
  };

  const getDeptName = (id: string) => {
    const found = departments.find(d => d.id === id);
    return found ? found.name : 'None';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <OrgIcon color="primary" sx={{ fontSize: '2.4rem' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Organization Setup</Typography>
            <Typography variant="caption" color="text.secondary">Maintain divisions, asset categories, and assign employee roles</Typography>
          </Box>
        </Box>
        {role === 'Admin' && (
          <Stack direction="row" spacing={1.5}>
            {tabValue === 0 && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => handleOpenDeptModal()}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Add Department
              </Button>
            )}
            {tabValue === 1 && (
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<AddIcon />} 
                onClick={() => handleOpenCatModal()}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Add Category
              </Button>
            )}
          </Stack>
        )}
      </Box>

      {/* Admin Role Check Warning */}
      {role !== 'Admin' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          You are currently in read-only mode. Modifying hierarchies, categories, or promoting user privileges requires an <strong>Admin</strong> account.
        </Alert>
      )}

      {/* Layout Tabs */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="organization tabs">
            <Tab icon={<DeptIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Departments" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
            <Tab icon={<CategoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Categories" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
            <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Employee Directory" sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {/* Tab A - Department Management */}
          {tabValue === 0 && (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 0 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department Head</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Parent Division</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    {role === 'Admin' && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No departments defined.</TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{dept.name}</TableCell>
                        <TableCell><Chip label={dept.code} size="small" variant="outlined" /></TableCell>
                        <TableCell>{getEmployeeName(dept.department_head_id)}</TableCell>
                        <TableCell>{getDeptName(dept.parent_id)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={dept.status || 'Active'} 
                            color={dept.status === 'Inactive' ? 'default' : 'success'} 
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                            onClick={() => handleToggleDeptStatus(dept)}
                            style={{ cursor: role === 'Admin' ? 'pointer' : 'default' }}
                          />
                        </TableCell>
                        {role === 'Admin' && (
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleOpenDeptModal(dept)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab B - Category Management */}
          {tabValue === 1 && (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 0 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Warranty Period (Months)</TableCell>
                    {role === 'Admin' && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No categories registered.</TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{cat.name}</TableCell>
                        <TableCell><Chip label={cat.code} size="small" variant="outlined" /></TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{cat.description || 'No description provided'}</TableCell>
                        <TableCell>
                          {cat.warranty_period ? `${cat.warranty_period} Months` : 'N/A'}
                        </TableCell>
                        {role === 'Admin' && (
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleOpenCatModal(cat)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab C - Employee Directory */}
          {tabValue === 2 && (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 0 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>System Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Account Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{emp.first_name} {emp.last_name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>
                        {role === 'Admin' ? (
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                              value={emp.department_id || 'None'}
                              onChange={(e) => handleEmployeeDeptChange(emp.id, e.target.value)}
                            >
                              <MenuItem value="None">Unassigned</MenuItem>
                              {departments.filter(d => d.status !== 'Inactive').map(d => (
                                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          getDeptName(emp.department_id)
                        )}
                      </TableCell>
                      <TableCell>
                        {role === 'Admin' && emp.email !== 'admin@assetflow.com' ? (
                          <FormControl size="small" sx={{ minWidth: 160 }}>
                            <Select
                              value={emp.role}
                              onChange={(e) => handleEmployeeRoleChange(emp.id, e.target.value)}
                            >
                              <MenuItem value="Employee">Employee</MenuItem>
                              <MenuItem value="Department Head">Department Head</MenuItem>
                              <MenuItem value="Asset Manager">Asset Manager</MenuItem>
                              <MenuItem value="Admin">Admin</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip label={emp.role} size="small" color={emp.role === 'Admin' ? 'error' : 'default'} sx={{ fontWeight: 'bold' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={emp.status !== 'Inactive'}
                              onChange={() => handleEmployeeStatusToggle(emp)}
                              disabled={role !== 'Admin' || emp.email === 'admin@assetflow.com'}
                              color="success"
                            />
                          }
                          label={emp.status === 'Inactive' ? 'Inactive' : 'Active'}
                          labelPlacement="end"
                          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem', fontWeight: 600 } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Department Modal */}
      <Dialog open={deptModalOpen} onClose={() => setDeptModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingDept ? `Modify Department: ${editingDept.name}` : 'Create Corporate Department'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }} component="form" onSubmit={handleDeptSubmit}>
            <TextField 
              fullWidth
              label="Department Name *"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="e.g. Facilities Operations"
            />
            <TextField 
              fullWidth
              label="Department Code *"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              placeholder="e.g. FAC"
            />
            <FormControl fullWidth>
              <InputLabel>Department Head</InputLabel>
              <Select
                value={deptHeadId}
                label="Department Head"
                onChange={(e) => setDeptHeadId(e.target.value)}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {employees.map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Parent Department</InputLabel>
              <Select
                value={deptParentId}
                label="Parent Department"
                onChange={(e) => setDeptParentId(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {departments.filter(d => !editingDept || d.id !== editingDept.id).map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={deptStatus}
                label="Status"
                onChange={(e) => setDeptStatus(e.target.value)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeptModalOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleDeptSubmit} variant="contained">Save Department</Button>
        </DialogActions>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={catModalOpen} onClose={() => setCatModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingCat ? `Modify Category: ${editingCat.name}` : 'Create Asset Category'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }} component="form" onSubmit={handleCatSubmit}>
            <TextField 
              fullWidth
              label="Category Name *"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. IT Electronics"
            />
            <TextField 
              fullWidth
              label="Category Code *"
              value={catCode}
              onChange={(e) => setCatCode(e.target.value)}
              placeholder="e.g. ITEL"
            />
            <TextField 
              fullWidth
              label="Description"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              multiline
              rows={2}
              placeholder="Brief description of catalog items"
            />
            <TextField 
              fullWidth
              label="Standard Warranty Period (Months)"
              type="number"
              value={catWarranty}
              onChange={(e) => setCatWarranty(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="e.g. 36"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCatModalOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleCatSubmit} variant="contained" color="secondary">Save Category</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationSetup;
