"use client";

import { BrainCircuit, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-4 flex items-center">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="ml-2 font-heading text-2xl font-bold">TriSolve</h1>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {!loading && (
            userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="profile picture" />
                      <AvatarFallback>{userProfile.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground pt-1">
                        Role: <span className="font-semibold">{userProfile.role}</span>
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
