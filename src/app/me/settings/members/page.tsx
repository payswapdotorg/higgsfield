import type { Metadata } from "next";
import { Users } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/members — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/_team/members`.
 * The captured operator account is a private workspace (user body:
 * workspace_type "private", workspace_role "owner", workspace_membership_exists
 * false) — zero member-management bodies in the survey → shell + the real
 * workspace facts, nothing invented.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Members — Settings — HF Studio",
};

export default async function MembersPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);

  return (
    <UncapturedShell
      icon={Users}
      title="Members"
      manifestKey="/_private/me/settings/_team/members"
      facts={[
        { label: "workspace_type", value: u.workspace_type },
        { label: "workspace_role", value: u.workspace_role },
        { label: "workspace_id", value: u.workspace_id },
      ]}
      disclosure={
        <p>
          The captured account is a single-owner private workspace (the user body carries
          workspace_membership_exists: false), so no member list, seat management or invite
          bodies were captured in the 2026-10-17 survey. The workspace facts above are the real
          captured user-body keys; everything else is intentionally absent.
        </p>
      }
    />
  );
}
