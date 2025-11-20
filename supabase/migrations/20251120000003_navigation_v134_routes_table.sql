/*
  # Navigation Backend v1.3.4 - Route Registration System (Part 3)

  1. New Table: `navigation_routes`
    - Stores registered backend routes from modules
    - Links routes to menu items, view types, and layout profiles
    - Enables idempotent route registration

  2. Columns
    - `id` (UUID, PK) - Unique identifier
    - `module_id` (TEXT, NOT NULL) - Technical module identifier
    - `route` (TEXT, NOT NULL) - Backend route path (must start with /admin/)
    - `menu_id` (UUID, FK nullable) - Associated navigation menu item
    - `view_type` (TEXT, NOT NULL, default 'list') - View rendering type
    - `layout_profile` (TEXT, NOT NULL, default 'backend_default') - Layout configuration
    - `created_at` (TIMESTAMPTZ) - Registration timestamp

  3. Constraints & Indexes
    - Unique index on (module_id, route) for idempotency
    - Foreign key to navigation_items (optional, can be NULL)
    - Check constraint on route (must start with /admin/)
    - Check constraint on view_type (enum values)

  4. Security
    - RLS enabled
    - Admin-only write access
    - Read access for authenticated users
*/

-- Create navigation_routes table
CREATE TABLE IF NOT EXISTS navigation_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  route TEXT NOT NULL,
  menu_id UUID REFERENCES navigation_items(id) ON DELETE SET NULL,
  view_type TEXT NOT NULL DEFAULT 'list',
  layout_profile TEXT NOT NULL DEFAULT 'backend_default',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure route starts with /admin/
  CONSTRAINT chk_navigation_routes_route_prefix
    CHECK (route LIKE '/admin/%'),

  -- Ensure view_type is valid
  CONSTRAINT chk_navigation_routes_view_type
    CHECK (view_type IN ('list', 'detail', 'form', 'dashboard', 'wizard'))
);

-- Add comment to table
COMMENT ON TABLE navigation_routes IS
  'Stores registered backend routes from modules with associated menu items, view types, and layout profiles';

-- Add comments to columns
COMMENT ON COLUMN navigation_routes.module_id IS 'Technical identifier of the module (e.g., navigation-backend, agi-shell-core)';
COMMENT ON COLUMN navigation_routes.route IS 'Fully qualified backend URL path (must start with /admin/)';
COMMENT ON COLUMN navigation_routes.menu_id IS 'Optional reference to navigation_items. NULL for routes without sidebar entry';
COMMENT ON COLUMN navigation_routes.view_type IS 'Determines how the backend UI should render this route';
COMMENT ON COLUMN navigation_routes.layout_profile IS 'References a layout profile key in navigation_settings.layout_profiles';

-- Create unique index for idempotency (module + route combination must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_navigation_routes_module_route
  ON navigation_routes(module_id, route);

-- Create index for menu_id lookups
CREATE INDEX IF NOT EXISTS idx_navigation_routes_menu_id
  ON navigation_routes(menu_id)
  WHERE menu_id IS NOT NULL;

-- Create index for module_id lookups
CREATE INDEX IF NOT EXISTS idx_navigation_routes_module_id
  ON navigation_routes(module_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_navigation_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_navigation_routes_updated_at ON navigation_routes;
CREATE TRIGGER trigger_navigation_routes_updated_at
  BEFORE UPDATE ON navigation_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_routes_updated_at();

-- Enable RLS
ALTER TABLE navigation_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read all routes
CREATE POLICY "Allow authenticated users to read routes"
  ON navigation_routes
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow admins to insert routes
CREATE POLICY "Allow admins to insert routes"
  ON navigation_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policy: Allow admins to update routes
CREATE POLICY "Allow admins to update routes"
  ON navigation_routes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policy: Allow admins to delete routes
CREATE POLICY "Allow admins to delete routes"
  ON navigation_routes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );
