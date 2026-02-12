export default function CreateSchoolPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">Create School</h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <a className="text-indigo-600 hover:underline" href="/admin-roles/schools">Back to Schools</a>
        <a className="text-indigo-600 hover:underline" href="/admin-roles/users">Users</a>
        <a className="text-indigo-600 hover:underline" href="/admin-roles/academic">Academic</a>
        <a className="text-indigo-600 hover:underline" href="/admin-roles/fees">Fees</a>
      </div>
      <p className="mt-2 text-gray-600">School creation UI scaffold.</p>
    </main>
  );
}
