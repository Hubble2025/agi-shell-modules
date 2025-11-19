/*
  # Tenant-Isolation & Feature-Flags-System

  1. Changes to navigation_items
    - Add tenant_id column for multi-tenant isolation
    - Add required_feature_flags column for feature gating
    - Add indexes for performance optimization
    
  2. New Table: feature_flags
    - flag_key: Unique identifier (e.g., "beta.navigation.newTree")
    - display_name: Human-readable name
    - description: Flag purpose documentation
    - is_active: Activation state
    - scope: 'global' or 'tenant'
    - tenant_id: Optional tenant reference for tenant-scoped flags
    
  3. Security
    - Enable RLS on navigation_items for tenant isolation
    - Policy uses auth.jwt() -> app_metadata -> tenant_id
    - Admin/Dev-only access for feature_flags management
    
  4. Indexes
    - Composite indexes for tenant + parent_id queries
    - Feature flags indexed by tenant_id and flag_key
    - Global flags optimized with partial index
*/

-- Add tenant_id to navigation_items
ALTER TABLE navigation_items
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add feature flags support to navigation_items
ALTER TABLE navigation_items
  ADD COLUMN IF NOT EXISTS required_feature_flags JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant 
  ON navigation_items(tenant_id);

CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant_parent 
  ON navigation_items(tenant_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant_active 
  ON navigation_items(tenant_id, is_active);

-- Enable RLS for tenant isolation
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for clean slate)
DROP POLICY IF EXISTS "Tenant navigation access" ON navigation_items;

-- Create RLS policy for tenant isolation
CREATE POLICY "Tenant navigation access"
  ON navigation_items FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL CHECK (flag_key ~ '^[a-z]+\.[a-z]+\.[a-zA-Z]+$'),
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'tenant')),
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for feature_flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant 
  ON feature_flags(tenant_id, flag_key);

CREATE INDEX IF NOT EXISTS idx_feature_flags_global 
  ON feature_flags(flag_key) WHERE scope = 'global';

CREATE INDEX IF NOT EXISTS idx_feature_flags_active 
  ON feature_flags(is_active) WHERE is_active = true;

-- Enable RLS on feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins manage feature flags" ON feature_flags;

-- Create helper function to check if user has admin/dev role
CREATE OR REPLACE FUNCTION has_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  user_roles := COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'roles')),
    ARRAY[]::TEXT[]
  );
  RETURN 'admin' = ANY(user_roles) OR 'dev' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin/Dev-only policy for feature_flags
CREATE POLICY "Admins manage feature flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (has_admin_role())
  WITH CHECK (has_admin_role());

-- Insert some example feature flags for testing
INSERT INTO feature_flags (flag_key, display_name, description, is_active, scope)
VALUES 
  ('beta.navigation.newTree', 'New Tree Navigation', 'Enable the new tree-based navigation UI', false, 'global'),
  ('beta.navigation.dragDrop', 'Drag & Drop', 'Enable drag and drop for navigation items', false, 'global'),
  ('experimental.navigation.ai', 'AI Navigation Assistant', 'Enable AI-powered navigation suggestions', false, 'global')
ON CONFLICT (flag_key) DO NOTHING;