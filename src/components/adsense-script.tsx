"use client";

import { usePathname } from 'next/navigation';
import Script from 'next/script';

const AUTH_PATHS = ['/login', '/auth/verify-email'];

export default function AdSenseScript() {
    const pathname = usePathname();
    const isAuthPage = AUTH_PATHS.some(path => pathname.startsWith(path));

    // Do not render AdSense script on authentication pages to comply with policy
    if (isAuthPage) {
        return null;
    }
    
    return (
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1119691945074832"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
    );
}
