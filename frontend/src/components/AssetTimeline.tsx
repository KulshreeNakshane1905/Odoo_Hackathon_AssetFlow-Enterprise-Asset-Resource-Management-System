import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { 
  ShoppingBag as AcquisitionIcon, 
  Build as MaintenanceIcon, 
  FactCheck as AuditIcon, 
  VerifiedUser as WarrantyIcon,
  Timeline as HistoryIcon,
  AssignmentInd as AllocateIcon,
  AssignmentReturn as ReturnIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface AssetTimelineProps {
  asset: any;
  maintenanceLogs: any[];
  warranties: any[];
  allocations?: any[];
  users?: any[];
  departments?: any[];
}

export const AssetTimeline: React.FC<AssetTimelineProps> = ({ 
  asset, 
  maintenanceLogs, 
  warranties,
  allocations = [],
  users = [],
  departments = []
}) => {
  if (!asset) return null;

  // Construct timeline items
  const items: TimelineItem[] = [];

  // 1. Acquisition
  items.push({
    id: 'acq',
    title: 'Asset Acquisition',
    date: asset.purchase_date,
    description: `Acquired for $${Number(asset.purchase_value).toLocaleString()} via vendor. Initialized in ${asset.location} with a ${asset.lifespan_years}-year estimated life.`,
    icon: <AcquisitionIcon fontSize="small" />,
    color: '#3b82f6'
  });

  // 2. Warranties
  const assetWarranties = warranties.filter(w => w.asset_id === asset.id);
  assetWarranties.forEach((w, idx) => {
    items.push({
      id: `war-${idx}`,
      title: 'Warranty Registered',
      date: w.start_date,
      description: `Policy ${w.policy_number} activated. Covered until ${w.end_date}. Details: ${w.coverage_details}`,
      icon: <WarrantyIcon fontSize="small" />,
      color: '#10b981'
    });
  });

  // 3. Maintenance Logs
  const assetLogs = maintenanceLogs.filter(l => l.asset_id === asset.id);
  assetLogs.forEach((l) => {
    items.push({
      id: l.id,
      title: `Maintenance: ${l.status}`,
      date: l.completion_date || l.scheduled_date,
      description: `${l.description}. Performed by: ${l.performed_by || 'Unknown'}. Cost: $${Number(l.cost).toFixed(2)}`,
      icon: <MaintenanceIcon fontSize="small" />,
      color: l.status === 'Completed' ? '#10b981' : l.status === 'In Progress' ? '#f59e0b' : '#3b82f6'
    });
  });

  // 4. Last Audit
  if (asset.last_audit_date) {
    items.push({
      id: 'audit',
      title: 'Physical Audit Verified',
      date: asset.last_audit_date,
      description: `Asset physical presence and telemetry attributes verified at ${asset.location}. Audit status: OK.`,
      icon: <AuditIcon fontSize="small" />,
      color: '#8b5cf6'
    });
  }

  // 5. Allocations History
  const assetAllocs = allocations.filter(al => al.asset_id === asset.id);
  assetAllocs.forEach((al) => {
    const holderName = al.allocated_to_type === 'Employee' 
      ? (() => {
          const u = users.find(usr => usr.id === al.employee_id);
          return u ? `${u.first_name} ${u.last_name}` : 'Employee (Unassigned)';
        })()
      : (() => {
          const d = departments.find(dept => dept.id === al.department_id);
          return d ? `${d.name}` : 'Department (Unassigned)';
        })();

    items.push({
      id: `alloc-checkout-${al.id}`,
      title: `Asset Allocated`,
      date: al.allocated_at,
      description: `Allocated to ${al.allocated_to_type === 'Employee' ? 'Employee' : 'Department'}: ${holderName}. Expected Return: ${al.expected_return_date ? new Date(al.expected_return_date).toLocaleDateString() : 'No Date Specified'}.`,
      icon: <AllocateIcon fontSize="small" />,
      color: '#6366f1'
    });

    if (al.returned_at) {
      items.push({
        id: `alloc-return-${al.id}`,
        title: `Asset Returned`,
        date: al.returned_at,
        description: `Returned to inventory in ${al.returned_condition || 'Good'} condition. Notes: ${al.check_in_notes || 'None'}.`,
        icon: <ReturnIcon fontSize="small" />,
        color: '#10b981'
      });
    }
  });

  // Sort chronologically (most recent first)
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Asset Lifecycle Timeline</Typography>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No historical timeline items registered.</Typography>
      ) : (
        <Box sx={{ position: 'relative', pl: 3, '&::before': { content: '""', position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', bgcolor: 'divider' } }}>
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.2 }}
              style={{ position: 'relative', paddingBottom: idx === items.length - 1 ? 0 : '24px' }}
            >
              {/* Timeline Connector Dot */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  left: '-31px', 
                  top: '2px', 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  bgcolor: item.color, 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.15)',
                  zIndex: 2
                }}
              >
                {item.icon}
              </Box>

              {/* Card Container */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </Paper>
            </motion.div>
          ))}
        </Box>
      )}
    </Box>
  );
};
export default AssetTimeline;
