import { supabase } from '../lib/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'transaction' | 'security' | 'investment' | 'system' | 'goal';
  category: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  metadata: any;
  action_url?: string;
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  // Get all notifications for the current user
  async getNotifications(limit = 50, offset = 0) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as Notification[];
  },

  // Get unread notification count
  async getUnreadCount() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        user_id: userData.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Get notification preferences
  async getPreferences() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userData.user.id);

    if (error) throw error;
    return data as NotificationPreference[];
  },

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreference>[]) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const updates = preferences.map(pref => ({
      ...pref,
      user_id: userData.user.id,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(updates, { onConflict: 'user_id,notification_type' })
      .select();

    if (error) throw error;
    return data;
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(callback: (notification: Notification) => void) {
    const { data: userData } = supabase.auth.getUser();
    
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  },

  // Helper methods for creating specific notification types
  async createTransactionNotification(title: string, message: string, metadata: any = {}) {
    return this.createNotification({
      title,
      message,
      type: 'transaction',
      category: 'info',
      priority: 'medium',
      is_read: false,
      metadata
    });
  },

  async createSecurityNotification(title: string, message: string, metadata: any = {}) {
    return this.createNotification({
      title,
      message,
      type: 'security',
      category: 'warning',
      priority: 'high',
      is_read: false,
      metadata
    });
  },

  async createInvestmentNotification(title: string, message: string, metadata: any = {}) {
    return this.createNotification({
      title,
      message,
      type: 'investment',
      category: 'success',
      priority: 'medium',
      is_read: false,
      metadata
    });
  },

  async createSystemNotification(title: string, message: string, metadata: any = {}) {
    return this.createNotification({
      title,
      message,
      type: 'system',
      category: 'info',
      priority: 'low',
      is_read: false,
      metadata
    });
  },

  async createGoalNotification(title: string, message: string, metadata: any = {}) {
    return this.createNotification({
      title,
      message,
      type: 'goal',
      category: 'success',
      priority: 'medium',
      is_read: false,
      metadata
    });
  }
};