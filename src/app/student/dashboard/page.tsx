/**
 * Student Dashboard
 * /student/dashboard
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { PageLoader } from '@/shared/components/ui/PageLoader';
import { useToast } from '@/shared/components/ui/ToastProvider';

interface SubjectItem {
  id: string;
  name: string;
  teacher: string;
  grade: string;
  progress: number;
}

interface ScheduleItem {
  id: string;
  subject: string;
  slot: string;
  periodNumber: number;
}

interface DueItem {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface PaymentItem {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: string;
}

interface StudentDashboardResponse {
  summary: {
    totalSubjects: number;
    todayClasses: number;
    pendingDues: number;
    feeClearance: number;
  };
  classLabel: string;
  subjects: SubjectItem[];
  todaySchedule: ScheduleItem[];
  dueItems: DueItem[];
  recentPayments: PaymentItem[];
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toastMessage } = useToast();
  const userRole = (session?.user as { role?: UserRole } | undefined)?.role;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StudentDashboardResponse>({
    summary: { totalSubjects: 0, todayClasses: 0, pendingDues: 0, feeClearance: 0 },
    classLabel: '',
    subjects: [],
    todaySchedule: [],
    dueItems: [],
    recentPayments: [],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && userRole !== UserRole.STUDENT) {
      router.push('/auth/signin');
    }
  }, [router, status, userRole]);

  useEffect(() => {
    if (status !== 'authenticated' || userRole !== UserRole.STUDENT) return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const response = await fetch('/api/student/dashboard');
        const body = (await response.json()) as StudentDashboardResponse & { error?: string };
        if (!response.ok) {
          toastMessage(body?.error || 'Failed to load student dashboard');
          return;
        }

        if (!active) return;
        setData({
          summary: {
            totalSubjects: Number(body?.summary?.totalSubjects ?? 0),
            todayClasses: Number(body?.summary?.todayClasses ?? 0),
            pendingDues: Number(body?.summary?.pendingDues ?? 0),
            feeClearance: Number(body?.summary?.feeClearance ?? 0),
          },
          classLabel: String(body?.classLabel ?? ''),
          subjects: Array.isArray(body?.subjects) ? body.subjects : [],
          todaySchedule: Array.isArray(body?.todaySchedule) ? body.todaySchedule : [],
          dueItems: Array.isArray(body?.dueItems) ? body.dueItems : [],
          recentPayments: Array.isArray(body?.recentPayments) ? body.recentPayments : [],
        });
      } catch (error) {
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [status, toastMessage, userRole]);

  const summary = useMemo(() => data.summary, [data.summary]);

  if (status === 'loading' || (status === 'authenticated' && userRole !== UserRole.STUDENT)) {
    return (
      <PageLoader
        message="Loading your dashboard..."
        spinnerClassName="h-12 w-12 border-b-2 border-blue-600"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(' ')[0]}!</h2>
          <p className="mt-2 text-gray-600">
            {data.classLabel ? `Class: ${data.classLabel}` : 'Here is your academic and fee overview.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Subjects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : summary.totalSubjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C6.228 6.228 2 10.456 2 15.5c0 5.044 4.228 9.272 10 9.272s10-4.228 10-9.272c0-5.044-4.228-9.247-10-9.247z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Classes Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : summary.todayClasses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pending Dues</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : summary.pendingDues}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Fee Clearance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : `${summary.feeClearance}%`}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Subjects</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {data.subjects.map((course) => (
                  <div key={course.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{course.name}</h4>
                        <p className="text-sm text-gray-600">{course.teacher}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {course.grade}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{course.progress}% Complete</p>
                  </div>
                ))}
                {data.subjects.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-600">
                    <p className="text-sm">{loading ? 'Loading subjects...' : 'No subjects found.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Dues</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {data.dueItems.map((item) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      INR {item.amount.toLocaleString()} · {item.status}
                    </p>
                    <div className="flex items-center mt-2">
                      <svg
                        className="w-4 h-4 text-red-500 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs text-red-600">
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {data.dueItems.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-600">
                    <p className="text-sm">{loading ? 'Loading dues...' : 'No pending dues.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {data.todaySchedule.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <p className="font-medium text-gray-900">{item.subject}</p>
                <p className="text-sm text-gray-600">{item.slot}</p>
              </div>
            ))}
            {data.todaySchedule.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-600">
                <p className="text-sm">{loading ? 'Loading schedule...' : 'No classes scheduled for today.'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentPayments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">INR {item.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.method}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.reference || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.paidAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {data.recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                      <p className="text-sm">{loading ? 'Loading payments...' : 'No payment records found.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
