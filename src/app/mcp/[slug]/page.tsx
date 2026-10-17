import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * /mcp/[slug] — routed MCP doc placeholder (PUBLIC).
 *
 * The live product carries an `mcp_` doc tree under the MCP page
 * (route-preload-manifest.json keys `/(public)/mcp_/$slug` and
 * `/(public)/mcp_/(bundles)/$id`, with sibling action-redirect routes
 * `/(action-redirects)/mcp-credits{,/$id}` and
 * `/(action-redirects)/mcp-pricing{,/$id}`) — none of those surfaces were
 * captured in the 2026-10-17 evidence survey (inspect-mcp.json covers the
 * landing page only). This route therefore renders the captured slug
 * verbatim plus a visible demo-scope note; no doc content is invented and
 * no 404 for unknown slugs (the live route accepts arbitrary slugs).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Higgsfield MCP — HF Studio`,
    description: `Routed placeholder for the live MCP doc page “${slug}” (manifest key /(public)/mcp_/$slug).`,
  };
}

export default async function McpDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2 lg:py-4">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/mcp">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Higgsfield MCP
          </Link>
        </Button>
        <h1 className="break-all text-2xl font-bold tracking-tight lg:text-3xl">{slug}</h1>
        <p className="text-xs text-muted-foreground">
          Slug: <code className="rounded bg-muted px-1.5 py-0.5">{slug}</code>
        </p>
      </header>

      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
            <span className="font-semibold text-amber-500">Demo scope — routed placeholder</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This route family exists in the live product (route-preload-manifest.json keys{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/(public)/mcp_/$slug</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/(public)/mcp_/(bundles)/$id</code>,
            with the sibling action-redirects{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">mcp-credits</code> /{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">mcp-pricing</code>) but no doc,
            bundle or credits surface was captured in the 2026-10-17 evidence survey — only the MCP
            landing page was. Nothing beyond the slug above is implemented, and this build will not
            fake the underlying flows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
