import { redirect } from 'next/navigation';

// This page is a workaround to resolve a routing conflict.
// It redirects to the homepage to avoid an infinite loop and allow the build to succeed.
export default function ConflictingLoginPage() {
  redirect('/');
  return null;
}
