"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  currentRole: 'student' | 'operator' | 'admin';
}

const roleColors = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  operator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  student: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function UserRoleSelect({ userId, currentRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'student' | 'operator' | 'admin';
    setRole(newRole);
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update user role');
        }
        
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred');
        setRole(currentRole);
      }
    });
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={role}
        onChange={handleRoleChange}
        disabled={isPending}
        className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-semibold outline-none cursor-pointer border border-transparent transition-colors disabled:opacity-50 ${roleColors[role]} hover:border-gray-300 dark:hover:border-gray-600`}
      >
        <option value="student">Student</option>
        <option value="operator">Operator</option>
        <option value="admin">Admin</option>
      </select>
      <div className="absolute right-2 pointer-events-none text-current opacity-70">
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
      </div>
    </div>
  );
}
