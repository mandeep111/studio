"use client";

import { useActionState, useEffect, useRef } from "react";
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
import { createIdea, type FormState } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "./submit-button";
import { Lightbulb, PlusCircle } from "lucide-react";

const initialState: FormState = {
  message: "",
};

export function SubmitIdeaDialog() {
  const [state, formAction] = useActionState(createIdea, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.error ? "destructive" : "default",
        title: state.error ? "Error" : "Success!",
        description: state.message,
      });
      if (!state.error) {
        formRef.current?.reset();
      }
    }
  }, [state, toast]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Lightbulb className="mr-2 h-4 w-4" />
          Submit an Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit a Random Idea</DialogTitle>
          <DialogDescription>
            Have a brilliant thought that isn't tied to a specific problem? Share it here.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" name="title" className="col-span-3" placeholder="A catchy title for your idea" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea id="description" name="description" className="col-span-3" placeholder="Describe your idea in detail" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <Input id="tags" name="tags" className="col-span-3" placeholder="e.g. AI, Sustainability, Health (comma-separated)" />
          </div>
          <DialogFooter>
            <SubmitButton>Submit Idea</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
