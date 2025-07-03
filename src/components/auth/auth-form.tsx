
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { UserRole } from "@/lib/types";
import { getRandomAvatar } from "@/lib/avatars";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { verifyRecaptcha } from "@/app/actions";

const executeRecaptcha = (action: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (!siteKey || typeof window === 'undefined' || !(window as any).grecaptcha?.enterprise) {
            console.warn("reCAPTCHA not configured or not loaded. Skipping.");
            resolve(null);
            return;
        }

        (window as any).grecaptcha.enterprise.ready(async () => {
            try {
                const token = await (window as any).grecaptcha.enterprise.execute(siteKey, { action });
                resolve(token);
            } catch (error) {
                console.error("reCAPTCHA execution error:", error);
                resolve(null);
            }
        });
    });
};

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.98-4.66 1.98-3.56 0-6.47-2.92-6.47-6.47s2.91-6.47 6.47-6.47c1.97 0 3.29.79 4.06 1.52l2.36-2.36C18.22 2.72 15.82 1.5 12.48 1.5c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.85 0 8.7-3.23 8.7-8.84 0-.62-.06-1.22-.18-1.78Z"
    />
  </svg>
);

const passwordPolicy = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const loginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(1, { message: "Password is required." }),
});

const signupSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: passwordPolicy,
    role: z.enum(["User", "Investor"]),
    expertise: z.string().min(2, { message: "Expertise must be at least 2 characters." }),
});

const PasswordPolicyItem = ({ isMet, text }: { isMet: boolean; text: string }) => (
    <div className={cn("flex items-center text-xs transition-colors", isMet ? "text-green-500" : "text-muted-foreground")}>
        {isMet ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
        {text}
    </div>
);


export function AuthForm() {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: "User", expertise: "" },
  });

  const watchedPassword = signupForm.watch("password", "");
  const passwordPolicies = {
      length: watchedPassword.length >= 8,
      uppercase: /[A-Z]/.test(watchedPassword),
      lowercase: /[a-z]/.test(watchedPassword),
      number: /[0-9]/.test(watchedPassword),
      special: /[^A-Za-z0-9]/.test(watchedPassword),
  };
  
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handlePasswordReset = async () => {
    if(!resetEmail) {
        toast({ variant: "destructive", title: "Error", description: "Please enter your email address." });
        return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for instructions to reset your password." });
      setResetEmail("");
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setResetLoading(false);
    }
  }

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);

    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        const token = await executeRecaptcha('LOGIN');
        if (!token) {
            toast({
                variant: "destructive",
                title: "Security Error",
                description: "Could not initialize security check. Please refresh the page and try again.",
            });
            setLoading(false);
            return;
        }

        const recaptchaResult = await verifyRecaptcha(token);
        if (!recaptchaResult.success) {
            toast({
                variant: "destructive",
                title: "Security Check Failed",
                description: recaptchaResult.message,
            });
            setLoading(false);
            return;
        }
    }

    try {
      const result = await signInWithEmailAndPassword(auth, values.email, values.password);
      if (!result.user.emailVerified) {
          toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Please verify your email address before logging in. Check your inbox for the verification link.",
          });
          setLoading(false);
          return;
      }
      toast({ title: "Success", description: "Logged in successfully." });
      router.push("/marketplace");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const usersCollectionRef = collection(db, "users");
        const q = query(usersCollectionRef, limit(1));
        const existingUsersSnapshot = await getDocs(q);
        const isFirstUser = existingUsersSnapshot.empty;
        const userRole: UserRole = isFirstUser ? "Admin" : "User";
        
        const avatarUrl = user.photoURL || getRandomAvatar(userRole);

        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "New User",
          role: userRole,
          expertise: "Not specified",
          avatarUrl: avatarUrl,
          points: 0,
          isPremium: isFirstUser, // First user is Admin and Premium
          unreadDealMessages: {},
        });
      }
      toast({ title: "Success", description: "Logged in with Google successfully." });
      router.push("/marketplace");
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message,
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  const handleSignUp = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);
    
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        const token = await executeRecaptcha('SIGNUP');
        if (!token) {
            toast({
                variant: "destructive",
                title: "Security Error",
                description: "Could not initialize security check. Please refresh the page and try again.",
            });
            setLoading(false);
            return;
        }

        const recaptchaResult = await verifyRecaptcha(token);
        if (!recaptchaResult.success) {
            toast({
                variant: "destructive",
                title: "Security Check Failed",
                description: recaptchaResult.message,
            });
            setLoading(false);
            return;
        }
    }

    try {
      const usersCollectionRef = collection(db, "users");
      const q = query(usersCollectionRef, limit(1));
      const existingUsersSnapshot = await getDocs(q);
      const isFirstUser = existingUsersSnapshot.empty;
      const userRole: UserRole = isFirstUser ? "Admin" : values.role;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      
      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: values.name,
        role: userRole,
        expertise: values.expertise,
        avatarUrl: getRandomAvatar(userRole),
        points: 0,
        isPremium: isFirstUser, // First user is Admin and Premium
        unreadDealMessages: {},
      });
      
      toast({ title: "Verification Email Sent", description: `A verification link has been sent to ${values.email}. Please check your inbox and verify your account before logging in.` });
      setActiveTab("login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
                    {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                    Login with Google
                  </Button>
                   <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="m@example.com" {...field} disabled={loading} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                           <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type={showLoginPassword ? "text" : "password"} {...field} disabled={loading} className="pl-10 pr-10" />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowLoginPassword(prev => !prev)}>
                                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-sm">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="link" className="p-0 h-auto">Forgot Password?</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset Password</AlertDialogTitle>
                            <AlertDialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input id="reset-email" type="email" placeholder="m@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                          </div>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handlePasswordReset} disabled={resetLoading}>
                                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Send Reset Link
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button disabled={loading || googleLoading} className="w-full" type="submit">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </CardFooter>
              </form>
            </Form>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignUp)}>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>
                    Create a new account to join the community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
                     {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                    Sign Up with Google
                  </Button>
                   <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Your name" {...field} disabled={loading} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="m@example.com" {...field} disabled={loading} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                           <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type={showSignupPassword ? "text" : "password"} {...field} disabled={loading} className="pl-10 pr-10" />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowSignupPassword(prev => !prev)}>
                                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                           </div>
                        </FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-2">
                            <PasswordPolicyItem isMet={passwordPolicies.length} text="At least 8 characters" />
                            <PasswordPolicyItem isMet={passwordPolicies.uppercase} text="One uppercase letter" />
                            <PasswordPolicyItem isMet={passwordPolicies.lowercase} text="One lowercase letter" />
                            <PasswordPolicyItem isMet={passwordPolicies.number} text="One number" />
                            <PasswordPolicyItem isMet={passwordPolicies.special} text="One special character" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am a...</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                           <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                           </FormControl>
                            <SelectContent>
                                <SelectItem value="User">User (Creator)</SelectItem>
                                <SelectItem value="Investor">Investor</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="expertise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area of Expertise</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sustainable Tech" {...field} disabled={loading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button disabled={loading || googleLoading} className="w-full" type="submit">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
