"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * HF-W5 settings navigation — the left rail of the /me/settings surface.
 *
 * LAYOUT DISCLOSURE (program convention: cite the evidence gap): the live settings
 * page layout was NEVER captured — evidence/rea-2026-10-17/surfaces/inspect-settings.json
 * is a policy-filtered shell (completeness.status "policy_filtered", zero a11y nodes
 * for https://higgsfield.ai/settings; README.md § evidence index notes the settings
 * surface is uncaptured). The sidebar/tab layout below is therefore a DISCLOSED
 * clone-side choice following the app-shell/sidebar patterns established in
 * waves 1–3 (src/components/app-shell.tsx). The ROUTE LIST is verbatim from
 * evidence/rea-2026-10-17/route-preload-manifest.json keys
 * /_private/me/settings{,/_team/…} (13 children + index); only the labels/ordering
 * are this clone's.
 */

const SECTIONS: Array<{ group: string; links: Array<{ href: string; label: string }> }> = [
  {
    group: "Account",
    links: [
      { href: "/me/settings", label: "Overview" },
      { href: "/me/settings/subscription", label: "Subscription" },
      { href: "/me/settings/billing", label: "Billing" },
      { href: "/me/settings/usage", label: "Usage" },
      { href: "/me/settings/promo", label: "Promo" },
    ],
  },
  {
    // The live manifest nests these under a pathless _team layout
    // (/_private/me/settings/_team/…) — the clone flattens it into /me/settings/*.
    group: "Team",
    links: [
      { href: "/me/settings/members", label: "Members" },
      { href: "/me/settings/organization", label: "Organization" },
      { href: "/me/settings/sub-workspaces", label: "Sub-workspaces" },
      { href: "/me/settings/unlimited-access-history", label: "Unlimited access history" },
    ],
  },
  {
    group: "More",
    links: [
      { href: "/me/settings/gift", label: "Gift" },
      { href: "/me/settings/referrals", label: "Referrals" },
      { href: "/me/settings/cancel", label: "Cancel plan" },
      { href: "/me/settings/onboarding", label: "Onboarding" },
      { href: "/me/settings/sessions", label: "Sessions" },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/me/settings" ? pathname === "/me/settings" : pathname === href;

  return (
    <nav aria-label="Settings navigation" className="lg:sticky lg:top-20">
      {/* Desktop rail / mobile horizontal scroller (touch-friendly ≥44px targets) */}
      <ul className="flex gap-1 overflow-x-auto pb-1 scrollbar-slim lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {SECTIONS.map((section) => (
          <li key={section.group} className="flex gap-1 lg:block lg:space-y-0.5">
            <div className="hidden lg:block px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground first:pt-0">
              {section.group}
            </div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:py-2",
                  isActive(link.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </li>
        ))}
      </ul>
    </nav>
  );
}
