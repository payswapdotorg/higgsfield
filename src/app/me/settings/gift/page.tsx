import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/gift — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/gift`.
 * The live /gift checkout surface is part of the deferred billing-checkout group;
 * the captured user body reports is_gift_subscription false → shell + the real
 * flag, nothing invented.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gift — Settings — HF Studio",
};

export default async function GiftPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);

  return (
    <UncapturedShell
      icon={Gift}
      title="Gift"
      manifestKey="/_private/me/settings/gift"
      facts={[
        { label: "is_gift_subscription", value: String(u.is_gift_subscription) },
        { label: "plan_type", value: u.plan_type },
      ]}
      disclosure={
        <p>
          Gift-subscription purchase and redemption bodies were never captured (the captured
          account reports is_gift_subscription: false; the live /gift page is part of the
          deferred billing-checkout provider surface). The flag above is the real captured
          datum; no gift purchase flow is invented.
        </p>
      }
    />
  );
}
