'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
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
  section: 'primary' | 'manage' | 'general' | 'pages';
}

type IconName =
  | 'dashboard'
  | 'organization'
  | 'coaching-center'
  | 'users'
  | 'academic'
  | 'coaching'
  | 'fees'
  | 'profile';

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ORGANIZATION_ADMIN]: 'Organization Administrator',
  [UserRole.COACHING_ADMIN]: 'Coaching Administrator',
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
    label: 'Dashboard',
    href: '/admin-roles/organization-admin',
    icon: 'dashboard',
    allowedRoles: [UserRole.ORGANIZATION_ADMIN],
    section: 'primary',
  },
  {
    label: 'Dashboard',
    href: '/admin-roles/coaching-admin',
    icon: 'dashboard',
    allowedRoles: [UserRole.COACHING_ADMIN],
    section: 'primary',
  },
  {
    label: 'Dashboard',
    href: '/admin-roles/admin',
    icon: 'dashboard',
    allowedRoles: [UserRole.ADMIN],
    section: 'primary',
  },
  {
    label: 'Onboarding Flow',
    href: '/admin-roles/admin/onboarding',
    icon: 'dashboard',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
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
    label: 'Manage Coaching Centers',
    href: '/admin-roles/coaching-centers',
    icon: 'coaching-center',
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
    href: '/admin-roles/manage-setting/academic',
    icon: 'academic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Enrollments',
    href: '/admin-roles/manage-setting/enrollments',
    icon: 'academic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Fees',
    href: '/admin-roles/manage-setting/fees',
    icon: 'fees',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  {
    label: 'Manage Coaching',
    href: '/admin-roles/manage-setting/coaching',
    icon: 'coaching',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'manage',
  },
  // Analytical Pages
  {
    label: 'Academic Analytics',
    href: '/admin-roles/pages/academic',
    icon: 'academic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'pages',
  },
  {
    label: 'Fees Analytics',
    href: '/admin-roles/pages/fees',
    icon: 'fees',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'pages',
  },
  {
    label: 'Users Analytics',
    href: '/admin-roles/pages/users',
    icon: 'users',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'pages',
  },
  {
    label: 'Student Analytics',
    href: '/admin-roles/pages/student',
    icon: 'users',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'pages',
  },
  {
    label: 'Teacher Analytics',
    href: '/admin-roles/pages/teacher',
    icon: 'users',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'pages',
  },
  {
    label: 'Classes Analytics',
    href: '/admin-roles/pages/classes',
    icon: 'academic',
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.COACHING_ADMIN, UserRole.ADMIN],
    section: 'pages',
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
  {
    label: 'Profile Settings',
    href: '/profile/settings',
    icon: 'profile',
    allowedRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.ORGANIZATION_ADMIN,
      UserRole.COACHING_ADMIN,
      UserRole.ADMIN,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.PARENT,
      UserRole.STAFF,
    ],
    section: 'general',
  },
];

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RoleBasedAppShell({ role, children }: RoleBasedAppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Desktop: collapsed/expanded toggle
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile: drawer open/closed
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track viewport size to show mobile header/drawer on mobile + medium screens (<=1023px)
  // Treat screens <= 1023px as "mobile-like" where the topbar/drawer should be used.
  const [isMobile, setIsMobile] = useState<boolean | null>(() =>
    typeof window === 'undefined' ? null : window.matchMedia('(max-width: 1023px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handle = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileOpen(false);
    };
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handle);
      return () => mq.removeEventListener('change', handle);
    }
    const legacyMq = mq as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    legacyMq.addListener?.(handle);
    return () => {
      legacyMq.removeListener?.(handle);
    };
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const items = useMemo(
    () => navItems.filter((item) => item.allowedRoles.includes(role)),
    [role]
  );
  const primaryItems = useMemo(() => items.filter((item) => item.section === 'primary'), [items]);
  const manageItems = useMemo(() => items.filter((item) => item.section === 'manage'), [items]);
  const generalItems = useMemo(() => items.filter((item) => item.section === 'general'), [items]);
  const pagesItems = useMemo(() => items.filter((item) => item.section === 'pages'), [items]);

  const desktopSidebarWidth = isCollapsed ? 80 : 288;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Mobile top bar ── */}
      {isMobile === true && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
          aria-label="Open navigation"
        >
          {/* Hamburger icon */}
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-semibold text-gray-800">Coaching SaaS</span>
        </header>
      )}

      {/* ── Mobile overlay backdrop ── */}
      {isMobile === true && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      {isMobile === true && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-72 flex-col overflow-hidden border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button inside drawer */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Coaching SaaS</p>
              <h2 className="mt-0.5 text-base font-semibold text-gray-900">Control Center</h2>
              <p className="text-xs text-gray-600">{roleLabels[role]}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              aria-label="Close navigation"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <SidebarContent
            role={role}
            primaryItems={primaryItems}
            manageItems={manageItems}
            generalItems={generalItems}
            pagesItems={pagesItems}
            pathname={pathname}
            userName={session?.user?.name ?? 'User'}
            collapsed={false}
            showHeader={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        style={{ width: `${desktopSidebarWidth}px` }}
        className="fixed inset-y-0 left-0 z-30 hidden h-screen flex-col overflow-hidden border-r border-gray-200 bg-white lg:flex"
      >
        <SidebarContent
          role={role}
          primaryItems={primaryItems}
          manageItems={manageItems}
          generalItems={generalItems}
          pagesItems={pagesItems}
          pathname={pathname}
          userName={session?.user?.name ?? 'User'}
          collapsed={isCollapsed}
          showHeader={true}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </aside>

      {/* ── Main content ── */}
      {/*
        Mobile  (<lg): no left margin — sidebar slides over the content as an overlay.
        Desktop (≥lg): left margin equals the sidebar width so content is pushed aside.
        We drive the desktop margin via a CSS custom property so the collapse animation
        is smooth without needing a JS resize listener.
      */}
      <main
        style={{ '--sidebar-w': `${desktopSidebarWidth}px` } as React.CSSProperties}
        className="min-h-screen pt-14 lg:pt-0 lg:ml-(--sidebar-w)"
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
  generalItems,
  pagesItems,
  pathname,
  userName,
  collapsed = false,
  showHeader = true,
  onToggleCollapse,
  onNavigate,
}: {
  role: UserRole;
  primaryItems: NavItem[];
  manageItems: NavItem[];
  generalItems: NavItem[];
  pagesItems: NavItem[];
  pathname: string;
  userName: string;
  collapsed?: boolean;
  showHeader?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const [manageOpen, setManageOpen] = useState(true);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);
  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="border-b border-gray-200 px-3 py-4">
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Coaching SaaS</p>
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
      )}

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
        {/* Pages section (placed directly after primary items) */}
        {pagesItems.length > 0 && (
          <div className="px-2">
            <div className="flex items-center justify-between mb-2">
              {!collapsed ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Pages</p>
              ) : (
                <p className="sr-only">Pages</p>
              )}
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setPagesOpen((s) => !s)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-50"
                  aria-expanded={pagesOpen}
                >
                  <svg className={`h-4 w-4 transform ${pagesOpen ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>

            {!collapsed && pagesOpen && (
              <ul className="space-y-1">
                {pagesItems.map((item) => {
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
            )}
          </div>
        )}

        {/* Collapsed: compact column showing only major section icons */}
        {collapsed && (
          <div className="flex flex-col items-center space-y-2 py-2">
            {manageItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onToggleCollapse?.();
                  setManageOpen(true);
                }}
                title="Manage"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50"
              >
                <SidebarIcon name="organization" active={false} />
              </button>
            )}
            {generalItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onToggleCollapse?.();
                  setGeneralOpen(true);
                }}
                title="General"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50"
              >
                <SidebarIcon name="profile" active={false} />
              </button>
            )}
            {pagesItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onToggleCollapse?.();
                  setPagesOpen(true);
                }}
                title="Pages"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50"
              >
                <SidebarIcon name="academic" active={false} />
              </button>
            )}
          </div>
        )}

        {manageItems.length > 0 && (
          <div className="px-2">
            <div className="flex items-center justify-between mb-2">
              {!collapsed ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Manage Setting</p>
              ) : (
                <p className="sr-only">Manage Setting</p>
              )}
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setManageOpen((s) => !s)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-50"
                  aria-expanded={manageOpen}
                >
                  <svg className={`h-4 w-4 transform ${manageOpen ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>

            {!collapsed && manageOpen && (
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
            )}
          </div>
        )}

        

        {generalItems.length > 0 && (
          <div className="px-2">
            <div className="flex items-center justify-between mb-2">
              {!collapsed ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">General</p>
              ) : (
                <p className="sr-only">General</p>
              )}
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setGeneralOpen((s) => !s)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-50"
                  aria-expanded={generalOpen}
                >
                  <svg className={`h-4 w-4 transform ${generalOpen ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>

            {!collapsed && generalOpen && (
              <ul className="space-y-1">
                {generalItems.map((item) => {
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
            )}
          </div>
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
    case 'coaching-center':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l9-4-9-4-9 4 9 4zm0 8v10M7 21h10" />
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
    case 'coaching':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h5M6 3h12a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V5a2 2 0 012-2z" />
        </svg>
      );
    case 'fees':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2 0-3 1-3 2s1 2 3 2 3 1 3 2-1 2-3 2m0-10V6m0 12v-2" />
        </svg>
      );
    case 'profile':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" />
        </svg>
      );
    default:
      return null;
  }
}
