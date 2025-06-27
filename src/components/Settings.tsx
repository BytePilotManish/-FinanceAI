import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Download, 
  Upload, 
  Key, 
  CreditCard, 
  FileText, 
  Settings as SettingsIcon,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Copy,
  RefreshCw,
  Monitor,
  Smartphone,
  Calendar,
  DollarSign,
  BarChart3,
  Database,
  Clock,
  MapPin,
  Mail,
  Phone,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Camera
} from 'lucide-react';
import { settingsService, type UserSettings, type BillingInfo, type ApiKey, type ExportRecord, type LoginSession } from '../services/settingsService';
import { notificationService } from '../services/notificationService';

interface SettingsTab {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile & Account Settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
    pan_number: ''
  });

  // Notification Settings
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
    security_alerts: true,
    transaction_alerts: true,
    goal_updates: true,
    market_updates: false
  });

  // Privacy & Security
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'private',
    data_sharing: false,
    analytics_tracking: true,
    location_tracking: false,
    activity_status: true
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    sidebar_collapsed: false,
    dashboard_layout: 'default',
    font_size: 'medium',
    high_contrast: false,
    animations: true
  });

  // Billing & Subscription
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [showBillingForm, setShowBillingForm] = useState(false);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>([]);

  // Data & Export
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Login Sessions
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      const [settings, billing, keys, exports, sessions] = await Promise.all([
        settingsService.getUserSettings(),
        settingsService.getBillingInfo().catch(() => null),
        settingsService.getApiKeys(),
        settingsService.getExportHistory(),
        settingsService.getLoginSessions()
      ]);

      setUserSettings(settings);
      setBillingInfo(billing);
      setApiKeys(keys);
      setExportHistory(exports);
      setLoginSessions(sessions);

      // Set form data from loaded settings
      if (settings) {
        setAppearanceSettings({
          theme: settings.theme,
          sidebar_collapsed: settings.sidebar_collapsed,
          dashboard_layout: settings.dashboard_layout?.type || 'default',
          font_size: 'medium',
          high_contrast: false,
          animations: true
        });

        setPrivacySettings({
          profile_visibility: settings.profile_visibility,
          data_sharing: settings.data_sharing,
          analytics_tracking: settings.analytics_tracking,
          location_tracking: false,
          activity_status: true
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  // Profile Component
  const ProfileSettings = () => {
    const [avatarUploading, setAvatarUploading] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        await settingsService.updateProfile(profileData);
        showMessage('Profile updated successfully', 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setAvatarUploading(true);
      try {
        const avatarUrl = await settingsService.uploadAvatar(file);
        await settingsService.updateUserSettings({ avatar_url: avatarUrl });
        showMessage('Avatar updated successfully', 'success');
        loadAllSettings();
      } catch (err: any) {
        showMessage(err.message, 'error');
      } finally {
        setAvatarUploading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {userSettings?.avatar_url ? (
                  <img src={userSettings.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={avatarUploading}
                />
              </label>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Profile Picture</h4>
              <p className="text-sm text-gray-600">Upload a new avatar for your account</p>
              {avatarUploading && <p className="text-sm text-indigo-600">Uploading...</p>}
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={profileData.pan_number}
                onChange={(e) => setProfileData({ ...profileData, pan_number: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="ABCDE1234F"
                maxLength={10}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Account Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={userSettings?.timezone || 'Asia/Kolkata'}
                onChange={(e) => settingsService.updateUserSettings({ timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Mumbai">Asia/Mumbai</option>
                <option value="Asia/Delhi">Asia/Delhi</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={userSettings?.language || 'en'}
                onChange={(e) => settingsService.updateUserSettings({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={userSettings?.date_format || 'DD/MM/YYYY'}
                onChange={(e) => settingsService.updateUserSettings({ date_format: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={userSettings?.default_currency || 'INR'}
                onChange={(e) => settingsService.updateUserSettings({ default_currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Notifications Component
  const NotificationSettings = () => {
    const handleNotificationUpdate = async (key: string, value: boolean) => {
      setNotificationPrefs(prev => ({ ...prev, [key]: value }));
      // In a real app, you'd save this to the backend
      showMessage('Notification preferences updated', 'success');
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
          
          <div className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
              <div className="space-y-3">
                {[
                  { key: 'email_notifications', label: 'General email notifications', desc: 'Receive important updates via email' },
                  { key: 'transaction_alerts', label: 'Transaction alerts', desc: 'Get notified about account transactions' },
                  { key: 'security_alerts', label: 'Security alerts', desc: 'Important security-related notifications' },
                  { key: 'goal_updates', label: 'Goal updates', desc: 'Progress updates on your financial goals' },
                  { key: 'market_updates', label: 'Market updates', desc: 'Weekly market analysis and insights' },
                  { key: 'marketing_emails', label: 'Marketing emails', desc: 'Product updates and promotional content' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{item.label}</h5>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                        onChange={(e) => handleNotificationUpdate(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Push Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Browser notifications</h5>
                    <p className="text-sm text-gray-600">Receive notifications in your browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.push_notifications}
                      onChange={(e) => handleNotificationUpdate('push_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">SMS Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">SMS alerts</h5>
                    <p className="text-sm text-gray-600">Receive critical alerts via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.sms_notifications}
                      onChange={(e) => handleNotificationUpdate('sms_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Privacy Component
  const PrivacySettings = () => {
    const handlePrivacyUpdate = async (key: string, value: any) => {
      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      await settingsService.updateUserSettings({ [key]: value });
      showMessage('Privacy settings updated', 'success');
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Privacy & Data</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Profile Visibility</h4>
              <div className="space-y-3">
                {[
                  { value: 'public', label: 'Public', desc: 'Your profile is visible to everyone' },
                  { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
                  { value: 'contacts', label: 'Contacts only', desc: 'Only your contacts can see your profile' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="profile_visibility"
                      value={option.value}
                      checked={privacySettings.profile_visibility === option.value}
                      onChange={(e) => handlePrivacyUpdate('profile_visibility', e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Data & Analytics</h4>
              <div className="space-y-4">
                {[
                  { key: 'data_sharing', label: 'Data sharing', desc: 'Share anonymized data to improve our services' },
                  { key: 'analytics_tracking', label: 'Analytics tracking', desc: 'Help us improve the app with usage analytics' },
                  { key: 'location_tracking', label: 'Location tracking', desc: 'Use your location for enhanced features' },
                  { key: 'activity_status', label: 'Activity status', desc: 'Show when you were last active' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{item.label}</h5>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings[item.key as keyof typeof privacySettings]}
                        onChange={(e) => handlePrivacyUpdate(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Download */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Download your data</h4>
                <p className="text-sm text-gray-600">Get a copy of all your data</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <h4 className="font-medium text-red-900">Delete account</h4>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Appearance Component
  const AppearanceSettings = () => {
    const handleAppearanceUpdate = async (key: string, value: any) => {
      setAppearanceSettings(prev => ({ ...prev, [key]: value }));
      await settingsService.updateUserSettings({ [key]: value });
      showMessage('Appearance settings updated', 'success');
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Appearance & Display</h3>
          
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Theme</h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', preview: 'bg-white border-2' },
                  { value: 'dark', label: 'Dark', preview: 'bg-gray-900 border-2' },
                  { value: 'auto', label: 'Auto', preview: 'bg-gradient-to-r from-white to-gray-900 border-2' }
                ].map((theme) => (
                  <label key={theme.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={appearanceSettings.theme === theme.value}
                      onChange={(e) => handleAppearanceUpdate('theme', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg text-center transition-all ${
                      appearanceSettings.theme === theme.value 
                        ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                        : 'hover:bg-gray-50'
                    }`}>
                      <div className={`w-full h-16 rounded-lg mb-2 ${theme.preview} ${
                        appearanceSettings.theme === theme.value ? 'border-indigo-500' : 'border-gray-300'
                      }`}></div>
                      <span className="font-medium text-gray-900">{theme.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Layout Options */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Layout</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Collapsed sidebar</h5>
                    <p className="text-sm text-gray-600">Keep the sidebar minimized by default</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceSettings.sidebar_collapsed}
                      onChange={(e) => handleAppearanceUpdate('sidebar_collapsed', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard layout</label>
                  <select
                    value={appearanceSettings.dashboard_layout}
                    onChange={(e) => handleAppearanceUpdate('dashboard_layout', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="expanded">Expanded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Accessibility */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Accessibility</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font size</label>
                  <select
                    value={appearanceSettings.font_size}
                    onChange={(e) => handleAppearanceUpdate('font_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">High contrast</h5>
                    <p className="text-sm text-gray-600">Increase contrast for better visibility</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceSettings.high_contrast}
                      onChange={(e) => handleAppearanceUpdate('high_contrast', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Animations</h5>
                    <p className="text-sm text-gray-600">Enable smooth animations and transitions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearanceSettings.animations}
                      onChange={(e) => handleAppearanceUpdate('animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Billing Component
  const BillingSettings = () => {
    const [billingForm, setBillingForm] = useState({
      billing_name: billingInfo?.billing_name || '',
      billing_email: billingInfo?.billing_email || '',
      billing_address: billingInfo?.billing_address || '',
      billing_city: billingInfo?.billing_city || '',
      billing_state: billingInfo?.billing_state || '',
      billing_pincode: billingInfo?.billing_pincode || '',
      gst_number: billingInfo?.gst_number || ''
    });

    const handleBillingUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        await settingsService.updateBillingInfo(billingForm);
        showMessage('Billing information updated successfully', 'success');
        setShowBillingForm(false);
        loadAllSettings();
      } catch (err: any) {
        showMessage(err.message, 'error');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Plan</h3>
          
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div>
              <h4 className="font-semibold text-indigo-900 capitalize">
                {billingInfo?.plan_type || 'Free'} Plan
              </h4>
              <p className="text-sm text-indigo-700">
                {billingInfo?.plan_type === 'free' 
                  ? 'Basic features with limited usage'
                  : 'Full access to all premium features'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-900">
                {billingInfo?.plan_type === 'free' ? '₹0' : '₹999'}
              </div>
              <div className="text-sm text-indigo-700">per month</div>
            </div>
          </div>

          {billingInfo?.plan_type === 'free' && (
            <div className="mt-4">
              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Upgrade to Premium
              </button>
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Usage Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Calls</span>
                <span className="text-sm text-gray-600">
                  {billingInfo?.api_calls_used || 0} / {billingInfo?.api_calls_limit || 1000}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ 
                    width: `${((billingInfo?.api_calls_used || 0) / (billingInfo?.api_calls_limit || 1000)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Storage</span>
                <span className="text-sm text-gray-600">
                  {settingsService.formatFileSize(billingInfo?.storage_used || 0)} / {settingsService.formatFileSize(billingInfo?.storage_limit || 1073741824)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ 
                    width: `${((billingInfo?.storage_used || 0) / (billingInfo?.storage_limit || 1073741824)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
            <button
              onClick={() => setShowBillingForm(!showBillingForm)}
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
            >
              <SettingsIcon className="w-4 h-4" />
              {showBillingForm ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {showBillingForm ? (
            <form onSubmit={handleBillingUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={billingForm.billing_name}
                    onChange={(e) => setBillingForm({ ...billingForm, billing_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={billingForm.billing_email}
                    onChange={(e) => setBillingForm({ ...billingForm, billing_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={billingForm.billing_address}
                  onChange={(e) => setBillingForm({ ...billingForm, billing_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={billingForm.billing_city}
                    onChange={(e) => setBillingForm({ ...billingForm, billing_city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={billingForm.billing_state}
                    onChange={(e) => setBillingForm({ ...billingForm, billing_state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={billingForm.billing_pincode}
                    onChange={(e) => setBillingForm({ ...billingForm, billing_pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={billingForm.gst_number}
                  onChange={(e) => setBillingForm({ ...billingForm, gst_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBillingForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {billingInfo ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{billingInfo.billing_name || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{billingInfo.billing_email || 'Not set'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium">
                        {billingInfo.billing_address ? 
                          `${billingInfo.billing_address}, ${billingInfo.billing_city}, ${billingInfo.billing_state} ${billingInfo.billing_pincode}` 
                          : 'Not set'
                        }
                      </span>
                    </div>
                    {billingInfo.gst_number && (
                      <div>
                        <span className="text-gray-600">GST:</span>
                        <span className="ml-2 font-medium">{billingInfo.gst_number}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-600">No billing information set up yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // API Keys Component
  const ApiKeysSettings = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newKeyData, setNewKeyData] = useState({
      name: '',
      permissions: [] as string[],
      expires_at: ''
    });

    const handleCreateApiKey = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const { key, record } = await settingsService.createApiKey(
          newKeyData.name,
          newKeyData.permissions,
          newKeyData.expires_at || undefined
        );
        
        // Show the key to the user (only time they'll see it)
        alert(`Your new API key: ${key}\n\nPlease save this key securely. You won't be able to see it again.`);
        
        setApiKeys(prev => [record, ...prev]);
        setShowCreateForm(false);
        setNewKeyData({ name: '', permissions: [], expires_at: '' });
        showMessage('API key created successfully', 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleRevokeKey = async (keyId: string) => {
      if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
        return;
      }

      try {
        await settingsService.revokeApiKey(keyId);
        setApiKeys(prev => prev.map(key => 
          key.id === keyId ? { ...key, is_active: false } : key
        ));
        showMessage('API key revoked successfully', 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    };

    const handleDeleteKey = async (keyId: string) => {
      if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
        return;
      }

      try {
        await settingsService.deleteApiKey(keyId);
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
        showMessage('API key deleted successfully', 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    };

    const availablePermissions = [
      { id: 'read', label: 'Read', desc: 'View account data and transactions' },
      { id: 'write', label: 'Write', desc: 'Create and update data' },
      { id: 'delete', label: 'Delete', desc: 'Delete data (use with caution)' },
      { id: 'admin', label: 'Admin', desc: 'Full administrative access' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Create API Key
            </button>
          </div>

          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Create New API Key</h4>
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="My API Key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {availablePermissions.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={newKeyData.permissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyData({
                                ...newKeyData,
                                permissions: [...newKeyData.permissions, perm.id]
                              });
                            } else {
                              setNewKeyData({
                                ...newKeyData,
                                permissions: newKeyData.permissions.filter(p => p !== perm.id)
                              });
                            }
                          }}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{perm.label}</div>
                          <div className="text-sm text-gray-600">{perm.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={newKeyData.expires_at}
                    onChange={(e) => setNewKeyData({ ...newKeyData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving || newKeyData.permissions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    {saving ? 'Creating...' : 'Create Key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No API keys created yet</p>
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{apiKey.key_name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apiKey.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Key: {apiKey.key_prefix}...</div>
                      <div>Permissions: {apiKey.permissions.join(', ')}</div>
                      <div>Created: {new Date(apiKey.created_at).toLocaleDateString()}</div>
                      {apiKey.last_used && (
                        <div>Last used: {new Date(apiKey.last_used).toLocaleDateString()}</div>
                      )}
                      {apiKey.expires_at && (
                        <div>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apiKey.is_active && (
                      <button
                        onClick={() => handleRevokeKey(apiKey.id)}
                        className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg"
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
              <p className="text-sm text-blue-800 mb-3">
                Use your API key to access FinanceAI programmatically. Include it in the Authorization header:
              </p>
              <code className="block p-2 bg-blue-100 rounded text-sm font-mono text-blue-900">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
            
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              <a href="#" className="text-indigo-600 hover:text-indigo-700 text-sm">
                View full API documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Data & Export Component
  const DataExportSettings = () => {
    const handleExport = async (type: string, format: string) => {
      setExportLoading(true);
      try {
        const exportRecord = await settingsService.createExport(type, format);
        setExportHistory(prev => [exportRecord, ...prev]);
        showMessage(`${type} export started. You'll be notified when it's ready.`, 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      } finally {
        setExportLoading(false);
      }
    };

    const exportOptions = [
      { type: 'transactions', label: 'Transactions', desc: 'All your transaction history' },
      { type: 'accounts', label: 'Accounts', desc: 'Account information and balances' },
      { type: 'goals', label: 'Financial Goals', desc: 'Your financial goals and progress' },
      { type: 'portfolio', label: 'Portfolio', desc: 'Investment portfolio data' },
      { type: 'complete', label: 'Complete Data', desc: 'All your data in one export' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Your Data</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {exportOptions.map((option) => (
              <div key={option.type} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{option.label}</h4>
                <p className="text-sm text-gray-600 mb-4">{option.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(option.type, 'csv')}
                    disabled={exportLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(option.type, 'json')}
                    disabled={exportLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Export History</h3>
          
          <div className="space-y-3">
            {exportHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No exports yet</p>
              </div>
            ) : (
              exportHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {record.export_type} Export ({record.file_format.toUpperCase()})
                    </h4>
                    <div className="text-sm text-gray-600">
                      <span>Created: {new Date(record.created_at).toLocaleDateString()}</span>
                      {record.file_size && (
                        <span className="ml-4">Size: {settingsService.formatFileSize(record.file_size)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                    {record.status === 'completed' && record.download_url && (
                      <a
                        href={record.download_url}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sessions Component
  const SessionsSettings = () => {
    const handleRevokeSession = async (sessionId: string) => {
      if (!confirm('Are you sure you want to revoke this session?')) return;

      try {
        await settingsService.revokeSession(sessionId);
        setLoginSessions(prev => prev.filter(s => s.id !== sessionId));
        showMessage('Session revoked successfully', 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    };

    const handleRevokeAllSessions = async () => {
      if (!confirm('Are you sure you want to revoke all other sessions? You will remain logged in on this device.')) return;

      try {
        await settingsService.revokeAllSessions();
        setLoginSessions(prev => prev.filter(s => s.is_current));
        showMessage('All other sessions revoked successfully', 'success');
      } catch (err: any) {
        showMessage(err.message, 'error');
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
            <button
              onClick={handleRevokeAllSessions}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              Revoke All Others
            </button>
          </div>

          <div className="space-y-4">
            {loginSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active sessions</p>
              </div>
            ) : (
              loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {session.device_info?.includes('Mobile') ? (
                        <Smartphone className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Monitor className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {session.device_info || 'Unknown Device'}
                        </h4>
                        {session.is_current && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.browser_info || 'Unknown Browser'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.location || 'Unknown Location'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last active: {new Date(session.last_activity).toLocaleString()}
                        </div>
                        {session.ip_address && (
                          <div>IP: {session.ip_address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!session.is_current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabs: SettingsTab[] = [
    { id: 'profile', label: 'Profile', icon: User, component: ProfileSettings },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationSettings },
    { id: 'privacy', label: 'Privacy', icon: Shield, component: PrivacySettings },
    { id: 'appearance', label: 'Appearance', icon: Palette, component: AppearanceSettings },
    { id: 'billing', label: 'Billing', icon: CreditCard, component: BillingSettings },
    { id: 'api', label: 'API Keys', icon: Key, component: ApiKeysSettings },
    { id: 'data', label: 'Data & Export', icon: Database, component: DataExportSettings },
    { id: 'sessions', label: 'Sessions', icon: Monitor, component: SessionsSettings }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProfileSettings;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and application settings</p>
      </div>

      {/* Success/Error Messages */}
      {(success || error) && (
        <div className={`mb-6 p-4 rounded-lg border ${
          success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{success || error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Settings;