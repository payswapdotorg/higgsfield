import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { ProfileHeader, ProfileUncapturedCard } from "@/components/profile/profile-header";

/**
 * /profile/[username]/blogs — HF-W5 honest shell (PUBLIC).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/profile/$username/blogs`. No blog list or post body was captured
 * (the user body carries blog_ip_check / blog_collab flags only) → honest shell.
 * Unknown usernames → notFound() (404).
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
  return { title: `Blogs — @${user.username} — HF Studio` };
}

export default async function ProfileBlogsPage({
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

      <section aria-label="Blogs" className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Newspaper className="h-7 w-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold">No blogs captured</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            The live profile carries a blogs route family (the captured user body has only the
            blog_ip_check / blog_collab feature flags), but no blog list or post payload was
            captured in the survey — nothing is invented here.
          </p>
        </div>

        <ProfileUncapturedCard title="blogs" manifestKey="/_private/profile/$username/blogs">
          <p>
            Blog post permalinks live at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /_private/profile/$username/blogs_/$slug
            </code>{" "}
            on the live tree and ship as a shell in this clone.
          </p>
        </ProfileUncapturedCard>
      </section>
    </div>
  );
}
