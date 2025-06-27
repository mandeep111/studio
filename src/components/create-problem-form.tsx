"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createProblem } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from './submit-button';
import { DollarSign } from 'lucide-react';

interface CreateProblemFormProps {
    onProblemCreated?: () => void;
}

export default function CreateProblemForm({ onProblemCreated }: CreateProblemFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a problem." });
        setLoading(false);
        return;
    }

    if (userProfile.role !== 'User' && userProfile.role !== 'Admin') {
        toast({ variant: "destructive", title: "Permission Denied", description: "Only Users and Admins can create problems." });
        setLoading(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
    
    if (!title || !description || !tags) {
        toast({ variant: "destructive", title: "Validation Error", description: "All fields are required." });
        setLoading(false);
        return;
    }
    if (price && isNaN(price)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Price must be a valid number."});
        setLoading(false);
        return;
    }

    try {
        await createProblem(title, description, tags, price, userProfile);
        toast({ title: "Success!", description: "Problem submitted successfully. You've earned 50 points!" });
        formRef.current?.reset();
        if (onProblemCreated) {
            onProblemCreated();
        }
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to submit problem." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Problem Title</Label>
        <Input id="title" name="title" placeholder="e.g., Plastic waste in oceans" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the problem in detail. What is the context? Who is affected? What are the current challenges?"
          className="min-h-[120px]"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="e.g. Sustainability, Environment, Technology (comma-separated)" required disabled={loading}/>
        <p className="text-xs text-muted-foreground">
          Comma-separated list of tags.
        </p>
      </div>
       <div className="space-y-2">
        <Label htmlFor="price">Price (Optional)</Label>
        <div className="relative">
             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="price" name="price" type="number" step="0.01" placeholder="100.00" className="pl-8" disabled={loading}/>
        </div>
        <p className="text-xs text-muted-foreground">
          Set a price for your problem. Prices over $1,000 require admin approval.
        </p>
      </div>
      <div className="flex justify-end pt-4">
        <SubmitButton pendingText="Submitting..." disabled={loading}>Submit Problem</SubmitButton>
      </div>
    </form>
  );
}
