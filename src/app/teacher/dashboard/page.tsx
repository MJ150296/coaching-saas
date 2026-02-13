/**
 * Teacher Dashboard
 * /teacher/dashboard
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';

interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  pendingAssignments: number;
  averageClassTime: number;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  students: number;
  schedule: string;
}

interface Assignment {
  id: string;
  title: string;
  class: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
}

const stats: TeacherStats = {
  totalClasses: 4,
  totalStudents: 120,
  pendingAssignments: 5,
  averageClassTime: 45,
};

const classes: Class[] = [
  {
    id: '1',
    name: 'Mathematics 101',
    grade: '10-A',
    students: 32,
    schedule: 'Mon, Wed, Fri - 9:00 AM',
  },
  {
    id: '2',
    name: 'Advanced Calculus',
    grade: '12-B',
    students: 28,
    schedule: 'Tue, Thu - 10:00 AM',
  },
  {
    id: '3',
    name: 'Algebra Basics',
    grade: '9-C',
    students: 30,
    schedule: 'Mon, Wed, Fri - 2:00 PM',
  },
  {
    id: '4',
    name: 'Statistics & Probability',
    grade: '11-A',
    students: 30,
    schedule: 'Tue, Thu - 1:00 PM',
  },
];

const assignments: Assignment[] = [
  {
    id: '1',
    title: 'Chapter 5 Exercises',
    class: 'Mathematics 101',
    dueDate: '2026-02-15',
    submittedCount: 28,
    totalStudents: 32,
  },
  {
    id: '2',
    title: 'Calculus Problem Set',
    class: 'Advanced Calculus',
    dueDate: '2026-02-18',
    submittedCount: 22,
    totalStudents: 28,
  },
  {
    id: '3',
    title: 'Algebra Quiz',
    class: 'Algebra Basics',
    dueDate: '2026-02-12',
    submittedCount: 30,
    totalStudents: 30,
  },
  {
    id: '4',
    title: 'Statistics Project',
    class: 'Statistics & Probability',
    dueDate: '2026-02-20',
    submittedCount: 15,
    totalStudents: 30,
  },
  {
    id: '5',
    title: 'Research Paper',
    class: 'Advanced Calculus',
    dueDate: '2026-03-01',
    submittedCount: 5,
    totalStudents: 28,
  },
];

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: UserRole } | undefined)?.role;
  const isLoading = status === 'loading' || (status === 'authenticated' && userRole !== UserRole.TEACHER);

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && userRole !== UserRole.TEACHER) {
      router.push('/auth/signin');
    }
  }, [router, status, userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(' ')[0]}!</h2>
          <p className="mt-2 text-gray-600">Manage your classes and assignments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Classes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClasses}</p>
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
                    d="M12 6.253v13m0-13C6.228 6.228 2 10.456 2 15.5c0 5.044 4.228 9.272 10 9.272s10-4.228 10-9.272c0-5.044-4.228-9.247-10-9.247z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
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
                    d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Pending Grading</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingAssignments}</p>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Avg. Class Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageClassTime}m</p>
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Classes</h3>
                <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                  + Add Class
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {classes.map((cls) => (
                  <div key={cls.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <p className="text-sm text-gray-600">Grade: {cls.grade}</p>
                      </div>
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200">
                        Manage
                      </button>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {cls.students} Students
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {cls.schedule}
                      </div>
                    </div>
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
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-200">
                  ✓ Create New Assignment
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200">
                  📝 Grade Submissions
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-md transition-colors border border-purple-200">
                  📊 View Class Stats
                </button>
                <button className="w-full px-4 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors border border-orange-200">
                  💬 Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Pending Grading */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Assignments Pending Grading</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{assignment.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{assignment.class}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(assignment.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {assignment.submittedCount}/{assignment.totalStudents}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-green-600 hover:text-green-900 font-medium">Grade</button>
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
