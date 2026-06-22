"use client";

import { useState } from "react";

import { UserPlus, Mail, Calendar, UserIcon, Edit2, ShieldAlert } from "lucide-react";
import AvatarImage from "@/components/user/AvatarImage";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import UserModal from "@/components/admin/UserModal";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'operator' | 'admin';
  avatarUrl?: string;
  createdAt: string;
}

export default function UsersClientView({ initialUsers }: { initialUsers: UserProfile[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleAddClick = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-500 dark:text-gray-400">View and manage platform users and their roles.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm items-center gap-2">
            <ShieldAlert size={16} /> Admin Access
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {initialUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarImage 
                        avatarUrl={user.avatarUrl} 
                        fullName={user.fullName} 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail size={14} />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar size={14} />
                      <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <UserRoleSelect userId={user.id} currentRole={user.role} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {initialUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        user={selectedUser} 
      />
    </div>
  );
}
