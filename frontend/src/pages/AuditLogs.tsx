import React, { useEffect, useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TextField, 
  FormControl, InputLabel, Select, MenuItem, Paper, Stack, Chip
} from '@mui/material';
import { 
  FactCheck as AuditIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { api } from '../services/api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Table controls
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const l = await api.getActivityLogs();
      const a = await api.getAssets();
      setLogs(l);
      setAssets(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE_ASSET': return 'success';
      case 'UPDATE_ASSET': return 'primary';
      case 'SCHEDULE_MAINTENANCE': return 'warning';
      case 'SCHEDULE_MAINTENANCE_AI': return 'secondary';
      case 'SCAN_ASSET_QR': return 'info';
      default: return 'default';
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.user_email.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === 'All' || l.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            ERP Audit Trails
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inspect security activity logs, database mutations, and system transactions
          </Typography>
        </Box>
      </Box>

      {/* Filter and Search Panel */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search logs by email, detail actions..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Action Category</InputLabel>
            <Select
              value={actionFilter}
              label="Action Category"
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <MenuItem value="All">All Operations</MenuItem>
              <MenuItem value="CREATE_ASSET">Create Asset</MenuItem>
              <MenuItem value="UPDATE_ASSET">Update Asset</MenuItem>
              <MenuItem value="SCHEDULE_MAINTENANCE">Schedule Maintenance</MenuItem>
              <MenuItem value="SCHEDULE_MAINTENANCE_AI">AI Maintenance Schedule</MenuItem>
              <MenuItem value="SCAN_ASSET_QR">QR Scan Audit</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {/* Logs Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Operator Session</TableCell>
                <TableCell>Security Role</TableCell>
                <TableCell>Operation Action</TableCell>
                <TableCell>Associated Asset</TableCell>
                <TableCell>Transaction Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Loading log streams...</TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No security records registered.</TableCell></TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const asset = assets.find(a => a.id === log.asset_id);
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>{log.user_email}</TableCell>
                      <TableCell>
                        <Chip label={log.user_role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action} 
                          color={getActionColor(log.action) as any} 
                          size="small" 
                          sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {asset ? (
                          <strong>{asset.name}</strong>
                        ) : (
                          <span style={{ color: 'gray', fontSize: '0.8rem' }}>Global System</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{log.details}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};
export default AuditLogs;
