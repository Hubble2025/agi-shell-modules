/*
  # Icon-System for Navigation Items

  1. Changes to navigation_items
    - Add icon column for Lucide React icons or emojis
    
  2. Icon Types Supported
    - Lucide Icons: PascalCase names (e.g., "Home", "Settings", "LayoutDashboard")
    - Emoji: Unicode emoji characters (e.g., "🏠", "⚙️", "📊")
    - Null: No icon (allowed)
    
  3. Validation
    - Lucide names must match PascalCase pattern: ^[A-Z][a-zA-Z0-9]+$
    - Emoji support through length check (simplified)
    - NULL is allowed for items without icons
    
  4. Notes
    - Custom SVG upload deferred to v2+
    - Lucide React already in project dependencies
    - Icon field is optional to maintain backward compatibility
*/

-- Add icon column to navigation_items
ALTER TABLE navigation_items
  ADD COLUMN IF NOT EXISTS icon TEXT CHECK (
    icon IS NULL 
    OR icon ~ '^[A-Z][a-zA-Z0-9]+$'  -- Lucide PascalCase names
    OR LENGTH(icon) <= 4  -- Emoji support (simplified check)
  );

-- Create index for icon queries (optional but useful)
CREATE INDEX IF NOT EXISTS idx_navigation_items_icon 
  ON navigation_items(icon) WHERE icon IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN navigation_items.icon IS 'Icon identifier: Lucide React component name (PascalCase) or emoji character. NULL if no icon.';