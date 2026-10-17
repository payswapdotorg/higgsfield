import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileHeader } from "@/components/profile/profile-header";
import { UserGenerationsGrid } from "@/components/profile/generations-grid";

/**
 * /profile/[username]/generations — HF-W5 (PUBLIC, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/generations`.
 *
 * Data: that user's published generations from the community read-model
 * (FeedPublication ⟕ Generation — the same source as /api/community/generations/
 * feed and the community generations tab). Unknown usernames → notFound() (404).
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
  return { title: `Generations — @${user.username} — HF Studio` };
}

export default async function ProfileGenerationsPage({
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
      <section aria-label={`All published generations by ${username}`}>
        <UserGenerationsGrid username={username} />
      </section>
    </div>
  );
}
