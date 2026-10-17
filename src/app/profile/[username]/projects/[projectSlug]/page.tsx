import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard, BackToProfile } from "@/components/profile/profile-header";

/**
 * /profile/[username]/projects/[projectSlug] — HF-W5 honest shell (PUBLIC).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/projects/$projectSlug`. No public project-detail
 * body was captured (and no public-project model exists in the clone) → the page
 * renders the route shell + disclosure for any projectSlug. Unknown usernames →
 * notFound() (404).
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Project — @${username} — HF Studio` };
}

export default async function ProfileProjectDetailPage({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}) {
  const { username, projectSlug } = await params;
  const user = await db.user.findUnique({ where: { username } });
  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2 lg:py-4">
      <div className="space-y-4">
        <BackToProfile username={username} />
        <ProfileHeader username={username} />
      </div>

      <section aria-label="Project detail" className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <FolderKanban className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">Project detail not captured</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{projectSlug}</code> — the
            live project-detail surface was never captured, so no project title, cover or
            generations are invented for this slug.
          </p>
        </div>

        <ProfileUncapturedCard
          title="project detail"
          manifestKey="/_private/profile/$username/projects/$projectSlug"
        >
          <p>
            The route family exists on the live manifest; the survey captured no
            project-detail payload (the clone&apos;s Folder model is the private generation
            container — not a public project entity). This shell is the honest rendering.
          </p>
        </ProfileUncapturedCard>
      </section>
    </div>
  );
}
