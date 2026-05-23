import { cookies } from 'next/headers';
import UsersClientView from './UsersClientView';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'operator' | 'admin';
  avatarUrl?: string;
  createdAt: string;
}

async function getUsers(): Promise<UserProfile[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    const cookieStore = await cookies();
    const token = cookieStore.get('olp_session')?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/admin/users`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <UsersClientView initialUsers={users} />;
}
