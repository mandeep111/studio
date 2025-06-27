"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createProblem } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';

export default function CreateProblemForm() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a problem." });
        setLoading(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    
    // Basic validation
    if (!title || !description || !tags) {
        toast({ variant: "destructive", title: "Validation Error", description: "All fields are required." });
        setLoading(false);
        return;
    }

    try {
        await createProblem(title, description, tags, userProfile);
        toast({ title: "Success!", description: "Problem submitted successfully." });
        router.push('/');
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to submit problem." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <SubmitButton pendingText="Submitting..." disabled={loading}>Submit Problem</SubmitButton>
      </div>
    </form>
  );
}
