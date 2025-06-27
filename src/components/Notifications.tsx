import React, { useState, useEffect } from 'react';
import { Bell, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Clock, Settings, Filter, Smartphone, Mail, X, MoreHorizontal, Trash2, Eye, EyeOff } from 'lucide-react';
import { notificationService, type Notification, type NotificationPreference } from '../services/notificationService';

interface NotificationPreferences {
  [key: string]: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const notificationTypes = [
    { id: 'transactions', title: 'Transaction Alerts', description: 'Get notified about large or unusual transactions' },
    { id: 'security', title: 'Security Alerts', description: 'Important alerts about your account security' },
    { id: 'investment', title: 'Investment Updates', description: 'Updates about your investment performance' },
    { id: 'system', title: 'System Notifications', description: 'App updates and maintenance notices' },
    { id: 'goals', title: 'Goal Tracking', description: 'Progress updates on your financial goals' }
  ];

  useEffect(() => {
    loadNotifications();
    loadPreferences();
    loadUnreadCount();

    // Subscribe to real-time notifications
    const subscription = notificationService.subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const data = await notificationService.getPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handlePreferenceChange = async (type: string, channel: 'email_enabled' | 'push_enabled' | 'sms_enabled', value: boolean) => {
    try {
      const existingPref = preferences.find(p => p.notification_type === type);
      const updatedPref = {
        ...existingPref,
        notification_type: type,
        [channel]: value
      };

      await notificationService.updatePreferences([updatedPref]);
      setPreferences(prev => 
        prev.map(p => p.notification_type === type ? { ...p, [channel]: value } : p)
      );
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'success') return CheckCircle;
    if (category === 'warning' || category === 'error') return AlertTriangle;
    if (type === 'transaction') return ArrowUpRight;
    return Bell;
  };

  const getNotificationColor = (category: string) => {
    switch (category) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !notification.is_read;
    return notification.type === selectedFilter;
  });

  // Generate sample notifications for demonstration
  const generateSampleNotifications = async () => {
    const sampleNotifications = [
      {
        title: 'Large Transaction Alert',
        message: 'A transaction of ₹85,000 was processed from your savings account.',
        type: 'transaction' as const,
        category: 'warning' as const,
        priority: 'high' as const,
        metadata: { amount: 85000, account: 'Savings Account' }
      },
      {
        title: 'Investment Goal Achieved',
        message: 'Congratulations! Your emergency fund goal of ₹5,00,000 has been reached.',
        type: 'goal' as const,
        category: 'success' as const,
        priority: 'medium' as const,
        metadata: { goalName: 'Emergency Fund', targetAmount: 500000 }
      },
      {
        title: 'Security Alert',
        message: 'New login detected from a different device. If this wasn\'t you, please secure your account.',
        type: 'security' as const,
        category: 'warning' as const,
        priority: 'high' as const,
        metadata: { device: 'iPhone 13', location: 'Mumbai, India' }
      },
      {
        title: 'Market Update',
        message: 'Your portfolio gained ₹12,500 today. NIFTY 50 closed 2.3% higher.',
        type: 'investment' as const,
        category: 'success' as const,
        priority: 'medium' as const,
        metadata: { gain: 12500, marketChange: 2.3 }
      }
    ];

    for (const notification of sampleNotifications) {
      try {
        await notificationService.createNotification({
          ...notification,
          is_read: false
        });
      } catch (error) {
        console.error('Error creating sample notification:', error);
      }
    }

    loadNotifications();
    loadUnreadCount();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Manage your notification preferences and view recent alerts</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Mark all as read ({unreadCount})
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={generateSampleNotifications}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Generate Sample
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'transaction', label: 'Transactions' },
              { id: 'security', label: 'Security' },
              { id: 'investment', label: 'Investments' },
              { id: 'system', label: 'System' },
              { id: 'goal', label: 'Goals' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      {showPreferences && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Settings className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>
              </div>
            </div>
            <button
              onClick={() => setShowPreferences(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {notificationTypes.map((type) => {
              const pref = preferences.find(p => p.notification_type === type.id);
              return (
                <div key={type.id} className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">{type.title}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePreferenceChange(type.id, 'email_enabled', !pref?.email_enabled)}
                      className={`p-2 rounded-lg ${
                        pref?.email_enabled
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title="Email notifications"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handlePreferenceChange(type.id, 'push_enabled', !pref?.push_enabled)}
                      className={`p-2 rounded-lg ${
                        pref?.push_enabled
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title="Push notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handlePreferenceChange(type.id, 'sms_enabled', !pref?.sms_enabled)}
                      className={`p-2 rounded-lg ${
                        pref?.sms_enabled
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title="SMS notifications"
                    >
                      <Smartphone className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Recent Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No notifications found</p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedFilter === 'unread' 
                ? 'All notifications have been read'
                : 'You\'re all caught up!'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type, notification.category);
              const colorClass = getNotificationColor(notification.category);
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{notification.title}</h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            <span className="capitalize">{notification.type}</span>
                            <span className="capitalize">{notification.priority} priority</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                              title="Mark as read"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;