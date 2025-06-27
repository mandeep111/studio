"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "./submit-button";
import { Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createIdea } from "@/lib/firestore";

interface SubmitIdeaDialogProps {
  onIdeaCreated: () => void;
  children?: React.ReactNode;
}

export function SubmitIdeaDialog({ onIdeaCreated, children }: SubmitIdeaDialogProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit an idea." });
        setFormLoading(false);
        return;
    }

    if (userProfile.role !== 'User' && userProfile.role !== 'Admin') {
        toast({ variant: "destructive", title: "Permission Denied", description: "Only Users and Admins can create ideas." });
        setFormLoading(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;

    if (!title || !description || !tags) {
        toast({ variant: "destructive", title: "Validation Error", description: "All fields are required." });
        setFormLoading(false);
        return;
    }

    try {
        await createIdea(title, description, tags, userProfile);
        toast({ title: "Success!", description: "Idea submitted successfully." });
        formRef.current?.reset();
        onIdeaCreated();
        setOpen(false);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to submit idea." });
    } finally {
        setFormLoading(false);
    }
  };


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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit a Random Idea</DialogTitle>
          <DialogDescription>
            Have a brilliant thought that isn't tied to a specific problem? Share it here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" name="title" className="col-span-3" placeholder="A catchy title for your idea" required disabled={isFieldsDisabled} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea id="description" name="description" className="col-span-3" placeholder="Describe your idea in detail" required disabled={isFieldsDisabled} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <Input id="tags" name="tags" className="col-span-3" placeholder="e.g. AI, Health (comma-separated)" required disabled={isFieldsDisabled} />
          </div>
          <DialogFooter>
            <SubmitButton disabled={isSubmitDisabled} pendingText="Submitting...">Submit Idea</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
