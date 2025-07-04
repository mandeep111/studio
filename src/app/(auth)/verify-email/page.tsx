
import { redirect } from 'next/navigation';

// This component is not meant to be rendered.
// It exists to resolve a build-time routing conflict.
// It redirects to the correct email verification page.
export default function ConflictingVerifyEmailPage() {
  redirect('/auth/verify-email');
  return null;
}
