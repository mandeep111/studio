"use client";
import { useAuth } from "@/hooks/use-auth";
import DealsWidget from "@/components/deals-widget";

export function DealsWidgetWrapper() {
    const { user } = useAuth();
    if (!user) return null;
    return <DealsWidget />;
}
