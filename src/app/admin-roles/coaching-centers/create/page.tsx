import Link from 'next/link';

export default function CreateCoachingCenterPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">Create Coaching Center</h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <Link className="text-indigo-600 hover:underline" href="/admin-roles/coaching-centers">Back to Coaching Centers</Link>
        <Link className="text-indigo-600 hover:underline" href="/admin-roles/users">Users</Link>
        <Link className="text-indigo-600 hover:underline" href="/admin-roles/manage-setting/academic">Academic</Link>
        <Link className="text-indigo-600 hover:underline" href="/admin-roles/manage-setting/fees">Fees</Link>
      </div>
      <p className="mt-2 text-gray-600">Coaching center creation UI scaffold.</p>
    </main>
  );
}
