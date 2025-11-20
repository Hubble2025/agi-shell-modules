export type ViewType = 'list' | 'detail' | 'form' | 'dashboard' | 'wizard';

export interface NavigationItem {
  id: string;
  parent_id: string | null;
  title: string;
  path: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  roles: string[];
  metadata: Record<string, unknown>;
  tenant_id?: string | null;
  required_feature_flags?: string[];
  view_type: ViewType;
  layout_profile: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  flag_key: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  scope: 'global' | 'tenant';
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NavigationSettings {
  id: string;
  cache_ttl: number;
  max_tree_depth: number;
  enable_advanced_indexes: boolean;
  require_authentication: boolean;
  enable_audit_logging: boolean;
  max_failed_queries: number;
  enable_live_updates: boolean;
  enable_soft_delete: boolean;
  enable_versioning: boolean;
  api_rate_limit: number;
  max_batch_size: number;
  enable_public_api: boolean;
  default_icon: string;
  theme: Record<string, unknown>;
  language: string;
  custom_config: Record<string, unknown>;
  logo_url: string | null;
  logo_storage_path: string | null;
  header_banner_text: string | null;
  header_banner_widget_id: string | null;
  sidebar_width: number;
  typography: TypographySettings;
  applied_template_id: string | null;
  template_applied_at: string | null;
  backup_snapshot: Record<string, unknown> | null;
  layout_profiles: LayoutProfiles | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface TypographySettings {
  h1: HeadingStyle;
  h2: HeadingStyle;
  h3: HeadingStyle;
  h4: HeadingStyle;
  h5: HeadingStyle;
  h6: HeadingStyle;
}

export interface HeadingStyle {
  size: string;
  weight: number;
  color: string;
}

export interface UserPreferences {
  user_id: string;
  preferred_theme: 'light' | 'dark' | 'auto';
  sidebar_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNavigationItemInput {
  parent_id?: string | null;
  title: string;
  path: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
  roles?: string[];
  metadata?: Record<string, unknown>;
  tenant_id?: string | null;
  required_feature_flags?: string[];
  view_type?: ViewType;
  layout_profile?: string;
}

export interface UpdateNavigationItemInput {
  parent_id?: string | null;
  title?: string;
  path?: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
  roles?: string[];
  metadata?: Record<string, unknown>;
  required_feature_flags?: string[];
  view_type?: ViewType;
  layout_profile?: string;
}

export interface NavigationTreeNode extends NavigationItem {
  children: NavigationTreeNode[];
}

export interface SearchNavigationOptions {
  includeInactive?: boolean;
  tenantId?: string;
}

export type ContentPadding = 'none' | 'sm' | 'md' | 'lg';
export type MaxContentWidth = 'full' | 'xl' | '2xl';
export type ScrollBehavior = 'main_only' | 'page';

export interface LayoutZoneHeader {
  visible: boolean;
}

export interface LayoutZoneSidebar {
  visible: boolean;
  width?: number;
}

export interface LayoutZoneToolbar {
  visible: boolean;
}

export interface LayoutZoneFooter {
  visible: boolean;
}

export interface LayoutZones {
  header: LayoutZoneHeader;
  sidebar: LayoutZoneSidebar;
  toolbar: LayoutZoneToolbar;
  footer: LayoutZoneFooter;
}

export interface LayoutOptions {
  content_padding: ContentPadding;
  max_content_width: MaxContentWidth;
  scroll_behavior: ScrollBehavior;
}

export interface LayoutProfile {
  label: string;
  zones: LayoutZones;
  options: LayoutOptions;
}

export interface LayoutProfiles {
  [profileId: string]: LayoutProfile;
}

export interface NavigationRoute {
  id: string;
  module_id: string;
  route: string;
  menu_id: string | null;
  view_type: ViewType;
  layout_profile: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterRouteInput {
  route: string;
  menu_id?: string | null;
  view_type?: ViewType;
  layout_profile?: string;
}

export interface RegisterRoutesInput {
  module: string;
  routes: RegisterRouteInput[];
}

export interface RegisteredRouteResult extends RegisterRouteInput {
  created: boolean;
  updated: boolean;
}

export interface RegisterRoutesResponse {
  module: string;
  routes: RegisteredRouteResult[];
}

export interface NavigationFullResponse {
  navigation_items: NavigationItem[];
  layout_profiles: LayoutProfiles;
  routes: NavigationRoute[];
}
