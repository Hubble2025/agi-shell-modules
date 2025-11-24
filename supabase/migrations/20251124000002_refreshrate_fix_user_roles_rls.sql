/*
  # RefreshRate Core Module - Fix user_roles RLS v3.2.0

  ## Summary
  Adds missing RLS policy to allow users to read their own roles.
  The base schema only included admin/system access; regular users
  need to see their own role assignments for proper authorization checks.

  ## Changes
  - Add policy: users_read_own_roles (SELECT)
    - Allows authenticated users to read their own role records
    - Required for client-side role verification

  ## Security Impact
  - Users can now see their own roles (SELECT only)
  - Cannot modify or see other users' roles
  - Admin/system roles retain full read access
  - service_role retains full access

  ## Important Notes
  1. Uses IF NOT EXISTS for idempotency
  2. Does not affect existing admin/system policies
  3. Complements existing RLS structure
*/

-- Users can read their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_roles'
    AND policyname = 'users_read_own_roles'
  ) THEN
    CREATE POLICY "users_read_own_roles"
      ON user_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
