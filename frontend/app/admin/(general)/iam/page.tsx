import { cookies } from 'next/headers';
import RoleManagement from '@/components/admin/iam/RoleManagement';
import PermissionManagement from '@/components/admin/iam/PermissionManagement';

async function fetchIamData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;
  
  if (!token) throw new Error('Unauthorized');
  
  const backendUrl = process.env.BACKEND_URL;
  const headers = { 'Authorization': `Bearer ${token}` };
  
  const [rolesRes, permsRes] = await Promise.all([
    fetch(`${backendUrl}/admin/iam/roles`, { headers, cache: 'no-store' }),
    fetch(`${backendUrl}/admin/iam/permissions`, { headers, cache: 'no-store' }),
  ]);
  
  if (!rolesRes.ok || !permsRes.ok) {
    throw new Error('Failed to fetch IAM data');
  }

  const roles = await rolesRes.json();
  const permissions = await permsRes.json();

  // Fetch permissions for each role
  const rolePermissionsMap: Record<string, string[]> = {};
  await Promise.all(roles.map(async (role: any) => {
    const res = await fetch(`${backendUrl}/admin/iam/roles/${role.id}/permissions`, { headers, cache: 'no-store' });
    if (res.ok) {
      rolePermissionsMap[role.id] = await res.json();
    } else {
      rolePermissionsMap[role.id] = [];
    }
  }));

  return { roles, permissions, rolePermissionsMap };
}

export default async function IamAdminPage() {
  let data;
  try {
    data = await fetchIamData();
  } catch (err: any) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        Failed to load IAM data. Make sure you have the required permissions. ({err.message})
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage system roles, permissions, and define access control across the platform.
        </p>
      </div>

      <RoleManagement 
        roles={data.roles} 
        allPermissions={data.permissions} 
        rolePermissionsMap={data.rolePermissionsMap} 
      />
      
      <PermissionManagement 
        permissions={data.permissions} 
      />
    </div>
  );
}
