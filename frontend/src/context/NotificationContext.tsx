import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: SystemNotification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('system-notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'mn-assigned',
        title: '💼 Asset Assigned',
        message: 'Laptop AF-0014 has been assigned to Priya Shah.',
        type: 'info',
        timestamp: new Date(Date.now() - 120000).toISOString(), // 2m ago
        read: false
      },
      {
        id: 'mn-maint-approved',
        title: '🔧 Maintenance Approved',
        message: 'Maintenance request AF-0055 has been approved.',
        type: 'warning',
        timestamp: new Date(Date.now() - 1080000).toISOString(), // 18m ago
        read: false
      },
      {
        id: 'mn-booking-confirmed',
        title: '📆 Booking Confirmed',
        message: 'Booking confirmed : Room B2 : 2:00 to 3:00 PM.',
        type: 'success',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1h ago
        read: false
      },
      {
        id: 'mn-transfer-approved',
        title: '🔄 Transfer Approved',
        message: 'Transfer approved : AF-0033 to facilities dept.',
        type: 'info',
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3h ago
        read: false
      },
      {
        id: 'mn-overdue-alert',
        title: '⚠️ Overdue Return Alert',
        message: 'Overdue return : AF-0021 was due 3 days ago.',
        type: 'error',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1d ago
        read: false
      },
      {
        id: 'mn-audit-discrepancy',
        title: '🚨 Audit Discrepancy Flagged',
        message: 'audit discrepancy flagged : AF-0088 marked Damaged.',
        type: 'error',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2d ago
        read: false
      }
    ];
  });

  const [toast, setToast] = useState<{ open: boolean; message: string; type: SystemNotification['type'] }>({
    open: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    localStorage.setItem('system-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title: string, message: string, type: SystemNotification['type']) => {
    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setToast({
      open: true,
      message: `${title}: ${message}`,
      type
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.type} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
