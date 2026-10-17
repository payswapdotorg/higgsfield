import type { Metadata } from "next";
import { Network } from "lucide-react";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { UncapturedShell } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";

/**
 * /me/settings/sub-workspaces — HF-W5 honest shell (PRIVATE).
 * Route truth: route-preload-manifest.json key
 * `/_private/me/settings/_team/sub-workspaces`. No sub-workspace bodies captured
 * → shell only, nothing invented.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sub-workspaces — Settings — HF Studio",
};

export default async function SubWorkspacesPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  return (
    <UncapturedShell
      icon={Network}
      title="Sub-workspaces"
      manifestKey="/_private/me/settings/_team/sub-workspaces"
      disclosure={
        <p>
          Sub-workspace management bodies were never captured in the 2026-10-17 survey (the
          captured account has a single private workspace). This tab ships as an honest shell —
          no sub-workspace list, quota or creation surface is invented.
        </p>
      }
    />
  );
}
