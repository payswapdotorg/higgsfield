import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard } from "@/components/profile/profile-header";

/**
 * /profile/[username]/achievements — HF-W5 honest shell (PUBLIC).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/achievements`. The captured profile body carries
 * badge: null and badges: [] — NO badge/achievement payload was captured →
 * honest shell. Unknown usernames → notFound() (404).
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
  return { title: `Achievements — @${user.username} — HF Studio` };
}

export default async function ProfileAchievementsPage({
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

      <section aria-label="Achievements" className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Trophy className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">No achievements captured</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            The captured profile body reports{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">badge: null</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">badges: []</code> — no
            achievement, badge or trophy payload exists in the evidence, so none is invented
            here.
          </p>
        </div>

        <ProfileUncapturedCard
          title="achievements"
          manifestKey="/_private/profile/$username/achievements"
        >
          <p>
            The achievements surface is route-manifest-only in the survey; the badge fields of
            the profile body are the only related captured keys and both are empty on the
            captured account.
          </p>
        </ProfileUncapturedCard>
      </section>
    </div>
  );
}
