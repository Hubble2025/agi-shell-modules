/*
  # Navigation Backend v1.3.4 - View Types & Layout Profiles (Part 1)

  1. New Columns on `navigation_items`
    - `view_type` (text, NOT NULL, default 'list')
      - Allowed values: 'list', 'detail', 'form', 'dashboard', 'wizard'
      - Determines how the backend UI should render the route
    - `layout_profile` (text, NOT NULL, default 'backend_default')
      - References a layout profile key in `navigation_settings.layout_profiles`
      - Determines the AppShell layout configuration for this item

  2. Data Migration
    - All existing rows automatically get default values via column defaults
    - Safe for production (non-breaking, additive only)

  3. Backward Compatibility
    - Existing queries continue to work unchanged
    - New columns are optional in responses
    - RLS policies remain unchanged
*/

-- Add view_type column to navigation_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'navigation_items' AND column_name = 'view_type'
  ) THEN
    ALTER TABLE navigation_items
      ADD COLUMN view_type TEXT NOT NULL DEFAULT 'list';

    -- Add check constraint to enforce allowed values
    ALTER TABLE navigation_items
      ADD CONSTRAINT chk_navigation_items_view_type
      CHECK (view_type IN ('list', 'detail', 'form', 'dashboard', 'wizard'));

    COMMENT ON COLUMN navigation_items.view_type IS
      'Determines how the backend UI should render this route. Allowed: list, detail, form, dashboard, wizard';
  END IF;
END $$;

-- Add layout_profile column to navigation_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'navigation_items' AND column_name = 'layout_profile'
  ) THEN
    ALTER TABLE navigation_items
      ADD COLUMN layout_profile TEXT NOT NULL DEFAULT 'backend_default';

    COMMENT ON COLUMN navigation_items.layout_profile IS
      'References a layout profile key in navigation_settings.layout_profiles. Determines AppShell layout configuration.';
  END IF;
END $$;

-- Add index for layout_profile lookups (optional, but recommended for validation queries)
CREATE INDEX IF NOT EXISTS idx_navigation_items_layout_profile
  ON navigation_items(layout_profile)
  WHERE layout_profile IS NOT NULL;
