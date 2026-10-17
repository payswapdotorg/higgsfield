import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  Eye,
  Heart,
  Instagram,
  Linkedin,
  MapPin,
  MessageSquare,
  Music2,
  Twitter,
  Youtube,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { ProfileTabs } from "@/components/profile/profile-tabs";

/**
 * HF-W5 — the public profile header shared by every /profile/[username]/* page.
 *
 * Data contract VERBATIM: evidence/rea-2026-10-17/api-bodies-digest.json →
 * `profile` — the /fnf/user/profile body shape:
 *   username, avatar_url, background_image_url, bio, headline, the 6 social
 *   handles, show_full_name, full_name, location, badge, badges,
 *   total_projects_views, total_projects_likes, created_at, account_created_at.
 * full_name renders ONLY when show_full_name is true (the captured operator had
 * show_full_name false with full_name present — the API body keeps it, the page
 * hides it, exactly like the live product).
 *
 * LAYOUT DISCLOSURE: the profile page layout was never captured (no
 * inspect-profile*.json exists in the survey; the route family is manifest-only).
 * This header + tabs composition is a disclosed clone-side choice following the
 * community/creators surface patterns (src/components/community/creators-tab.tsx).
 */

const SOCIAL_ROWS: Array<{
  key: "instagramHandle" | "twitterHandle" | "youtubeHandle" | "tiktokHandle" | "discordHandle" | "linkedinHandle";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "instagramHandle", label: "Instagram", icon: Instagram },
  { key: "twitterHandle", label: "Twitter", icon: Twitter },
  { key: "youtubeHandle", label: "YouTube", icon: Youtube },
  { key: "tiktokHandle", label: "TikTok", icon: Music2 },
  { key: "discordHandle", label: "Discord", icon: MessageSquare },
  { key: "linkedinHandle", label: "LinkedIn", icon: Linkedin },
];

export async function getProfileUser(username: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) notFound();
  const publications = await db.feedPublication.count({ where: { authorUsername: username } });
  return { user, publications };
}

export async function ProfileHeader({ username }: { username: string }) {
  const { user, publications } = await getProfileUser(username);
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <header className="space-y-5" aria-label={`Profile of ${user.username}`}>
      <div className="flex flex-wrap items-start gap-5">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.username} avatar`} />}
          <AvatarFallback className="bg-secondary text-xl font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="flex items-center gap-1.5 text-xl font-bold tracking-tight sm:text-2xl">
              <AtSign className="h-5 w-5 text-muted-foreground" aria-hidden />
              {user.username}
            </h1>
            {user.badge && (
              <Badge variant="secondary" className="gap-1">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                {user.badge}
              </Badge>
            )}
          </div>
          {user.showFullName && user.fullName && (
            <p className="text-base font-medium">{user.fullName}</p>
          )}
          {user.headline && <p className="text-sm text-muted-foreground">{user.headline}</p>}
          {user.bio && <p className="max-w-xl text-sm leading-relaxed">{user.bio}</p>}
          <p className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Joined {format(user.createdAt, "MMM d, yyyy")}
            </span>
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {user.location}
              </span>
            )}
          </p>
        </div>

        <dl className="flex gap-6 text-sm sm:ml-2">
          <div className="text-center">
            <dt className="text-xs text-muted-foreground">publications</dt>
            <dd className="text-lg font-bold tabular-nums">{publications}</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs text-muted-foreground">views</dt>
            <dd className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {user.totalProjectsViews.toLocaleString("en-US")}
            </dd>
          </div>
          <div className="text-center">
            <dt className="text-xs text-muted-foreground">likes</dt>
            <dd className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums">
              <Heart className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {user.totalProjectsLikes.toLocaleString("en-US")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Social handles — the captured 6-key set; inert chips (handle URLs uncaptured) */}
      <ul className="flex flex-wrap gap-2">
        {SOCIAL_ROWS.map(({ key, label, icon: Icon }) => {
          const handle = user[key];
          if (!handle) return null;
          return (
            <li key={key}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                {label}: {handle}
              </span>
            </li>
          );
        })}
        {user.badges !== "[]" && (
          <li>
            <Badge variant="outline">badges: {user.badges}</Badge>
          </li>
        )}
      </ul>

      <ProfileTabs username={user.username} />
    </header>
  );
}

/** Honest shell for the uncaptured profile tabs (achievements/blogs/projects/ranking). */
export function ProfileUncapturedCard({
  title,
  manifestKey,
  children,
}: {
  title: string;
  manifestKey: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
      <CardContent className="space-y-3 p-4 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="font-semibold text-amber-500">
            Demo scope — {title} not captured
          </span>
        </p>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {children}
          <p>
            Route truth:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{manifestKey}</code>{" "}
            (evidence/rea-2026-10-17/route-preload-manifest.json) — the route exists on the live
            tree, but no page body or API payload for it was captured in the 2026-10-17 survey.
            This clone ships an honest shell instead of invented content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const profileLink = (username: string, tab?: string) =>
  tab ? `/profile/${username}/${tab}` : `/profile/${username}`;

export function BackToProfile({ username, className }: { username: string; className?: string }) {
  return (
    <Link
      href={`/profile/${username}`}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      ← @{username}
    </Link>
  );
}
