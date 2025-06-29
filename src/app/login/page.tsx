import { AuthForm } from "@/components/auth/auth-form";
import { P2PLogo } from "@/components/p2p-logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
            <P2PLogo className="h-12 w-12" />
            <h1 className="mt-4 font-heading text-3xl font-bold">Welcome to Problem2Profit</h1>
            <p className="text-muted-foreground">Log in or create an account to continue</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
