import type { LucideIcon } from "lucide-react";
import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * HF-W5 shared disclosure card — the amber "demo scope" pattern established by the
 * wave-3C submissions shell (src/app/contests/[slug]/submissions/page.tsx). Every
 * wave-5 surface that is NOT fully captured carries one of these, visibly.
 */

export function DisclosureCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
      <CardContent className="space-y-3 p-4 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
          <span className="font-semibold text-amber-500">{title}</span>
        </p>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  );
}

/** One inert read-only datum row (label + value + optional caption). */
export function DatumRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * The honest empty-state shell for settings tabs whose live bodies were never
 * captured (the 2026-10-17 operator account was free-plan/private-workspace —
 * zero team/billing child-tab bodies in the survey). Nothing is invented: the
 * shell renders the route truth + any REAL captured user-body facts passed in
 * + the visible disclosure.
 */
export function UncapturedShell({
  icon: Icon,
  title,
  manifestKey,
  facts,
  disclosure,
}: {
  icon: LucideIcon;
  title: string;
  manifestKey: string;
  facts?: Array<{ label: string; value: string }>;
  disclosure: React.ReactNode;
}) {
  return (
    <section className="space-y-6" aria-label={title}>
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight lg:text-2xl">
          <Icon className="h-5 w-5 text-[var(--signal)]" aria-hidden />
          {title}
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          live route key: {manifestKey}
        </p>
      </header>

      {facts && facts.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Captured account facts
            </p>
            <dl>
              {facts.map((f) => (
                <DatumRow key={f.label} label={f.label} value={f.value} />
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Uncaptured surface — shell only</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This settings tab exists in the live route tree but no page body or API payload for
          it was captured in the 2026-10-17 evidence survey, so the clone ships an honest
          empty state instead of invented content.
        </p>
      </div>

      <DisclosureCard title="Demo scope — surface not captured">
        {disclosure}
        <p>
          Route truth:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{manifestKey}</code>{" "}
          (evidence/rea-2026-10-17/route-preload-manifest.json).
        </p>
      </DisclosureCard>
    </section>
  );
}
