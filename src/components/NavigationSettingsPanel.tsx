import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Globe,
  Palette
} from 'lucide-react';

type NavigationSettings = {
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
  theme: {
    mode: string;
    primaryColor: string;
    accentColor: string;
  };
  language: string;
  custom_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export default function NavigationSettingsPanel() {
  const [settings, setSettings] = useState<NavigationSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<NavigationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('navigation_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data);
        setOriginalSettings(data);
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('navigation_settings')
        .update({
          cache_ttl: settings.cache_ttl,
          max_tree_depth: settings.max_tree_depth,
          enable_advanced_indexes: settings.enable_advanced_indexes,
          require_authentication: settings.require_authentication,
          enable_audit_logging: settings.enable_audit_logging,
          max_failed_queries: settings.max_failed_queries,
          enable_live_updates: settings.enable_live_updates,
          enable_soft_delete: settings.enable_soft_delete,
          enable_versioning: settings.enable_versioning,
          api_rate_limit: settings.api_rate_limit,
          max_batch_size: settings.max_batch_size,
          enable_public_api: settings.enable_public_api,
          default_icon: settings.default_icon,
          theme: settings.theme,
          language: settings.language,
          custom_config: settings.custom_config
        })
        .eq('id', settings.id);

      if (error) throw error;

      showMessage('success', 'Settings saved successfully');
      await loadSettings();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    if (originalSettings) {
      setSettings({ ...originalSettings });
      showMessage('success', 'Settings reset to last saved state');
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function updateSetting<K extends keyof NavigationSettings>(key: K, value: NavigationSettings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Settings not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Backend Configuration</h2>
            <p className="text-sm text-gray-600">Server settings and feature flags</p>
          </div>
        </div>

        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`
          p-4 rounded-lg border flex items-center gap-3
          ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
        `}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cache TTL (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={settings.cache_ttl}
                onChange={(e) => updateSetting('cache_ttl', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Cache duration for navigation items</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tree Depth
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.max_tree_depth}
                onChange={(e) => updateSetting('max_tree_depth', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum hierarchy depth (1-50)</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Advanced Indexes
                </label>
                <p className="text-xs text-gray-500">Enable enterprise-grade indexes</p>
              </div>
              <button
                onClick={() => updateSetting('enable_advanced_indexes', !settings.enable_advanced_indexes)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enable_advanced_indexes ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enable_advanced_indexes ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Require Authentication
                </label>
                <p className="text-xs text-gray-500">Force auth for all navigation</p>
              </div>
              <button
                onClick={() => updateSetting('require_authentication', !settings.require_authentication)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.require_authentication ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.require_authentication ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Audit Logging
                </label>
                <p className="text-xs text-gray-500">Track all navigation changes</p>
              </div>
              <button
                onClick={() => updateSetting('enable_audit_logging', !settings.enable_audit_logging)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enable_audit_logging ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enable_audit_logging ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Failed Queries
              </label>
              <input
                type="number"
                min="1"
                value={settings.max_failed_queries}
                onChange={(e) => updateSetting('max_failed_queries', parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Rate limit threshold</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">API Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Rate Limit (req/min)
              </label>
              <input
                type="number"
                min="1"
                value={settings.api_rate_limit}
                onChange={(e) => updateSetting('api_rate_limit', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={settings.max_batch_size}
                onChange={(e) => updateSetting('max_batch_size', parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Public API Access
                </label>
                <p className="text-xs text-gray-500">Allow unauthenticated requests</p>
              </div>
              <button
                onClick={() => updateSetting('enable_public_api', !settings.enable_public_api)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enable_public_api ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enable_public_api ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Feature Flags</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Live Updates
                </label>
                <p className="text-xs text-gray-500">Real-time subscriptions</p>
              </div>
              <button
                onClick={() => updateSetting('enable_live_updates', !settings.enable_live_updates)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enable_live_updates ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enable_live_updates ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Soft Delete
                </label>
                <p className="text-xs text-gray-500">Mark as deleted instead of remove</p>
              </div>
              <button
                onClick={() => updateSetting('enable_soft_delete', !settings.enable_soft_delete)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enable_soft_delete ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enable_soft_delete ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Versioning
                </label>
                <p className="text-xs text-gray-500">Track navigation versions</p>
              </div>
              <button
                onClick={() => updateSetting('enable_versioning', !settings.enable_versioning)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enable_versioning ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enable_versioning ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>Last updated: {new Date(settings.updated_at).toLocaleString()}</p>
          <p>Updated by: {settings.updated_by || 'System'}</p>
        </div>
      </div>
    </div>
  );
}
