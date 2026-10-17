import type { Metadata } from "next";
import { SettingsNav } from "@/components/settings/settings-nav";

/**
 * /me/settings layout — HF-W5.
 *
 * LAYOUT DISCLOSURE: the live settings page layout was never captured
 * (evidence/rea-2026-10-17/surfaces/inspect-settings.json is a policy-filtered
 * 404 shell — see README.md § evidence index, line ~144). This sidebar/content
 * shell is a disclosed clone-side choice following the app-shell sidebar pattern
 * (src/components/app-shell.tsx); the ROUTE LIST inside SettingsNav is verbatim
 * from the route-preload-manifest keys /_private/me/settings{,/_team/…}.
 *
 * Auth gating happens per-page (server components resolve the session cookie via
 * src/lib/page-auth.ts and render <SignInGate/> for guests) so each tab's
 * evidence-shaped body is server-rendered.
 */

export const metadata: Metadata = {
  title: "Settings — HF Studio",
  description: "Account, consents, subscription and billing settings.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-2 lg:py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, consents, subscription and billing.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
