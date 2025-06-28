"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Coffee, DollarSign } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";

interface BuyMeACoffeePopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (amount: number) => void;
}

export default function BuyMeACoffeePopup({ isOpen, onOpenChange, onConfirm }: BuyMeACoffeePopupProps) {
  const [amount, setAmount] = useState(10);
  const { toast } = useToast();
  
  const handleConfirm = () => {
    if (amount < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "The minimum contribution is $10."
      });
      return;
    }
    onConfirm(amount);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-amber-600" />
            Support the Creators
          </DialogTitle>
          <DialogDescription>
            Facilitate this introduction by contributing to the platform. This small gesture helps keep the platform running and shows your appreciation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="coffee-amount">Contribution Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="coffee-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="10"
                step="1"
                className="pl-8"
              />
            </div>
             <p className="text-xs text-muted-foreground">
                Minimum contribution is $10.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>
            <Coffee className="mr-2 h-4 w-4" />
            Continue to Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
