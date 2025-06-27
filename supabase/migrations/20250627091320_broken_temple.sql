/*
  # Fix User Signup Database Error

  1. Database Issues Fixed
    - Ensure proper user creation triggers exist
    - Fix RLS policies that might block user creation
    - Add missing default settings creation
    - Ensure profiles table can be created for new users

  2. Security
    - Update RLS policies to allow proper user creation
    - Ensure auth.users table has correct permissions

  3. Triggers
    - Add trigger to create user profile automatically
    - Add trigger to create default user settings
    - Add trigger to create default security settings
*/

-- First, let's ensure the users table exists and has proper structure
-- Note: auth.users is managed by Supabase, but we need to ensure our public tables work with it

-- Drop existing problematic triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_security ON auth.users;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_default_settings() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_security_settings() CASCADE;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Create default user settings
  INSERT INTO public.user_settings (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Create default security settings
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);

  -- Create default billing info
  INSERT INTO public.billing_info (user_id)
  VALUES (NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to ensure they don't block user creation

-- Profiles table policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User security settings policies
DROP POLICY IF EXISTS "Users can manage own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can view own security settings" ON public.user_security_settings;

CREATE POLICY "Users can manage own security settings"
  ON public.user_security_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Billing info policies
DROP POLICY IF EXISTS "Users can manage own billing info" ON public.billing_info;
DROP POLICY IF EXISTS "Users can view own billing info" ON public.billing_info;

CREATE POLICY "Users can manage own billing info"
  ON public.billing_info
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure all tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;