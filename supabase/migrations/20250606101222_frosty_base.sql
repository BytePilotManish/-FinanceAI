/*
  # Advanced Settings Schema

  1. New Tables
    - `user_settings` - Core user settings and preferences
    - `billing_info` - User billing and subscription information
    - `api_keys` - User API keys for integrations
    - `export_history` - Track data exports
    - `login_sessions` - Active user sessions

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies
*/

-- User settings table for comprehensive preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  
  -- Profile settings
  display_name text,
  bio text,
  avatar_url text,
  timezone text DEFAULT 'Asia/Kolkata',
  language text DEFAULT 'en',
  date_format text DEFAULT 'DD/MM/YYYY',
  time_format text DEFAULT '24h',
  
  -- Financial preferences
  default_currency text DEFAULT 'INR',
  number_format text DEFAULT 'indian', -- 'indian', 'international'
  fiscal_year_start text DEFAULT 'april', -- 'april', 'january'
  
  -- Privacy settings
  profile_visibility text DEFAULT 'private', -- 'public', 'private', 'friends'
  data_sharing boolean DEFAULT false,
  analytics_tracking boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  
  -- App preferences
  theme text DEFAULT 'light', -- 'light', 'dark', 'auto'
  sidebar_collapsed boolean DEFAULT false,
  dashboard_layout jsonb DEFAULT '{}',
  default_page text DEFAULT '/dashboard',
  
  -- Advanced settings
  api_access_enabled boolean DEFAULT false,
  export_format text DEFAULT 'csv', -- 'csv', 'excel', 'pdf'
  backup_frequency text DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billing information table
CREATE TABLE IF NOT EXISTS billing_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  
  -- Subscription details
  plan_type text DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  plan_status text DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'suspended'
  subscription_start timestamptz,
  subscription_end timestamptz,
  auto_renewal boolean DEFAULT true,
  
  -- Payment details
  payment_method text, -- 'card', 'upi', 'netbanking', 'wallet'
  last_four_digits text,
  card_brand text,
  billing_email text,
  
  -- Billing address
  billing_name text,
  billing_address text,
  billing_city text,
  billing_state text,
  billing_country text DEFAULT 'India',
  billing_pincode text,
  gst_number text,
  
  -- Usage tracking
  api_calls_used integer DEFAULT 0,
  api_calls_limit integer DEFAULT 1000,
  storage_used bigint DEFAULT 0, -- in bytes
  storage_limit bigint DEFAULT 1073741824, -- 1GB in bytes
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API keys for integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  key_name text NOT NULL,
  key_hash text NOT NULL, -- Store hashed version
  key_prefix text NOT NULL, -- First 8 chars for display
  permissions jsonb DEFAULT '[]', -- Array of permissions
  last_used timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Export history tracking
CREATE TABLE IF NOT EXISTS export_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  export_type text NOT NULL, -- 'transactions', 'portfolio', 'full_data'
  file_format text NOT NULL, -- 'csv', 'excel', 'pdf'
  file_size bigint,
  download_url text,
  expires_at timestamptz,
  status text DEFAULT 'processing', -- 'processing', 'completed', 'failed', 'expired'
  
  created_at timestamptz DEFAULT now()
);

-- Active login sessions
CREATE TABLE IF NOT EXISTS login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  session_token text NOT NULL,
  device_info text,
  browser_info text,
  ip_address inet,
  location text,
  is_current boolean DEFAULT false,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Billing info policies
CREATE POLICY "Users can view own billing info"
  ON billing_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own billing info"
  ON billing_info FOR ALL
  USING (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

-- Export history policies
CREATE POLICY "Users can view own export history"
  ON export_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own export history"
  ON export_history FOR ALL
  USING (auth.uid() = user_id);

-- Login sessions policies
CREATE POLICY "Users can view own sessions"
  ON login_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON login_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(last_activity);

-- Insert default settings for existing users
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO billing_info (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_user_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  INSERT INTO billing_info (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings when a new user signs up
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_default_settings();