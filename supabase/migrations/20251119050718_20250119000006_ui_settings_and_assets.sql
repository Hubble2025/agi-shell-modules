/*
  # UI-Settings & Asset-Management

  1. New Columns for navigation_settings
    - logo_url: Public URL for uploaded logo
    - logo_storage_path: Storage path in Supabase Storage
    - header_banner_text: Plain text banner (max 200 chars, v1)
    - header_banner_widget_id: Placeholder for v2+ widget integration
    - sidebar_width: Configurable sidebar width (200-400px)
    - typography: JSONB with H1-H6 settings
    - applied_template_id: Reference to active backend template
    - template_applied_at: Timestamp of template application
    - backup_snapshot: JSONB snapshot for template restore
    
  2. Typography Structure
    - Each heading (H1-H6) has: size, weight, color
    - Colors use CSS variables for theme compatibility
    
  3. New Table: user_preferences
    - User-specific preferences (theme, sidebar state)
    - Separated from auth.users for better permission control
    
  4. Constraints
    - Banner text limited to 200 characters (v1 plain text)
    - Sidebar width constrained between 200-400px
    - Theme must be one of predefined values
*/

-- Extend navigation_settings table
ALTER TABLE navigation_settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS header_banner_text TEXT CHECK (LENGTH(header_banner_text) <= 200),
  ADD COLUMN IF NOT EXISTS header_banner_widget_id UUID,
  ADD COLUMN IF NOT EXISTS sidebar_width INTEGER DEFAULT 280 
    CHECK (sidebar_width BETWEEN 200 AND 400),
  ADD COLUMN IF NOT EXISTS typography JSONB DEFAULT '{
    "h1": {"size": "2rem", "weight": 700, "color": "var(--color-text-primary)"},
    "h2": {"size": "1.5rem", "weight": 600, "color": "var(--color-text-primary)"},
    "h3": {"size": "1.25rem", "weight": 600, "color": "var(--color-text-secondary)"},
    "h4": {"size": "1.125rem", "weight": 500, "color": "var(--color-text-secondary)"},
    "h5": {"size": "1rem", "weight": 500, "color": "var(--color-text-tertiary)"},
    "h6": {"size": "0.875rem", "weight": 500, "color": "var(--color-text-tertiary)"}
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS applied_template_id UUID,
  ADD COLUMN IF NOT EXISTS template_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS backup_snapshot JSONB;

-- Create user_preferences table for user-specific settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_theme TEXT DEFAULT 'light' CHECK (preferred_theme IN ('light', 'dark', 'auto')),
  sidebar_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own preferences
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());