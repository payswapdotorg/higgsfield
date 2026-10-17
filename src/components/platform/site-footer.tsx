"use client";

import Link from "next/link";
import { Headphones } from "lucide-react";

/**
 * SiteFooter — the "AI-NATIVE CREATIVE SUITE" sitemap footer shared by the
 * public platform pages (/mcp, /academy).
 *
 * Evidence: the footer was captured twice with identical column structure —
 * evidence/rea-2026-10-17/surfaces/inspect-mcp.json (sectionfooter 7602,
 * heading 7603 'AI-NATIVE CREATIVE SUITE', columns Create 7606 / Video
 * Models 7640 / Image Models 7668 / Studios 7687 / Soul 7712 / Platform
 * 7725 / Resources 7750 / Company 7769 / Community 7797, socials 7813-7825,
 * address 7810, © 7830-7833) and surfaces/inspect-academy.json (heading
 * 24460 'AI-NATIVE CREATIVE SUITE', columns 24463-24664, socials 24670-24683,
 * address 24667, © line).
 *
 * Link policy (disclosed): live footer hrefs were not captured — labels link
 * ONLY to clone surfaces that actually exist; every other entry renders as
 * inert text (no fake links), same policy as the 3A registry href rule.
 */

const COLUMNS: { heading: string; links: { label: string; href?: string }[] }[] = [
  {
    // ev: mcp 7606 / academy 24463 'Create'
    heading: "Create",
    links: [
      { label: "AI Video" },
      { label: "AI Image" },
      { label: "Edit Image" },
      { label: "Inpaint" },
      { label: "Upscale" },
      { label: "Sora 2 Upscale" },
      { label: "Mixed Media" },
      { label: "AI Face Swap" },
      { label: "AI Influencer" },
      { label: "Apps" },
    ],
  },
  {
    // ev: mcp 7640 / academy 24497 'Video Models'
    heading: "Video Models",
    links: [
      { label: "Seedance 2.5" },
      { label: "Seedance 2.0" },
      { label: "Kling 3.0" },
      { label: "Sora 2 Introduction" },
      { label: "Veo 3.1 Introduction" },
      { label: "WAN 2.6" },
      { label: "Grok Imagine 1.5" },
      { label: "Gemini Omni Flash" },
    ],
  },
  {
    // ev: mcp 7668 / academy 24525 'Image Models'
    heading: "Image Models",
    links: [
      { label: "Nano Banana" },
      { label: "Flux 2" },
      { label: "Seedream 5" },
      { label: "GPT Image 2" },
      { label: "Ideogram 4.5" },
    ],
  },
  {
    // ev: mcp 7687 / academy 24544 'Studios'
    heading: "Studios",
    links: [
      { label: "Cinema Studio", href: "/" },
      { label: "Marketing Studio", href: "/marketing-studio" },
      { label: "Lipsync Studio" },
      { label: "Photodump Studio" },
      { label: "Fashion Factory" },
      { label: "Higgsfield Popcorn" },
      { label: "Higgsfield Canvas" },
    ],
  },
  {
    // ev: mcp 7712 / academy 24569 'Soul'
    heading: "Soul",
    links: [{ label: "Soul 2.0" }, { label: "Soul ID Character" }, { label: "Soul Cinema" }],
  },
  {
    // ev: mcp 7725 / academy 24582 'Platform'
    heading: "Platform",
    links: [
      { label: "Supercomputer" },
      { label: "AI Motion Designer" },
      { label: "MCP/CLI", href: "/mcp" },
      { label: "API", href: "/api-docs" },
      { label: "Collab" },
      { label: "Games" },
      { label: "Reference Extension" },
    ],
  },
  {
    // ev: mcp 7750 / academy 24607 'Resources'
    heading: "Resources",
    links: [
      { label: "Blog" },
      { label: "Creator Hub" },
      { label: "Help Center" },
      { label: "Academy", href: "/academy" },
      { label: "Prompt Guide" },
    ],
  },
  {
    // ev: mcp 7769 / academy 24626 'Company'
    heading: "Company",
    links: [
      { label: "About" },
      { label: "Trust" },
      { label: "Report a vulnerability" },
      { label: "Enterprise" },
      { label: "Team" },
      { label: "Pricing", href: "/pricing" },
      { label: "Careers" },
      { label: "Contact" },
    ],
  },
  {
    // ev: mcp 7797 / academy 24654 'Community'
    heading: "Community",
    links: [
      { label: "Community", href: "/community" },
      { label: "Contests", href: "/community?tab=contests" },
      { label: "Creative Partners" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer aria-label="AI-native creative suite" className="space-y-6 border-t border-border pt-8">
      {/* ev: mcp 7603 / academy 24460 'AI-NATIVE CREATIVE SUITE' */}
      <h2 className="text-lg font-bold tracking-tight">AI-NATIVE CREATIVE SUITE</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading} className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {col.heading}
            </h3>
            <ul className="space-y-1.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <Link
                      href={l.href}
                      className="text-xs font-medium text-foreground/75 transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    /* Live href uncaptured → inert text (no fake links) */
                    <span className="text-xs text-muted-foreground/70" title="Live link not captured">
                      {l.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      {/* ev: mcp 7813-7825 / academy 24670-24683 social links — hrefs uncaptured → inert */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Headphones className="h-3.5 w-3.5" aria-hidden />
          X / Twitter · Youtube · LinkedIn · Tiktok · Discord
        </span>
      </div>
      {/* ev: mcp 7810 / academy 24667 address + © 2026 lines */}
      <div className="space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>535 Mission St, 14th floor, San Francisco, CA, 94105</p>
        <p>© 2026 Higgsfield, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
