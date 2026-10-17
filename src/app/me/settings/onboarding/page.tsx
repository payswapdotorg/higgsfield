import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";

/**
 * /me/settings/onboarding — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/onboarding`.
 * No onboarding-preferences body captured → shell only, nothing invented.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding — Settings — HF Studio",
};

export default async function OnboardingPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  return (
    <UncapturedShell
      icon={Compass}
      title="Onboarding"
      manifestKey="/_private/me/settings/onboarding"
      disclosure={
        <p>
          Onboarding-preference bodies (role/goal re-selection, survey answers, tour state) were
          never captured for this route. This tab ships as an honest shell — no preference form
          is invented.
        </p>
      }
    />
  );
}
