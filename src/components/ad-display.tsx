"use client";

import type { Ad } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/badge";

export default function AdDisplay({ ad }: { ad: Ad }) {
  if (!ad) return null;

  // As requested, using a dummy ad object for now.
  // This can be switched back to use the dynamic 'ad' prop later.
  const dummyAd = {
    title: "Your Advertisement Here",
    imageUrl: "https://placehold.co/728x90.png",
    linkUrl: "#",
  };

  return (
    <div className="my-8">
      <div className="relative rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <a href={dummyAd.linkUrl} target="_blank" rel="noopener sponsored">
            <div className="relative h-[90px] w-full mb-4">
                <Image
                src={dummyAd.imageUrl}
                alt={dummyAd.title}
                fill
                className="rounded-md object-contain"
                data-ai-hint="advertisement banner"
                />
            </div>
            <h4 className="font-semibold text-lg hover:underline">{dummyAd.title}</h4>
        </a>
        <Badge variant="outline" className="absolute top-2 right-2">Ad</Badge>
      </div>
    </div>
  );
}
