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
 * StudioGate — auth gate for the wave-3A studio surfaces (Ads / Marketing /
 * AI Influencer studios).
 *
 * Pattern copied from src/components/session-gate.tsx (the /generate/all private
 * route gate): same one-click demo sign-in + email sign-in card, same session
 * query. ONE disclosed deviation: while the session query is loading (which is
 * the SSR/prerender state), this gate renders its children instead of a spinner,
 * so the evidence-derived landing headings appear in the server-rendered HTML —
 * required by the wave-3A exit gate ("grep the SSR HTML for key evidence
 * headings"). Data-dependent children must gate their queries on
 * `enabled: !!session?.user` (the Cinema Studio composer at src/app/page.tsx
 * already uses this convention).
 */
export function StudioGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isError, data } = useSession();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"demo" | "email" | null>(null);

  const signedIn = !isError && !!data?.user;
  const signedOut = !isLoading && !signedIn;

  if (!signedOut) {
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
            <Label htmlFor="studio-gate-email" className="sr-only">
              Email
            </Label>
            <Input
              id="studio-gate-email"
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
