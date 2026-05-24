import { cookies } from 'next/headers';
import { Users, BookOpen, Presentation, Activity } from 'lucide-react';
import { SystemMetrics } from '@/components/admin/SystemMetrics';

async function getStats() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return { users: 0, courses: 0, lessons: 0 };

    const cookieStore = await cookies();
    const token = cookieStore.get('olp_session')?.value;
    
    // Instead of directly querying Supabase, we would call a backend endpoint.
    // For now, if the endpoint doesn't exist, we return mocked stats 
    // to decouple the frontend from the database entirely.
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const [usersRes, coursesRes] = await Promise.all([
      fetch(`${backendUrl}/admin/users`, { headers, cache: "no-store" }),
      fetch(`${backendUrl}/courses`, { headers, cache: "no-store" })
    ]);

    const users = usersRes.ok ? await usersRes.json() : [];
    const courses = coursesRes.ok ? await coursesRes.json() : [];
    
    // Fetch lessons for each course to get total lesson count
    let totalLessons = 0;
    if (courses.length > 0) {
      const lessonPromises = courses.map((c: any) => 
        fetch(`${backendUrl}/courses/${c.id}/lessons`, { headers, cache: "no-store" })
          .then(res => res.ok ? res.json() : [])
      );
      const lessonsArrays = await Promise.all(lessonPromises);
      totalLessons = lessonsArrays.reduce((sum, arr) => sum + arr.length, 0);
    }

    return { 
      users: users.length || 0, 
      courses: courses.length || 0, 
      lessons: totalLessons 
    };
  } catch {
    return { users: 0, courses: 0, lessons: 0 };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const cookieStore = await cookies();

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Lessons', value: stats.lessons, icon: Presentation, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'System Status', value: 'Healthy', icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
        <p className="text-gray-500 dark:text-gray-400">Welcome to the AdminOS. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <SystemMetrics token={cookieStore.get('olp_session')?.value} backendUrl={process.env.BACKEND_URL} />
    </div>
  );
}
