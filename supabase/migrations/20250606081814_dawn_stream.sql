/*
  # Complete Notification System

  1. New Tables
    - `notifications`
      - User notifications with categories and metadata
    - `notification_preferences`
      - User notification preferences for different channels

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'transaction', 'security', 'investment', 'system', 'goal'
  category text NOT NULL, -- 'info', 'warning', 'success', 'error'
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  action_url text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  notification_type text NOT NULL,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Notification Preferences Policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, notification_type, email_enabled, push_enabled, sms_enabled)
SELECT 
  id as user_id,
  unnest(ARRAY['transactions', 'security', 'investment', 'system', 'goals']) as notification_type,
  true as email_enabled,
  true as push_enabled,
  false as sms_enabled
FROM auth.users
ON CONFLICT (user_id, notification_type) DO NOTHING;