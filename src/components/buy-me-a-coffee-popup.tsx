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
import { Coffee } from "lucide-react";

interface BuyMeACoffeePopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export default function BuyMeACoffeePopup({ isOpen, onOpenChange, onConfirm }: BuyMeACoffeePopupProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-amber-600" />
            One Last Step!
          </DialogTitle>
          <DialogDescription>
            Help support the platform and its creators. In a real application, this would be a small payment to facilitate the introduction.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p className="text-sm text-muted-foreground">
                For this demo, no payment is required. Click continue to open the group chat.
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
