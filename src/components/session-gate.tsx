"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, useLogin } from "@/hooks/use-session";
import { toast } from "sonner";

/**
 * Auth gate for private surfaces. One-click demo sign-in (seeded demo user) or email sign-in
 * (creates a fresh user). Mirrors §1d session flow; all private APIs 401 until signed in.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isError, data } = useSession();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"demo" | "email" | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading session">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!isError && data?.user) {
    return <>{children}</>;
  }

  const signIn = async (target: "demo" | "email", mail: string) => {
    setBusy(target);
    try {
      await login(mail);
      toast.success("Welcome to HF Studio");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">Welcome to HF Studio</CardTitle>
          <CardDescription>
            Sign in to start generating. The demo creator account ships with 1,000 wallet credits,
            10 daily credits and 5 free Nano Banana Pro generations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            disabled={busy !== null}
            onClick={() => void signIn("demo", "demo@hf-studio.local")}
          >
            {busy === "demo" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Continue as demo creator
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or sign in with email
            <span className="h-px flex-1 bg-border" />
          </div>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) void signIn("email", email.trim());
            }}
          >
            <Label htmlFor="signin-email" className="sr-only">
              Email
            </Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@studio.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Button type="submit" variant="secondary" className="w-full" disabled={busy !== null || !email.trim()}>
              {busy === "email" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
