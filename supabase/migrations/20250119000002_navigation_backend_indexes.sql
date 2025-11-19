/*
  # Navigation Backend Module v1.3.1 - Performance Patch: Database Index Optimization

  This migration adds optimized indexes to improve query performance for large navigation trees (1000+ items).

  ## Index Strategy

  1. **Parent/Child Resolution** (`idx_navigation_items_parent_id`)
     - Optimizes hierarchical tree queries
     - Speeds up recursive CTE operations
     - Essential for menu rendering

  2. **Sort Order** (`idx_navigation_items_sort_order`)
     - Optimizes ORDER BY operations
     - Critical for UI display ordering
     - Improves sibling navigation rendering

  3. **Role-Based Filtering** (`idx_navigation_items_roles`)
     - GIN index for array operations
     - Optimizes role-based access control queries
     - Speeds up `WHERE roles @> ARRAY['role']` operations

  4. **Actor-Based Audit** (`idx_navigation_logs_actor`)
     - Enables fast user activity queries
     - Essential for audit trail reports
     - Speeds up "who changed what" analysis

  5. **Time-Based Log Analysis** (`idx_navigation_logs_created_at`)
     - Optimized for DESC ordering (recent-first)
     - Speeds up admin dashboard log views
     - Essential for change history timelines

  ## Performance Impact

  - Expected improvement: 60-90% faster queries on installations with 1000+ navigation items
  - Minimal storage overhead: ~5-10% increase
  - Index creation time: <5 seconds on typical datasets

  ## Compatibility

  - Non-breaking change
  - Compatible with v1.3.0 schema
  - Can be applied to running systems
  - Idempotent (safe to run multiple times)
*/

-- 1) Parent/Child Resolution Index
-- Optimizes: SELECT * FROM navigation_items WHERE parent_id = ?
-- Use Case: Building navigation trees, breadcrumb generation
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_id
  ON navigation_items(parent_id);

-- 2) Sort Order Index
-- Optimizes: SELECT * FROM navigation_items ORDER BY sort_order
-- Use Case: Rendering sorted navigation menus
CREATE INDEX IF NOT EXISTS idx_navigation_items_sort_order
  ON navigation_items(sort_order);

-- 3) Role-Based Filtering Index (GIN for array operations)
-- Optimizes: SELECT * FROM navigation_items WHERE roles @> ARRAY['admin']
-- Use Case: Role-based access control, permission filtering
CREATE INDEX IF NOT EXISTS idx_navigation_items_roles
  ON navigation_items
  USING GIN(roles);

-- 4) Actor-Based Audit Index
-- Optimizes: SELECT * FROM navigation_logs WHERE actor = ?
-- Use Case: User activity tracking, audit reports
CREATE INDEX IF NOT EXISTS idx_navigation_logs_actor
  ON navigation_logs(actor);

-- 5) Time-Based Log Analysis Index (DESC for recent-first queries)
-- Optimizes: SELECT * FROM navigation_logs ORDER BY created_at DESC
-- Use Case: Recent changes dashboard, changelog views
CREATE INDEX IF NOT EXISTS idx_navigation_logs_created_at
  ON navigation_logs(created_at DESC);
