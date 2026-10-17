import type { Metadata } from "next";
import { BadgePercent, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { DisclosureCard, DatumRow } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/promo — HF-W5 (PRIVATE, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/me/settings/promo`.
 *
 * Data contract: promo_state from the captured `user` body verbatim
 * (api-bodies-digest.json → user: promo_state "inactive" on the captured
 * free-plan operator; also cohort "tier_1" — the captured user-meta body carries
 * {"country_code":"HK","region_code":null,"cohort":"tier_1"}).
 *
 * Disclosure: no personal-promo payload exists in the wave-2+ tree (the wave-1
 * /api/user/personal-promo endpoint was superseded by the wave-2 core — see the
 * HF-W2-merge record), and no promo-page body was captured; the tab renders the
 * real promo_state datum + an honest empty state.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo — Settings — HF Studio",
};

export default async function PromoPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u } = await accountBodiesFor(user);

  return (
    <section className="space-y-6" aria-label="Promo">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Promo</h1>
        <p className="font-mono text-xs text-muted-foreground">
          live route key: /_private/me/settings/promo
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgePercent className="h-5 w-5 text-[var(--signal)]" aria-hidden />
            Promo state
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={u.promo_state === "active" ? "default" : "outline"} className="font-mono">
              {u.promo_state}
            </Badge>
            <p className="text-sm text-muted-foreground">
              The captured user body reports{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">promo_state: &quot;{u.promo_state}&quot;</code>{" "}
              for the free-plan account.
            </p>
          </div>
          <dl>
            <DatumRow label="promo_state" value={<span className="font-mono">{u.promo_state}</span>} />
            <DatumRow label="cohort" value={<span className="font-mono">{u.cohort}</span>} />
            <DatumRow label="plan_type" value={<span className="font-mono">{u.plan_type}</span>} />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Tag className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">No active promos</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          No personal promo codes or promo-page bodies were captured in the evidence survey —
          the only real datum is the promo_state row above. Nothing is invented here.
        </p>
      </div>

      <DisclosureCard title="Demo scope — promo surface uncaptured">
        <p>
          promo_state and cohort are the captured user-body values (api-bodies-digest.json →{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">user</code>; the user-meta body
          additionally carries country_code HK / region_code null — an endpoint the wave-5 scope
          does not add). The personal-promo surface of wave 1 was superseded by the wave-2 core
          and carries no captured payload here.
        </p>
      </DisclosureCard>
    </section>
  );
}
