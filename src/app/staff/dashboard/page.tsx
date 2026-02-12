/**
 * Staff Dashboard
 * /staff/dashboard
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';

interface StaffStats {
  totalDocuments: number;
  pendingRequests: number;
  completedTasks: number;
  upcomingMeetings: number;
}

interface Request {
  id: string;
  title: string;
  requester: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StaffStats>({
    totalDocuments: 0,
    pendingRequests: 0,
    completedTasks: 0,
    upcomingMeetings: 0,
  });
  const [requests, setRequests] = useState<Request[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated or not staff
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole && userRole !== UserRole.STAFF) {
        router.push('/auth/signin');
      } else {
        setIsLoading(false);
      }
    }
  }, [status, session, router]);

  // Fetch staff data
  useEffect(() => {
    if (status === 'authenticated') {
      setStats({
        totalDocuments: 245,
        pendingRequests: 8,
        completedTasks: 34,
        upcomingMeetings: 3,
      });

      setRequests([
        {
          id: '1',
          title: 'Student Registration Documents',
          requester: 'Admin Office',
          date: '2026-02-10',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '2',
          title: 'Grade Sheets Processing',
          requester: 'Academic Office',
          date: '2026-02-09',
          status: 'in-progress',
          priority: 'high',
        },
        {
          id: '3',
          title: 'Certificate Preparation',
          requester: 'Registrar',
          date: '2026-02-08',
          status: 'pending',
          priority: 'medium',
        },
        {
          id: '4',
          title: 'Attendance Report',
          requester: 'Principal Office',
          date: '2026-02-07',
          status: 'completed',
          priority: 'medium',
        },
        {
          id: '5',
          title: 'Fee Processing',
          requester: 'Finance Office',
          date: '2026-02-06',
          status: 'in-progress',
          priority: 'high',
        },
      ]);

      setTasks([
        {
          id: '1',
          title: 'Update Student Database',
          assignedTo: 'You',
          dueDate: '2026-02-12',
          status: 'in-progress',
        },
        {
          id: '2',
          title: 'Process Transfer Requests',
          assignedTo: 'You',
          dueDate: '2026-02-15',
          status: 'pending',
        },
        {
          id: '3',
          title: 'Prepare Admission Letters',
          assignedTo: 'Team',
          dueDate: '2026-02-18',
          status: 'pending',
        },
        {
          id: '4',
          title: 'Archive Old Records',
          assignedTo: 'You',
          dueDate: '2026-02-20',
          status: 'pending',
        },
      ]);
    }
  }, [status]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(' ')[0]}!</h2>
          <p className="mt-2 text-gray-600">Track your administrative tasks and requests</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDocuments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Completed Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Upcoming Meetings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingMeetings}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  + New Request
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <div key={request.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                        <p className="text-sm text-gray-600">From: {request.requester}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested: {new Date(request.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200">
                  📄 Generate Report
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-200">
                  ✓ Approve Request
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-md transition-colors border border-purple-200">
                  👥 Schedule Meeting
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors border border-orange-200">
                  📨 Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.assignedTo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
