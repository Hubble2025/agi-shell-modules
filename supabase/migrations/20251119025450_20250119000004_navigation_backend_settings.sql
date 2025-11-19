/*
  # Navigation Backend Module v1.3.3 - Configuration & Settings Management

  This migration adds a configuration table for server-side settings and runtime behavior control.

  ## New Tables

  1. **navigation_settings**
     - System-wide configuration for navigation backend
     - Feature flags and operational parameters
     - Cache control and performance tuning
     - API rate limits and security settings
     - Runtime behavior customization

  2. **navigation_settings_history**
     - Change tracking for all settings modifications
     - Actor attribution and change reason
     - Full snapshot of settings at each change
*/

-- Create navigation_settings table
CREATE TABLE IF NOT EXISTS navigation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Performance Settings
  cache_ttl INTEGER NOT NULL DEFAULT 300 CHECK (cache_ttl >= 0),
  max_tree_depth INTEGER NOT NULL DEFAULT 10 CHECK (max_tree_depth > 0 AND max_tree_depth <= 50),
  enable_advanced_indexes BOOLEAN NOT NULL DEFAULT false,

  -- Security Settings
  require_authentication BOOLEAN NOT NULL DEFAULT true,
  enable_audit_logging BOOLEAN NOT NULL DEFAULT true,
  max_failed_queries INTEGER NOT NULL DEFAULT 100 CHECK (max_failed_queries > 0),

  -- Feature Flags
  enable_live_updates BOOLEAN NOT NULL DEFAULT true,
  enable_soft_delete BOOLEAN NOT NULL DEFAULT false,
  enable_versioning BOOLEAN NOT NULL DEFAULT false,

  -- API Settings
  api_rate_limit INTEGER NOT NULL DEFAULT 60 CHECK (api_rate_limit > 0),
  max_batch_size INTEGER NOT NULL DEFAULT 100 CHECK (max_batch_size > 0 AND max_batch_size <= 1000),
  enable_public_api BOOLEAN NOT NULL DEFAULT false,

  -- UI Settings
  default_icon TEXT NOT NULL DEFAULT '📄',
  theme JSONB NOT NULL DEFAULT '{"mode": "light", "primaryColor": "#3b82f6"}'::JSONB,
  language TEXT NOT NULL DEFAULT 'en',

  -- Extended Configuration
  custom_config JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,

  -- Ensure only one settings row exists
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::UUID)
);

-- Create navigation_settings_history for change tracking
CREATE TABLE IF NOT EXISTS navigation_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_snapshot JSONB NOT NULL,
  changed_fields TEXT[] NOT NULL,
  actor TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE navigation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_settings_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read settings
CREATE POLICY "Admins can view navigation settings"
  ON navigation_settings
  FOR SELECT
  TO authenticated
  USING (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(
          (auth.jwt()->'app_metadata'->'roles')::jsonb,
          '[]'::jsonb
        )
      )
    )
  );

-- RLS Policy: Admins can update settings
CREATE POLICY "Admins can update navigation settings"
  ON navigation_settings
  FOR UPDATE
  TO authenticated
  USING (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(
          (auth.jwt()->'app_metadata'->'roles')::jsonb,
          '[]'::jsonb
        )
      )
    )
  )
  WITH CHECK (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(
          (auth.jwt()->'app_metadata'->'roles')::jsonb,
          '[]'::jsonb
        )
      )
    )
  );

-- RLS Policy: System can insert initial settings
CREATE POLICY "System can insert navigation settings"
  ON navigation_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(
          (auth.jwt()->'app_metadata'->'roles')::jsonb,
          '[]'::jsonb
        )
      )
    )
    OR NOT EXISTS (SELECT 1 FROM navigation_settings)
  );

-- RLS Policy: Admins can view settings history
CREATE POLICY "Admins can view navigation settings history"
  ON navigation_settings_history
  FOR SELECT
  TO authenticated
  USING (
    'admin' = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(
          (auth.jwt()->'app_metadata'->'roles')::jsonb,
          '[]'::jsonb
        )
      )
    )
  );

-- RLS Policy: System can insert settings history
CREATE POLICY "System can insert navigation settings history"
  ON navigation_settings_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger function for settings updated_at
CREATE OR REPLACE FUNCTION update_navigation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = COALESCE(current_setting('app.current_user', true), auth.uid()::text, 'system');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for settings updated_at
DROP TRIGGER IF EXISTS navigation_settings_updated_at ON navigation_settings;
CREATE TRIGGER navigation_settings_updated_at
  BEFORE UPDATE ON navigation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_settings_updated_at();

-- Trigger function for settings history
CREATE OR REPLACE FUNCTION log_navigation_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[];
BEGIN
  -- Detect which fields changed
  changed_fields := ARRAY(
    SELECT key
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
      AND key NOT IN ('updated_at', 'updated_by')
  );

  -- Only log if there are actual changes
  IF array_length(changed_fields, 1) > 0 THEN
    INSERT INTO navigation_settings_history (
      settings_snapshot,
      changed_fields,
      actor
    ) VALUES (
      to_jsonb(NEW),
      changed_fields,
      COALESCE(current_setting('app.current_user', true), auth.uid()::text, 'system')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for settings history
DROP TRIGGER IF EXISTS navigation_settings_history_trigger ON navigation_settings;
CREATE TRIGGER navigation_settings_history_trigger
  AFTER UPDATE ON navigation_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_navigation_settings_changes();

-- Insert default settings (only if not exists)
INSERT INTO navigation_settings (
  id,
  cache_ttl,
  max_tree_depth,
  enable_advanced_indexes,
  require_authentication,
  enable_audit_logging,
  max_failed_queries,
  enable_live_updates,
  enable_soft_delete,
  enable_versioning,
  api_rate_limit,
  max_batch_size,
  enable_public_api,
  default_icon,
  theme,
  language,
  custom_config
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  300,
  10,
  false,
  true,
  true,
  100,
  true,
  false,
  false,
  60,
  100,
  false,
  '📄',
  '{"mode": "light", "primaryColor": "#3b82f6", "accentColor": "#8b5cf6"}'::JSONB,
  'en',
  '{"maintenance_mode": false, "beta_features": []}'::JSONB
)
ON CONFLICT (id) DO NOTHING;

-- Create index for history queries
CREATE INDEX IF NOT EXISTS idx_navigation_settings_history_created_at
  ON navigation_settings_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_navigation_settings_history_actor
  ON navigation_settings_history(actor);