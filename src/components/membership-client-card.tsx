"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { upgradeMembershipAction } from "@/app/actions";
import { useState } from "react";


interface MembershipClientCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    lifetimePrice: number;
    isPaymentEnabled: boolean;
}

export default function MembershipClientCard({
    title,
    description,
    icon,
    features,
    lifetimePrice,
    isPaymentEnabled,
}: MembershipClientCardProps) {
    const { userProfile, loading } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleUpgrade = async () => {
        if (!userProfile) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to upgrade your membership."});
            return;
        }

        setIsSubmitting(true);
       
        const result = await upgradeMembershipAction('investor', 'lifetime', lifetimePrice, userProfile);

        if (result.success) {
            if (result.url) {
                window.location.href = result.url;
            } else if (result.instant) {
                toast({ title: "Success!", description: "Your membership has been upgraded successfully."});
                window.location.reload();
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }

        setIsSubmitting(false);
    }
    
    const isCurrentPlan = userProfile?.role === 'Investor';

    return (
        <Card className="flex flex-col max-w-md border-primary ring-2 ring-primary">
            <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1 rounded-t-lg">
                LIFETIME ACCESS
            </div>
            <CardHeader>
                <div className="flex items-center gap-4">
                    {icon}
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <p className="text-4xl font-bold">${lifetimePrice}</p>
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
                        <Button onClick={handleUpgrade} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPaymentEnabled ? `Get Lifetime Access - $${lifetimePrice}` : "Upgrade for Free"}
                        </Button>
                    )
                )}
            </CardFooter>
        </Card>
    )
}
