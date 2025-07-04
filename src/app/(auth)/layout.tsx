
import React from 'react';

// This is a minimal pass-through layout. A layout file must exist and
// export a default component for the route group to be valid, even if its pages are inert.
export default function ConflictingAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
