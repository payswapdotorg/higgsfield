import type { Metadata } from "next";
import { Ban } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/cancel — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/cancel`.
 * The real datums: the captured user body reports is_cancel_inited false and
 * plan_ends_at null on the free plan — there is nothing to cancel and no
 * cancellation-flow body was captured → shell + the real flags.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancel plan — Settings — HF Studio",
};

export default async function CancelPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);

  return (
    <UncapturedShell
      icon={Ban}
      title="Cancel plan"
      manifestKey="/_private/me/settings/cancel"
      facts={[
        { label: "plan_type", value: u.plan_type },
        { label: "is_cancel_inited", value: String(u.is_cancel_inited) },
        { label: "plan_ends_at", value: u.plan_ends_at ?? "null" },
      ]}
      disclosure={
        <p>
          The captured account is on the free plan (billing_period null, is_cancel_inited false,
          plan_ends_at null) — no cancellation flow or retention-offer body exists in the
          evidence. The flags above are the real captured user-body keys; no cancel/keep
          affordances are invented.
        </p>
      }
    />
  );
}
