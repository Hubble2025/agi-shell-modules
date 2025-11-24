-- ================================================
-- CRITICAL FIX: Enable RLS on user_roles table
-- ================================================
-- Bug: user_roles table was created without RLS enabled
-- Impact: Table is accessible without restrictions
-- Fix: Enable RLS and add policies

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for Edge Functions)
CREATE POLICY "service_role_all_user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin users can read all roles
CREATE POLICY "admin_read_user_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'system')
    )
  );

-- Users can read their own roles
CREATE POLICY "users_read_own_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
