-- Create loan_assessments table
CREATE TABLE IF NOT EXISTS loan_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  assessment_date timestamptz DEFAULT now() NOT NULL,
  loan_application_data jsonb NOT NULL,
  risk_score integer NOT NULL,
  risk_breakdown jsonb NOT NULL,
  recommendations text[] NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE loan_assessments ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own loan assessments"
  ON loan_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan assessments"
  ON loan_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);