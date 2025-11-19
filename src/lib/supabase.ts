import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type NavigationItem = {
  id: string;
  parent_id: string | null;
  title: string;
  path: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  roles: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NavigationLog = {
  id: string;
  navigation_id: string | null;
  action: 'create' | 'update' | 'delete';
  actor: string;
  changes: Record<string, unknown>;
  created_at: string;
};
