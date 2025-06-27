-- Security logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  device text NOT NULL,
  location text NOT NULL,
  ip_address inet,
  user_agent text,
  status text NOT NULL CHECK (status IN ('success', 'warning', 'blocked')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User security settings table
CREATE TABLE IF NOT EXISTS user_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  two_factor_enabled boolean DEFAULT false,
  biometric_enabled boolean DEFAULT false,
  device_approval_enabled boolean DEFAULT true,
  location_tracking_enabled boolean DEFAULT true,
  session_timeout integer DEFAULT 30,
  login_notifications boolean DEFAULT true,
  suspicious_activity_alerts boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trusted devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  device_name text NOT NULL,
  device_fingerprint text NOT NULL,
  browser text,
  location text,
  ip_address inet,
  user_agent text,
  is_trusted boolean DEFAULT false,
  last_used timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Security logs policies
CREATE POLICY "Users can view own security logs"
  ON security_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security logs"
  ON security_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User security settings policies
CREATE POLICY "Users can view own security settings"
  ON user_security_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security settings"
  ON user_security_settings FOR ALL
  USING (auth.uid() = user_id);

-- Trusted devices policies
CREATE POLICY "Users can view own trusted devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices"
  ON trusted_devices FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_status ON security_logs(status);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);

-- Insert default security settings for existing users
INSERT INTO user_security_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Function to automatically create security settings for new users
CREATE OR REPLACE FUNCTION create_user_security_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create security settings when a new user signs up
CREATE TRIGGER on_auth_user_created_security
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_security_settings();