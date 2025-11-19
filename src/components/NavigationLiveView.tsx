import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { NavigationItem } from '@/types/navigation';
import NavigationSettingsPanel from './NavigationSettingsPanel';
import { NavigationIcon } from './NavigationIcon';
import { NavigationItemForm } from './NavigationItemForm';
import { navigationService } from '@/services/NavigationService';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Activity,
  Database,
  RefreshCw,
  Settings
} from 'lucide-react';

interface NavigationLog {
  id: string;
  navigation_id: string | null;
  action: 'create' | 'update' | 'delete';
  actor: string;
  changes: Record<string, unknown>;
  created_at: string;
}

export default function NavigationLiveView() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [logs, setLogs] = useState<NavigationLog[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'logs' | 'settings'>('tree');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | undefined>(undefined);

  useEffect(() => {
    loadNavigationItems();
    loadNavigationLogs();

    const itemsSubscription = supabase
      .channel('navigation_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'navigation_items'
        },
        () => {
          loadNavigationItems();
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    const logsSubscription = supabase
      .channel('navigation_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'navigation_logs'
        },
        () => {
          loadNavigationLogs();
        }
      )
      .subscribe();

    return () => {
      itemsSubscription.unsubscribe();
      logsSubscription.unsubscribe();
    };
  }, []);

  async function loadNavigationItems() {
    try {
      setLoading(true);
      const data = await navigationService.getAllItems(true);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load navigation items');
    } finally {
      setLoading(false);
    }
  }

  async function loadNavigationLogs() {
    try {
      const { data, error: fetchError } = await supabase
        .from('navigation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }

  function buildTree(parentId: string | null = null): NavigationItem[] {
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function getChildCount(parentId: string): number {
    return items.filter(item => item.parent_id === parentId).length;
  }

  function renderTreeItem(item: NavigationItem, depth: number = 0) {
    const hasChildren = getChildCount(item.id) > 0;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedId === item.id;

    return (
      <div key={item.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}
          `}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => setSelectedId(item.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-6" />}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <NavigationIcon icon={item.icon} className="w-5 h-5" />
            <span className="font-medium text-gray-900 truncate">{item.title}</span>
            <span className="text-xs text-gray-500 truncate">{item.path}</span>
          </div>

          <div className="flex items-center gap-2">
            {item.is_active ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            {item.roles.includes('admin') && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                Admin
              </span>
            )}
            <span className="text-xs text-gray-500">#{item.sort_order}</span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {buildTree(item.id).map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const selectedItem = items.find(item => item.id === selectedId);
  const rootItems = buildTree(null);
  const totalItems = items.length;
  const activeItems = items.filter(item => item.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Navigation Backend Live View</h1>
                <p className="text-sm text-gray-600">v1.3.2 - Real-time monitoring & management</p>
              </div>
            </div>

            <button
              onClick={() => {
                loadNavigationItems();
                loadNavigationLogs();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-3xl font-bold text-blue-900">{totalItems}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Items</p>
                  <p className="text-3xl font-bold text-green-900">{activeItems}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Recent Logs</p>
                  <p className="text-3xl font-bold text-purple-900">{logs.length}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('tree')}
              className={`
                px-4 py-2 font-medium transition-colors
                ${activeTab === 'tree'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Navigation Tree
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`
                px-4 py-2 font-medium transition-colors
                ${activeTab === 'logs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`
                px-4 py-2 font-medium transition-colors flex items-center gap-2
                ${activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && activeTab === 'tree' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hierarchical Navigation Tree
                  </h2>
                  <span className="text-xs text-gray-500">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>

                {rootItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No navigation items found</p>
                    <p className="text-sm">Create your first navigation item to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {rootItems.map(item => renderTreeItem(item))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Item Details</h3>

                {selectedItem ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">ID</label>
                      <p className="text-sm text-gray-900 font-mono break-all">{selectedItem.id}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Title</label>
                      <p className="text-sm text-gray-900">{selectedItem.title}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Path</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedItem.path}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Icon</label>
                      <p className="text-sm text-gray-900">{selectedItem.icon || 'None'}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Sort Order</label>
                      <p className="text-sm text-gray-900">{selectedItem.sort_order}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Status</label>
                      <p className="text-sm">
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${selectedItem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}
                        `}>
                          {selectedItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Roles</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedItem.roles.map(role => (
                          <span key={role} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Parent ID</label>
                      <p className="text-sm text-gray-900 font-mono">
                        {selectedItem.parent_id || 'Root level'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Created</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedItem.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500">Updated</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedItem.updated_at).toLocaleString()}
                      </p>
                    </div>

                    {Object.keys(selectedItem.metadata).length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Metadata</label>
                        <pre className="text-xs bg-gray-800 text-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(selectedItem.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => {
                          setEditingItem(selectedItem);
                          setShowForm(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${selectedItem.title}"?`)) {
                            try {
                              await navigationService.deleteItem(selectedItem.id);
                              setSelectedId(null);
                              loadNavigationItems();
                            } catch (err) {
                              alert('Failed to delete item');
                            }
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Select an item to view details
                  </p>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === 'settings' && (
            <NavigationSettingsPanel onItemsChange={loadNavigationItems} />
          )}

          {!loading && activeTab === 'logs' && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail (Last 50)</h2>

              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className={`
                        p-2 rounded-lg
                        ${log.action === 'create' ? 'bg-green-100' : ''}
                        ${log.action === 'update' ? 'bg-blue-100' : ''}
                        ${log.action === 'delete' ? 'bg-red-100' : ''}
                      `}>
                        {log.action === 'create' && <Plus className="w-4 h-4 text-green-700" />}
                        {log.action === 'update' && <Edit className="w-4 h-4 text-blue-700" />}
                        {log.action === 'delete' && <Trash2 className="w-4 h-4 text-red-700" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`
                            px-2 py-0.5 rounded text-xs font-medium uppercase
                            ${log.action === 'create' ? 'bg-green-100 text-green-800' : ''}
                            ${log.action === 'update' ? 'bg-blue-100 text-blue-800' : ''}
                            ${log.action === 'delete' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500">by {log.actor}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <details className="text-sm text-gray-700">
                          <summary className="cursor-pointer hover:text-gray-900">
                            View changes
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Navigation Backend Module v1.3.2 - OPSL-1.0 © 2025 Sebastian Hühn</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates active</span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <NavigationItemForm
          item={editingItem}
          parentItems={items.filter(i => !i.parent_id)}
          onSave={() => {
            setShowForm(false);
            setEditingItem(undefined);
            loadNavigationItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(undefined);
          }}
        />
      )}
    </div>
  );
}
