"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { upgradeMembershipAction } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { useState } from "react";


interface MembershipCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    monthlyPrice: number;
    lifetimePrice: number;
    planType: 'creator' | 'investor';
    isPopular?: boolean;
}

export default function MembershipCard({
    title,
    description,
    icon,
    features,
    monthlyPrice,
    lifetimePrice,
    planType,
    isPopular = false
}: MembershipCardProps) {
    const { userProfile, loading } = useAuth();
    const { toast } = useToast();
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [lifetimeLoading, setLifetimeLoading] = useState(false);
    
    const handleUpgrade = async (paymentFrequency: 'monthly' | 'lifetime', price: number) => {
        if (!userProfile) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to upgrade your membership."});
            return;
        }

        if (paymentFrequency === 'monthly') {
            setMonthlyLoading(true);
        } else {
            setLifetimeLoading(true);
        }

        const result = await upgradeMembershipAction(planType, paymentFrequency, price, userProfile);

        if (result.success && result.url) {
            window.location.href = result.url;
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }

        if (paymentFrequency === 'monthly') {
            setMonthlyLoading(false);
        } else {
            setLifetimeLoading(false);
        }
    }
    
    const isCurrentPlan = planType === 'investor' ? userProfile?.role === 'Investor' : (userProfile?.isPremium && userProfile?.role !== 'Investor');

    return (
        <Card className={cn("flex flex-col", isPopular && "border-primary ring-2 ring-primary")}>
            {isPopular && (
                <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1 rounded-t-lg">
                    MOST POPULAR
                </div>
            )}
            <CardHeader>
                <div className="flex items-center gap-4">
                    {icon}
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <ul className="grid gap-2 text-sm">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
                {isCurrentPlan ? (
                    <Button disabled variant="outline">Current Plan</Button>
                ) : (
                    loading ? (
                        <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>
                    ) : (
                        <>
                            <Button onClick={() => handleUpgrade('monthly', monthlyPrice)} disabled={monthlyLoading || lifetimeLoading}>
                                {monthlyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Subscribe - ${monthlyPrice}/mo
                            </Button>
                           <Button variant="outline" onClick={() => handleUpgrade('lifetime', lifetimePrice)} disabled={monthlyLoading || lifetimeLoading}>
                                {lifetimeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Get Lifetime - ${lifetimePrice}
                            </Button>
                        </>
                    )
                )}
            </CardFooter>
        </Card>
    )
}
