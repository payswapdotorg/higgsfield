"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Apple, Chrome, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type SocialProvider = "google" | "apple" | "microsoft";

const SOCIAL_BUTTONS: {
  provider: SocialProvider;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    provider: "google",
    label: "Continue with Google",
    icon: <Chrome className="size-4" aria-hidden="true" />,
  },
  {
    provider: "apple",
    label: "Continue with Apple",
    icon: <Apple className="size-4" aria-hidden="true" />,
  },
  {
    provider: "microsoft",
    label: "Continue with Microsoft",
    icon: <LayoutGrid className="size-4" aria-hidden="true" />,
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<SocialProvider | "email" | null>(
    null,
  );

  const finishSignIn = async () => {
    // Session source of truth is GET /api/user — refresh every query after
    // the credentials round-trip.
    await queryClient.invalidateQueries();
  };

  const handleSocial = async (provider: SocialProvider) => {
    setPending(provider);
    setEmailError(null);
    try {
      const result = await signIn("credentials", {
        email: `${provider}.demo@hf-studio.local`,
        callbackUrl: "/quiz",
        redirect: false,
      });
      if (result && typeof result.error === "string" && result.error) {
        toast.error("Could not sign in — please try again", {
          description: result.error,
        });
        return;
      }
      onOpenChange(false);
      await finishSignIn();
      router.push("/quiz");
    } finally {
      setPending(null);
    }
  };

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError("Enter a valid email address to continue.");
      return;
    }
    setEmailError(null);
    setPending("email");
    try {
      const result = await signIn("credentials", {
        email: trimmed,
        callbackUrl: "/quiz",
        redirect: false,
      });
      if (result && typeof result.error === "string" && result.error) {
        setEmailError("Sign-in failed. Please try again.");
        return;
      }
      onOpenChange(false);
      await finishSignIn();
      router.push("/quiz");
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-zinc-800 bg-zinc-950 p-6 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-zinc-50">
            Welcome to HF Studio
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Sign in to keep your projects, generations and credits in sync.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {SOCIAL_BUTTONS.map(({ provider, label, icon }) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="h-11 w-full justify-start gap-3 border-zinc-800 bg-zinc-900 text-sm font-medium text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800"
              onClick={() => void handleSocial(provider)}
              disabled={pending !== null}
            >
              {icon}
              {pending === provider ? "Continuing…" : label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-zinc-800" />
          <span className="text-xs uppercase tracking-widest text-zinc-500">
            or
          </span>
          <Separator className="flex-1 bg-zinc-800" />
        </div>

        <form className="flex flex-col gap-2" onSubmit={handleEmail}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email address"
            aria-invalid={emailError ? true : undefined}
            className="h-11 border-zinc-800 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending !== null}
          />
          {emailError ? (
            <p role="alert" className="text-xs text-red-400">
              {emailError}
            </p>
          ) : null}
          <Button
            type="submit"
            className="h-11 w-full bg-white text-sm font-semibold text-black hover:bg-zinc-200"
            disabled={pending !== null}
          >
            {pending === "email" ? "Continuing…" : "Continue"}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Sandbox build — social buttons sign in with demo accounts.
        </p>
      </DialogContent>
    </Dialog>
  );
}
