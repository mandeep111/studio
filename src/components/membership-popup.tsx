"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import { upgradeMembershipAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

interface MembershipPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function MembershipPopup({ isOpen, onOpenChange }: MembershipPopupProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleBecomeInvestor = async () => {
    if (!userProfile) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        return;
    };
    setLoading(true);

    const result = await upgradeMembershipAction('investor', 'lifetime', 20, userProfile);

    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Unlock Investor Tools
          </DialogTitle>
          <DialogDescription>
            To use AI-powered matchmaking and start deals, you need an Investor membership. This gives you exclusive access to find and fund the best new ideas on OppChain.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" asChild>
            <Link href="/membership">Learn More</Link>
          </Button>
          <Button onClick={handleBecomeInvestor} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Become an Investor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
