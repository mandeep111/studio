"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createSolution } from '@/lib/firestore';
import { Card, CardContent, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { SubmitButton } from './submit-button';

interface CreateSolutionFormProps {
    problemId: string;
    problemTitle: string;
    onSolutionCreated: () => void;
}

export default function CreateSolutionForm({ problemId, problemTitle, onSolutionCreated }: CreateSolutionFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a solution." });
        setLoading(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const description = formData.get('description') as string;

    if (!description || description.length < 20) {
        toast({ variant: "destructive", title: "Validation Error", description: "Description must be at least 20 characters." });
        setLoading(false);
        return;
    }

    try {
        await createSolution(description, problemId, problemTitle, userProfile);
        toast({ title: "Success!", description: "Solution posted successfully." });
        formRef.current?.reset();
        onSolutionCreated(); // Callback to refetch solutions
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to post solution." });
    } finally {
        setLoading(false);
    }
  };


  return (
    <Card>
      <form ref={formRef} onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <Textarea
            name="description"
            placeholder="Describe your innovative solution here..."
            className="min-h-[120px]"
            required
            disabled={loading}
          />
        </CardContent>
        <CardFooter>
          <SubmitButton className="ml-auto" disabled={loading} pendingText="Posting...">Post Solution</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
