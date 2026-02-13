/**
 * Organization Admin Dashboard
 * Dashboard for managing schools and organizations
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Badge } from '@/shared/components/ui/Badge';

interface Organization {
  id: string;
  name: string;
  type: string;
  city: string;
  students: number;
  teachers: number;
  status: 'active' | 'inactive';
}

interface Stat {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

const stats: Stat[] = [
  {
    label: 'Total Schools',
    value: '12',
    change: '+2 this month',
    icon: '🏫',
    color: 'blue',
  },
  {
    label: 'Active Students',
    value: '4,850',
    change: '+125 enrolled',
    icon: '👥',
    color: 'green',
  },
  {
    label: 'Total Teachers',
    value: '380',
    change: '+15 hired',
    icon: '👨‍🏫',
    color: 'purple',
  },
  {
    label: 'Operations Cost',
    value: '$125K',
    change: '↓ 5% vs last month',
    icon: '💰',
    color: 'red',
  },
];

const organizations: Organization[] = [
  {
    id: '1',
    name: 'Central High School',
    type: 'High School',
    city: 'New York',
    students: 450,
    teachers: 35,
    status: 'active',
  },
  {
    id: '2',
    name: 'Lincoln Middle School',
    type: 'Middle School',
    city: 'Boston',
    students: 380,
    teachers: 28,
    status: 'active',
  },
  {
    id: '3',
    name: 'Riverside Elementary',
    type: 'Elementary School',
    city: 'Chicago',
    students: 520,
    teachers: 32,
    status: 'active',
  },
  {
    id: '4',
    name: 'Oak Valley Academy',
    type: 'Private School',
    city: 'Los Angeles',
    students: 280,
    teachers: 22,
    status: 'active',
  },
  {
    id: '5',
    name: 'Spring Garden College',
    type: 'High School',
    city: 'Houston',
    students: 650,
    teachers: 48,
    status: 'inactive',
  },
];

export default function OrganizationAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const userRole = (session?.user as { role?: UserRole } | undefined)?.role;
  const isAuthorized =
    userRole === UserRole.ORGANIZATION_ADMIN || userRole === UserRole.SCHOOL_ADMIN;
  const isLoading = status === 'loading' || (status === 'authenticated' && !isAuthorized);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    if (status === 'authenticated' && !isAuthorized) {
      router.push('/auth/signin');
    }
  }, [isAuthorized, router, status]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${colorMap[stat.color]} rounded-lg p-6 shadow-sm hover:shadow-md transition`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  <p className="text-xs opacity-75 mt-2">{stat.change}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Organizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organizations List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Schools</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                  + New School
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        School Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Teachers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {organizations.map((org) => (
                      <tr
                        key={org.id}
                        className="hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">
                            {org.name}
                          </span>
                          <p className="text-sm text-gray-500">{org.city}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {org.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {org.students}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {org.teachers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={org.status === 'active' ? 'green' : 'gray'}>
                            {org.status.charAt(0).toUpperCase() +
                              org.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-700 mr-4">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Selected School Details */}
          <div className="bg-white rounded-lg shadow-md h-fit">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedOrg ? 'School Details' : 'Select a School'}
              </h2>
            </div>
            {selectedOrg ? (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">School Name</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedOrg.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedOrg.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedOrg.city}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Students</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedOrg.students}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">
                      Teachers
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedOrg.teachers}
                    </p>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    View Full Details
                  </button>
                  <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
                    Manage Users
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>Click on a school to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {[
              { label: 'Add School', icon: '➕', href: '/admin-roles/schools/create' },
              { label: 'Manage Users', icon: '👥', href: '/admin-roles/users' },
              { label: 'Academic Setup', icon: '📚', href: '/admin-roles/academic' },
              { label: 'Fee Management', icon: '💰', href: '/admin-roles/fees' },
              { label: 'Generate Report', icon: '📊' },
              { label: 'Budget Management', icon: '💼' },
              { label: 'System Settings', icon: '⚙️' },
            ].map((action, index) => {
              const content = (
                <>
                  <span className="text-2xl mb-2">{action.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {action.label}
                  </span>
                </>
              );

              return action.href ? (
                <a
                  key={index}
                  href={action.href}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition"
                >
                  {content}
                </a>
              ) : (
                <button
                  key={index}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
