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
        id: 'n1',
        title: '⚠️ Telemetry Anomaly Detected',
        message: 'Warehouse HVAC Unit temperature reached 108.5°C. High risk of compressor failure.',
        type: 'error',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: 'n2',
        title: '🔧 Maintenance Scheduled',
        message: 'Projector lamp replacement is scheduled for HQ Room 101 tomorrow.',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        read: false
      },
      {
        id: 'n3',
        title: '📆 Warranty Expiration Warning',
        message: 'Standard hardware warranty for Enterprise Server Rack expires in 30 days.',
        type: 'warning',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        read: true
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
