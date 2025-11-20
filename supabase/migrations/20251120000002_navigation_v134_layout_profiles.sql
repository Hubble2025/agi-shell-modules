/*
  # Navigation Backend v1.3.4 - Layout Profiles System (Part 2)

  1. New Column on `navigation_settings`
    - `layout_profiles` (JSONB)
      - Stores global layout profile configurations
      - Each profile defines AppShell zones and options
      - Keyed by profile ID (e.g., 'backend_default', 'compact', 'wide_toolbar')

  2. Default Layout Profile
    - Creates 'backend_default' profile if none exists
    - Provides standard backend layout configuration

  3. Layout Profile JSON Schema
    ```json
    {
      "profile_id": {
        "label": "Human Readable Name",
        "zones": {
          "header": { "visible": true },
          "sidebar": { "visible": true, "width": 260 },
          "toolbar": { "visible": true },
          "footer": { "visible": false }
        },
        "options": {
          "content_padding": "lg",
          "max_content_width": "full",
          "scroll_behavior": "main_only"
        }
      }
    }
    ```

  4. History Tracking
    - Changes to layout_profiles are tracked in navigation_settings_history
    - Existing trigger handles automatic logging
*/

-- Add layout_profiles column to navigation_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'navigation_settings' AND column_name = 'layout_profiles'
  ) THEN
    ALTER TABLE navigation_settings
      ADD COLUMN layout_profiles JSONB;

    COMMENT ON COLUMN navigation_settings.layout_profiles IS
      'Global layout profile configurations for backend AppShell. Keyed by profile ID.';
  END IF;
END $$;

-- Initialize default layout profile if layout_profiles is NULL or empty
DO $$
DECLARE
  settings_exists BOOLEAN;
  profiles_empty BOOLEAN;
BEGIN
  -- Check if navigation_settings table has any rows
  SELECT EXISTS(SELECT 1 FROM navigation_settings LIMIT 1) INTO settings_exists;

  -- If no settings row exists, create one with default layout profile
  IF NOT settings_exists THEN
    INSERT INTO navigation_settings (
      layout_profiles,
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
      custom_config,
      sidebar_width,
      typography
    )
    VALUES (
      '{"backend_default": {"label": "Backend Default Layout", "zones": {"header": {"visible": true}, "sidebar": {"visible": true, "width": 260}, "toolbar": {"visible": true}, "footer": {"visible": false}}, "options": {"content_padding": "lg", "max_content_width": "full", "scroll_behavior": "main_only"}}}'::JSONB,
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
      '{}'::JSONB,
      'en',
      '{}'::JSONB,
      260,
      '{"h1": {"size": "2xl", "weight": 700, "color": "#1a1a1a"}, "h2": {"size": "xl", "weight": 600, "color": "#2a2a2a"}, "h3": {"size": "lg", "weight": 600, "color": "#3a3a3a"}, "h4": {"size": "md", "weight": 500, "color": "#4a4a4a"}, "h5": {"size": "sm", "weight": 500, "color": "#5a5a5a"}, "h6": {"size": "xs", "weight": 500, "color": "#6a6a6a"}}'::JSONB
    );
  ELSE
    -- If settings exist, check if layout_profiles is NULL or empty
    SELECT layout_profiles IS NULL OR layout_profiles = '{}'::JSONB
    INTO profiles_empty
    FROM navigation_settings
    LIMIT 1;

    -- If layout_profiles is empty, add default profile
    IF profiles_empty THEN
      UPDATE navigation_settings
      SET layout_profiles = '{"backend_default": {"label": "Backend Default Layout", "zones": {"header": {"visible": true}, "sidebar": {"visible": true, "width": 260}, "toolbar": {"visible": true}, "footer": {"visible": false}}, "options": {"content_padding": "lg", "max_content_width": "full", "scroll_behavior": "main_only"}}}'::JSONB,
          updated_at = now()
      WHERE layout_profiles IS NULL OR layout_profiles = '{}'::JSONB;
    END IF;
  END IF;
END $$;
