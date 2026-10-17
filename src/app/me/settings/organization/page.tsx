import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/organization — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key `/_private/me/settings/_team/organization`.
 * No organization settings body captured (free-plan private workspace) → shell +
 * the real workspace facts from the captured user body.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organization — Settings — HF Studio",
};

export default async function OrganizationPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);

  return (
    <UncapturedShell
      icon={Building2}
      title="Organization"
      manifestKey="/_private/me/settings/_team/organization"
      facts={[
        { label: "workspace_type", value: u.workspace_type },
        { label: "workspace_role", value: u.workspace_role },
        { label: "enterprise_new_main", value: String(u.enterprise_new_main) },
      ]}
      disclosure={
        <p>
          Organization settings bodies were never captured (the survey account is a private
          workspace, not an organization). The workspace facts above are real captured user-body
          keys; organization-profile, SSO-domain and policy surfaces are not rendered because
          no evidence for them exists.
        </p>
      }
    />
  );
}
