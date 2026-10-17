import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard } from "@/components/profile/profile-header";
import { UserGenerationsGrid } from "@/components/profile/generations-grid";
import { DisclosureCard } from "@/components/settings/settings-shared";

/**
 * /profile/[username] — HF-W5 public profile index (PUBLIC, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json keys
 * `/_private/profile/$username` (+ `/` duplicate). The profile DATA contract is
 * verbatim from api-bodies-digest.json → `profile`; the page LAYOUT was never
 * captured (no inspect-profile*.json in the survey) — header + tabs + a real
 * latest-generations preview is a disclosed clone-side composition.
 *
 * Unknown usernames → notFound() (404). full_name renders only when
 * show_full_name is true (captured operator: false).
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return { title: "Profile not found — HF Studio" };
  return {
    title: `@${user.username} — Profile — HF Studio`,
    description:
      user.bio ?? `Public profile, generations and projects by @${user.username} on HF Studio.`,
  };
}

export default async function ProfileIndexPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username } });
  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2 lg:py-4">
      <ProfileHeader username={username} />

      {/* Real data: latest published generations (community read-model) */}
      <section aria-label="Latest generations" className="space-y-4">
        <h2 className="text-lg font-semibold">Latest generations</h2>
        <UserGenerationsGrid username={username} limit={6} />
      </section>

      <ProfileUncapturedCard
        title="achievements / blogs / projects / ranking"
        manifestKey="/_private/profile/$username/{achievements,blogs,projects,ranking}"
      >
        <p>
          No badge, blog, public-project or ranking payload was captured in the survey (the
          captured profile body carries <code className="rounded bg-muted px-1 py-0.5 text-xs">badges: []</code>{" "}
          and zero project totals) — those tabs ship as honest shells linked above.
        </p>
      </ProfileUncapturedCard>

      <DisclosureCard title="Clone-side layout choice">
        <p>
          The profile page layout was never captured (route-manifest only). This composition —
          profile header (captured /user/profile fields), tab rail, and a latest-generations
          preview drawn from the real community read-model — follows the community/creators
          surface patterns and is disclosed as a clone-side choice. The data contracts are
          verbatim (api-bodies-digest.json → profile).
        </p>
      </DisclosureCard>
    </div>
  );
}
