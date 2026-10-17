import type { Metadata } from "next";
import { MonitorSmartphone } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";

/**
 * /me/settings/sessions — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/sessions`.
 * No session-list body captured → shell only. (The clone's own session is the
 * hf_session cookie issued by /api/auth/login — noted in the disclosure; no
 * revoke-other-sessions affordance is invented.)
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sessions — Settings — HF Studio",
};

export default async function SessionsPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  return (
    <UncapturedShell
      icon={MonitorSmartphone}
      title="Sessions"
      manifestKey="/_private/me/settings/sessions"
      disclosure={
        <p>
          Device/session listing and remote-signout bodies were never captured in the survey.
          This clone&apos;s own session is the <code className="rounded bg-muted px-1 py-0.5 text-xs">hf_session</code>{" "}
          cookie (src/lib/auth.ts, §1d JWT chain) — the sign-out affordance lives in the account
          menu. No session table or revoke flow is invented here.
        </p>
      }
    />
  );
}
