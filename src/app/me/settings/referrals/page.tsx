import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";

/**
 * /me/settings/referrals — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/referrals`.
 * No referral bodies captured → shell only, nothing invented.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Referrals — Settings — HF Studio",
};

export default async function ReferralsPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  return (
    <UncapturedShell
      icon={UserPlus}
      title="Referrals"
      manifestKey="/_private/me/settings/referrals"
      disclosure={
        <p>
          Referral codes, invite links and referral-reward bodies were never captured in the
          2026-10-17 survey. This tab ships as an honest shell — no referral link, reward
          balance or invite table is invented.
        </p>
      }
    />
  );
}
