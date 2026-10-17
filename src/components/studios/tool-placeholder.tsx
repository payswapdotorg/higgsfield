"use client";

import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * ToolPlaceholder — routed placeholder body for Ads Studio sub-routes whose live
 * counterparts exist in route-preload-manifest.json but whose surfaces were NOT
 * captured in the evidence survey. Shows the evidence-derived heading (where one
 * exists) plus a clearly visible demo-scope note. No functionality is faked.
 */
export function ToolPlaceholder({
  title,
  blurb,
  liveRoute,
  extraDetail,
  backHref = "/ads-studio",
  backLabel = "Ads Studio",
  brandId,
}: {
  title: string;
  blurb?: string;
  /** The live route key from route-preload-manifest.json (cited on the page). */
  liveRoute: string;
  /** Optional route-derived detail (e.g. the captured brandId param). */
  extraDetail?: string;
  backHref?: string;
  backLabel?: string;
  brandId?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2 lg:py-4">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        {blurb && <p className="max-w-xl text-sm text-muted-foreground">{blurb}</p>}
        {brandId && (
          <p className="text-xs tabular-nums text-muted-foreground">
            Brand ID: <code className="rounded bg-muted px-1.5 py-0.5">{brandId}</code>
          </p>
        )}
      </header>

      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
            <span className="font-semibold text-amber-500">Demo scope — routed placeholder</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This route exists in the live product (route-preload-manifest.json key{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{liveRoute}</code>) but its surface was
            not captured in the 2026-10-17 evidence survey, so nothing beyond the heading above is
            implemented. This build will not fake the underlying flow.
          </p>
          {extraDetail && <p className="text-sm leading-relaxed text-muted-foreground">{extraDetail}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
