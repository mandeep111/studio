
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
import CreateProblemForm from "./create-problem-form";
import { PlusCircle } from "lucide-react";

interface SubmitProblemDialogProps {
    onProblemCreated?: () => void;
    children?: React.ReactNode;
    isPaymentEnabled: boolean;
}

export function SubmitProblemDialog({ onProblemCreated, children, isPaymentEnabled }: SubmitProblemDialogProps) {
  const [open, setOpen] = useState(false);

  const handleProblemCreated = () => {
    if (onProblemCreated) {
        onProblemCreated();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Problem
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a New Problem</DialogTitle>
          <DialogDescription>
            Clearly articulate a problem you're facing or have identified. The community might have the solution.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <CreateProblemForm onProblemCreated={handleProblemCreated} isPaymentEnabled={isPaymentEnabled} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
