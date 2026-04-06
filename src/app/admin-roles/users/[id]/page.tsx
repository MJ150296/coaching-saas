import { redirect } from 'next/navigation';

export default function AdminUserProfileRedirect({ params }: { params: { id: string } }) {
  redirect(`/profile/users/${encodeURIComponent(params.id)}`);
}
