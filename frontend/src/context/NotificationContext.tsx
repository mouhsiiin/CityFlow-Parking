import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, description?: string, duration?: number) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev?.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, message: string, description?: string, duration: number = 5000) => {
      const id = Math.random().toString(36).substring(7);
      const notification: Notification = { id, type, message, description, duration };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string, description?: string) => {
      showNotification('success', message, description);
    },
    [showNotification]
  );

  const error = useCallback(
    (message: string, description?: string) => {
      showNotification('error', message, description, 7000);
    },
    [showNotification]
  );

  const info = useCallback(
    (message: string, description?: string) => {
      showNotification('info', message, description);
    },
    [showNotification]
  );

  const warning = useCallback(
    (message: string, description?: string) => {
      showNotification('warning', message, description);
    },
    [showNotification]
  );

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, success, error, info, warning }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[10001] space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto min-w-80 max-w-md border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-5 ${getStyles(
              notification.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{notification.message}</p>
              {notification.description && (
                <p className="text-xs text-gray-600 mt-1">{notification.description}</p>
              )}
            </div>
            
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
