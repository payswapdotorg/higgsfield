"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * HF-W5 profile tab rail — the child-route family of /profile/[username]
 * (route-preload-manifest.json keys /_private/profile/$username/{generations,
 * projects, blogs, achievements, ranking}). Labels are clone-side (the live tab
 * labels were never captured — layout disclosure in profile-header.tsx).
 */
const TABS: Array<{ slug?: string; label: string }> = [
  { label: "Overview" },
  { slug: "generations", label: "Generations" },
  { slug: "projects", label: "Projects" },
  { slug: "blogs", label: "Blogs" },
  { slug: "achievements", label: "Achievements" },
  { slug: "ranking", label: "Ranking" },
];

export function ProfileTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/profile/${username}`;

  return (
    <nav aria-label={`Profile sections for ${username}`} className="border-b border-border">
      <ul className="flex gap-1 overflow-x-auto scrollbar-slim">
        {TABS.map(({ slug, label }) => {
          const href = slug ? `${base}/${slug}` : base;
          const active = pathname === href;
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
