"use client";

import { useActionState, useEffect, useRef } from 'react';
import { createProblem, type FormState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';

const initialState: FormState = {
  message: '',
};

export default function CreateProblemForm() {
  const [state, formAction] = useActionState(createProblem, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast({
        variant: state.error ? 'destructive' : 'default',
        title: state.error ? 'Error' : 'Success!',
        description: state.message,
      });
      if (!state.error) {
        formRef.current?.reset();
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Problem Title</Label>
        <Input id="title" name="title" placeholder="e.g., Plastic waste in oceans" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the problem in detail. What is the context? Who is affected? What are the current challenges?"
          className="min-h-[120px]"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="e.g. Sustainability, Environment, Technology (comma-separated)" required />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of tags.
        </p>
      </div>
      <div className="flex justify-end">
        <SubmitButton>Submit Problem</SubmitButton>
      </div>
    </form>
  );
}
