import { supabase } from '@/lib/supabase';
import type {
  RegisterRoutesInput,
  RegisterRoutesResponse,
  RegisteredRouteResult,
  NavigationRoute,
  ViewType,
} from '../types/navigation';
import { validationService, type ValidationError } from './ValidationService';
import { navigationService } from './NavigationService';

export interface RouteRegistrationError {
  index: number;
  route: string;
  error: ValidationError;
}

export class RouteRegistrationService {
  private static instance: RouteRegistrationService;

  private constructor() {}

  static getInstance(): RouteRegistrationService {
    if (!this.instance) {
      this.instance = new RouteRegistrationService();
    }
    return this.instance;
  }

  async registerRoutes(input: RegisterRoutesInput): Promise<RegisterRoutesResponse> {
    if (!input.module || typeof input.module !== 'string' || input.module.trim() === '') {
      throw new Error('module must be a non-empty string');
    }

    if (!Array.isArray(input.routes) || input.routes.length === 0) {
      throw new Error('routes must be a non-empty array');
    }

    const errors: RouteRegistrationError[] = [];
    const validatedRoutes = [];

    const layoutProfiles = await navigationService.getLayoutProfiles();

    for (let i = 0; i < input.routes.length; i++) {
      const route = input.routes[i];
      const validationErrors: ValidationError[] = [];

      const routeError = validationService.validateRoute(route.route);
      if (routeError) {
        errors.push({ index: i, route: route.route, error: routeError });
        continue;
      }

      const viewType = route.view_type ?? 'list';
      const viewTypeError = validationService.validateViewType(viewType);
      if (viewTypeError) {
        errors.push({ index: i, route: route.route, error: viewTypeError });
        continue;
      }

      const layoutProfile = route.layout_profile ?? 'backend_default';
      const layoutProfileError = validationService.validateLayoutProfile(
        layoutProfile,
        layoutProfiles
      );
      if (layoutProfileError) {
        errors.push({ index: i, route: route.route, error: layoutProfileError });
        continue;
      }

      if (route.menu_id) {
        const menuIdError = validationService.validateUUID(route.menu_id, 'menu_id');
        if (menuIdError) {
          errors.push({ index: i, route: route.route, error: menuIdError });
          continue;
        }

        const menuItem = await navigationService.getItemById(route.menu_id);
        if (!menuItem) {
          errors.push({
            index: i,
            route: route.route,
            error: {
              code: 'MENU_ID_NOT_FOUND',
              message: `Navigation item with id ${route.menu_id} not found or not accessible`,
              field: 'menu_id',
              value: route.menu_id,
            },
          });
          continue;
        }
      }

      validatedRoutes.push({
        route: route.route,
        menu_id: route.menu_id ?? null,
        view_type: viewType,
        layout_profile: layoutProfile,
      });
    }

    if (errors.length > 0) {
      throw new Error(
        JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: 'One or more route definitions are invalid',
          details: errors,
        })
      );
    }

    const results: RegisteredRouteResult[] = [];

    for (const routeData of validatedRoutes) {
      const { data: existing } = await supabase
        .from('navigation_routes')
        .select('*')
        .eq('module_id', input.module)
        .eq('route', routeData.route)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('navigation_routes')
          .update({
            menu_id: routeData.menu_id,
            view_type: routeData.view_type,
            layout_profile: routeData.layout_profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        results.push({
          route: routeData.route,
          menu_id: routeData.menu_id,
          view_type: routeData.view_type,
          layout_profile: routeData.layout_profile,
          created: false,
          updated: true,
        });
      } else {
        const { error: insertError } = await supabase
          .from('navigation_routes')
          .insert([
            {
              module_id: input.module,
              route: routeData.route,
              menu_id: routeData.menu_id,
              view_type: routeData.view_type,
              layout_profile: routeData.layout_profile,
            },
          ]);

        if (insertError) throw insertError;

        results.push({
          route: routeData.route,
          menu_id: routeData.menu_id,
          view_type: routeData.view_type,
          layout_profile: routeData.layout_profile,
          created: true,
          updated: false,
        });
      }
    }

    return {
      module: input.module,
      routes: results,
    };
  }

  async unregisterRoutes(moduleId: string, routes?: string[]): Promise<number> {
    let query = supabase.from('navigation_routes').delete().eq('module_id', moduleId);

    if (routes && routes.length > 0) {
      query = query.in('route', routes);
    }

    const { error, count } = await query;
    if (error) throw error;

    return count ?? 0;
  }

  async getModuleRoutes(moduleId: string): Promise<NavigationRoute[]> {
    return navigationService.getNavigationRoutes(moduleId);
  }
}

export const routeRegistrationService = RouteRegistrationService.getInstance();
