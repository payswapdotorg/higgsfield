import type { Metadata } from "next";
import { Infinity as InfinityIcon } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/unlimited-access-history — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key
 * `/_private/me/settings/_team/unlimited-access-history`. The real datum: the
 * captured user body reports has_unlim false (and the settings body's
 * unlimited_settings is null) — no unlimited-access purchase history exists in
 * the survey → shell + the real flag.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unlimited access history — Settings — HF Studio",
};

export default async function UnlimitedAccessHistoryPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);

  return (
    <UncapturedShell
      icon={InfinityIcon}
      title="Unlimited access history"
      manifestKey="/_private/me/settings/_team/unlimited-access-history"
      facts={[
        { label: "has_unlim", value: String(u.has_unlim) },
        { label: "plan_type", value: u.plan_type },
      ]}
      disclosure={
        <p>
          The captured account has no unlimited access (user body key has_unlim: false; the
          settings body carries unlimited_settings: null), so no purchase history body was
          captured. The flag above is the real captured datum; the history list itself is
          intentionally absent.
        </p>
      }
    />
  );
}
