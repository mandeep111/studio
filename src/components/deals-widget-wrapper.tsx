"use client";
import { useAuth } from "@/hooks/use-auth";
import DealsWidget from "@/components/deals-widget";
import { usePathname } from "next/navigation";

export function DealsWidgetWrapper() {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user || pathname.startsWith('/deals')) {
        return null;
    }
    
    return <DealsWidget />;
}
