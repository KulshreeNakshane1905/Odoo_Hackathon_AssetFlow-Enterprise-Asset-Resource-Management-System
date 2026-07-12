import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, IconButton, Badge, 
  Menu, MenuItem, Divider, FormControl, Select, 
  useTheme, useMediaQuery, Chip, CircularProgress, Button
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Inventory as AssetsIcon, 
  Build as MaintenanceIcon, 
  Store as VendorsIcon, 
  Security as LogsIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  NotificationsActive as NotificationActiveIcon,
  People as PeopleIcon,
  CalendarMonth as BookingsIcon,
  AssignmentTurnedIn as AuditIcon,
  SwapHoriz as TransferIcon
} from '@mui/icons-material';

import { CustomThemeProvider, useThemeToggle } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UserRole } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';

import { api } from './services/api';

// Pages
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Allocations } from './pages/Allocations';
import { Maintenance } from './pages/Maintenance';
import { Vendors } from './pages/Vendors';
import { AuditLogs } from './pages/AuditLogs';
import { OrganizationSetup } from './pages/OrganizationSetup';
import { Bookings } from './pages/Bookings';
import { AuditCycles } from './pages/AuditCycles';

// Global floating components
import { AIChatbot } from './components/AIChatbot';

const DRAWER_WIDTH = 250;

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode, toggleDarkMode } = useThemeToggle();
  const { role, setRole, user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, addNotification } = useNotifications();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'allocations' | 'bookings' | 'maintenance' | 'vendors' | 'audits' | 'employees' | 'logs'>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notification menu state
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  // Scan overdue returns on mount
  useEffect(() => {
    const scanOverdue = async () => {
      try {
        const allocs = await api.getAllocations();
        const assetsList = await api.getAssets();
        const todayStr = new Date().toISOString().split('T')[0];
        const savedNotifs = JSON.parse(localStorage.getItem('system-notifications') || '[]');
        
        allocs.forEach((al: any) => {
          if (al.status === 'Active' && al.expected_return_date && al.expected_return_date < todayStr) {
            const exists = savedNotifs.some((n: any) => n.title === '⚠️ Overdue Return Alert' && n.message.includes(al.asset_id));
            if (!exists) {
              const asset = assetsList.find((a: any) => a.id === al.asset_id);
              api.createActivityLog({
                user_email: 'system@assetflow.com',
                user_role: 'Admin',
                action: 'OVERDUE_ALERT',
                asset_id: al.asset_id,
                details: `Asset ${asset ? asset.name : al.asset_id} is overdue. Expected return was ${al.expected_return_date}.`
              }, 'Admin', 'system@assetflow.com');

              addNotification(
                `⚠️ Overdue Return Alert`,
                `Asset "${asset ? asset.name : al.asset_id}" (ID: ${al.asset_id}) is past its expected return date of ${al.expected_return_date}. Please contact the holder.`,
                'error'
              );
            }
          }
        });
      } catch (err) {
        console.error('Failed to run overdue returns scan:', err);
      }
    };
    
    const timer = setTimeout(() => {
      scanOverdue();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    if (id.startsWith('n') || id.includes('overdue')) {
      setActiveTab('allocations');
    }
    handleNotifClose();
  };

  // Determine available nav items based on roles
  const navItems = [
    { id: 'dashboard', text: 'Analytics & KPIs', icon: <DashboardIcon />, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'assets', text: 'Asset Inventory', icon: <AssetsIcon />, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'allocations', text: 'Allocations & Transfers', icon: <TransferIcon />, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'bookings', text: 'Resource Bookings', icon: <BookingsIcon />, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'maintenance', text: 'Maintenance & Service', icon: <MaintenanceIcon />, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'vendors', text: 'Partners & Warranties', icon: <VendorsIcon />, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { id: 'audits', text: 'Audit Cycles', icon: <AuditIcon />, roles: ['Admin', 'Asset Manager'] },
    { id: 'employees', text: 'Organization Setup', icon: <PeopleIcon />, roles: ['Admin', 'Asset Manager'] },
    { id: 'logs', text: 'System Audit Logs', icon: <LogsIcon />, roles: ['Admin', 'Asset Manager'] }
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main', 
            borderRadius: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
          }}
        >
          AF
        </Box>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
          AssetFlow ERP
        </Typography>
      </Toolbar>
      
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'action.hover',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2', fontWeight: isActive ? 'bold' : 'medium' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Sidebar Footer info */}
      <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Authorized Operator:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', mb: 1 }}>
          {user?.first_name} {user?.last_name}
        </Typography>
        <Chip label={role} size="small" color="primary" sx={{ fontWeight: 'bold', mb: 1 }} />
        
        <Button 
          fullWidth
          variant="outlined" 
          color="error" 
          size="small"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{ mt: 1, textTransform: 'none', borderRadius: 2 }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          {/* Menu button for mobile screens */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'block' } }}>
             {activeTab === 'dashboard' ? 'Analytics & KPIs' : 
              activeTab === 'assets' ? 'Asset Inventory' : 
              activeTab === 'allocations' ? 'Allocations & Transfers' : 
              activeTab === 'bookings' ? 'Resource Bookings' : 
              activeTab === 'maintenance' ? 'Maintenance Requests' : 
              activeTab === 'vendors' ? 'Partners & Warranties' : 
              activeTab === 'audits' ? 'Audit Cycles' : 
              activeTab === 'employees' ? 'Organization Setup' : 'System Audit Logs'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 } }}>
            {/* Demo / Sandbox Role Switcher */}
            <FormControl size="small" sx={{ minWidth: 165 }}>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                displayEmpty
                sx={{
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  fontSize: '0.85rem'
                }}
              >
                <MenuItem value="Admin">🛡️ Admin View</MenuItem>
                <MenuItem value="Asset Manager">🔧 Asset Manager</MenuItem>
                <MenuItem value="Department Head">👔 Dept Head</MenuItem>
                <MenuItem value="Employee">💼 Employee</MenuItem>
              </Select>
            </FormControl>

            {/* Dark Mode toggle */}
            <IconButton onClick={toggleDarkMode} sx={{ color: 'text.primary' }}>
              {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>

            {/* Notification bell popover */}
            <IconButton onClick={handleNotifOpen} sx={{ color: 'text.primary' }}>
              <Badge badgeContent={unreadCount} color="error">
                {unreadCount > 0 ? <NotificationActiveIcon color="warning" /> : <NotificationsIcon />}
              </Badge>
            </IconButton>
            
            {/* Notification Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={handleNotifClose}
              PaperProps={{
                sx: { width: 340, maxHeight: 400, mt: 1.5, overflowY: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Alert Inbox ({unreadCount})</Typography>
                {unreadCount > 0 && (
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }} onClick={markAllAsRead}>
                    Mark all read
                  </Typography>
                )}
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <MenuItem disabled sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Alert inbox is empty</Typography>
                </MenuItem>
              ) : (
                notifications.map((n) => (
                  <MenuItem 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n.id)}
                    sx={{ 
                      py: 1.5, 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      whiteSpace: 'normal',
                      bgcolor: n.read ? 'transparent' : 'action.selected',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: n.type === 'error' ? 'error.main' : n.type === 'warning' ? 'warning.main' : 'text.primary' }}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                      {n.message}
                    </Typography>
                  </MenuItem>
                ))
              )}
              {notifications.length > 0 && (
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="caption" color="error" sx={{ cursor: 'pointer', fontWeight: 600 }} onClick={clearNotifications}>
                    Clear all logs
                  </Typography>
                </Box>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Collapsible Drawers */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile Navigation Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH }
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Permanent Sidebar for Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' }
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main Page Panel Rendering */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px'
        }}
      >
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'assets' && <Assets />}
        {activeTab === 'allocations' && <Allocations />}
        {activeTab === 'bookings' && <Bookings />}
        {activeTab === 'maintenance' && <Maintenance />}
        {activeTab === 'vendors' && <Vendors />}
        {activeTab === 'audits' && <AuditCycles />}
        {activeTab === 'employees' && <OrganizationSetup />}
        {activeTab === 'logs' && <AuditLogs />}
      </Box>

      {/* AI Floating Chatbot */}
      <AIChatbot />
    </Box>
  );
};

const AuthOrLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AuthOrLayout />
        </NotificationProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}
