import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ExternalLink } from "lucide-react";
import type { Ad } from "@/lib/types";

interface AdCardProps {
    ad: Ad;
}

export default function AdCard({ ad }: AdCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg border-2 border-dashed border-primary/50 bg-accent/20">
      <CardHeader>
        <Badge variant="outline" className="w-fit">Sponsored</Badge>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center text-center gap-4">
        <div className="relative w-full aspect-video">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            className="rounded-md object-cover"
          />
        </div>
        <CardTitle className="text-lg leading-tight">{ad.title}</CardTitle>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <Button asChild className="w-full">
          <a href={ad.linkUrl} target="_blank" rel="noopener sponsored">
            Learn More <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
