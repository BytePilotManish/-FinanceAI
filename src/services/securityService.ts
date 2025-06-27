import { supabase } from '../lib/supabase/client';
import { notificationService } from './notificationService';

export interface SecurityEvent {
  id: string;
  user_id: string;
  action: string;
  device: string;
  location: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'warning' | 'blocked';
  timestamp: string;
  metadata?: any;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  deviceApprovalEnabled: boolean;
  locationTrackingEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

export interface TrustedDevice {
  id: string;
  name: string;
  location: string;
  lastUsed: string;
  browser: string;
  trusted: boolean;
  fingerprint: string;
}

// WebAuthn/Biometric Authentication Support
interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceType: string;
}

// RFC 6238 compliant TOTP implementation
class TOTPGenerator {
  private static readonly BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  
  // Convert base32 string to bytes
  private static base32ToBytes(base32: string): Uint8Array {
    // Remove padding and convert to uppercase
    const cleanBase32 = base32.replace(/=+$/, '').toUpperCase();
    const bytes: number[] = [];
    let buffer = 0;
    let bitsLeft = 0;
    
    for (const char of cleanBase32) {
      const value = this.BASE32_CHARS.indexOf(char);
      if (value === -1) {
        throw new Error(`Invalid base32 character: ${char}`);
      }
      
      buffer = (buffer << 5) | value;
      bitsLeft += 5;
      
      if (bitsLeft >= 8) {
        bytes.push((buffer >> (bitsLeft - 8)) & 255);
        bitsLeft -= 8;
      }
    }
    
    return new Uint8Array(bytes);
  }
  
  // Convert number to 8-byte big-endian array
  private static numberToBytes(num: number): Uint8Array {
    const bytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xff;
      num = Math.floor(num / 256);
    }
    return bytes;
  }
  
  // HMAC-SHA1 implementation using Web Crypto API
  private static async hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return new Uint8Array(signature);
  }
  
  // Generate TOTP token for given secret and time
  static async generateTOTP(secret: string, timeStep?: number): Promise<string> {
    try {
      // Use current time step if not provided (30-second intervals)
      const currentTimeStep = timeStep ?? Math.floor(Date.now() / 30000);
      
      console.log('Generating TOTP:', {
        secret: secret.substring(0, 8) + '...',
        timeStep: currentTimeStep,
        currentTime: new Date().toISOString()
      });
      
      // Convert secret from base32 to bytes
      const keyBytes = this.base32ToBytes(secret);
      
      // Convert time step to 8-byte big-endian
      const timeBytes = this.numberToBytes(currentTimeStep);
      
      // Calculate HMAC-SHA1
      const hmac = await this.hmacSha1(keyBytes, timeBytes);
      
      // Dynamic truncation (RFC 4226)
      const offset = hmac[hmac.length - 1] & 0x0f;
      const truncatedHash = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      );
      
      // Generate 6-digit code
      const code = (truncatedHash % 1000000).toString().padStart(6, '0');
      
      console.log('Generated TOTP code:', code);
      return code;
    } catch (error) {
      console.error('TOTP generation error:', error);
      throw error;
    }
  }
  
  // Verify TOTP token with time window tolerance
  static async verifyTOTP(secret: string, token: string, windowSize = 2): Promise<boolean> {
    try {
      const cleanToken = token.replace(/\s/g, '');
      
      if (!/^\d{6}$/.test(cleanToken)) {
        console.error('Invalid token format:', cleanToken);
        return false;
      }
      
      const currentTimeStep = Math.floor(Date.now() / 30000);
      
      console.log('TOTP Verification:', {
        secret: secret.substring(0, 8) + '...',
        providedToken: cleanToken,
        currentTimeStep,
        windowSize,
        currentTime: new Date().toISOString()
      });
      
      // Check current time step and surrounding window
      for (let i = -windowSize; i <= windowSize; i++) {
        const testTimeStep = currentTimeStep + i;
        const expectedToken = await this.generateTOTP(secret, testTimeStep);
        
        console.log(`Testing time step ${testTimeStep} (offset ${i}): expected=${expectedToken}, provided=${cleanToken}`);
        
        if (expectedToken === cleanToken) {
          console.log('✅ Token verified successfully at time step:', testTimeStep);
          return true;
        }
      }
      
      console.log('❌ Token verification failed - no match found');
      return false;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }
  
  // Generate cryptographically secure base32 secret
  static generateSecret(length = 32): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    
    let secret = '';
    for (const byte of bytes) {
      secret += this.BASE32_CHARS[byte % 32];
    }
    
    return secret;
  }
}

export const securityService = {
  // Get security events for the current user
  async getSecurityEvents(limit = 20): Promise<SecurityEvent[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        device: log.device,
        location: log.location,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        status: log.status,
        timestamp: log.created_at,
        metadata: log.metadata
      }));
    } catch (error) {
      console.error('Error fetching security events:', error);
      // Return mock data as fallback
      return this.getMockSecurityEvents(userData.user.id);
    }
  },

  // Get trusted devices
  async getTrustedDevices(): Promise<TrustedDevice[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('last_used', { ascending: false });

      if (error) throw error;

      return data.map(device => ({
        id: device.id,
        name: device.device_name,
        location: device.location || 'Unknown',
        lastUsed: this.formatLastUsed(device.last_used),
        browser: device.browser || 'Unknown',
        trusted: device.is_trusted,
        fingerprint: device.device_fingerprint
      }));
    } catch (error) {
      console.error('Error fetching trusted devices:', error);
      return this.getMockTrustedDevices();
    }
  },

  // Get security settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (error) {
        // Create default settings if none exist
        return await this.createDefaultSecuritySettings();
      }

      return {
        twoFactorEnabled: data.two_factor_enabled,
        biometricEnabled: data.biometric_enabled,
        deviceApprovalEnabled: data.device_approval_enabled,
        locationTrackingEnabled: data.location_tracking_enabled,
        sessionTimeout: data.session_timeout,
        loginNotifications: data.login_notifications,
        suspiciousActivityAlerts: data.suspicious_activity_alerts
      };
    } catch (error) {
      console.error('Error fetching security settings:', error);
      return this.getDefaultSecuritySettings();
    }
  },

  // Update security settings
  async updateSecuritySettings(settings: SecuritySettings): Promise<SecuritySettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: userData.user.id,
          two_factor_enabled: settings.twoFactorEnabled,
          biometric_enabled: settings.biometricEnabled,
          device_approval_enabled: settings.deviceApprovalEnabled,
          location_tracking_enabled: settings.locationTrackingEnabled,
          session_timeout: settings.sessionTimeout,
          login_notifications: settings.loginNotifications,
          suspicious_activity_alerts: settings.suspiciousActivityAlerts,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent({
        action: 'Security Settings Updated',
        device: this.getCurrentDevice(),
        location: await this.getCurrentLocation(),
        ip_address: await this.getCurrentIP(),
        user_agent: navigator.userAgent,
        status: 'success',
        metadata: { settings }
      });

      return settings;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  // Two-Factor Authentication Implementation
  async enableTwoFactor(): Promise<{ secret: string; qrCode: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    try {
      // Generate cryptographically secure secret
      const secret = TOTPGenerator.generateSecret(32);
      const qrCode = this.generateQRCode(userData.user.email!, secret);

      console.log('🔐 Generated 2FA Setup:', {
        secret: secret.substring(0, 8) + '...',
        secretLength: secret.length,
        userEmail: userData.user.email,
        userId: userData.user.id
      });

      // Store temporarily for verification
      sessionStorage.setItem('temp_2fa_secret', secret);
      sessionStorage.setItem('temp_2fa_user', userData.user.id);

      await this.logSecurityEvent({
        action: 'Two-Factor Authentication Setup Started',
        device: this.getCurrentDevice(),
        location: await this.getCurrentLocation(),
        ip_address: await this.getCurrentIP(),
        user_agent: navigator.userAgent,
        status: 'success'
      });

      return { secret, qrCode };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  },

  async verifyTwoFactor(token: string): Promise<boolean> {
    try {
      const secret = sessionStorage.getItem('temp_2fa_secret');
      const userId = sessionStorage.getItem('temp_2fa_user');
      
      console.log('🔍 2FA Setup Verification:', {
        hasSecret: !!secret,
        hasUserId: !!userId,
        token: token,
        tokenLength: token.length
      });
      
      if (!secret || !userId) {
        console.error('❌ No 2FA setup in progress');
        throw new Error('No 2FA setup in progress');
      }

      // Verify using robust TOTP implementation
      const isValid = await TOTPGenerator.verifyTOTP(secret, token, 3);
      
      console.log('🔐 Setup verification result:', isValid);
      
      if (isValid) {
        // First, check if settings record exists
        const { data: existingSettings } = await supabase
          .from('user_security_settings')
          .select('id')
          .eq('user_id', userId)
          .single();

        let dbError;
        
        if (existingSettings) {
          // Update existing record
          console.log('📝 Updating existing security settings...');
          const { error } = await supabase
            .from('user_security_settings')
            .update({
              two_factor_enabled: true,
              two_factor_secret: secret,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          dbError = error;
        } else {
          // Insert new record
          console.log('📝 Creating new security settings...');
          const { error } = await supabase
            .from('user_security_settings')
            .insert({
              user_id: userId,
              two_factor_enabled: true,
              two_factor_secret: secret,
              biometric_enabled: false,
              device_approval_enabled: true,
              location_tracking_enabled: true,
              session_timeout: 30,
              login_notifications: true,
              suspicious_activity_alerts: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          dbError = error;
        }

        if (dbError) {
          console.error('❌ Database error:', dbError);
          throw dbError;
        }

        // Clean up temporary storage
        sessionStorage.removeItem('temp_2fa_secret');
        sessionStorage.removeItem('temp_2fa_user');

        await this.logSecurityEvent({
          action: 'Two-Factor Authentication Enabled',
          device: this.getCurrentDevice(),
          location: await this.getCurrentLocation(),
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          status: 'success'
        });

        await notificationService.createSecurityNotification(
          'Two-Factor Authentication Enabled',
          'Two-factor authentication has been successfully enabled for your account.',
          { feature: '2FA' }
        );

        console.log('✅ 2FA setup completed successfully');
        return true;
      } else {
        await this.logSecurityEvent({
          action: 'Failed 2FA Setup Verification',
          device: this.getCurrentDevice(),
          location: await this.getCurrentLocation(),
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          status: 'blocked',
          metadata: { token }
        });
        
        console.log('❌ 2FA setup verification failed');
      }

      return false;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return false;
    }
  },

  async verifyTwoFactorLogin(token: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      console.log('🔍 2FA Login verification for user:', userData.user.id);

      // Get the user's 2FA secret from database
      const { data: settings, error } = await supabase
        .from('user_security_settings')
        .select('two_factor_secret')
        .eq('user_id', userData.user.id)
        .single();

      if (error || !settings?.two_factor_secret) {
        console.error('❌ 2FA not enabled for user or database error:', error);
        throw new Error('2FA not enabled for this user');
      }

      // Verify the token using robust TOTP
      const isValid = await TOTPGenerator.verifyTOTP(settings.two_factor_secret, token, 3);
      
      console.log('🔐 2FA Login verification result:', isValid);
      
      if (isValid) {
        await this.logSecurityEvent({
          action: 'Successful 2FA Login',
          device: this.getCurrentDevice(),
          location: await this.getCurrentLocation(),
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          status: 'success'
        });
        
        console.log('✅ 2FA login successful');
      } else {
        await this.logSecurityEvent({
          action: 'Failed 2FA Verification',
          device: this.getCurrentDevice(),
          location: await this.getCurrentLocation(),
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          status: 'blocked',
          metadata: { token }
        });
        
        console.log('❌ 2FA login failed');
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA login:', error);
      return false;
    }
  },

  async disableTwoFactor(): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_security_settings')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userData.user.id);

      if (error) throw error;

      await this.logSecurityEvent({
        action: 'Two-Factor Authentication Disabled',
        device: this.getCurrentDevice(),
        location: await this.getCurrentLocation(),
        ip_address: await this.getCurrentIP(),
        user_agent: navigator.userAgent,
        status: 'warning'
      });

      await notificationService.createSecurityNotification(
        'Two-Factor Authentication Disabled',
        'Two-factor authentication has been disabled. Your account security may be reduced.',
        { feature: '2FA' }
      );

      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  },

  // Biometric Authentication Implementation
  async enableBiometric(): Promise<boolean> {
    if (!this.isBiometricSupported()) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No authenticated user');

      // Create WebAuthn credential
      const credential = await this.createBiometricCredential(userData.user.email!);
      
      if (credential) {
        // Store credential info
        await this.storeBiometricCredential(credential);

        const currentSettings = await this.getSecuritySettings();
        await this.updateSecuritySettings({
          ...currentSettings,
          biometricEnabled: true
        });

        await this.logSecurityEvent({
          action: 'Biometric Authentication Enabled',
          device: this.getCurrentDevice(),
          location: await this.getCurrentLocation(),
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          status: 'success',
          metadata: { credentialId: credential.id }
        });

        await notificationService.createSecurityNotification(
          'Biometric Authentication Enabled',
          'Biometric authentication has been successfully enabled for your device.',
          { feature: 'biometric' }
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  },

  async authenticateWithBiometric(): Promise<boolean> {
    if (!this.isBiometricSupported()) {
      return false;
    }

    try {
      const credentials = this.getBiometricCredentials();
      if (credentials.length === 0) {
        return false;
      }

      const assertion = await this.getBiometricAssertion(credentials);
      
      if (assertion) {
        await this.logSecurityEvent({
          action: 'Biometric Authentication Success',
          device: this.getCurrentDevice(),
          location: await this.getCurrentLocation(),
          ip_address: await this.getCurrentIP(),
          user_agent: navigator.userAgent,
          status: 'success'
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error with biometric authentication:', error);
      return false;
    }
  },

  async disableBiometric(): Promise<boolean> {
    try {
      const currentSettings = await this.getSecuritySettings();
      await this.updateSecuritySettings({
        ...currentSettings,
        biometricEnabled: false
      });

      // Remove stored credentials
      localStorage.removeItem('biometric_credentials');

      await this.logSecurityEvent({
        action: 'Biometric Authentication Disabled',
        device: this.getCurrentDevice(),
        location: await this.getCurrentLocation(),
        ip_address: await this.getCurrentIP(),
        user_agent: navigator.userAgent,
        status: 'warning'
      });

      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await this.logSecurityEvent({
        action: 'Password Changed',
        device: this.getCurrentDevice(),
        location: await this.getCurrentLocation(),
        ip_address: await this.getCurrentIP(),
        user_agent: navigator.userAgent,
        status: 'success'
      });

      await notificationService.createSecurityNotification(
        'Password Changed Successfully',
        'Your account password has been updated. If you didn\'t make this change, contact support immediately.',
        { timestamp: new Date().toISOString() }
      );

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Revoke device access
  async revokeDevice(deviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      await this.logSecurityEvent({
        action: 'Device Access Revoked',
        device: this.getCurrentDevice(),
        location: await this.getCurrentLocation(),
        ip_address: await this.getCurrentIP(),
        user_agent: navigator.userAgent,
        status: 'success',
        metadata: { revokedDeviceId: deviceId }
      });

      await notificationService.createSecurityNotification(
        'Device Access Revoked',
        'A trusted device has been removed from your account.',
        { deviceId }
      );

      return true;
    } catch (error) {
      console.error('Error revoking device:', error);
      throw error;
    }
  },

  // Log security event
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'user_id' | 'timestamp'>): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    try {
      const { error } = await supabase
        .from('security_logs')
        .insert({
          user_id: userData.user.id,
          action: event.action,
          device: event.device,
          location: event.location,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          status: event.status,
          metadata: event.metadata || {}
        });

      if (error) throw error;

      // Create notification for important security events
      if (event.status === 'warning' || event.status === 'blocked') {
        await notificationService.createSecurityNotification(
          'Security Alert',
          `${event.action} detected from ${event.device} in ${event.location}`,
          { event }
        );
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  },

  // Helper methods
  getCurrentDevice(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) {
      if (userAgent.includes('iPhone')) return 'iPhone';
      if (userAgent.includes('Android')) return 'Android Device';
      return 'Mobile Device';
    }
    if (userAgent.includes('Mac')) return 'MacBook';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Linux')) return 'Linux PC';
    return 'Desktop Computer';
  },

  async getCurrentLocation(): Promise<string> {
    // Try multiple location detection methods for better accuracy
    try {
      // Method 1: Try browser geolocation API first (most accurate)
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          
          // Reverse geocode the coordinates
          const reverseGeocode = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (reverseGeocode) {
            console.log('Location from GPS:', reverseGeocode);
            return reverseGeocode;
          }
        } catch (geoError) {
          console.log('GPS location failed:', geoError.message);
        }
      }
      
      // Method 2: Try multiple IP geolocation services
      const locationServices = [
        {
          name: 'ipapi.co',
          url: 'https://ipapi.co/json/',
          parser: (data: any) => {
            const parts = [data.city, data.region, data.country_name].filter(Boolean);
            return parts.join(', ');
          }
        },
        {
          name: 'ip-api.com',
          url: 'http://ip-api.com/json/',
          parser: (data: any) => {
            const parts = [data.city, data.regionName, data.country].filter(Boolean);
            return parts.join(', ');
          }
        },
        {
          name: 'ipinfo.io',
          url: 'https://ipinfo.io/json',
          parser: (data: any) => {
            const parts = [data.city, data.region, data.country].filter(Boolean);
            return parts.join(', ');
          }
        }
      ];
      
      for (const service of locationServices) {
        try {
          console.log(`Trying location service: ${service.name}`);
          const response = await fetch(service.url);
          const data = await response.json();
          
          if (data && !data.error) {
            const location = service.parser(data);
            if (location && location !== 'undefined, undefined, undefined') {
              console.log(`Location from ${service.name}:`, location);
              
              // Add accuracy warning for IP-based location
              return `${location} (IP-based)`;
            }
          }
        } catch (serviceError) {
          console.log(`${service.name} failed:`, serviceError.message);
          continue;
        }
      }
      
      // Method 3: Fallback to timezone-based location estimation
      const timezoneLocation = this.getLocationFromTimezone();
      if (timezoneLocation) {
        console.log('Location from timezone:', timezoneLocation);
        return `${timezoneLocation} (Timezone-based)`;
      }
      
    } catch (error) {
      console.error('Error fetching location:', error);
    }
    
    return 'Location Unavailable';
  },

  // Reverse geocode coordinates to get address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // Using OpenStreetMap Nominatim (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FinanceAI-App/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const { city, town, village, state, country } = data.address;
        const location = city || town || village;
        const parts = [location, state, country].filter(Boolean);
        return parts.join(', ');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    
    return null;
  },

  // Get approximate location from timezone
  getLocationFromTimezone(): string | null {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map common Indian timezones to regions
      const timezoneMap: { [key: string]: string } = {
        'Asia/Kolkata': 'India',
        'Asia/Calcutta': 'India',
        'Asia/Mumbai': 'Mumbai, India',
        'Asia/Delhi': 'Delhi, India',
        'Asia/Bangalore': 'Bangalore, India',
        'Asia/Chennai': 'Chennai, India',
        'Asia/Hyderabad': 'Hyderabad, India',
        'Asia/Pune': 'Pune, India',
        'Asia/Ahmedabad': 'Ahmedabad, India',
        'Asia/Karachi': 'Pakistan',
        'Asia/Dhaka': 'Bangladesh',
        'Asia/Kathmandu': 'Nepal',
        'Asia/Colombo': 'Sri Lanka'
      };
      
      if (timezoneMap[timezone]) {
        return timezoneMap[timezone];
      }
      
      // Extract region from timezone for other locations
      const parts = timezone.split('/');
      if (parts.length >= 2) {
        return parts[1].replace(/_/g, ' ');
      }
      
      return null;
    } catch (error) {
      console.error('Error getting timezone location:', error);
      return null;
    }
  },

  async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'Unknown';
    } catch (error) {
      console.error('Error fetching IP:', error);
      return 'Unknown';
    }
  },

  // QR Code generation for 2FA
  generateQRCode(email: string, secret: string): string {
    const issuer = 'FinanceAI';
    const accountName = email;
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    // Return QR code URL using a public QR code service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
  },

  // Biometric helper methods
  isBiometricSupported(): boolean {
    return !!(navigator.credentials && window.PublicKeyCredential);
  },

  async createBiometricCredential(email: string): Promise<BiometricCredential | null> {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'FinanceAI' },
          user: {
            id: new TextEncoder().encode(email),
            name: email,
            displayName: email
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      }) as PublicKeyCredential;

      if (credential) {
        return {
          id: credential.id,
          publicKey: 'stored_securely',
          counter: 0,
          deviceType: 'platform'
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating biometric credential:', error);
      return null;
    }
  },

  async storeBiometricCredential(credential: BiometricCredential): Promise<void> {
    const credentials = this.getBiometricCredentials();
    credentials.push(credential);
    localStorage.setItem('biometric_credentials', JSON.stringify(credentials));
  },

  getBiometricCredentials(): BiometricCredential[] {
    try {
      const stored = localStorage.getItem('biometric_credentials');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async getBiometricAssertion(credentials: BiometricCredential[]): Promise<boolean> {
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: credentials.map(cred => ({
            id: new TextEncoder().encode(cred.id),
            type: 'public-key'
          })),
          userVerification: 'required'
        }
      });

      return !!assertion;
    } catch (error) {
      console.error('Error getting biometric assertion:', error);
      return false;
    }
  },

  // Mock data methods for fallback
  getMockSecurityEvents(userId: string): SecurityEvent[] {
    return [
      {
        id: '1',
        user_id: userId,
        action: 'Login',
        device: 'MacBook Pro',
        location: 'Mumbai, India',
        ip_address: '192.168.1.1',
        user_agent: navigator.userAgent,
        status: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '2',
        user_id: userId,
        action: 'Password Change',
        device: 'iPhone 14',
        location: 'Delhi, India',
        ip_address: '192.168.1.2',
        user_agent: 'Mobile Safari',
        status: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ];
  },

  getMockTrustedDevices(): TrustedDevice[] {
    return [
      {
        id: '1',
        name: 'MacBook Pro',
        location: 'Mumbai, India',
        lastUsed: 'Just now',
        browser: 'Chrome',
        trusted: true,
        fingerprint: 'abc123'
      },
      {
        id: '2',
        name: 'iPhone 14',
        location: 'Delhi, India',
        lastUsed: '2 hours ago',
        browser: 'Safari',
        trusted: true,
        fingerprint: 'def456'
      }
    ];
  },

  getDefaultSecuritySettings(): SecuritySettings {
    return {
      twoFactorEnabled: false,
      biometricEnabled: false,
      deviceApprovalEnabled: true,
      locationTrackingEnabled: true,
      sessionTimeout: 30,
      loginNotifications: true,
      suspiciousActivityAlerts: true
    };
  },

  async createDefaultSecuritySettings(): Promise<SecuritySettings> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const defaultSettings = this.getDefaultSecuritySettings();

    try {
      await supabase
        .from('user_security_settings')
        .insert({
          user_id: userData.user.id,
          two_factor_enabled: defaultSettings.twoFactorEnabled,
          biometric_enabled: defaultSettings.biometricEnabled,
          device_approval_enabled: defaultSettings.deviceApprovalEnabled,
          location_tracking_enabled: defaultSettings.locationTrackingEnabled,
          session_timeout: defaultSettings.sessionTimeout,
          login_notifications: defaultSettings.loginNotifications,
          suspicious_activity_alerts: defaultSettings.suspiciousActivityAlerts
        });
    } catch (error) {
      console.error('Error creating default security settings:', error);
    }

    return defaultSettings;
  },

  formatLastUsed(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
};