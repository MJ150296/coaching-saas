export default function CreateSchoolPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">Create Coaching Center</h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <a className="text-indigo-600 hover:underline" href="/admin-roles/coaching-centers">Back to Coaching Centers</a>
        <a className="text-indigo-600 hover:underline" href="/admin-roles/users">Users</a>
        <a className="text-indigo-600 hover:underline" href="/admin-roles/manage-setting/academic">Academic</a>
        <a className="text-indigo-600 hover:underline" href="/admin-roles/manage-setting/fees">Fees</a>
      </div>
      <p className="mt-2 text-gray-600">Coaching center creation UI scaffold.</p>
    </main>
  );
}
