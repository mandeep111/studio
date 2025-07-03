
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
import { Lightbulb, DollarSign, Gem, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TagInput } from "./ui/tag-input";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createIdeaAction } from "@/app/actions";


interface SubmitIdeaDialogProps {
  onIdeaCreated: () => void;
  children?: React.ReactNode;
  isPaymentEnabled: boolean;
}

const ideaFormSchema = z.object({
  title: z.string().min(10, { message: "Title must be at least 10 characters long." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters long." }),
  price: z.string().optional(),
});


export function SubmitIdeaDialog({ onIdeaCreated, children, isPaymentEnabled }: SubmitIdeaDialogProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof ideaFormSchema>>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: { title: "", description: "", price: "" },
  });

  const isFieldsDisabled = authLoading || formLoading;
  const isSubmitDisabled = authLoading || formLoading || !user;

  const canSetPrice = userProfile && (userProfile.isPremium || userProfile.points >= 10000);
  const showPriceInput = !isPaymentEnabled || canSetPrice;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachment(e.target.files?.[0] || null);
  };

  const handleRemoveAttachment = () => {
      setAttachment(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };


  const onSubmit = async (values: z.infer<typeof ideaFormSchema>) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit an idea." });
        return;
    }
    setFormLoading(true);

    const result = await createIdeaAction({
      userId: user.uid,
      title: values.title,
      description: values.description,
      price: values.price,
      tags,
      attachment,
    });

    if (result.success) {
        toast({ title: "Success!", description: result.message });
        form.reset();
        setTags([]);
        handleRemoveAttachment();
        onIdeaCreated();
        setOpen(false);
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
    
    setFormLoading(false);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a Random Idea</DialogTitle>
          <DialogDescription>
            Have a brilliant thought that isn't tied to a specific problem? Share it here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="A catchy title for your idea" {...field} disabled={isFieldsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your idea in detail" {...field} disabled={isFieldsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <TagInput
                value={tags}
                onChange={setTags}
                placeholder="e.g. AI, Health..."
                disabled={isFieldsDisabled}
                />
            </div>
            <div className="space-y-2">
                <Label>Price (Optional)</Label>
                {showPriceInput ? (
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="100.00" className="pl-8" {...field} disabled={isFieldsDisabled}/>
                                </FormControl>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Set a price for your idea. Prices over $1,000 require admin approval.
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted border">
                    <Gem className="h-4 w-4 text-primary" />
                    <span>Become an <Link href="/membership" className="underline text-primary">Investor</Link> or earn 10,000 points to set a price.</span>
                </div>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="attachment-idea-dialog">Attachment (Optional)</Label>
                 {!attachment ? (
                    <Input
                        id="attachment-idea-dialog"
                        name="attachment"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isFieldsDisabled}
                    />
                ) : (
                    <div className="flex items-center justify-between p-2 text-sm border rounded-md">
                        <span className="truncate max-w-xs">{attachment.name}</span>
                        <Button variant="ghost" size="icon" onClick={handleRemoveAttachment} type="button" disabled={isFieldsDisabled}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Investors will be able to see this attachment.
                </p>
            </div>
            <DialogFooter>
                <SubmitButton disabled={isSubmitDisabled} pendingText="Submitting...">Submit Idea</SubmitButton>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
