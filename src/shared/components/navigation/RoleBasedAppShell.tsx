'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';

interface RoleBasedAppShellProps {
  role: UserRole;
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  allowedRoles: UserRole[];
  section: 'primary' | 'manage';
}

type IconName =
  | 'dashboard'
  | 'organization'
  | 'school'
  | 'users'
  | 'academic'
  | 'fees';

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ORGANIZATION_ADMIN]: 'Organization Administrator',
  [UserRole.SCHOOL_ADMIN]: 'School Administrator',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.STUDENT]: 'Student',
  [UserRole.PARENT]: 'Parent',
  [UserRole.STAFF]: 'Staff',
};

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin-roles/superadmin',
    icon: 'dashboard',
    allowedRoles: [UserRole.SUPER_ADMIN],
    section: 'primary',
  },
  {
    label: 'Onboarding Flow',
    href: '/admin-roles/admin/onboarding',
    icon: 'dashboard',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
    section: 'primary',
  },
  {
    label: 'Manage Organizations',
    href: '/admin-roles/organizations',
    icon: 'organization',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Schools',
    href: '/admin-roles/schools',
    icon: 'school',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Users',
    href: '/admin-roles/users',
    icon: 'users',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Academic',
    href: '/admin-roles/academic',
    icon: 'academic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Enrollments',
    href: '/admin-roles/enrollments',
    icon: 'academic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Fees',
    href: '/admin-roles/fees',
    icon: 'fees',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  {
    label: 'Admin Workspace',
    href: '/admin-roles/admin',
    icon: 'dashboard',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.ADMIN],
    section: 'primary',
  },
  {
    label: 'Dashboard',
    href: '/teacher/dashboard',
    icon: 'dashboard',
    allowedRoles: [UserRole.TEACHER],
    section: 'primary',
  },
  {
    label: 'Dashboard',
    href: '/student/dashboard',
    icon: 'dashboard',
    allowedRoles: [UserRole.STUDENT],
    section: 'primary',
  },
  {
    label: 'Dashboard',
    href: '/parent/dashboard',
    icon: 'dashboard',
    allowedRoles: [UserRole.PARENT],
    section: 'primary',
  },
  {
    label: 'Dashboard',
    href: '/staff/dashboard',
    icon: 'dashboard',
    allowedRoles: [UserRole.STAFF],
    section: 'primary',
  },
];

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RoleBasedAppShell({ role, children }: RoleBasedAppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const items = useMemo(
    () => navItems.filter((item) => item.allowedRoles.includes(role)),
    [role]
  );
  const primaryItems = useMemo(() => items.filter((item) => item.section === 'primary'), [items]);
  const manageItems = useMemo(() => items.filter((item) => item.section === 'manage'), [items]);
  const sidebarWidth = isCollapsed ? 80 : 288;

  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="fixed inset-y-0 left-0 z-30 flex h-screen max-h-screen flex-col overflow-hidden border-r border-gray-200 bg-white"
      >
        <SidebarContent
          role={role}
          primaryItems={primaryItems}
          manageItems={manageItems}
          pathname={pathname}
          userName={session?.user?.name ?? 'User'}
          collapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </aside>

      <main
        style={{
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100vw - ${sidebarWidth}px)`,
        }}
        className="min-h-screen"
      >
        <div className="min-h-screen w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  role,
  primaryItems,
  manageItems,
  pathname,
  userName,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  role: UserRole;
  primaryItems: NavItem[];
  manageItems: NavItem[];
  pathname: string;
  userName: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-3 py-4">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">School SaaS</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">Control Center</h2>
              <p className="mt-1 text-xs text-gray-600">{roleLabels[role]}</p>
            </div>
          ) : (
            <p className="mx-auto text-xs font-semibold text-gray-500">SMS</p>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {primaryItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`${collapsed ? 'mx-auto' : 'mr-3'} inline-flex`}>
                    <SidebarIcon name={item.icon} active={active} />
                  </span>
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {manageItems.length > 0 && !collapsed && (
          <div className="px-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Manage Setting
            </p>
            <ul className="space-y-1">
              {manageItems.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3 inline-flex">
                        <SidebarIcon name={item.icon} active={active} />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {manageItems.length > 0 && collapsed && (
          <ul className="space-y-1">
            {manageItems.map((item) => {
              const active = isItemActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={item.label}
                    className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mx-auto inline-flex">
                      <SidebarIcon name={item.icon} active={active} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {!collapsed && <p className="truncate text-sm font-medium text-gray-900">{userName}</p>}
        <button
          type="button"
          onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
          title={collapsed ? 'Sign Out' : undefined}
          className={`rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
            collapsed ? 'mt-0 w-full' : 'mt-3 w-full'
          }`}
        >
          {collapsed ? '↪' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}

function SidebarIcon({ name, active }: { name: IconName; active: boolean }) {
  const iconColor = active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700';
  const className = `h-4 w-4 ${iconColor}`;

  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10h16V10" />
        </svg>
      );
    case 'organization':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21V7l8-4 8 4v14M9 21v-4h6v4" />
        </svg>
      );
    case 'school':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l9 4-9 4-9-4 9-4zm0 8v10M7 21h10" />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 10-8 0m12 7v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        </svg>
      );
    case 'academic':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
        </svg>
      );
    case 'fees':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2 0-3 1-3 2s1 2 3 2 3 1 3 2-1 2-3 2m0-10V6m0 12v-2" />
        </svg>
      );
    default:
      return null;
  }
}
