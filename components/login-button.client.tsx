"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut } from "next-auth/react";
import { Github, LogOut } from "lucide-react";
import { useTransition } from "react";

type ButtonProps = {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export function SignInWithGithubButton({ className, size, variant }: ButtonProps) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      className={className}
      size={size}
      variant={variant ?? "default"}
      disabled={isPending}
      onClick={() => startTransition(() => signIn("github"))}
    >
      <Github className="size-4" />
      Sign in with GitHub
    </Button>
  );
}

export function SignOutButton({ className, size, variant }: ButtonProps) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      className={className}
      size={size}
      variant={variant ?? "outline"}
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
