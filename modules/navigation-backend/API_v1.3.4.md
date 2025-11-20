# Navigation Backend Module - API Documentation v1.3.4

## Overview

This document describes the new and extended API endpoints introduced in v1.3.4.

---

## Extended Endpoints

### GET /api/navigation/items

**Extended Response**: Now includes `view_type` and `layout_profile` fields.

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "parent_id": null,
      "title": "Dashboard",
      "path": "/admin/dashboard",
      "icon": "layout-dashboard",
      "sort_order": 10,
      "is_active": true,
      "roles": ["admin"],
      "metadata": {},
      "tenant_id": "uuid-or-null",
      "view_type": "dashboard",
      "layout_profile": "backend_default",
      "created_at": "2025-11-20T00:00:00Z",
      "updated_at": "2025-11-20T00:00:00Z"
    }
  ]
}
```

**Backward Compatibility**: Existing clients ignoring unknown fields continue to work.

---

### GET /api/navigation/tree

**Extended Response**: Tree structure now includes `view_type` and `layout_profile` on each node.

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Settings",
      "path": "/admin/settings",
      "view_type": "form",
      "layout_profile": "backend_default",
      "children": [...]
    }
  ]
}
```

---

## New Endpoints

### GET /api/navigation/full

**Purpose**: Aggregating endpoint for backend AppShell initialization.

**Description**: Returns complete navigation context including items, layout profiles, and registered routes.

**Request**:
```http
GET /api/navigation/full
```

**Query Parameters**:
- `tenant_id` (optional): Filter items by tenant

**Response**:
```json
{
  "success": true,
  "data": {
    "navigation_items": [
      {
        "id": "uuid",
        "title": "Dashboard",
        "path": "/admin/dashboard",
        "view_type": "dashboard",
        "layout_profile": "backend_default",
        ...
      }
    ],
    "layout_profiles": {
      "backend_default": {
        "label": "Backend Default Layout",
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
    },
    "routes": [
      {
        "id": "uuid",
        "module_id": "navigation-backend",
        "route": "/admin/navigation/settings",
        "menu_id": "uuid-or-null",
        "view_type": "form",
        "layout_profile": "backend_default",
        "created_at": "2025-11-20T00:00:00Z",
        "updated_at": "2025-11-20T00:00:00Z"
      }
    ]
  }
}
```

**RBAC**: Authenticated users, RLS applies to navigation_items.

---

### POST /api/navigation/routes/register

**Purpose**: Idempotent route registration for backend modules.

**Description**: Registers or updates backend routes with associated menu items, view types, and layout profiles.

**Request**:
```http
POST /api/navigation/routes/register
Content-Type: application/json
```

**Request Body**:
```json
{
  "module": "agi-shell-core",
  "routes": [
    {
      "route": "/admin/modules/installed",
      "menu_id": "uuid-or-null",
      "view_type": "list",
      "layout_profile": "backend_default"
    },
    {
      "route": "/admin/modules/settings",
      "menu_id": "uuid",
      "view_type": "form",
      "layout_profile": "backend_default"
    }
  ]
}
```

**Field Descriptions**:
- `module` (required): Technical module identifier (e.g., "navigation-backend")
- `routes` (required): Array of route objects
  - `route` (required): Backend route path, must start with `/admin/`
  - `menu_id` (optional): UUID of associated navigation item, null if no sidebar entry
  - `view_type` (optional): View type enum, default `list`
  - `layout_profile` (optional): Layout profile ID, default `backend_default`

**Success Response**:
```json
{
  "success": true,
  "data": {
    "module": "agi-shell-core",
    "routes": [
      {
        "route": "/admin/modules/installed",
        "menu_id": null,
        "view_type": "list",
        "layout_profile": "backend_default",
        "created": true,
        "updated": false
      },
      {
        "route": "/admin/modules/settings",
        "menu_id": "uuid",
        "view_type": "form",
        "layout_profile": "backend_default",
        "created": false,
        "updated": true
      }
    ]
  }
}
```

**Error Responses**:

**400 - Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more route definitions are invalid",
    "details": [
      {
        "index": 0,
        "route": "/public/home",
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "Route must start with /admin/",
          "field": "route",
          "value": "/public/home"
        }
      }
    ]
  }
}
```

**403 - Forbidden**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not allowed to register navigation routes"
  }
}
```

**RBAC**: Admin-only write access.

**Idempotency**:
- First call with (module, route) → INSERT → `created: true`
- Subsequent calls → UPDATE → `updated: true`
- No duplicates created

---

## Validation Rules

### View Type
**Allowed Values**: `list`, `detail`, `form`, `dashboard`, `wizard`

**Validation**:
- Must be one of the allowed enum values
- Enforced on create/update operations
- Returns 400 error if invalid

### Layout Profile
**Validation**:
- Must reference an existing profile key in `navigation_settings.layout_profiles`
- Default `backend_default` always available
- Returns 400 error if profile not found

### Route
**Validation**:
- Must be non-empty string
- Must start with `/admin/` prefix
- Returns 400 error if invalid

### Menu ID
**Validation**:
- Must be valid UUID format
- Must reference existing `navigation_items.id`
- Must be visible/accessible (RLS applies)
- Returns 400 error if not found or inaccessible

---

## Layout Profile Schema

```typescript
{
  "profile_id": {
    "label": string,  // Human-readable name
    "zones": {
      "header": { "visible": boolean },
      "sidebar": {
        "visible": boolean,
        "width": number?  // Optional, pixels
      },
      "toolbar": { "visible": boolean },
      "footer": { "visible": boolean }
    },
    "options": {
      "content_padding": "none" | "sm" | "md" | "lg",
      "max_content_width": "full" | "xl" | "2xl",
      "scroll_behavior": "main_only" | "page"
    }
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `LAYOUT_PROFILE_NOT_FOUND` | Referenced layout profile does not exist | 400 |
| `MENU_ID_NOT_FOUND` | Referenced menu item not found or inaccessible | 400 |
| `FORBIDDEN` | Insufficient permissions | 403 |

---

## Migration Guide

### From v1.3.3 to v1.3.4

**Breaking Changes**: None

**New Fields**:
- All existing navigation items automatically get default values:
  - `view_type: 'list'`
  - `layout_profile: 'backend_default'`

**Client Updates**:
1. Update TypeScript types to include `view_type` and `layout_profile`
2. Optionally use new `/api/navigation/full` endpoint for AppShell initialization
3. Optionally implement route registration in module installers

**No Action Required**:
- Existing API calls continue to work
- New fields can be ignored by existing clients
- Default values are automatically applied
