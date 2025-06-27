import React, { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, History, Lock, AlertTriangle, CheckCircle, Fingerprint, Eye, EyeOff, RefreshCw, Monitor, MapPin, Clock, QrCode, Copy } from 'lucide-react';
import { securityService, type SecurityEvent, type SecuritySettings, type TrustedDevice } from '../services/securityService';
import { notificationService } from '../services/notificationService';

interface SecurityActivity {
  id: string;
  action: string;
  device: string;
  location: string;
  time: string;
  status: 'success' | 'warning' | 'blocked';
  ip_address: string;
  user_agent: string;
}

const Security = () => {
  const [securityScore, setSecurityScore] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    biometricEnabled: false,
    deviceApprovalEnabled: true,
    locationTrackingEnabled: true,
    sessionTimeout: 30,
    loginNotifications: true,
    suspiciousActivityAlerts: true
  });

  const [activities, setActivities] = useState<SecurityEvent[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 2FA Setup States
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setting2FA, setSetting2FA] = useState(false);

  // Biometric States
  const [settingBiometric, setSettingBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  const securityRecommendations = [
    {
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: securitySettings.twoFactorEnabled ? 'completed' : 'pending',
      action: () => handle2FAToggle()
    },
    {
      title: 'Review Active Sessions',
      description: 'Check and manage your active login sessions',
      status: 'pending',
      action: () => loadTrustedDevices()
    },
    {
      title: 'Enable Biometric Login',
      description: 'Use fingerprint or face recognition for secure access',
      status: securitySettings.biometricEnabled ? 'completed' : 'pending',
      action: () => handleBiometricToggle(),
      disabled: !biometricSupported
    },
    {
      title: 'Review Security Settings',
      description: 'Ensure all security features are properly configured',
      status: 'pending',
      action: () => calculateSecurityScore()
    }
  ];

  useEffect(() => {
    loadSecurityData();
    checkBiometricSupport();
  }, []);

  useEffect(() => {
    calculateSecurityScore();
  }, [securitySettings]);

  const checkBiometricSupport = () => {
    setBiometricSupported(securityService.isBiometricSupported());
  };

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [events, devices, settings] = await Promise.all([
        securityService.getSecurityEvents(),
        securityService.getTrustedDevices(),
        securityService.getSecuritySettings()
      ]);
      
      setActivities(events);
      setTrustedDevices(devices);
      setSecuritySettings(settings);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityScore = () => {
    let score = 0;
    const maxScore = 100;
    
    // Two-factor authentication (25 points)
    if (securitySettings.twoFactorEnabled) score += 25;
    
    // Biometric login (20 points)
    if (securitySettings.biometricEnabled) score += 20;
    
    // Device approval (15 points)
    if (securitySettings.deviceApprovalEnabled) score += 15;
    
    // Location tracking (10 points)
    if (securitySettings.locationTrackingEnabled) score += 10;
    
    // Login notifications (10 points)
    if (securitySettings.loginNotifications) score += 10;
    
    // Suspicious activity alerts (10 points)
    if (securitySettings.suspiciousActivityAlerts) score += 10;
    
    // Session timeout (10 points)
    if (securitySettings.sessionTimeout <= 30) score += 10;
    
    setSecurityScore(Math.min(score, maxScore));
  };

  const toggleSetting = async (setting: keyof SecuritySettings) => {
    try {
      const newSettings = {
        ...securitySettings,
        [setting]: !securitySettings[setting]
      };
      
      await securityService.updateSecuritySettings(newSettings);
      setSecuritySettings(newSettings);
      
      // Create notification for security setting change
      await notificationService.createSecurityNotification(
        'Security Setting Updated',
        `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${newSettings[setting] ? 'enabled' : 'disabled'}.`,
        { setting, enabled: newSettings[setting] }
      );
    } catch (error) {
      console.error('Error updating security setting:', error);
    }
  };

  const handle2FAToggle = async () => {
    if (securitySettings.twoFactorEnabled) {
      // Disable 2FA
      try {
        setSetting2FA(true);
        await securityService.disableTwoFactor();
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
      } catch (error) {
        console.error('Error disabling 2FA:', error);
      } finally {
        setSetting2FA(false);
      }
    } else {
      // Enable 2FA - show setup modal
      setShow2FASetup(true);
      try {
        setSetting2FA(true);
        const { secret, qrCode } = await securityService.enableTwoFactor();
        setTwoFASecret(secret);
        setQrCodeUrl(qrCode);
      } catch (error) {
        console.error('Error setting up 2FA:', error);
        setShow2FASetup(false);
      } finally {
        setSetting2FA(false);
      }
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    try {
      setSetting2FA(true);
      const isValid = await securityService.verifyTwoFactor(verificationCode);
      
      if (isValid) {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
        setShow2FASetup(false);
        setVerificationCode('');
        alert('Two-factor authentication has been successfully enabled!');
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      alert('Error verifying code. Please try again.');
    } finally {
      setSetting2FA(false);
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricSupported) {
      alert('Biometric authentication is not supported on this device');
      return;
    }

    if (securitySettings.biometricEnabled) {
      // Disable biometric
      try {
        setSettingBiometric(true);
        await securityService.disableBiometric();
        setSecuritySettings(prev => ({ ...prev, biometricEnabled: false }));
      } catch (error) {
        console.error('Error disabling biometric:', error);
      } finally {
        setSettingBiometric(false);
      }
    } else {
      // Enable biometric
      try {
        setSettingBiometric(true);
        const success = await securityService.enableBiometric();
        if (success) {
          setSecuritySettings(prev => ({ ...prev, biometricEnabled: true }));
          alert('Biometric authentication has been successfully enabled!');
        } else {
          alert('Failed to enable biometric authentication. Please try again.');
        }
      } catch (error) {
        console.error('Error enabling biometric:', error);
        alert('Error enabling biometric authentication: ' + error.message);
      } finally {
        setSettingBiometric(false);
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await securityService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      await securityService.revokeDevice(deviceId);
      setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (error) {
      console.error('Error revoking device:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Security Center</h1>
        <p className="text-gray-600">Manage your account security and privacy settings</p>
      </div>

      {/* Security Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-green-50 rounded-lg">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Security Score</h2>
            <p className="text-sm text-gray-600">
              Your account security is {securityScore >= 80 ? 'excellent' : securityScore >= 60 ? 'good' : 'needs improvement'}
            </p>
          </div>
          <button
            onClick={calculateSecurityScore}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(securityScore)}`}
              style={{ width: `${securityScore}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Security Score</span>
            <span className={`font-medium ${getScoreColor(securityScore)}`}>
              {securityScore}/100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password & Authentication */}
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Key className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Change Password</h3>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Current Password</label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mt-1"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Security Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <button
                  onClick={handle2FAToggle}
                  disabled={setting2FA}
                  className={`relative inline-flex items-center cursor-pointer ${setting2FA ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={securitySettings.twoFactorEnabled}
                    readOnly
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Biometric Login</h4>
                  <p className="text-sm text-gray-600">
                    {biometricSupported ? 'Use fingerprint or face recognition' : 'Not supported on this device'}
                  </p>
                </div>
                <button
                  onClick={handleBiometricToggle}
                  disabled={settingBiometric || !biometricSupported}
                  className={`relative inline-flex items-center cursor-pointer ${(settingBiometric || !biometricSupported) ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={securitySettings.biometricEnabled}
                    readOnly
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Login Notifications</h4>
                  <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={securitySettings.loginNotifications}
                    onChange={() => toggleSetting('loginNotifications')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Suspicious Activity Alerts</h4>
                  <p className="text-sm text-gray-600">Monitor unusual account activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={securitySettings.suspiciousActivityAlerts}
                    onChange={() => toggleSetting('suspiciousActivityAlerts')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Recommendations & Activity */}
        <div className="space-y-6">
          {/* Security Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Security Recommendations</h3>
            </div>
            
            <div className="space-y-4">
              {securityRecommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  {rec.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                  {rec.status === 'pending' && (
                    <button
                      onClick={rec.action}
                      disabled={rec.disabled}
                      className={`px-3 py-1 text-xs rounded-lg font-medium ${
                        rec.disabled 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {rec.disabled ? 'N/A' : 'Fix'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Trusted Devices */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Monitor className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Trusted Devices</h3>
            </div>
            
            <div className="space-y-4">
              {trustedDevices.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{device.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {device.lastUsed}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeDevice(device.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Activity */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Security Activity</h2>
            <History className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'success' ? 'bg-green-50' :
                  activity.status === 'warning' ? 'bg-amber-50' :
                  'bg-red-50'
                }`}>
                  <Lock className={`h-5 w-5 ${
                    activity.status === 'success' ? 'text-green-600' :
                    activity.status === 'warning' ? 'text-amber-600' :
                    'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{activity.action}</h3>
                      <p className="text-sm text-gray-600">{activity.device}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </span>
                        <span>IP: {activity.ip_address}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{securityService.formatLastUsed(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Setup Two-Factor Authentication</h3>
              <button
                onClick={() => setShow2FASetup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto mb-4" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter this secret key manually:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={twoFASecret}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(twoFASecret)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter verification code:
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShow2FASetup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={verify2FA}
                  disabled={setting2FA || verificationCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {setting2FA ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;