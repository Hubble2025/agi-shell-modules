-- 1) Composite Parent + Sort Index
-- Optimizes: SELECT * FROM navigation_items WHERE parent_id = ? ORDER BY sort_order
-- Use Case: Single-query optimization for sorted child items
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_sort
  ON navigation_items(parent_id, sort_order);

-- 2) Partial Active Items Index
-- Optimizes: SELECT * FROM navigation_items WHERE is_active = TRUE AND parent_id = ?
-- Use Case: Frontend queries (most common pattern - 99% of requests)
CREATE INDEX IF NOT EXISTS idx_navigation_items_active
  ON navigation_items(parent_id, sort_order)
  WHERE is_active = TRUE;

-- 3) Path Lookup Index
-- Optimizes: SELECT * FROM navigation_items WHERE path = '/admin/modules'
-- Use Case: Router matching, active menu highlighting, deep linking
CREATE INDEX IF NOT EXISTS idx_navigation_items_path
  ON navigation_items(path);