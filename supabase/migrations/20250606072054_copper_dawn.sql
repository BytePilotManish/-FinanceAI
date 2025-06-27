/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add INSERT policy for profiles table to allow users to create their own profile during signup
    - Policy allows authenticated users to insert a profile where the id matches their auth.uid()

  This fixes the RLS violation error that occurs during user signup when trying to create a profile record.
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);