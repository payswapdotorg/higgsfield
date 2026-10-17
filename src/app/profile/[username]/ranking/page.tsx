import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard } from "@/components/profile/profile-header";

/**
 * /profile/[username]/ranking — HF-W5 honest shell (PUBLIC).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/ranking`. No creator-ranking/leaderboard payload
 * was captured → honest shell. Unknown usernames → notFound() (404).
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
  return { title: `Ranking — @${user.username} — HF Studio` };
}

export default async function ProfileRankingPage({
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

      <section aria-label="Ranking" className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <BarChart3 className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">Ranking not captured</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            No creator-ranking, leaderboard-position or contest-standing payload was captured
            in the 2026-10-17 survey — nothing is invented here.
          </p>
        </div>

        <ProfileUncapturedCard
          title="ranking"
          manifestKey="/_private/profile/$username/ranking"
        >
          <p>
            The ranking surface is route-manifest-only in the evidence base; the community
            creators tab (aggregate views/likes) carries the clone&apos;s creator-metric
            surface instead.
          </p>
        </ProfileUncapturedCard>
      </section>
    </div>
  );
}
