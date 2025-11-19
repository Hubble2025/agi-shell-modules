/*
  # Default Navigation Groups & Hierarchical Structure

  1. Purpose
    - Creates default navigation groups for common use cases
    - Establishes logical grouping: Dashboard, Communication, Content & Modules, 
      Access & Security, Settings, Tools
    - Provides example nested items under each group
    
  2. Group Structure
    - Each group is marked with is_active = true
    - Groups have no path (path is empty string for groups)
    - Groups are ordered by sort_order (100, 200, 300, etc.)
    - Child items reference parent_id and have higher sort_order values
    
  3. Icon System
    - Uses Lucide React icon names (PascalCase)
    - Examples: LayoutDashboard, MessageCircle, Boxes, Shield, Settings, Wrench
    - Home icon for primary dashboard link
    
  4. Notes
    - This migration is idempotent (uses INSERT ... ON CONFLICT DO NOTHING)
    - Groups are created without tenant_id (can be updated later for multi-tenant)
    - All items are active by default
*/

-- Insert navigation groups (parent items)
INSERT INTO navigation_items (title, path, icon, sort_order, is_active, roles, parent_id)
VALUES
  ('Dashboard', '/groups/dashboard', 'LayoutDashboard', 100, true, ARRAY['authenticated'], NULL),
  ('Communication', '/groups/communication', 'MessageCircle', 200, true, ARRAY['authenticated'], NULL),
  ('Content & Modules', '/groups/content', 'Boxes', 300, true, ARRAY['authenticated'], NULL),
  ('Access & Security', '/groups/security', 'Shield', 400, true, ARRAY['authenticated'], NULL),
  ('Settings', '/groups/settings', 'Settings', 500, true, ARRAY['authenticated'], NULL),
  ('Tools', '/groups/tools', 'Wrench', 600, true, ARRAY['authenticated'], NULL)
ON CONFLICT (path) DO NOTHING;

-- Insert nested items under Dashboard group
INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Home', '/admin/home', 'Home', id, 101, true, ARRAY['authenticated']
FROM navigation_items 
WHERE title = 'Dashboard' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

-- Insert nested items under Communication group
INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Messages', '/admin/messages', 'Mail', id, 201, true, ARRAY['authenticated']
FROM navigation_items 
WHERE title = 'Communication' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Notifications', '/admin/notifications', 'Bell', id, 202, true, ARRAY['authenticated']
FROM navigation_items 
WHERE title = 'Communication' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

-- Insert nested items under Content & Modules group
INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Pages', '/admin/pages', 'FileText', id, 301, true, ARRAY['authenticated']
FROM navigation_items 
WHERE title = 'Content & Modules' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Media Library', '/admin/media', 'Image', id, 302, true, ARRAY['authenticated']
FROM navigation_items 
WHERE title = 'Content & Modules' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Modules', '/admin/modules', 'Package', id, 303, true, ARRAY['authenticated']
FROM navigation_items 
WHERE title = 'Content & Modules' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

-- Insert nested items under Access & Security group
INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Users', '/admin/users', 'Users', id, 401, true, ARRAY['admin']
FROM navigation_items 
WHERE title = 'Access & Security' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Roles & Permissions', '/admin/roles', 'ShieldCheck', id, 402, true, ARRAY['admin']
FROM navigation_items 
WHERE title = 'Access & Security' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Security Logs', '/admin/security-logs', 'FileWarning', id, 403, true, ARRAY['admin']
FROM navigation_items 
WHERE title = 'Access & Security' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

-- Insert nested items under Settings group
INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'General', '/admin/settings/general', 'Sliders', id, 501, true, ARRAY['admin']
FROM navigation_items 
WHERE title = 'Settings' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Navigation', '/admin/settings/navigation', 'Menu', id, 502, true, ARRAY['admin', 'dev']
FROM navigation_items 
WHERE title = 'Settings' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Appearance', '/admin/settings/appearance', 'Palette', id, 503, true, ARRAY['admin']
FROM navigation_items 
WHERE title = 'Settings' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

-- Insert nested items under Tools group
INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'Database', '/admin/tools/database', 'Database', id, 601, true, ARRAY['dev']
FROM navigation_items 
WHERE title = 'Tools' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'API Playground', '/admin/tools/api', 'Code', id, 602, true, ARRAY['dev']
FROM navigation_items 
WHERE title = 'Tools' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;

INSERT INTO navigation_items (title, path, icon, parent_id, sort_order, is_active, roles)
SELECT 'System Health', '/admin/tools/health', 'Activity', id, 603, true, ARRAY['admin', 'dev']
FROM navigation_items 
WHERE title = 'Tools' AND parent_id IS NULL 
LIMIT 1
ON CONFLICT (path) DO NOTHING;