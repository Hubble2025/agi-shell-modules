import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { navigationService } from '@/services/NavigationService';
import type { NavigationItem, CreateNavigationItemInput, UpdateNavigationItemInput } from '@/types/navigation';

interface NavigationItemFormProps {
  item?: NavigationItem;
  parentItems?: NavigationItem[];
  onSave: () => void;
  onCancel: () => void;
}

export function NavigationItemForm({ item, parentItems = [], onSave, onCancel }: NavigationItemFormProps) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    path: item?.path || '',
    icon: item?.icon || '',
    parent_id: item?.parent_id || '',
    sort_order: item?.sort_order || 999,
    is_active: item?.is_active ?? true,
    roles: item?.roles?.join(', ') || 'authenticated',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const roles = formData.roles.split(',').map(r => r.trim()).filter(Boolean);

      if (item) {
        const updates: UpdateNavigationItemInput = {
          title: formData.title,
          path: formData.path,
          icon: formData.icon || null,
          parent_id: formData.parent_id || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
          roles,
        };
        await navigationService.updateItem(item.id, updates);
      } else {
        const newItem: CreateNavigationItemInput = {
          title: formData.title,
          path: formData.path,
          icon: formData.icon || null,
          parent_id: formData.parent_id || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
          roles,
        };
        await navigationService.createItem(newItem);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save navigation item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit Navigation Item' : 'Add Navigation Item'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="path" className="block text-sm font-medium text-gray-700 mb-1">
              Path *
            </label>
            <input
              id="path"
              type="text"
              required
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              placeholder="/admin/example"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <input
              id="icon"
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Home or 🏠"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use Lucide icon name (e.g., Home, Settings) or emoji
            </p>
          </div>

          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Item
            </label>
            <select
              id="parent_id"
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Root Level)</option>
              {parentItems.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="is_active"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Roles
            </label>
            <input
              id="roles"
              type="text"
              value={formData.roles}
              onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
              placeholder="authenticated, admin, dev"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated list of roles
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
