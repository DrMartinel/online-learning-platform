'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Activity, AlertTriangle } from 'lucide-react';

interface MetricPoint {
  time: string;
  count: number;
}

export function SystemMetrics({ token, backendUrl }: { token?: string, backendUrl?: string }) {
  const [requests, setRequests] = useState<MetricPoint[]>([]);
  const [errors, setErrors] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!backendUrl) return;
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [reqsRes, errsRes] = await Promise.all([
          fetch(`${backendUrl}/admin/system-analytics/requests`, { headers, cache: "no-store" }),
          fetch(`${backendUrl}/admin/system-analytics/errors`, { headers, cache: "no-store" })
        ]);

        if (reqsRes.ok) setRequests(await reqsRes.json());
        if (errsRes.ok) setErrors(await errsRes.json());
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, backendUrl]);

  if (loading) {
    return (
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 flex items-center justify-center min-h-[300px]">
         <div className="text-center animate-pulse">
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Loading Analytics...</h3>
         </div>
      </div>
    );
  }

  // Combine data by time for joint chart
  const combinedDataMap = new Map<string, { time: string, requests: number, errors: number }>();
  
  requests.forEach(r => {
    const timeLabel = new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    combinedDataMap.set(timeLabel, { time: timeLabel, requests: r.count, errors: 0 });
  });

  errors.forEach(e => {
    const timeLabel = new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (combinedDataMap.has(timeLabel)) {
      combinedDataMap.get(timeLabel)!.errors = e.count;
    } else {
      combinedDataMap.set(timeLabel, { time: timeLabel, requests: 0, errors: e.count });
    }
  });

  const chartData = Array.from(combinedDataMap.values()).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center mb-6">
          <Activity className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Request Volume (24h)</h3>
        </div>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error Rate (24h)</h3>
        </div>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
