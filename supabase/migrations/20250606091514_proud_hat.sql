/*
  # Add 2FA Secret Column to User Security Settings

  1. Changes
    - Add `two_factor_secret` column to store encrypted TOTP secrets
    - This column will store the base32 secret used for TOTP generation
    - In production, this should be encrypted before storage

  2. Security
    - Column is nullable to support users without 2FA
    - Should be encrypted in production environment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_security_settings' AND column_name = 'two_factor_secret'
  ) THEN
    ALTER TABLE user_security_settings ADD COLUMN two_factor_secret text;
  END IF;
END $$;