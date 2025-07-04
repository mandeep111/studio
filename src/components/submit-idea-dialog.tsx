
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lightbulb, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createIdeaAction } from "@/app/actions";
import CreateIdeaForm from "./create-idea-form";

interface SubmitIdeaDialogProps {
  onIdeaCreated: () => void;
  children?: React.ReactNode;
  isPaymentEnabled: boolean;
}

export function SubmitIdeaDialog({ onIdeaCreated, children, isPaymentEnabled }: SubmitIdeaDialogProps) {
  const [open, setOpen] = useState(false);
  
  const handleIdeaCreated = () => {
    if (onIdeaCreated) {
        onIdeaCreated();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
            <Button>
                <Lightbulb className="mr-2 h-4 w-4" />
                Submit an Idea
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a Random Idea</DialogTitle>
          <DialogDescription>
            Have a brilliant thought that isn't tied to a specific problem? Share it here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <CreateIdeaForm onIdeaCreated={handleIdeaCreated} isPaymentEnabled={isPaymentEnabled} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
