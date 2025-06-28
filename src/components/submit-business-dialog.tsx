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
}

export function SubmitBusinessDialog({ onBusinessCreated, children }: SubmitBusinessDialogProps) {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>List Your Business</DialogTitle>
          <DialogDescription>
            Provide details about your running business to attract investors.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <CreateBusinessForm onBusinessCreated={handleBusinessCreated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
