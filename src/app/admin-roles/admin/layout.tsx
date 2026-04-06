export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Note: RoleBasedAppShell is already provided by the parent admin-roles/layout.tsx
  // Adding it here would cause double nesting of sidebar shells
  return <>{children}</>;
}
