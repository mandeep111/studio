
import { redirect } from 'next/navigation';

// This component is not meant to be rendered.
// It exists to resolve a build-time routing conflict.
// It redirects to the correct login page.
export default function ConflictingLoginPage() {
  redirect('/login');
  // The redirect function throws an error, so this part is never reached.
  // A return is needed to satisfy TypeScript.
  return null;
}
