import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FlaskConical, Images, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

/**
 * /contests/[slug]/submissions — the contest submissions route shell (PUBLIC).
 *
 * HF-W3C C6: this route was the single gap found by the wave-3 route-parity
 * exit gate (scripts/route-parity.mjs) — the packet's 3C order says "add
 * /contests/[slug] detail … with submissions route shell", and worker 58's
 * detail page carried the disclosure in-page without the route. The route now
 * exists and the disclosure lives here.
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/(public)/contests/$contestSlug/submissions/` (the submission-detail
 * permalink `/(public)/contests/$contestSlug/submissions/$submissionId` is
 * additionally uncaptured → deferred; see docs/route-parity-report.md).
 *
 * Evidence (evidence/rea-2026-10-17/surfaces/inspect-contests.json, 839 a11y
 * nodes): 'View submissions' 6918 (the live card affordance whose target is
 * this route family) and 'Projects submitted' 6992 + count. The submissions
 * gallery itself was NOT captured in the 2026-10-17 survey — only the
 * contests-body key `submissions_count` is real
 * (api-bodies-digest.json → contests items). This shell therefore renders
 * the contest header + the real count + a visible demo-scope note; no
 * submission cards, authors or thumbnails are invented. Unknown slugs →
 * notFound() (404), matching the detail page.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const contest = await db.contest.findUnique({ where: { slug } });
  if (!contest) return { title: "Contest not found — HF Studio" };
  return {
    title: `Submissions — ${contest.title} — Contests — HF Studio`,
    description: `Projects submitted to ${contest.title}.`,
  };
}

export default async function ContestSubmissionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contest = await db.contest.findUnique({ where: { slug } });
  if (!contest) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2 lg:py-4">
      <header className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href={`/contests/${contest.slug}`}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            {contest.title}
          </Link>
        </Button>

        <div className="space-y-2">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight lg:text-3xl">
            <Images className="h-6 w-6 text-[var(--signal)]" aria-hidden />
            Submissions
          </h1>
          {/* ev: 'View submissions' 6918 targets this route family; the count
              below is the real contests-body key submissions_count. */}
          <p className="text-sm text-muted-foreground">
            {contest.title} —{" "}
            <span className="font-medium tabular-nums">
              {contest.submissionsCount.toLocaleString("en-US")}
            </span>{" "}
            projects submitted
            {/* ev: 'Projects submitted' 6992. */}
          </p>
        </div>
      </header>

      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
            <span className="font-semibold text-amber-500">
              Demo scope — submissions gallery not captured
            </span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The live product serves a submissions gallery at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /(public)/contests/$contestSlug/submissions/
            </code>{" "}
            (route-preload-manifest.json), but that surface was not captured in the 2026-10-17
            evidence survey — the only real datum is the count above (contests-body key{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">submissions_count</code>).
            The submission-detail permalink (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /(public)/contests/$contestSlug/submissions/$submissionId
            </code>
            ) is likewise uncaptured and deferred. No submission cards are invented here.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/contests/${contest.slug}`}>
                <Trophy className="mr-1 h-4 w-4" aria-hidden />
                Contest details
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/community?tab=contests">All contests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
