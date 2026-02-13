'use client';

import { useSession } from 'next-auth/react';
import { Badge } from '@/shared/components/ui/Badge';

interface AdminStats {
  totalUsers: number;
  activeClasses: number;
 pendingFees: number;
  supportTickets: number;
}

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  status: 'done' | 'pending';
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const stats: AdminStats = {
    totalUsers: 1480,
    activeClasses: 56,
    pendingFees: 37,
    supportTickets: 6,
  };

  const activities: ActivityItem[] = [
    {
      id: '1',
      title: 'New teacher account created',
      detail: 'Mathematics department onboarding completed.',
      date: '2026-02-12',
      status: 'done',
    },
    {
      id: '2',
      title: 'Fee reminder batch scheduled',
      detail: 'Monthly reminders for pending invoices.',
      date: '2026-02-12',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Class section updated',
      detail: 'Section 9-B capacity increased to 42 students.',
      date: '2026-02-11',
      status: 'done',
    },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h2>
          <p className="mt-2 text-gray-600">General administration workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Active Classes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeClasses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4-9 4-9-4zm0 7l9 4 9-4M3 7v7m18-7v7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pending Fees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingFees}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v-2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Open Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.supportTickets}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414a2 2 0 00-2.828 0l-8.486 8.486a2 2 0 00-.586 1.414V18h3.878a2 2 0 001.414-.586l8.022-8.022a2 2 0 000-2.828z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Modules</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/admin-roles/users" className="rounded-md border border-blue-200 p-4 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors">
                  User Registration
                </a>
                <a href="/admin-roles/academic" className="rounded-md border border-green-200 p-4 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors">
                  Academic Setup
                </a>
                <a href="/admin-roles/fees" className="rounded-md border border-yellow-200 p-4 text-sm font-medium text-yellow-700 hover:bg-yellow-50 transition-colors">
                  Fee Management
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {activities.map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <Badge variant={item.status === 'done' ? 'green' : 'yellow'} className="px-2">
                        {item.status === 'done' ? 'Done' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
