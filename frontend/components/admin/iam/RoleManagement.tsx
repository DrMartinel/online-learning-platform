'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, Settings2 } from 'lucide-react';
import { createRoleAction, updateRoleAction, deleteRoleAction, updateRolePermissionsAction } from '@/app/actions/iam';

export default function RoleManagement({ roles, allPermissions, rolePermissionsMap }: { roles: any[], allPermissions: any[], rolePermissionsMap: Record<string, string[]> }) {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({ urn: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openRoleModal = (role?: any) => {
    setError('');
    if (role) {
      setEditingRole(role);
      setFormData({ urn: role.urn, description: role.description || '' });
    } else {
      setEditingRole(null);
      setFormData({ urn: 'role:', description: '' });
    }
    setIsRoleModalOpen(true);
  };

  const openPermModal = (role: any) => {
    setError('');
    setEditingRole(role);
    const existingPerms = rolePermissionsMap[role.id] || [];
    setSelectedPerms(new Set(existingPerms));
    setIsPermModalOpen(true);
  };

  const closeModals = () => {
    setIsRoleModalOpen(false);
    setIsPermModalOpen(false);
    setEditingRole(null);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingRole) {
        await updateRoleAction(editingRole.id, formData);
      } else {
        await createRoleAction(formData);
      }
      closeModals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setLoading(true);
    setError('');

    try {
      await updateRolePermissionsAction(editingRole.id, Array.from(selectedPerms));
      closeModals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role? Users with this role will lose permissions.')) {
      try {
        await deleteRoleAction(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const togglePermission = (permId: string) => {
    const newSet = new Set(selectedPerms);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setSelectedPerms(newSet);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          Roles
        </h3>
        <button
          onClick={() => openRoleModal()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
        >
          <Plus size={16} /> New Role
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
            {roles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No roles found.</td>
              </tr>
            ) : roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-gray-900 dark:text-white font-medium">{role.urn}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{role.description || '-'}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => openPermModal(role)} className="text-gray-400 hover:text-emerald-500 p-1 mr-2" title="Manage Permissions">
                    <Settings2 size={16} />
                  </button>
                  <button onClick={() => openRoleModal(role)} className="text-gray-400 hover:text-blue-500 p-1 mr-1" title="Edit Role">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(role.id)} className="text-gray-400 hover:text-red-500 p-1" title="Delete Role">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Edit Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <form onSubmit={handleRoleSubmit}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingRole ? 'Edit Role' : 'New Role'}
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
                    placeholder="role:namespace:name"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must start with "role:"</p>
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
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Assignment Modal */}
      {isPermModalOpen && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <form onSubmit={handlePermSubmit} className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Manage Permissions for {editingRole.urn}
                </h3>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPermissions.map((perm) => (
                    <label 
                      key={perm.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedPerms.has(perm.id) 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                        checked={selectedPerms.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate" title={perm.urn}>
                          {perm.urn}
                        </p>
                        {perm.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {allPermissions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No permissions available in the system.</p>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
