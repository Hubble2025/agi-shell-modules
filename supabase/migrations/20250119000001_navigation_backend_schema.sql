/*
  # Navigation Backend Module v1.3.0 - Schema Definition

  1. New Tables
    - `navigation_items`
      - `id` (uuid, primary key)
      - `parent_id` (uuid, nullable, self-reference for tree structure)
      - `title` (text, navigation item title)
      - `path` (text, URL path)
      - `icon` (text, optional icon identifier)
      - `sort_order` (integer, display order)
      - `is_active` (boolean, visibility toggle)
      - `roles` (text[], role-based access control)
      - `metadata` (jsonb, flexible additional data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `navigation_logs`
      - `id` (uuid, primary key)
      - `navigation_id` (uuid, reference to navigation_items)
      - `action` (text, type of change: create, update, delete)
      - `actor` (text, user/system identifier)
      - `changes` (jsonb, change payload)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Restrictive policies for authenticated users
    - Role-based access control via `roles` column
    - Audit trail via `navigation_logs`

  3. Constraints
    - Foreign key: parent_id references navigation_items(id)
    - Unique constraint on path
    - Check constraint: sort_order >= 0
    - Default values for all appropriate columns
*/

-- Create navigation_items table
CREATE TABLE IF NOT EXISTS navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  roles TEXT[] NOT NULL DEFAULT ARRAY['authenticated']::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create navigation_logs table
CREATE TABLE IF NOT EXISTS navigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navigation_id UUID REFERENCES navigation_items(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  actor TEXT NOT NULL,
  changes JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for navigation_items

-- SELECT: Authenticated users can view items matching their roles
CREATE POLICY "Users can view navigation items matching their roles"
  ON navigation_items
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      'authenticated' = ANY(roles)
      OR EXISTS (
        SELECT 1 FROM unnest(roles) AS role
        WHERE role IN (
          SELECT jsonb_array_elements_text(
            COALESCE(auth.jwt()->>'user_metadata', '{}')::jsonb->'roles'
          )
        )
      )
    )
  );

-- INSERT: Only admins can create navigation items
CREATE POLICY "Admins can create navigation items"
  ON navigation_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(auth.jwt()->>'user_metadata', '{}')::jsonb->'roles'
      )
    )
  );

-- UPDATE: Only admins can update navigation items
CREATE POLICY "Admins can update navigation items"
  ON navigation_items
  FOR UPDATE
  TO authenticated
  USING (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(auth.jwt()->>'user_metadata', '{}')::jsonb->'roles'
      )
    )
  )
  WITH CHECK (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(auth.jwt()->>'user_metadata', '{}')::jsonb->'roles'
      )
    )
  );

-- DELETE: Only admins can delete navigation items
CREATE POLICY "Admins can delete navigation items"
  ON navigation_items
  FOR DELETE
  TO authenticated
  USING (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(auth.jwt()->>'user_metadata', '{}')::jsonb->'roles'
      )
    )
  );

-- RLS Policies for navigation_logs

-- SELECT: Only admins can view logs
CREATE POLICY "Admins can view navigation logs"
  ON navigation_logs
  FOR SELECT
  TO authenticated
  USING (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(auth.jwt()->>'user_metadata', '{}')::jsonb->'roles'
      )
    )
  );

-- INSERT: System can create log entries (via trigger)
CREATE POLICY "System can create navigation logs"
  ON navigation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_navigation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS navigation_items_updated_at ON navigation_items;
CREATE TRIGGER navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_items_updated_at();

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION log_navigation_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO navigation_logs (navigation_id, action, actor, changes)
    VALUES (OLD.id, 'delete', COALESCE(current_setting('app.current_user', true), auth.uid()::text, 'system'), to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO navigation_logs (navigation_id, action, actor, changes)
    VALUES (NEW.id, 'update', COALESCE(current_setting('app.current_user', true), auth.uid()::text, 'system'), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO navigation_logs (navigation_id, action, actor, changes)
    VALUES (NEW.id, 'create', COALESCE(current_setting('app.current_user', true), auth.uid()::text, 'system'), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for audit logging
DROP TRIGGER IF EXISTS navigation_items_audit ON navigation_items;
CREATE TRIGGER navigation_items_audit
  AFTER INSERT OR UPDATE OR DELETE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION log_navigation_changes();
