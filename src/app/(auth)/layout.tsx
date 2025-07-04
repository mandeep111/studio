import React from 'react';

// This is a minimal pass-through layout to resolve a Next.js build error.
// A layout file must export a default component, even if it does nothing.
export default function ConflictingAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
