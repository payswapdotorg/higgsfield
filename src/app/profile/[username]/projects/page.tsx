import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard } from "@/components/profile/profile-header";

/**
 * /profile/[username]/projects — HF-W5 honest shell (PUBLIC).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/projects`. The captured profile body carries
 * total_projects_views / total_projects_likes (0 on the captured account) but NO
 * public project-card payload → honest shell + the real totals. Unknown usernames
 * → notFound() (404).
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
  return { title: `Projects — @${user.username} — HF Studio` };
}

export default async function ProfileProjectsPage({
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

      <section aria-label="Public projects" className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <FolderKanban className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">Public projects surface not captured</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            The captured profile body reports total_projects_views{" "}
            <span className="tabular-nums">
              {user.totalProjectsViews.toLocaleString("en-US")}
            </span>{" "}
            and total_projects_likes{" "}
            <span className="tabular-nums">
              {user.totalProjectsLikes.toLocaleString("en-US")}
            </span>{" "}
            — the aggregate totals are real, but no public project-card payload was captured,
            so no project grid is invented here.
          </p>
        </div>

        <ProfileUncapturedCard title="projects" manifestKey="/_private/profile/$username/projects">
          <p>
            The live route exists on the manifest, but the survey captured only the aggregate
            totals above (api-bodies-digest.json → profile). The project-detail route{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /_private/profile/$username/projects/$projectSlug
            </code>{" "}
            is likewise uncaptured and ships as a shell.
          </p>
        </ProfileUncapturedCard>
      </section>
    </div>
  );
}
