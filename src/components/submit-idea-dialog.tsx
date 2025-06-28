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
import { Lightbulb, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createIdea } from "@/lib/firestore";
import { TagInput } from "./ui/tag-input";

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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);

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

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title || !description || tags.length === 0) {
        toast({ variant: "destructive", title: "Validation Error", description: "All fields are required." });
        setFormLoading(false);
        return;
    }

    try {
        await createIdea(title, description, tags, userProfile, attachment || undefined);
        toast({ title: "Success!", description: "Idea submitted successfully." });
        formRef.current?.reset();
        setTags([]);
        setAttachment(null);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a Random Idea</DialogTitle>
          <DialogDescription>
            Have a brilliant thought that isn't tied to a specific problem? Share it here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
            </Label>
            <Input id="title" name="title" placeholder="A catchy title for your idea" required disabled={isFieldsDisabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea id="description" name="description" placeholder="Describe your idea in detail" required disabled={isFieldsDisabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags
            </Label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="e.g. AI, Health..."
              disabled={isFieldsDisabled}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="attachment-idea">Attachment (Optional)</Label>
            <Input id="attachment-idea" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
            <p className="text-xs text-muted-foreground">
                Premium users will be able to see this attachment.
            </p>
          </div>
          <DialogFooter>
            <SubmitButton disabled={isSubmitDisabled} pendingText="Submitting...">Submit Idea</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
