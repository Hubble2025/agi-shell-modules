# Navigation Backend Module v1.3.4

Enterprise-grade navigation management system with hierarchical structure, role-based access control, comprehensive audit logging, view types, layout profiles, and route registration.

## Overview

The Navigation Backend Module provides a complete **standalone** solution for managing hierarchical navigation structures in AGI Shell CMS, Boltnew, Semantic OS, and AION environments.

**v1.3.4** is a complete standalone module containing:
- All database migrations (11 files)
- All React components (4 files)
- Business logic services (NavigationService, ValidationService, RouteRegistrationService)
- TypeScript type definitions
- Supabase client configuration
- View types and layout profiles framework
- Declarative route registration system

The module can be installed as a complete package without external dependencies on the host project structure.

## Features

### Core Functionality
- **Hierarchical Navigation Trees** - Unlimited depth parent-child relationships
- **Role-Based Access Control (RBAC)** - Fine-grained visibility control per navigation item
- **Comprehensive Audit Logging** - Track all changes with actor attribution
- **Flexible Metadata** - JSONB storage for custom properties
- **Active State Management** - Easy enable/disable of navigation items
- **Icon Support** - Built-in icon identifier storage

### v1.3.4 New Features

#### View Types
- **Backend UI Rendering Classification** - Each navigation item has a `view_type` field
- **Allowed Values**: `list`, `detail`, `form`, `dashboard`, `wizard`
- **Default**: `list`
- **Validation**: Enforced on create/update operations
- **RBAC**: Admin-only write access

#### Layout Profiles
- **Backend AppShell Layout Framework** - Global layout profile configurations
- **Storage**: `navigation_settings.layout_profiles` (JSONB)
- **Profile Structure**:
  - `label`: Human-readable name
  - `zones`: Header, sidebar, toolbar, footer visibility and configuration
  - `options`: Content padding, max width, scroll behavior
- **Default Profile**: `backend_default` automatically created
- **Per-Item Assignment**: Each navigation item references a layout profile
- **Comprehensive Validation**: Structure and enum values validated

#### Route Registration
- **Declarative Route Management** - Modules can register their backend routes
- **Idempotent**: Upsert behavior via unique (module_id, route) index
- **Route Metadata**: Links to menu items, view types, and layout profiles
- **Route Constraints**: Must start with `/admin/` prefix
- **API Endpoint**: `POST /api/navigation/routes/register`
- **Security**: Admin-only write, authenticated read

### Performance

#### Standard Tier (v1.3.1 - Always Enabled)
- **Optimized Indexes** for large navigation trees (1000+ items)
- **60-90% faster queries** on large datasets
- **Role-based filtering optimization** via GIN indexes
- **Time-based audit queries** optimized for admin dashboards

#### Advanced DB Tier (v1.3.2 - Optional)
- **Composite indexes** for combined parent+sort queries (40-60% faster)
- **Partial indexes** for active-only items (30-50% storage savings)
- **Path lookup optimization** for router matching (85% faster)
- **Flag-based activation** via environment variable
- **Auto-detection recommendation** at 500+ items

### Security
- **Row Level Security (RLS)** enabled on all tables
- **Restrictive-by-default** policies
- **Admin-only modifications** (INSERT, UPDATE, DELETE)
- **Role-based visibility** for navigation items
- **Secure audit trail** with admin-only access

## Installation

### Prerequisites
- Supabase >= 2.0.0
- PostgreSQL >= 14.0.0
- React >= 18.0.0
- lucide-react >= 0.300.0
- AGI Shell CMS >= 1.9.0 (or compatible environment)

### Module Structure

The module is completely self-contained:

```
navigation-backend/
├── package.json                 # Module package definition
├── manifest.json                # Module manifest
├── install.module.json          # Installation instructions
├── README.md                    # This file
├── CHANGELOG.md                 # Version history
├── src/
│   ├── components/             # 4 React components
│   │   ├── index.ts           # Component exports
│   │   ├── NavigationLiveView.tsx
│   │   ├── NavigationSettingsPanel.tsx
│   │   ├── NavigationItemForm.tsx
│   │   └── NavigationIcon.tsx
│   ├── services/
│   │   └── NavigationService.ts  # Business logic
│   ├── types/
│   │   └── navigation.ts         # TypeScript types
│   └── lib/
│       └── supabase.ts          # Supabase client
└── supabase/
    └── migrations/              # 8 database migrations
        ├── 20250119000001_navigation_backend_schema.sql
        ├── 20250119000002_navigation_backend_indexes.sql
        ├── 20250119000003_navigation_backend_advanced_indexes.sql
        ├── 20250119000004_navigation_backend_settings.sql
        ├── 20251119050637_20250119000005_tenant_id_and_feature_flags.sql
        ├── 20251119050718_20250119000006_ui_settings_and_assets.sql
        ├── 20251119050739_20250119000007_icon_system.sql
        └── 20251119050905_20250119000008_default_groups_and_structure.sql
```

### Quick Install

#### Option A: Via Module System (Recommended)

```bash
# Install complete module
npm run install:module navigation-backend
```

This will:
1. Apply all 8 database migrations
2. Copy all components to your src/components directory
3. Copy services to your src/services directory
4. Copy types to your src/types directory
5. Copy lib/supabase.ts configuration

#### Option B: Manual Installation

```bash
# 1. Apply all migrations in order
psql $DATABASE_URL -f supabase/migrations/20250119000001_navigation_backend_schema.sql
psql $DATABASE_URL -f supabase/migrations/20250119000002_navigation_backend_indexes.sql
psql $DATABASE_URL -f supabase/migrations/20250119000003_navigation_backend_advanced_indexes.sql
psql $DATABASE_URL -f supabase/migrations/20250119000004_navigation_backend_settings.sql
psql $DATABASE_URL -f supabase/migrations/20251119050637_20250119000005_tenant_id_and_feature_flags.sql
psql $DATABASE_URL -f supabase/migrations/20251119050718_20250119000006_ui_settings_and_assets.sql
psql $DATABASE_URL -f supabase/migrations/20251119050739_20250119000007_icon_system.sql
psql $DATABASE_URL -f supabase/migrations/20251119050905_20250119000008_default_groups_and_structure.sql

# 2. Copy source files to your project
cp -r src/components/* your-project/src/components/
cp -r src/services/* your-project/src/services/
cp -r src/types/* your-project/src/types/
cp src/lib/supabase.ts your-project/src/lib/
```

#### Option C: NPM Package (if published)

```bash
npm install @agi-shell/navigation-backend
```

Then import components:

```typescript
import { NavigationLiveView, NavigationSettingsPanel } from '@agi-shell/navigation-backend/components';
import { NavigationService } from '@agi-shell/navigation-backend';
```

#### Advanced DB Tier Installation (Tier 2 - Optional)

**Recommended for installations with 500+ navigation items**

```bash
# Option A: Enable via environment variable during installation
NAV_BACKEND_ENABLE_ADVANCED_INDEXES=true npm run install:module navigation-backend

# Option B: Enable after initial installation
psql $DATABASE_URL -f supabase/migrations/20250119000003_navigation_backend_advanced_indexes.sql

# Option C: Set environment variable for auto-activation
export NAV_BACKEND_ENABLE_ADVANCED_INDEXES=true
```

## Database Schema

### Important: User Roles Configuration

This module uses Row Level Security (RLS) with role-based access control. User roles **must** be stored in Supabase's `auth.users.raw_app_meta_data` column.

**Example role configuration:**

```sql
-- Set admin role for a user
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{roles}',
  '["admin"]'::jsonb
)
WHERE id = 'user-uuid-here';

-- Set multiple roles
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{roles}',
  '["admin", "editor"]'::jsonb
)
WHERE id = 'user-uuid-here';
```

**Testing RLS policies:**

```sql
-- Test as specific user (run in psql with superuser)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid", "app_metadata": {"roles": ["admin"]}}';

-- Now test queries
SELECT * FROM navigation_items;
INSERT INTO navigation_items (title, path) VALUES ('Test', '/test');
```

### navigation_items

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| parent_id | UUID | Parent item reference (nullable) |
| title | TEXT | Display title |
| path | TEXT | URL path (unique) |
| icon | TEXT | Icon identifier |
| sort_order | INTEGER | Display order (>= 0) |
| is_active | BOOLEAN | Visibility toggle |
| roles | TEXT[] | Role-based access control |
| metadata | JSONB | Custom properties |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### navigation_logs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| navigation_id | UUID | Reference to navigation_items |
| action | TEXT | Change type (create, update, delete) |
| actor | TEXT | User/system identifier |
| changes | JSONB | Change payload |
| created_at | TIMESTAMPTZ | Log timestamp |

## Backend Configuration (v1.3.3)

The Navigation Backend includes a comprehensive settings system for server-side configuration and runtime behavior control.

### Settings Categories

#### Performance Settings
- `cache_ttl` (300s default) - Cache duration for navigation items
- `max_tree_depth` (10 default) - Maximum hierarchy depth (1-50)
- `enable_advanced_indexes` (false default) - Toggle Advanced DB Tier

#### Security Settings
- `require_authentication` (true default) - Force authentication for all navigation
- `enable_audit_logging` (true default) - Track all changes in navigation_logs
- `max_failed_queries` (100 default) - Rate limit threshold for failed queries

#### Feature Flags
- `enable_live_updates` (true default) - Real-time subscriptions via Supabase
- `enable_soft_delete` (false default) - Mark as deleted instead of hard delete
- `enable_versioning` (false default) - Track navigation versions

#### API Settings
- `api_rate_limit` (60 req/min default) - API request rate limit
- `max_batch_size` (100 default) - Maximum bulk operations size (1-1000)
- `enable_public_api` (false default) - Allow unauthenticated API access

#### UI Settings
- `default_icon` ('📄' default) - Fallback icon for navigation items
- `theme` (JSONB) - UI theme configuration (mode, colors)
- `language` ('en' default) - Default language for UI

### Managing Settings

Settings are stored in the `navigation_settings` table with a singleton pattern (only one row allowed).

```sql
-- View current settings
SELECT * FROM navigation_settings;

-- Update settings (admin only)
UPDATE navigation_settings
SET cache_ttl = 600,
    enable_live_updates = true,
    api_rate_limit = 120
WHERE id = '00000000-0000-0000-0000-000000000001';

-- View settings history
SELECT * FROM navigation_settings_history
ORDER BY created_at DESC
LIMIT 10;
```

### Settings UI

Access the settings management panel via the Live View interface:
1. Navigate to Navigation Backend Live View
2. Click the "Settings" tab
3. Modify settings in organized categories
4. Click "Save Changes" to apply

All changes are:
- Validated for constraints
- Tracked in settings_history
- Attributed to the acting user
- Applied immediately without restart

## Performance Indexes

### Standard Tier (v1.3.1 - Always Enabled)

| Index | Purpose | Use Case |
|-------|---------|----------|
| idx_navigation_items_parent_id | Parent/Child queries | Tree building, breadcrumbs |
| idx_navigation_items_sort_order | Ordering operations | Menu rendering |
| idx_navigation_items_roles | Role-based filtering | RBAC queries |
| idx_navigation_logs_actor | User activity tracking | Audit reports |
| idx_navigation_logs_created_at | Time-based analysis | Recent changes dashboard |

### Advanced DB Tier (v1.3.2 - Optional)

| Index | Type | Purpose | Performance Gain |
|-------|------|---------|------------------|
| idx_navigation_items_parent_sort | Composite | Combined parent+sort queries | 40-60% faster |
| idx_navigation_items_active | Partial | Active items only | 30-50% storage savings |
| idx_navigation_items_path | B-Tree | Path lookup/router matching | 85% faster |

**Activation:** Set `NAV_BACKEND_ENABLE_ADVANCED_INDEXES=true`
**Recommended:** For installations with 500+ navigation items
**Storage Overhead:** ~2-3% additional

## Usage Examples

### Query Navigation Tree

```sql
-- Get all root items (no parent)
SELECT * FROM navigation_items
WHERE parent_id IS NULL
ORDER BY sort_order;

-- Get children of specific item
SELECT * FROM navigation_items
WHERE parent_id = 'parent-uuid-here'
ORDER BY sort_order;

-- Recursive tree query
WITH RECURSIVE nav_tree AS (
  SELECT * FROM navigation_items WHERE parent_id IS NULL
  UNION ALL
  SELECT n.* FROM navigation_items n
  JOIN nav_tree t ON n.parent_id = t.id
)
SELECT * FROM nav_tree ORDER BY sort_order;
```

### Role-Based Filtering

```sql
-- Get navigation items for admin role
SELECT * FROM navigation_items
WHERE roles @> ARRAY['admin']::TEXT[]
ORDER BY sort_order;

-- Get items accessible by specific role
SELECT * FROM navigation_items
WHERE 'editor' = ANY(roles)
ORDER BY sort_order;
```

### Audit Trail Queries

```sql
-- Get recent changes (last 100)
SELECT * FROM navigation_logs
ORDER BY created_at DESC
LIMIT 100;

-- Get changes by specific user
SELECT * FROM navigation_logs
WHERE actor = 'user-id-here'
ORDER BY created_at DESC;

-- Get changes for specific navigation item
SELECT * FROM navigation_logs
WHERE navigation_id = 'nav-item-uuid'
ORDER BY created_at DESC;
```

## Upgrading

### From v1.3.0 to v1.3.1

```bash
# Apply index optimization migration
psql $DATABASE_URL -f supabase/migrations/20250119000002_navigation_backend_indexes.sql
```

**Note:** This is a non-breaking change. All existing functionality remains intact.

### From v1.3.1 to v1.3.2 (Optional Advanced DB Tier)

```bash
# Option A: Apply advanced indexes manually
psql $DATABASE_URL -f supabase/migrations/20250119000003_navigation_backend_advanced_indexes.sql

# Option B: Enable via environment variable and re-run installer
export NAV_BACKEND_ENABLE_ADVANCED_INDEXES=true
npm run install:module navigation-backend
```

**Note:** Advanced indexes are optional and recommended for installations with 500+ navigation items.

### Rollback Advanced Indexes

If you need to remove the advanced indexes:

```sql
DROP INDEX IF EXISTS idx_navigation_items_parent_sort;
DROP INDEX IF EXISTS idx_navigation_items_active;
DROP INDEX IF EXISTS idx_navigation_items_path;
```

## Configuration

Default configuration values:

```json
{
  "max_depth": 10,
  "default_roles": ["authenticated"],
  "enable_audit": true,
  "enable_advanced_nav_indexes": false
}
```

### Performance Configuration

**Advanced DB Tier Activation:**

- **Environment Variable:** `NAV_BACKEND_ENABLE_ADVANCED_INDEXES=true`
- **Recommended When:** `item_count > 500`
- **Performance Gain:** 40-60% over v1.3.1
- **Storage Overhead:** ~2-3% additional

The system can automatically detect when your navigation tree grows beyond 500 items and recommend enabling Advanced DB Tier via admin dashboard notifications.

## API Endpoints (Provided)

- `GET /api/navigation/items` - List navigation items
- `GET /api/navigation/tree` - Get hierarchical navigation tree
- `GET /api/navigation/logs` - Access audit logs (admin only)
- `POST /api/navigation/items` - Create navigation item (admin only)
- `PUT /api/navigation/items/:id` - Update navigation item (admin only)
- `DELETE /api/navigation/items/:id` - Delete navigation item (admin only)

## Events

The module emits the following events:

- `navigation:item:created` - New navigation item created
- `navigation:item:updated` - Navigation item modified
- `navigation:item:deleted` - Navigation item removed
- `module:installed` - Module successfully installed

## Rollback

To completely remove the module:

```sql
DROP TRIGGER IF EXISTS navigation_items_audit ON navigation_items;
DROP TRIGGER IF EXISTS navigation_items_updated_at ON navigation_items;
DROP FUNCTION IF EXISTS log_navigation_changes();
DROP FUNCTION IF EXISTS update_navigation_items_updated_at();
DROP TABLE IF EXISTS navigation_logs CASCADE;
DROP TABLE IF EXISTS navigation_items CASCADE;

-- Remove indexes (v1.3.1)
DROP INDEX IF EXISTS idx_navigation_items_parent_id;
DROP INDEX IF EXISTS idx_navigation_items_sort_order;
DROP INDEX IF EXISTS idx_navigation_items_roles;
DROP INDEX IF EXISTS idx_navigation_logs_actor;
DROP INDEX IF EXISTS idx_navigation_logs_created_at;

-- Remove advanced indexes (v1.3.2 - if enabled)
DROP INDEX IF EXISTS idx_navigation_items_parent_sort;
DROP INDEX IF EXISTS idx_navigation_items_active;
DROP INDEX IF EXISTS idx_navigation_items_path;
```

## Compatibility

- AGI Shell CMS >= 1.9.0
- Boltnew (all versions)
- Semantic OS (all versions)
- AION (all versions)

## License

OPSL-1.0 © 2025 Sebastian Hühn

## Support

For issues, questions, or contributions, please refer to the AGI Shell CMS documentation or contact the module maintainer.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and detailed changes.
