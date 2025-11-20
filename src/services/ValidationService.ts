import type {
  ViewType,
  ContentPadding,
  MaxContentWidth,
  ScrollBehavior,
  LayoutProfile,
  LayoutProfiles,
} from '../types/navigation';

const ALLOWED_VIEW_TYPES: ViewType[] = ['list', 'detail', 'form', 'dashboard', 'wizard'];
const ALLOWED_CONTENT_PADDING: ContentPadding[] = ['none', 'sm', 'md', 'lg'];
const ALLOWED_MAX_CONTENT_WIDTH: MaxContentWidth[] = ['full', 'xl', '2xl'];
const ALLOWED_SCROLL_BEHAVIOR: ScrollBehavior[] = ['main_only', 'page'];

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  details?: unknown;
}

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  static getInstance(): ValidationService {
    if (!this.instance) {
      this.instance = new ValidationService();
    }
    return this.instance;
  }

  validateViewType(viewType: string): ValidationError | null {
    if (!ALLOWED_VIEW_TYPES.includes(viewType as ViewType)) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Invalid view_type. Allowed values: ${ALLOWED_VIEW_TYPES.join(', ')}`,
        field: 'view_type',
        value: viewType,
      };
    }
    return null;
  }

  validateRoute(route: string): ValidationError | null {
    if (!route || typeof route !== 'string') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Route must be a non-empty string',
        field: 'route',
        value: route,
      };
    }

    if (!route.startsWith('/admin/')) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Route must start with /admin/',
        field: 'route',
        value: route,
      };
    }

    return null;
  }

  validateLayoutProfile(
    profileId: string,
    availableProfiles: LayoutProfiles | null
  ): ValidationError | null {
    if (!profileId || typeof profileId !== 'string') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Layout profile must be a non-empty string',
        field: 'layout_profile',
        value: profileId,
      };
    }

    if (!availableProfiles) {
      if (profileId !== 'backend_default') {
        return {
          code: 'LAYOUT_PROFILE_NOT_FOUND',
          message: 'No layout profiles configured. Only backend_default is available.',
          field: 'layout_profile',
          value: profileId,
        };
      }
      return null;
    }

    if (!(profileId in availableProfiles)) {
      return {
        code: 'LAYOUT_PROFILE_NOT_FOUND',
        message: `Layout profile '${profileId}' not found in navigation_settings.layout_profiles`,
        field: 'layout_profile',
        value: profileId,
        details: {
          available_profiles: Object.keys(availableProfiles),
        },
      };
    }

    return null;
  }

  validateLayoutProfileStructure(profile: unknown): ValidationError | null {
    if (!profile || typeof profile !== 'object') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Layout profile must be an object',
        value: profile,
      };
    }

    const p = profile as Partial<LayoutProfile>;

    if (!p.label || typeof p.label !== 'string') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Layout profile must have a label (string)',
        field: 'label',
      };
    }

    if (!p.zones || typeof p.zones !== 'object') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Layout profile must have zones (object)',
        field: 'zones',
      };
    }

    const zones = p.zones;
    if (
      typeof zones.header?.visible !== 'boolean' ||
      typeof zones.sidebar?.visible !== 'boolean' ||
      typeof zones.toolbar?.visible !== 'boolean' ||
      typeof zones.footer?.visible !== 'boolean'
    ) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'All zone visibility flags must be boolean',
        field: 'zones',
      };
    }

    if (zones.sidebar.width !== undefined && typeof zones.sidebar.width !== 'number') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Sidebar width must be a number',
        field: 'zones.sidebar.width',
      };
    }

    if (zones.sidebar.width !== undefined && zones.sidebar.width <= 0) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Sidebar width must be positive',
        field: 'zones.sidebar.width',
        value: zones.sidebar.width,
      };
    }

    if (!p.options || typeof p.options !== 'object') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Layout profile must have options (object)',
        field: 'options',
      };
    }

    const options = p.options;

    if (!ALLOWED_CONTENT_PADDING.includes(options.content_padding as ContentPadding)) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Invalid content_padding. Allowed values: ${ALLOWED_CONTENT_PADDING.join(', ')}`,
        field: 'options.content_padding',
        value: options.content_padding,
      };
    }

    if (!ALLOWED_MAX_CONTENT_WIDTH.includes(options.max_content_width as MaxContentWidth)) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Invalid max_content_width. Allowed values: ${ALLOWED_MAX_CONTENT_WIDTH.join(', ')}`,
        field: 'options.max_content_width',
        value: options.max_content_width,
      };
    }

    if (!ALLOWED_SCROLL_BEHAVIOR.includes(options.scroll_behavior as ScrollBehavior)) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Invalid scroll_behavior. Allowed values: ${ALLOWED_SCROLL_BEHAVIOR.join(', ')}`,
        field: 'options.scroll_behavior',
        value: options.scroll_behavior,
      };
    }

    return null;
  }

  validateLayoutProfiles(profiles: unknown): ValidationError | null {
    if (!profiles || typeof profiles !== 'object') {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Layout profiles must be an object',
        value: profiles,
      };
    }

    const profilesObj = profiles as Record<string, unknown>;
    for (const [profileId, profile] of Object.entries(profilesObj)) {
      const error = this.validateLayoutProfileStructure(profile);
      if (error) {
        return {
          ...error,
          message: `Profile '${profileId}': ${error.message}`,
          details: { profile_id: profileId, ...error.details },
        };
      }
    }

    return null;
  }

  validateUUID(value: string, fieldName: string = 'id'): ValidationError | null {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return {
        code: 'VALIDATION_ERROR',
        message: `${fieldName} must be a valid UUID`,
        field: fieldName,
        value: value,
      };
    }
    return null;
  }
}

export const validationService = ValidationService.getInstance();
