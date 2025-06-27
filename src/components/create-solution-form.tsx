"use client";

import { useActionState, useEffect, useRef } from 'react';
import { createSolution, type FormState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { SubmitButton } from './submit-button';

interface CreateSolutionFormProps {
    problemId: string;
}

const initialState: FormState = {
    message: '',
};

export default function CreateSolutionForm({ problemId }: CreateSolutionFormProps) {
  const [state, formAction] = useActionState(createSolution, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.error ? 'destructive' : 'default',
        title: state.error ? 'Error' : 'Success!',
        description: state.message,
      });
    }
    if (state.resetKey) {
        formRef.current?.reset();
    }
  }, [state, toast]);


  return (
    <Card>
      <form key={state.resetKey} ref={formRef} action={formAction}>
        <CardContent className="pt-6">
          <input type="hidden" name="problemId" value={problemId} />
          <Textarea
            name="description"
            placeholder="Describe your innovative solution here..."
            className="min-h-[120px]"
            required
          />
        </CardContent>
        <CardFooter>
          <SubmitButton className="ml-auto">Post Solution</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
