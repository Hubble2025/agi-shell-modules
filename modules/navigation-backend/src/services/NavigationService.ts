import { supabase } from '@/lib/supabase';
import type {
  NavigationItem,
  CreateNavigationItemInput,
  UpdateNavigationItemInput,
  NavigationTreeNode,
  SearchNavigationOptions,
  NavigationSettings,
  LayoutProfiles,
  NavigationFullResponse,
  NavigationRoute,
} from '@/types/navigation';
import { validationService, type ValidationError } from './ValidationService';

export class NavigationService {
  private static instance: NavigationService;

  private constructor() {}

  static getInstance(): NavigationService {
    if (!this.instance) {
      this.instance = new NavigationService();
    }
    return this.instance;
  }

  async getItems(tenantId?: string): Promise<NavigationItem[]> {
    let query = supabase
      .from('navigation_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAllItems(includeInactive: boolean = false): Promise<NavigationItem[]> {
    let query = supabase
      .from('navigation_items')
      .select('*')
      .order('sort_order');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getItemById(id: string): Promise<NavigationItem | null> {
    const { data, error } = await supabase
      .from('navigation_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createItem(item: CreateNavigationItemInput): Promise<NavigationItem> {
    const viewType = item.view_type ?? 'list';
    const layoutProfile = item.layout_profile ?? 'backend_default';

    const viewTypeError = validationService.validateViewType(viewType);
    if (viewTypeError) {
      throw new Error(viewTypeError.message);
    }

    const settings = await this.getNavigationSettings();
    const layoutProfileError = validationService.validateLayoutProfile(
      layoutProfile,
      settings?.layout_profiles ?? null
    );
    if (layoutProfileError) {
      throw new Error(layoutProfileError.message);
    }

    const { data, error } = await supabase
      .from('navigation_items')
      .insert([
        {
          ...item,
          sort_order: item.sort_order ?? 999,
          is_active: item.is_active ?? true,
          roles: item.roles ?? ['authenticated'],
          metadata: item.metadata ?? {},
          view_type: viewType,
          layout_profile: layoutProfile,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateItem(id: string, updates: UpdateNavigationItemInput): Promise<NavigationItem> {
    if (updates.view_type) {
      const viewTypeError = validationService.validateViewType(updates.view_type);
      if (viewTypeError) {
        throw new Error(viewTypeError.message);
      }
    }

    if (updates.layout_profile) {
      const settings = await this.getNavigationSettings();
      const layoutProfileError = validationService.validateLayoutProfile(
        updates.layout_profile,
        settings?.layout_profiles ?? null
      );
      if (layoutProfileError) {
        throw new Error(layoutProfileError.message);
      }
    }

    const { data, error } = await supabase
      .from('navigation_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('navigation_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async reorderItems(
    items: { id: string; sort_order: number; parent_id?: string | null }[]
  ): Promise<void> {
    const updates = items.map((item) =>
      supabase
        .from('navigation_items')
        .update({ sort_order: item.sort_order, parent_id: item.parent_id })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      throw new Error(`Failed to reorder items: ${errors[0].error?.message}`);
    }
  }

  async searchItems(
    query: string,
    options: SearchNavigationOptions = {}
  ): Promise<NavigationItem[]> {
    const { includeInactive = false, tenantId } = options;

    let dbQuery = supabase
      .from('navigation_items')
      .select('*')
      .or(`title.ilike.%${query}%,path.ilike.%${query}%`)
      .order('sort_order');

    if (!includeInactive) {
      dbQuery = dbQuery.eq('is_active', true);
    }

    if (tenantId) {
      dbQuery = dbQuery.eq('tenant_id', tenantId);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data || [];
  }

  async checkFeatureFlags(
    requiredFlags: string[],
    tenantId?: string
  ): Promise<boolean> {
    if (!requiredFlags || requiredFlags.length === 0) return true;

    let query = supabase
      .from('feature_flags')
      .select('flag_key, is_active, scope, tenant_id')
      .in('flag_key', requiredFlags)
      .eq('is_active', true);

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},scope.eq.global`);
    } else {
      query = query.eq('scope', 'global');
    }

    const { data: flags } = await query;

    if (!flags) return false;

    return requiredFlags.every((flag) => {
      const matchingFlag = flags.find((f) => f.flag_key === flag);
      if (!matchingFlag) return false;

      if (tenantId && matchingFlag.tenant_id === tenantId) {
        return true;
      }

      if (matchingFlag.scope === 'global') {
        return true;
      }

      return false;
    });
  }

  buildTree(items: NavigationItem[]): NavigationTreeNode[] {
    const itemMap = new Map<string, NavigationTreeNode>();
    const rootItems: NavigationTreeNode[] = [];

    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    items.forEach((item) => {
      const node = itemMap.get(item.id)!;
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          rootItems.push(node);
        }
      } else {
        rootItems.push(node);
      }
    });

    return rootItems.sort((a, b) => a.sort_order - b.sort_order);
  }

  async getNavigationTree(tenantId?: string): Promise<NavigationTreeNode[]> {
    const items = await this.getItems(tenantId);
    return this.buildTree(items);
  }

  async getNavigationSettings(): Promise<NavigationSettings | null> {
    const { data, error } = await supabase
      .from('navigation_settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getLayoutProfiles(): Promise<LayoutProfiles> {
    const settings = await this.getNavigationSettings();
    if (!settings || !settings.layout_profiles) {
      return {
        backend_default: {
          label: 'Backend Default Layout',
          zones: {
            header: { visible: true },
            sidebar: { visible: true, width: 260 },
            toolbar: { visible: true },
            footer: { visible: false },
          },
          options: {
            content_padding: 'lg',
            max_content_width: 'full',
            scroll_behavior: 'main_only',
          },
        },
      };
    }
    return settings.layout_profiles;
  }

  async getNavigationFull(tenantId?: string): Promise<NavigationFullResponse> {
    const [items, layoutProfiles, routesResult] = await Promise.all([
      this.getItems(tenantId),
      this.getLayoutProfiles(),
      supabase.from('navigation_routes').select('*').order('module_id'),
    ]);

    if (routesResult.error) throw routesResult.error;

    return {
      navigation_items: items,
      layout_profiles: layoutProfiles,
      routes: routesResult.data || [],
    };
  }

  async getNavigationRoutes(moduleId?: string): Promise<NavigationRoute[]> {
    let query = supabase.from('navigation_routes').select('*').order('route');

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export const navigationService = NavigationService.getInstance();
