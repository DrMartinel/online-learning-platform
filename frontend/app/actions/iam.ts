'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;
  
  if (!token) throw new Error('Unauthorized');
  
  const backendUrl = process.env.BACKEND_URL;
  
  const res = await fetch(`${backendUrl}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await res.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  
  // Try to parse JSON, if it's 204 or empty it will fail gracefully
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// --- Roles ---

export async function createRoleAction(data: { urn: string, description?: string }) {
  const result = await fetchWithAuth('/admin/iam/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  revalidatePath('/admin/iam');
  return result;
}

export async function updateRoleAction(id: string, data: { urn?: string, description?: string }) {
  const result = await fetchWithAuth(`/admin/iam/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  revalidatePath('/admin/iam');
  return result;
}

export async function deleteRoleAction(id: string) {
  const result = await fetchWithAuth(`/admin/iam/roles/${id}`, {
    method: 'DELETE',
  });
  revalidatePath('/admin/iam');
  return result;
}

export async function updateRolePermissionsAction(roleId: string, permissionIds: string[]) {
  const result = await fetchWithAuth(`/admin/iam/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });
  revalidatePath('/admin/iam');
  return result;
}

// --- Permissions ---

export async function createPermissionAction(data: { urn: string, description?: string }) {
  const result = await fetchWithAuth('/admin/iam/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  revalidatePath('/admin/iam');
  return result;
}

export async function updatePermissionAction(id: string, data: { urn?: string, description?: string }) {
  const result = await fetchWithAuth(`/admin/iam/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  revalidatePath('/admin/iam');
  return result;
}

export async function deletePermissionAction(id: string) {
  const result = await fetchWithAuth(`/admin/iam/permissions/${id}`, {
    method: 'DELETE',
  });
  revalidatePath('/admin/iam');
  return result;
}
