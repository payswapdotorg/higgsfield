import type { Metadata } from "next";
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
  Pencil,
  Twitter,
  Youtube,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SignInGate } from "@/components/settings/sign-in-gate";
import { DisclosureCard, DatumRow } from "@/components/settings/settings-shared";
import { pageUser } from "@/lib/page-auth";
import { profileToJson } from "@/lib/profile-shape";
import { getOrCreateUserSettings, settingsToJson } from "@/lib/settings-shape";

/**
 * /me/settings — HF-W5 settings index (PRIVATE, server-rendered).
 *
 * Route truth: evidence/rea-2026-10-17/route-preload-manifest.json keys
 * `/_private/me/settings` (+ `/` and `/_team` duplicates). The live page layout
 * was NEVER captured (surfaces/inspect-settings.json is a policy-filtered shell;
 * README.md § evidence index) — the Overview/Profile+Consents composition below is
 * a disclosed clone-side choice; every DATA CONTRACT is verbatim from the
 * captured bodies:
 *   - profile fields  → api-bodies-digest.json → `profile`
 *     (/fnf/user/profile, GET 200, net-capture reqBody null ⇒ read-only)
 *   - consent switches → api-bodies-digest.json → `settings`
 *     (/fnf/user/settings, GET 200, reqBody null ⇒ the toggles below are INERT).
 *
 * Disclosures carried by this page:
 *   1. layout is a clone-side choice (settings layout uncaptured);
 *   2. every edit affordance is inert — "not captured — read-only surface";
 *   3. the consent switches are inert (GET-only capture);
 *   4. profile created_at == account_created_at (single User row, disclosed
 *      mapping in src/lib/profile-shape.ts).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — HF Studio",
};

const SOCIAL_ROWS: Array<{
  key: "instagram_handle" | "twitter_handle" | "youtube_handle" | "tiktok_handle" | "discord_handle" | "linkedin_handle";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "instagram_handle", label: "Instagram", icon: Instagram },
  { key: "twitter_handle", label: "Twitter", icon: Twitter },
  { key: "youtube_handle", label: "YouTube", icon: Youtube },
  { key: "tiktok_handle", label: "TikTok", icon: Music2 },
  { key: "discord_handle", label: "Discord", icon: MessageSquare },
  { key: "linkedin_handle", label: "LinkedIn", icon: Linkedin },
];

export default async function SettingsIndexPage() {
  const user = await pageUser();
  if (!user) return <SignInGate />;

  const profile = profileToJson(user);
  const settings = settingsToJson(await getOrCreateUserSettings(user.id));
  const initials = user.username.slice(0, 2).toUpperCase();

  const consentRows: Array<{
    label: string;
    hint: string;
    state: boolean | null;
    consentedAt: string | null;
  }> = [
    {
      label: "Media consent",
      hint: "media_consent — allow your generated media to be used across the product",
      state: settings.media_consent,
      consentedAt: settings.media_consented_at,
    },
    {
      label: "Audio consent",
      hint: "audio_consent — tri-state in the captured body (null = never asked)",
      state: settings.audio_consent,
      consentedAt: settings.audio_consented_at,
    },
    {
      label: "Character sheets consent",
      hint: "character_sheets_consent",
      state: settings.character_sheets_consent,
      consentedAt: settings.character_sheets_consented_at,
    },
    {
      label: "AI influencer consent",
      hint: "ai_influencer_consent",
      state: settings.ai_influencer_consent,
      consentedAt: settings.ai_influencer_consented_at,
    },
    {
      label: "Supercomputer LLM consent",
      hint: "supercomputer_llm_consent",
      state: settings.supercomputer_llm_consent,
      consentedAt: settings.supercomputer_llm_consented_at,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Profile & personal info (captured /user/profile body, verbatim fields) ── */}
      <section aria-label="Profile and personal info" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Profile &amp; personal info</CardTitle>
            {/* Inert affordance — the live save mutation was never captured
                (net-capture reqBody null on /fnf/user/profile). */}
            <Button variant="secondary" size="sm" disabled aria-disabled="true">
              <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
              Edit profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-16 w-16">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={`${profile.username} avatar`} />}
                <AvatarFallback className="bg-secondary text-base font-semibold uppercase">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                  <AtSign className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {profile.username}
                  {profile.badge && (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      {profile.badge}
                    </Badge>
                  )}
                </p>
                {profile.show_full_name && profile.full_name ? (
                  <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Full name hidden (show_full_name: false)
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  Joined {format(new Date(profile.account_created_at), "MMM d, yyyy")}
                </p>
                {profile.location && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {profile.location}
                  </p>
                )}
              </div>
              <div className="ml-auto flex gap-6 text-sm">
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 font-semibold tabular-nums">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    {profile.total_projects_views.toLocaleString("en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground">project views</p>
                </div>
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 font-semibold tabular-nums">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    {profile.total_projects_likes.toLocaleString("en-US")}
                  </p>
                  <p className="text-xs text-muted-foreground">project likes</p>
                </div>
              </div>
            </div>

            <Separator />

            <dl>
              <DatumRow label="Bio" value={profile.bio ?? <span className="text-muted-foreground">—</span>} />
              <DatumRow label="Headline" value={profile.headline ?? <span className="text-muted-foreground">—</span>} />
              <DatumRow
                label="Badges"
                value={
                  profile.badges.length === 0 ? (
                    <span className="text-muted-foreground">none (captured: [])</span>
                  ) : (
                    <span className="tabular-nums">{profile.badges.length}</span>
                  )
                }
              />
              <DatumRow
                label="Background image"
                value={profile.background_image_url ?? <span className="text-muted-foreground">—</span>}
              />
            </dl>

            {/* Social handles — captured key set (6); inert chips, no invented URLs */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Social handles
              </p>
              <ul className="flex flex-wrap gap-2">
                {SOCIAL_ROWS.map(({ key, label, icon: Icon }) => {
                  const handle = profile[key];
                  return (
                    <li key={key}>
                      {handle ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          {label}: {handle}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                          {label}: —
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        <DisclosureCard title="Not captured — read-only surface">
          <p>
            The profile API behind this card (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/fnf/user/profile</code>) was
            captured GET-only — every request row in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              evidence/rea-2026-10-17/net-capture-with-auth-headers.jsonl
            </code>{" "}
            carries <code className="rounded bg-muted px-1 py-0.5 text-xs">reqBody: null</code>.
            No save mutation exists in the evidence, so every edit affordance here is inert and
            the fields render exactly what the captured body shape defines
            (api-bodies-digest.json → <code className="rounded bg-muted px-1 py-0.5 text-xs">profile</code>).
          </p>
        </DisclosureCard>
      </section>

      {/* ── Content & AI consents (captured /user/settings body, verbatim switches) ── */}
      <section aria-label="Content and AI consents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content &amp; AI consents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ul className="mb-2">
              {consentRows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{row.hint}</p>
                    {row.consentedAt && (
                      <p className="text-xs text-muted-foreground">
                        Consented {format(new Date(row.consentedAt), "MMM d, yyyy, HH:mm")}
                      </p>
                    )}
                  </div>
                  {/* Inert toggle — GET-only capture (see the disclosure below) */}
                  <Switch
                    checked={row.state === true}
                    disabled
                    aria-label={`${row.label} (read-only)`}
                    aria-describedby={`${row.label.toLowerCase().replace(/[^a-z]+/g, "-")}-note`}
                  />
                </li>
              ))}
            </ul>

            <dl>
              <DatumRow
                label="Audio consent state"
                value={
                  settings.audio_consent === null ? (
                    <span className="text-muted-foreground">not set (null)</span>
                  ) : (
                    String(settings.audio_consent)
                  )
                }
              />
              <DatumRow
                label="has_image_auto"
                value={
                  <Badge variant={settings.has_image_auto ? "secondary" : "outline"}>
                    {settings.has_image_auto ? "on" : "off"}
                  </Badge>
                }
              />
              <DatumRow
                label="unlimited_settings"
                value={
                  settings.unlimited_settings === null ? (
                    <span className="text-muted-foreground">null (captured value)</span>
                  ) : (
                    <code className="text-xs">{JSON.stringify(settings.unlimited_settings)}</code>
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <DisclosureCard title="Not captured — switches are read-only">
          <p>
            The consent API (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/fnf/user/settings</code>) was
            captured GET-only in the 2026-10-17 survey (reqBody null on every row — same for
            /workspaces/settings, /datetime-settings and /banner/settings). No consent-accept
            mutation exists in the evidence, so the switches above are inert; their states come
            verbatim from the captured body (api-bodies-digest.json →{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">settings</code>).
          </p>
        </DisclosureCard>
      </section>
    </div>
  );
}
