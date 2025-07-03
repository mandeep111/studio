"use client";

import { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

export default function AdDisplay() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="my-8 flex justify-center text-center text-muted-foreground text-sm">
      <div>
        <p>Advertisement</p>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: '90px' }}
          data-ad-client="ca-pub-1119691945074832"
          data-ad-slot="YOUR_AD_SLOT_ID_HERE"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
}
