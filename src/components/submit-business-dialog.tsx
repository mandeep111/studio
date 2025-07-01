
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateBusinessForm from "./create-business-form";
import { PlusCircle } from "lucide-react";

interface SubmitBusinessDialogProps {
    onBusinessCreated?: () => void;
    children?: React.ReactNode;
    isPaymentEnabled: boolean;
}

export function SubmitBusinessDialog({ onBusinessCreated, children, isPaymentEnabled }: SubmitBusinessDialogProps) {
  const [open, setOpen] = useState(false);

  const handleBusinessCreated = () => {
    if (onBusinessCreated) {
        onBusinessCreated();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                List Your Business
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List Your Business</DialogTitle>
          <DialogDescription>
            Provide details about your running business to attract investors.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <CreateBusinessForm onBusinessCreated={handleBusinessCreated} isPaymentEnabled={isPaymentEnabled} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
