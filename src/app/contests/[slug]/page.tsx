import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ArrowLeft, Award, ExternalLink, FlaskConical, Sparkles, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type {
  ContestContestant,
  ContestJudge,
  ContestWinner,
} from "@/components/community/types";

/**
 * /contests/[slug] — contest detail page (PUBLIC).
 *
 * Data: the seeded Contest model, extended in HF-W3C C4 with the live
 * contests-body fields (prize_pool, submissions_count, winner,
 * some_contestants, judges, is_trending — evidence/
 * rea-2026-10-17/api-bodies-digest.json → contests items; the seed now
 * carries the digest's 3 contests verbatim).
 *
 * Surface structure (evidence/rea-2026-10-17/surfaces/inspect-contests.json,
 * 839 a11y nodes): page heading 6893 'WIN AWARDS AND CREDITS. PARTICIPATE IN
 * CONTESTS.'; ACTIVE/RECENT CONTESTS headings 6896/6919; card fields: 'Jury
 * review' chip 6902, 'Prize pool' 6909 + '$1,000,000' 6912, 'In Higgsfield
 * credits pool' 6929, '$85 000' 6928, 'Contest has ended' 6925, 'Winners
 * announced' 6940/6983, 'View details' 6936, 'View submissions' 6918,
 * 'Projects submitted' 6992 + '+8,752' 6995, contestant avatar images 6993/
 * 6994. Unknown slugs → notFound() (404), per the battery.
 *
 * Disclosures (docs/wave-3c-worker-worklog.md): the submissions gallery
 * (live route /(public)/contests/$contestSlug/submissions/…) was NOT captured
 * → the route family ships as a visibly scoped shell at
 * /contests/[slug]/submissions (HF-W3C C6 parity-gap fix; the disclosure
 * card below remains, 'View submissions' now links to the shell); prize
 * formatting uses the live '$1,000,000' comma style (6912); status chips map
 * the digest statuses onto the captured surface labels ('Winners announced' when a
 * winner exists, else 'Contest has ended' for finished); the live 'Jury
 * review' phase chip is a live-UI phase not present in the digest body and is
 * therefore not rendered.
 */

export const dynamic = "force-dynamic";

function initialsOf(name: string): string {
  return (name.slice(0, 2) || "?").toUpperCase();
}

function statusLabel(status: string, winner: ContestWinner | null): string {
  if (status === "open") return "Open";
  if (status === "created") return "Created";
  // ev: 'Winners announced' 6940/6983 (finished + winner) / 'Contest has ended' 6925.
  return winner ? "Winners announced" : "Contest has ended";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const contest = await db.contest.findUnique({ where: { slug } });
  if (!contest) return { title: "Contest not found — HF Studio" };
  return {
    title: `${contest.title} — Contests — HF Studio`,
    description: contest.description,
  };
}

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contest = await db.contest.findUnique({ where: { slug } });
  if (!contest) notFound();

  const winner: ContestWinner | null = contest.winner
    ? JSON.parse(contest.winner)
    : null;
  const contestants: ContestContestant[] = contest.someContestants
    ? JSON.parse(contest.someContestants)
    : [];
  const judges: ContestJudge[] = contest.judges ? JSON.parse(contest.judges) : [];

  const finished = contest.status === "finished";
  const prizeText = contest.prizePool
    ? `$${contest.prizePool.toLocaleString("en-US")}`
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2 lg:py-4">
      <header className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/community?tab=contests">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Contests
          </Link>
        </Button>

        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:w-72 lg:w-80">
            {/* Preview fixture — the digest preview_image/logo_url are live CDN
                assets; the seed maps them to local fixtures (disclosed). */}
            {contest.previewImage && (
              // @next/next/no-img-element is off in the flat config.
              <img
                src={contest.previewImage}
                alt={`${contest.title} preview`}
                className="h-full w-full object-cover"
              />
            )}
            <span
              className={cn(
                "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  contest.status === "open" ? "bg-emerald-400" : "bg-muted-foreground",
                )}
                aria-hidden
              />
              <span className={contest.status === "open" ? "text-emerald-400" : "text-muted-foreground"}>
                {statusLabel(contest.status, winner)}
              </span>
            </span>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{contest.title}</h1>
              {contest.isTrending && (
                /* ev: the festival card is the live active/trending contest */
                <Badge className="gap-1 px-2.5 text-[10px] font-semibold uppercase tracking-wide">
                  <Sparkles className="h-3 w-3 text-[var(--signal)]" aria-hidden />
                  Trending
                </Badge>
              )}
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {contest.description}
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {format(new Date(contest.startAt), "MMM d, yyyy")} –{" "}
              {format(new Date(contest.endAt), "MMM d, yyyy")}
            </p>
            {/* ev: 'Prize pool' 6909 + '$1,000,000' 6912 / '$85 000' 6928 +
                'In Higgsfield credits pool' 6929 */}
            {prizeText && (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">
                  Prize pool <span className="tabular-nums">{prizeText}</span>
                </p>
                <p className="text-xs text-muted-foreground">In Higgsfield credits pool</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Winner — ev: digest winner {id, username, avatar_url} (live winner
          username 'mrabujoe'); 'See winners' affordances 6951/6996 */}
      {winner && (
        <section aria-label="Winner" className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Award className="h-5 w-5 text-[var(--signal)]" aria-hidden />
            Winner
          </h2>
          <Card className="w-full max-w-sm border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                {winner.avatar_url && <AvatarImage src={winner.avatar_url} alt="" />}
                <AvatarFallback className="bg-secondary text-xs font-semibold uppercase">
                  {initialsOf(winner.username)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">@{winner.username}</p>
                <p className="text-xs text-muted-foreground">First place</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Some contestants — ev: digest some_contestants; live contestant
          avatars 6993/6994 + '+8,752' 6995 */}
      {contestants.length > 0 && (
        <section aria-label="Some contestants" className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Users className="h-5 w-5 text-[var(--signal)]" aria-hidden />
            Some contestants
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {contestants.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3"
              >
                <Avatar className="h-6 w-6">
                  {c.avatar_url && <AvatarImage src={c.avatar_url} alt="" />}
                  <AvatarFallback className="bg-secondary text-[10px] font-semibold uppercase">
                    {initialsOf(c.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{c.username}</span>
              </span>
            ))}
            {contest.submissionsCount > contestants.length && (
              /* ev: '+8,752' 6995 next to the contestant avatars */
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                +{contest.submissionsCount.toLocaleString("en-US")}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Judges — ev: digest judges [{display_name, description, external_link,
          avatar_url, background_url}] (Buralqy / PBC Worldwide / Secret Level /
          Rourke / PJ Ace / Jama Jurabaev on the captured contest) */}
      {judges.length > 0 && (
        <section aria-label="Judges" className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Trophy className="h-5 w-5 text-[var(--signal)]" aria-hidden />
            Judges
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {judges.map((j) => (
              <Card key={j.display_name} className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    {j.avatar_url && <AvatarImage src={j.avatar_url} alt="" />}
                    <AvatarFallback className="bg-secondary text-xs font-semibold uppercase">
                      {initialsOf(j.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold">{j.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{j.description}</p>
                    {j.external_link && (
                      <a
                        href={j.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--signal)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden />
                        Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Submissions — disclosed shell (live route /(public)/contests/
          $contestSlug/submissions/… not captured) */}
      <section aria-label="Submissions" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Submissions</h2>
          {/* ev: 'Projects submitted' 6992 + count */}
          <p className="text-sm tabular-nums text-muted-foreground">
            {contest.submissionsCount.toLocaleString("en-US")} projects submitted
          </p>
        </div>
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
              evidence survey — only the count above is real (contests-body key{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">submissions_count</code>). No
              submission cards are invented here.
            </p>
            {/* ev: 'View submissions' 6918 — its target route family now
                EXISTS as the routed shell /contests/[slug]/submissions
                (HF-W3C C6 parity-gap fix); the uncaptured-gallery disclosure
                lives on that page. */}
            <Button asChild variant="secondary" size="sm">
              <Link href={`/contests/${contest.slug}/submissions`}>
                View submissions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
