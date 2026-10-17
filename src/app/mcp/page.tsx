import type { Metadata } from "next";
import { McpLanding } from "@/components/platform/mcp-landing";

/**
 * /mcp — the MCP page (public, no SessionGate).
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-mcp.json (1476 a11y
 * nodes; root 7138 "Higgsfield MCP | AI Image & Video Generation for Any
 * Agent"). Section-level citations live in
 * src/components/platform/mcp-landing.tsx.
 *
 * Route truth: route-preload-manifest.json key `/(public)/mcp`; doc children
 * `/(public)/mcp_/$slug` + `/(public)/mcp_/(bundles)/$id` render as disclosed
 * placeholders at /mcp/[slug]; the sibling action-redirect routes
 * `/(action-redirects)/mcp-credits{,/$id}` and `/(action-redirects)/mcp-pricing{,/$id}`
 * carry no surface (redirects) and are intentionally not built — see
 * docs/route-parity-report.md.
 */
export const metadata: Metadata = {
  title: "Higgsfield MCP | AI Image & Video Generation for Any Agent — HF Studio",
  description:
    "Every creative model, inside ChatGPT: install the Higgsfield MCP connector and browse skill presets for images, video, ads and motion design.",
};

export default function McpPage() {
  return <McpLanding />;
}
