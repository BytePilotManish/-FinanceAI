-- Create risk_profiles table
CREATE TABLE IF NOT EXISTS risk_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  risk_score integer NOT NULL,
  risk_categories jsonb NOT NULL,
  recommendations text[] NOT NULL,
  answers jsonb NOT NULL,
  assessment_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own risk profiles"
  ON risk_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk profiles"
  ON risk_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);