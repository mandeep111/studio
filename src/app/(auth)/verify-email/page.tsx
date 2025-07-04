import { redirect } from 'next/navigation';

// This page is a workaround to resolve a routing conflict.
// It redirects to the correct verification page.
export default function ConflictingVerifyEmailPage() {
  redirect('/auth/verify-email');
  return null;
}
