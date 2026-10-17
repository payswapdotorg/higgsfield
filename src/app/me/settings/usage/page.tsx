import type { Metadata } from "next";
import { ChartColumn, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { DisclosureCard, DatumRow } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { accountBodiesFor } from "@/lib/account-bodies";

/**
 * /me/settings/usage — HF-W5 (PRIVATE, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json key
 * `/_private/me/settings/usage`.
 *
 * Data contract: the credit totals of the captured `user` body verbatim
 * (api-bodies-digest.json → user: package_credits, daily_credits, bonus_credits,
 * per-model credit pools, total_plan_credits) + the wallet body totals — both
 * computed by the shared src/lib/account-bodies.ts.
 *
 * Disclosure: usage ANALYTICS (generation history graphs, per-day usage, model
 * usage breakdowns) were never captured — only the live credit totals above are
 * real; the rest is an honest empty state.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usage — Settings — HF Studio",
};

export default async function UsagePage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const { userBody: u, walletBody: w } = await accountBodiesFor(user);

  return (
    <section className="space-y-6" aria-label="Usage">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Usage</h1>
        <p className="font-mono text-xs text-muted-foreground">
          live route key: /_private/me/settings/usage
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-[var(--signal)]" aria-hidden />
            Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DatumRow label="total_plan_credits" value={<span className="tabular-nums">{u.total_plan_credits}</span>} />
            <DatumRow label="package_credits" value={<span className="tabular-nums">{u.package_credits.toFixed(1)}</span>} />
            <DatumRow label="daily_credits" value={<span className="tabular-nums">{u.daily_credits.toFixed(1)}</span>} />
            <DatumRow label="subscription_credits" value={<span className="tabular-nums">{u.subscription_credits.toFixed(1)}</span>} />
            <DatumRow label="bonus_credits" value={<span className="tabular-nums">{u.bonus_credits.toFixed(1)}</span>} />
            <DatumRow label="wallet total_credits" value={<span className="tabular-nums">{w.total_credits.toLocaleString("en-US")}</span>} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Per-model credit pools</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DatumRow label="soul_credits" value={<span className="tabular-nums">{u.soul_credits.toFixed(1)}</span>} />
            <DatumRow label="wan2_5_video_credits" value={<span className="tabular-nums">{u.wan2_5_video_credits.toFixed(1)}</span>} />
            <DatumRow label="text2keyframes_credits" value={<span className="tabular-nums">{u.text2keyframes_credits.toFixed(1)}</span>} />
            <DatumRow label="face_swap_credits" value={<span className="tabular-nums">{u.face_swap_credits.toFixed(1)}</span>} />
            <DatumRow label="qwen_camera_control_credits" value={<span className="tabular-nums">{u.qwen_camera_control_credits.toFixed(1)}</span>} />
            <DatumRow label="character_swap_credits" value={<span className="tabular-nums">{u.character_swap_credits.toFixed(1)}</span>} />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <ChartColumn className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Usage analytics not captured</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Only the live credit totals above exist in the captured bodies. Generation-history
          graphs, daily usage timelines and per-model usage breakdowns were never captured in
          the 2026-10-17 survey — nothing is invented here.
        </p>
      </div>

      <DisclosureCard title="Demo scope — totals only">
        <p>
          The credit rows are the captured user-body keys (api-bodies-digest.json →{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">user</code>) computed from this
          clone&apos;s CreditPool model; the wallet row from the captured{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">wallet</code> body. Analytics
          surfaces beyond these totals are uncaptured.
        </p>
      </DisclosureCard>
    </section>
  );
}
