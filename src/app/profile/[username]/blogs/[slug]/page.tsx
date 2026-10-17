import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard, BackToProfile } from "@/components/profile/profile-header";

/**
 * /profile/[username]/blogs/[slug] — HF-W5 honest shell (PUBLIC).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/blogs_/$slug` (trailing-_ normalization →
 * /profile/:username/blogs/:slug — the wave-3C gate convention). No blog post
 * body was captured and no Blog model exists in the clone → the route renders
 * the shell + disclosure for any slug. Unknown usernames → notFound() (404).
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Blog post — @${username} — HF Studio` };
}

export default async function ProfileBlogPostPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const user = await db.user.findUnique({ where: { username } });
  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2 lg:py-4">
      <div className="space-y-4">
        <BackToProfile username={username} />
        <ProfileHeader username={username} />
      </div>

      <section aria-label="Blog post" className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Newspaper className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">Blog post not captured</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{slug}</code> — no blog post
            body, title or content was captured in the 2026-10-17 survey, so none is rendered
            for this slug.
          </p>
        </div>

        <ProfileUncapturedCard
          title="blog post"
          manifestKey="/_private/profile/$username/blogs_/$slug"
        >
          <p>
            Blog content is entirely uncaptured in the evidence base; this clone has no Blog
            model by design (nothing to serve at this depth). The shell keeps the route family
            honest and visible.
          </p>
        </ProfileUncapturedCard>
      </section>
    </div>
  );
}
