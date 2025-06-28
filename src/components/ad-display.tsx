"use client";

import type { Ad } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/badge";

export default function AdDisplay({ ad }: { ad: Ad }) {
  if (!ad) return null;

  return (
    <div className="my-8">
      <div className="relative rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <a href={ad.linkUrl} target="_blank" rel="noopener sponsored">
            <div className="relative aspect-video w-full mb-4">
                <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="rounded-md object-cover"
                />
            </div>
            <h4 className="font-semibold text-lg hover:underline">{ad.title}</h4>
        </a>
        <Badge variant="outline" className="absolute top-2 right-2">Ad</Badge>
      </div>
    </div>
  );
}
