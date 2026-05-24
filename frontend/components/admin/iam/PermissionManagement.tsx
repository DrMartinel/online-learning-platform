'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Key } from 'lucide-react';
import { createPermissionAction, updatePermissionAction, deletePermissionAction } from '@/app/actions/iam';

export default function PermissionManagement({ permissions }: { permissions: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<any | null>(null);
  const [formData, setFormData] = useState({ urn: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openModal = (perm?: any) => {
    setError('');
    if (perm) {
      setEditingPerm(perm);
      setFormData({ urn: perm.urn, description: perm.description || '' });
    } else {
      setEditingPerm(null);
      setFormData({ urn: 'action:', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPerm(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingPerm) {
        await updatePermissionAction(editingPerm.id, formData);
      } else {
        await createPermissionAction(formData);
      }
      closeModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this permission? This may break application functionality.')) {
      try {
        await deletePermissionAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Key size={20} className="text-emerald-500" />
          Permissions
        </h3>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
        >
          <Plus size={16} /> New Permission
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">URN</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {permissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No permissions found.</td>
              </tr>
            ) : permissions.map((perm) => (
              <tr key={perm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-gray-900 dark:text-white">{perm.urn}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{perm.description || '-'}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => openModal(perm)} className="text-gray-400 hover:text-blue-500 p-1 mr-1">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(perm.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingPerm ? 'Edit Permission' : 'New Permission'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URN</label>
                  <input
                    type="text"
                    required
                    value={formData.urn}
                    onChange={(e) => setFormData({ ...formData, urn: e.target.value })}
                    placeholder="action:resource:operation"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must start with "action:"</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
