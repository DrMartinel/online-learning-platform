import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ResourcesManager from '@/components/admin/ResourcesManager';

export default async function AdminResourcesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    redirect('/login?next=/admin/resources');
  }

  return <ResourcesManager token={token} />;
}
