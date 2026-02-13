/**
 * Student Dashboard
 * /student/dashboard
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';

interface StudentStats {
  totalCourses: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageGrade: number;
}

interface Course {
  id: string;
  name: string;
  teacher: string;
  grade: string;
  progress: number;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
}

const stats: StudentStats = {
  totalCourses: 5,
  completedAssignments: 12,
  pendingAssignments: 3,
  averageGrade: 85,
};

const courses: Course[] = [
  {
    id: '1',
    name: 'Mathematics',
    teacher: 'Dr. Smith',
    grade: 'A',
    progress: 85,
  },
  {
    id: '2',
    name: 'English Literature',
    teacher: 'Ms. Johnson',
    grade: 'B+',
    progress: 78,
  },
  {
    id: '3',
    name: 'Physics',
    teacher: 'Mr. Williams',
    grade: 'A-',
    progress: 88,
  },
  {
    id: '4',
    name: 'History',
    teacher: 'Dr. Brown',
    grade: 'B',
    progress: 72,
  },
  {
    id: '5',
    name: 'Chemistry',
    teacher: 'Ms. Davis',
    grade: 'A',
    progress: 90,
  },
];

const assignments: Assignment[] = [
  {
    id: '1',
    title: 'Calculus Problem Set 5',
    course: 'Mathematics',
    dueDate: '2026-02-15',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Essay: The Great Gatsby',
    course: 'English Literature',
    dueDate: '2026-02-18',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Physics Lab Report',
    course: 'Physics',
    dueDate: '2026-02-12',
    status: 'submitted',
  },
  {
    id: '4',
    title: 'Historical Analysis Essay',
    course: 'History',
    dueDate: '2026-02-20',
    status: 'pending',
  },
  {
    id: '5',
    title: 'Chemistry Experiment Observations',
    course: 'Chemistry',
    dueDate: '2026-02-10',
    status: 'graded',
    grade: 95,
  },
];

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: UserRole } | undefined)?.role;
  const isLoading = status === 'loading' || (status === 'authenticated' && userRole !== UserRole.STUDENT);

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && userRole !== UserRole.STUDENT) {
      router.push('/auth/signin');
    }
  }, [router, status, userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <p className="mt-2 text-gray-600">Here&apos;s your academic overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCourses}</p>
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
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedAssignments}</p>
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
                <p className="text-gray-600 text-sm font-medium">Pending</p>
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Average Grade</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageGrade}%</p>
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {courses.map((course) => (
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
              </div>
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pending Assignments</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {assignments
                  .filter((a) => a.status === 'pending')
                  .map((assignment) => (
                    <div key={assignment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <h4 className="font-medium text-gray-900 text-sm">{assignment.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{assignment.course}</p>
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
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                {assignments.filter((a) => a.status === 'pending').length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-600">
                    <p className="text-sm">No pending assignments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recently Graded</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments
                  .filter((a) => a.status === 'graded')
                  .map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{assignment.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{assignment.course}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {assignment.grade}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  ))}
                {assignments.filter((a) => a.status === 'graded').length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                      <p className="text-sm">No graded assignments yet</p>
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
