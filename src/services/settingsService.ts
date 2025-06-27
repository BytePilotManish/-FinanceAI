import { supabase } from '../lib/supabase/client';
import { notificationService } from './notificationService';

export interface UserSettings {
  id: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  timezone: string;
  language: string;
  date_format: string;
  time_format: string;
  default_currency: string;
  number_format: string;
  fiscal_year_start: string;
  profile_visibility: string;
  data_sharing: boolean;
  analytics_tracking: boolean;
  marketing_emails: boolean;
  theme: string;
  sidebar_collapsed: boolean;
  dashboard_layout: any;
  default_page: string;
  api_access_enabled: boolean;
  export_format: string;
  backup_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface BillingInfo {
  id: string;
  user_id: string;
  plan_type: string;
  plan_status: string;
  subscription_start?: string;
  subscription_end?: string;
  auto_renewal: boolean;
  payment_method?: string;
  last_four_digits?: string;
  card_brand?: string;
  billing_email?: string;
  billing_name?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country: string;
  billing_pincode?: string;
  gst_number?: string;
  api_calls_used: number;
  api_calls_limit: number;
  storage_used: number;
  storage_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_name: string;
  key_prefix: string;
  permissions: string[];
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface ExportRecord {
  id: string;
  user_id: string;
  export_type: string;
  file_format: string;
  file_size?: number;
  download_url?: string;
  expires_at?: string;
  status: string;
  created_at: string;
}

export interface LoginSession {
  id: string;
  user_id: string;
  device_info?: string;
  browser_info?: string;
  ip_address?: string;
  location?: string;
  is_current: boolean;
  last_activity: string;
  expires_at?: string;
  created_at: string;
}

export const settingsService = {
  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      // Create default settings if none exist
      return await this.createDefaultSettings();
    }

    return data;
  },

  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) throw error;

    // Create notification for important setting changes
    if (settings.theme || settings.language || settings.default_currency) {
      await notificationService.createSystemNotification(
        'Settings Updated',
        'Your account preferences have been successfully updated.',
        { updatedFields: Object.keys(settings) }
      );
    }

    return data;
  },

  async createDefaultSettings(): Promise<UserSettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const defaultSettings = {
      user_id: userData.user.id,
      timezone: 'Asia/Kolkata',
      language: 'en',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      default_currency: 'INR',
      number_format: 'indian',
      fiscal_year_start: 'april',
      profile_visibility: 'private',
      data_sharing: false,
      analytics_tracking: true,
      marketing_emails: false,
      theme: 'light',
      sidebar_collapsed: false,
      dashboard_layout: {},
      default_page: '/dashboard',
      api_access_enabled: false,
      export_format: 'csv',
      backup_frequency: 'weekly'
    };

    const { data, error } = await supabase
      .from('user_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Billing Information
  async getBillingInfo(): Promise<BillingInfo> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('billing_info')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateBillingInfo(billing: Partial<BillingInfo>): Promise<BillingInfo> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('billing_info')
      .update({
        ...billing,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) throw error;

    await notificationService.createSystemNotification(
      'Billing Information Updated',
      'Your billing information has been successfully updated.',
      { updatedFields: Object.keys(billing) }
    );

    return data;
  },

  // API Keys Management
  async getApiKeys(): Promise<ApiKey[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, key_name, key_prefix, permissions, last_used, expires_at, is_active, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createApiKey(keyName: string, permissions: string[], expiresAt?: string): Promise<{ key: string; record: ApiKey }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    // Generate a secure API key
    const apiKey = this.generateApiKey();
    const keyHash = await this.hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 8);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userData.user.id,
        key_name: keyName,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        expires_at: expiresAt
      })
      .select('id, user_id, key_name, key_prefix, permissions, last_used, expires_at, is_active, created_at')
      .single();

    if (error) throw error;

    await notificationService.createSecurityNotification(
      'API Key Created',
      `A new API key "${keyName}" has been created for your account.`,
      { keyName, permissions }
    );

    return { key: apiKey, record: data };
  },

  async revokeApiKey(keyId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userData.user.id);

    if (error) throw error;

    await notificationService.createSecurityNotification(
      'API Key Revoked',
      'An API key has been revoked from your account.',
      { keyId }
    );
  },

  async deleteApiKey(keyId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userData.user.id);

    if (error) throw error;
  },

  // Export History
  async getExportHistory(): Promise<ExportRecord[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  },

  async createExport(exportType: string, fileFormat: string): Promise<ExportRecord> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('export_history')
      .insert({
        user_id: userData.user.id,
        export_type: exportType,
        file_format: fileFormat,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate export processing
    setTimeout(async () => {
      await this.completeExport(data.id, 'https://example.com/download/' + data.id);
    }, 3000);

    return data;
  },

  async completeExport(exportId: string, downloadUrl: string): Promise<void> {
    const { error } = await supabase
      .from('export_history')
      .update({
        status: 'completed',
        download_url: downloadUrl,
        file_size: Math.floor(Math.random() * 1000000) + 100000 // Mock file size
      })
      .eq('id', exportId);

    if (error) throw error;

    await notificationService.createSystemNotification(
      'Export Ready',
      'Your data export is ready for download.',
      { exportId, downloadUrl }
    );
  },

  // Login Sessions
  async getLoginSessions(): Promise<LoginSession[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('login_sessions')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('login_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userData.user.id);

    if (error) throw error;

    await notificationService.createSecurityNotification(
      'Session Revoked',
      'A login session has been revoked from your account.',
      { sessionId }
    );
  },

  async revokeAllSessions(): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('login_sessions')
      .delete()
      .eq('user_id', userData.user.id)
      .neq('is_current', true);

    if (error) throw error;

    await notificationService.createSecurityNotification(
      'All Sessions Revoked',
      'All other login sessions have been revoked from your account.',
      {}
    );
  },

  // Profile Management
  async updateProfile(updates: { full_name?: string; phone?: string; address?: string; pan_number?: string }): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.user.id);

    if (error) throw error;

    await notificationService.createSystemNotification(
      'Profile Updated',
      'Your profile information has been successfully updated.',
      { updatedFields: Object.keys(updates) }
    );
  },

  async uploadAvatar(file: File): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user settings with new avatar URL
    await this.updateUserSettings({ avatar_url: data.publicUrl });

    return data.publicUrl;
  },

  // Utility functions
  generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'fa_'; // FinanceAI prefix
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  async hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatUsagePercentage(used: number, limit: number): number {
    return Math.round((used / limit) * 100);
  }
};