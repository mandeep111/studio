"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createSolution } from '@/lib/firestore';
import { Card, CardContent, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { SubmitButton } from './submit-button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { DollarSign } from 'lucide-react';

interface CreateSolutionFormProps {
    problemId: string;
    problemTitle: string;
    onSolutionCreated: () => void;
}

export default function CreateSolutionForm({ problemId, problemTitle, onSolutionCreated }: CreateSolutionFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [attachment, setAttachment] = useState<File | null>(null);

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);

    if (!userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to submit a solution." });
        setFormLoading(false);
        return;
    }

    const formData = new FormData(event.currentTarget);
    const description = formData.get('description') as string;
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;

    if (!description || description.length < 20) {
        toast({ variant: "destructive", title: "Validation Error", description: "Description must be at least 20 characters." });
        setFormLoading(false);
        return;
    }
     if (price && isNaN(price)) {
        toast({ variant: "destructive", title: "Validation Error", description: "Price must be a valid number."});
        setFormLoading(false);
        return;
    }

    try {
        await createSolution(description, problemId, problemTitle, price, userProfile, attachment || undefined);
        toast({ title: "Success!", description: "Solution posted successfully." });
        formRef.current?.reset();
        setAttachment(null);
        onSolutionCreated(); // Callback to refetch solutions
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to post solution." });
    } finally {
        setFormLoading(false);
    }
  };


  return (
    <Card>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="pt-6 space-y-4">
          <Textarea
            name="description"
            placeholder="Describe your innovative solution here..."
            className="min-h-[120px]"
            required
            disabled={isFieldsDisabled}
          />
           <div className="space-y-2">
            <Label htmlFor="price-solution">Price (Optional)</Label>
             <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="price-solution" name="price" type="number" step="0.01" placeholder="100.00" className="pl-8" disabled={isFieldsDisabled} />
            </div>
            <p className="text-xs text-muted-foreground">
            Set a price for your solution. Prices over $1,000 require admin approval.
            </p>
          </div>
           <div className="space-y-2">
            <Label htmlFor="attachment-solution">Attachment (Optional)</Label>
            <Input id="attachment-solution" name="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} disabled={isFieldsDisabled} />
            <p className="text-xs text-muted-foreground">
                Premium users will be able to see this attachment.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton className="ml-auto" disabled={isSubmitDisabled} pendingText="Posting...">Post Solution</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
