"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  MapPin,
  MessageCircle,
  Pencil,
  Play,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/platform/site-footer";
import { cn } from "@/lib/utils";

/**
 * /academy — the Academy course landing page body (public).
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-academy.json (1152 a11y
 * nodes; root "Academy | Higgsfield"). Nodes used:
 * - hero region 23994 'LEARN AI VIDEO FROM ZERO.': eyebrow StaticText 23996
 *   'Academy'; heading 23997; subtitle 24000 '7 lessons. 90 minutes. You'll
 *   make your first video in the first lesson.'; link 24001 'Start for free';
 *   social proof 24026-24028 'Join 100,000+ creators learning on Higgsfield';
 *   video player affordances: buttons 24012 'Play video' / 24019 'Fullscreen
 *   video' / 24015 'Unmute video', sliders 24011/24017, StaticText 24018
 *   '0:00 / 2:02'.
 * - WHAT YOU'LL MAKE. region 24029: heading 24031 + subtitle 24034 'Same app,
 *   same prompt box. The difference is knowing what to type.'; tabs 24035
 *   'Locations' / 24039 'Video' / 24043 'Characters' / 24047 'Product';
 *   before/after images 24051/24053 with labels 24052 'Before the course' /
 *   24054 'After the course'; feature headings 24055 'Your own settings' /
 *   24059 'Scene edits' / 24063 'New angles' with blurbs 24058/24062/24066.
 * - START CREATING WITH AI region 24067: heading 24069 + subtitle 24072;
 *   NO EXPERIENCE NEEDED 24073 + blurb 24076; steps 24082 'Watch the lesson'
 *   / 24085 'Write your prompt' / 24088 'Click Generate' / 24091-24092 'Your
 *   first generation is ready'; WE PICK THE MODELS FOR YOU 24093-24096 +
 *   blurb 24098 + link 24099 'Start for free'; LEARN THE AI BASICS 24102 +
 *   blurb 24105.
 * - WHAT YOU GET. region 24107: heading 24109 + 24112 'Everything you need is
 *   inside. Nothing to buy.'; LEARN FROM TOP AI FILMMAKERS 24114-24119; 7
 *   VIDEO LESSONS 24132-24134; A PDF GUIDE FOR EVERY LESSON 24136-24139; THE
 *   LATEST AI KNOWLEDGE 24157-24159; lesson card 'Your First Video' 24127 +
 *   'Lesson 2 of 8, 1 min' 24129-24131 + 'You are here' 24125; HOMEWORK 24142
 *   + blurb 24145 + links 24148/24151/24154; CERTIFICATE 24162 + blurb 24165
 *   + image 24161 'Higgsfield course completion certificate'.
 * - TWO WAYS TO SPEND THE NEXT 90 MINUTES. region 24168: heading 24170; card
 *   'Nothing' 24177 + blurb 24180-24181 + list 24185/24188/24191 + button
 *   24192 'Keep scrolling'; card 'RECOMMENDED' 24196 + 'Your own film' 24199 +
 *   'Beginner course' 24198 + blurb 2402 + features 24206/24209/24212/24215 +
 *   link 24216 'Start for free'.
 * - YOU WON'T BE ALONE. region 24218: heading 24220; EXPLORE CREATORS HUB
 *   24250-24254 + link 24255 'Explore'; DISCORD COMMUNITY 24271-24274 + link
 *   24275 'Join Discord'; HIGGSFIELD AI CREATOR PARTNERSHIP PROGRAM region
 *   24222 + heading 24236 + blurb 24240 + link 24241 'Learn more'.
 * - WANT MORE? region 24330: heading 24332 + blurb 24335 + link 24415 'All
 *   videos on YouTube' + 6 YouTube video cards 24338-24413.
 * - GOT ANY QUESTIONS LEFT? region 24418: heading 24420 + blurb 24423 + FAQ
 *   buttons 24426-24456; only the first answer was captured (24430 'No. We
 *   start with the basics and walk you through each step.').
 *
 * Clone-side adaptations (disclosed in docs/wave-3c-worker-worklog.md):
 * - 'Start for free' is an uncaptured course-signup flow → disabled +
 *   visibly scoped (no fake signup, no fake course player);
 * - the hero video, before/after media and certificate image were not
 *   captured → deterministic gradient tiles with the captured labels;
 * - the WHAT YOU'LL MAKE tabs: only the 'Locations' panel content was
 *   captured — the other three tabs render visible not-captured notes;
 * - FAQ: only 'Do I need any experience?' has a captured answer; the other
 *   seven items render a visible answer-not-captured note (no invented copy);
 * - YouTube cards and homework links render inert (live hrefs uncaptured);
 *   'Join Discord' / 'Learn more' are scoped stubs; 'Explore' links to the
 *   clone's community creators tab.
 */

const FAQ_ITEMS: { question: string; answer?: string }[] = [
  // ev: button 24426 + captured answer 24430.
  {
    question: "Do I need any experience?",
    answer: "No. We start with the basics and walk you through each step.",
  },
  // ev: buttons 24432-24456 — answers not captured (accordion closed in the capture).
  { question: "What will I learn to make?" },
  { question: "What’s included?" },
  { question: "How long does the course take?" },
  { question: "Will I need credits?" },
  { question: "How does homework work?" },
  { question: "Does my work need to be perfect?" },
  { question: "What do I get when I finish?" },
];

/** ev: WHAT YOU'LL MAKE tabs 24035/24039/24043/24047. */
const MAKE_TABS = ["Locations", "Video", "Characters", "Product"] as const;

/** ev: Locations panel features 24055-24066. */
const LOCATION_FEATURES = [
  { title: "Your own settings", blurb: "Create a place for your scene." },
  { title: "Scene edits", blurb: "Add people, change objects, or adjust the lighting." },
  { title: "New angles", blurb: "Show the same location from another view." },
];

/** ev: START CREATING steps 24082-24092. */
const STEPS = [
  { label: "Watch the lesson", icon: Play },
  { label: "Write your prompt", icon: Pencil },
  { label: "Click Generate", icon: Sparkles },
  { label: "Your first generation is ready", icon: Check },
];

/** ev: WHAT YOU GET items 24114-24159 + lesson card 24125-24131. */
const YOU_GET = [
  { title: "LEARN FROM TOP AI FILMMAKERS", blurb: "They make the films. They teach you how." },
  { title: "7 VIDEO LESSONS", blurb: null },
  { title: "A PDF GUIDE FOR EVERY LESSON", blurb: null },
  { title: "THE LATEST AI KNOWLEDGE", blurb: null },
];

/** ev: 'Nothing' card list 24185/24188/24191. */
const NOTHING_LIST = [
  "Watch other people’s AI videos",
  "Save tutorials for later",
  "Never actually make anything",
];

/** ev: 'Your own film' card features 24206-24215. */
const OWN_FILM_FEATURES = [
  "Your first video in lesson one",
  "A PDF guide for every lesson",
  "Homework that makes it stick",
  "A certificate when you finish",
];

/** ev: WANT MORE? video cards 24338-24413 (titles + 'Higgsfield AI' + 'YouTube'). */
const YOUTUBE_VIDEOS = [
  "Claude Opus 5.5 + Higgsfield Make Insane Motion Graphics! (Claude Motion)",
  "Claude Opus 5.5 Made Aura Farming Clipping Faster than Ever!",
  "How To Prompt Like a Director Using Opus 5.5 + Seedance 2.5 (Full Workflow)",
  "Can AI Beat VFX? (feat. ErikDoesVFX)",
  "GPT-6 Astra Changed Meta Ads Forever!",
  "Did AI Change Editing Forever? (GPT-6 Astra + DaVinci Resolve)",
];

/** Deterministic fnv1a hue (same algorithm as model-registry modelHue). */
function hue(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash & 0x7fffffff) % 360;
}

function Tile({ seed, className }: { seed: string; className?: string }) {
  const h = hue(seed);
  return (
    <div
      aria-hidden
      className={cn("rounded-xl border border-border", className)}
      style={{
        background: `linear-gradient(135deg, hsl(${h} 65% 52% / 0.45), hsl(${(h + 40) % 360} 65% 40% / 0.12))`,
      }}
    />
  );
}

export function AcademyLanding() {
  const [makeTab, setMakeTab] = useState<string>("Locations");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-14 py-2 lg:py-4">
      {/* Hero — ev: region 23994, eyebrow 23996, heading 23997, subtitle 24000 */}
      <header className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--signal)]">
            Academy
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            LEARN AI VIDEO FROM ZERO.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            7 lessons. 90 minutes. You&rsquo;ll make your first video in the first lesson.
          </p>
          <p className="max-w-2xl text-sm font-medium text-foreground/80">
            Join 100,000+ creators learning on Higgsfield
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* ev: link 24001 'Start for free' — course signup uncaptured → scoped */}
          <span title="Course signup flow not captured — no fake enrollment">
            <Button size="lg" disabled>
              Start for free
            </Button>
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            The course player and signup flow were not captured in the evidence survey — the button
            is intentionally inert; no enrollment is simulated.
          </p>
        </div>

        {/* Video player affordances — ev: buttons 24012/24019/24015, slider labels
            24011/24017, StaticText 24018 '0:00 / 2:02' (no media captured) */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[var(--signal)]/20 via-card to-muted">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
              <Play className="h-3.5 w-3.5" aria-hidden />
              0:00 / 2:02
            </div>
            <span className="absolute bottom-3 right-3 flex items-center gap-2">
              <span title="Video media not captured">
                <Button variant="secondary" size="sm" disabled className="gap-1.5">
                  <Video className="h-3.5 w-3.5" aria-hidden />
                  Unmute video
                </Button>
              </span>
              <span title="Video media not captured">
                <Button variant="secondary" size="sm" disabled>
                  Fullscreen video
                </Button>
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* WHAT YOU'LL MAKE. — ev: region 24029, heading 24031, subtitle 24034, tabs 24035-24047 */}
      <section aria-label="What you’ll make" className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">WHAT YOU&rsquo;LL MAKE.</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Same app, same prompt box. The difference is knowing what to type.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="What you’ll make examples"
          className="flex w-max items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {MAKE_TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={makeTab === t}
              onClick={() => setMakeTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                makeTab === t
                  ? "bg-[var(--signal)] text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {makeTab === "Locations" ? (
          <div className="space-y-6">
            {/* ev: before/after images 24051/24053 + labels 24052/24054 */}
            <div className="grid grid-cols-2 gap-4">
              {["Before the course", "After the course"].map((label) => (
                <figure key={label} className="space-y-2">
                  <Tile seed={label} className="aspect-[4/3]" />
                  <figcaption className="text-center text-xs font-medium text-muted-foreground">
                    {label}
                  </figcaption>
                </figure>
              ))}
            </div>
            {/* ev: features 24055-24066 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {LOCATION_FEATURES.map((f) => (
                <div key={f.title} className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-[var(--signal)]" aria-hidden />
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{f.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
            The “{makeTab}” panel was not captured in the 2026-10-17 evidence survey — nothing is
            rendered or faked here.
          </div>
        )}
      </section>

      {/* START CREATING WITH AI — ev: region 24067, heading 24069, subtitle 24072 */}
      <section aria-label="Start creating with AI" className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">START CREATING WITH AI</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Everything you need to make your first AI images and videos.
          </p>
        </div>

        {/* ev: steps 24082-24092 */}
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--signal)]/15 text-[var(--signal)]">
                <s.icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-medium leading-snug">{s.label}</span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">{i + 1}</span>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ev: NO EXPERIENCE NEEDED 24073 + blurb 24076 */}
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold tracking-tight">NO EXPERIENCE NEEDED</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Start from zero. We show you what to click and what to type, step by step.
            </p>
          </div>
          {/* ev: WE PICK THE MODELS FOR YOU 24093-24096 + blurb 24098 */}
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold tracking-tight">WE PICK THE MODELS FOR YOU</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Each lesson shows you which model and settings to use, so you can focus on creating.
            </p>
          </div>
          {/* ev: LEARN THE AI BASICS 24102 + blurb 24105 */}
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold tracking-tight">LEARN THE AI BASICS</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Learn how to write prompts, use references, and improve your results. Put these skills
              into practice with your own images and videos.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET. — ev: region 24107, heading 24109, subtitle 24112 */}
      <section aria-label="What you get" className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">WHAT YOU GET.</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Everything you need is inside. Nothing to buy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {YOU_GET.map((item, i) => (
            <div key={item.title} className="space-y-2 rounded-xl border border-border bg-card p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--signal)]/15 text-[var(--signal)]">
                {i === 0 ? (
                  <Users className="h-4 w-4" aria-hidden />
                ) : i === 1 ? (
                  <Video className="h-4 w-4" aria-hidden />
                ) : i === 2 ? (
                  <FileText className="h-4 w-4" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden />
                )}
              </span>
              <h3 className="text-sm font-bold tracking-tight">{item.title}</h3>
              {item.blurb && (
                <p className="text-xs leading-relaxed text-muted-foreground">{item.blurb}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ev: lesson card 24125-24131 'Your First Video' / 'Lesson 2 of 8, 1 min' / 'You are here' */}
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="px-2 text-[10px] font-semibold uppercase tracking-wide">
                  You are here
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">Lesson 2 of 8, 1 min</span>
              </div>
              <div className="flex items-center gap-3">
                <Tile seed="Your First Video" className="h-16 w-24 shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Your First Video</h3>
                  <p className="text-xs text-muted-foreground">
                    The lesson player was not captured — this card reproduces the captured progress
                    state only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ev: HOMEWORK 24142/24143/24145 + links 24148/24151/24154 */}
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                <Pencil className="h-4 w-4 text-[var(--signal)]" aria-hidden />
                HOMEWORK
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                A small task to practice what you just learned.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {["Make a video", "Make a product photo", "Make a video ad"].map((l) => (
                  <li key={l} className="flex items-center gap-2" title="Live link not captured">
                    <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                    {l}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* ev: CERTIFICATE 24162/24163/24165 + image 24161 */}
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                <Award className="h-4 w-4 text-[var(--signal)]" aria-hidden />
                CERTIFICATE
              </h3>
              <Tile seed="Higgsfield course completion certificate" className="h-16 w-full" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Post it in your stories when you finish.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TWO WAYS TO SPEND THE NEXT 90 MINUTES. — ev: region 24168, heading 24170 */}
      <section aria-label="Two ways to spend the next 90 minutes" className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
          TWO WAYS TO SPEND THE NEXT 90 MINUTES.
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ev: 'Nothing' card 24177-24193 */}
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-6">
            <h3 className="text-lg font-bold tracking-tight">Nothing</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Watch other people make AI videos, and keep wondering how they did it.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NOTHING_LIST.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  {l}
                </li>
              ))}
            </ul>
            {/* ev: button 24192 'Keep scrolling' — page-anchor behavior, inert in clone */}
            <span title="Scroll behavior not captured">
              <Button variant="outline" disabled>
                Keep scrolling
              </Button>
            </span>
          </div>

          {/* ev: RECOMMENDED 24196 + 'Your own film' 24198-24216 */}
          <div className="relative space-y-4 rounded-xl border border-[var(--signal)]/40 bg-[var(--signal)]/5 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="px-2 text-[10px] font-semibold uppercase tracking-wide">RECOMMENDED</Badge>
              <span className="text-xs font-medium text-muted-foreground">Beginner course</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight">Your own film</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Seven short lessons, from your first AI video to a finished scene.
            </p>
            <ul className="space-y-2 text-sm">
              {OWN_FILM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[var(--signal)]" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            {/* ev: link 24216 'Start for free' — scoped (same signup disclosure) */}
            <span title="Course signup flow not captured — no fake enrollment" className="block">
              <Button disabled>Start for free</Button>
            </span>
          </div>
        </div>
      </section>

      {/* YOU WON'T BE ALONE. — ev: region 24218, heading 24220 */}
      <section aria-label="You won’t be alone" className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">YOU WON&rsquo;T BE ALONE.</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ev: EXPLORE CREATORS HUB 24250-24254 + link 24255 'Explore' */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold tracking-tight">
              <span className="block">EXPLORE</span>
              <span className="block">CREATORS HUB</span>
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Get more out of Higgsfield with practical guides and step-by-step tutorials.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link href="/community?tab=creators">Explore</Link>
            </Button>
          </div>
          {/* ev: DISCORD COMMUNITY 24271-24274 + link 24275 'Join Discord' — scoped */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold tracking-tight">DISCORD COMMUNITY</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Share workflows, ask questions, and get feedback from fellow creators.
            </p>
            <span title="Discord invite not captured" className="block">
              <Button variant="secondary" size="sm" disabled className="gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                Join Discord
              </Button>
            </span>
          </div>
          {/* ev: CREATOR PARTNERSHIP PROGRAM 24236-24241 + link 'Learn more' — scoped */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold tracking-tight">
              HIGGSFIELD AI CREATOR PARTNERSHIP PROGRAM
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A full Higgsfield plan renewed every month, credit support, tips and hands-on help
              growing your audience, and a direct line to Higgsfield.
            </p>
            <span title="Program page not captured" className="block">
              <Button variant="secondary" size="sm" disabled>
                Learn more
              </Button>
            </span>
          </div>
        </div>
      </section>

      {/* WANT MORE? — ev: region 24330, heading 24332, blurb 24335, cards 24338-24413 */}
      <section aria-label="Want more?" className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">WANT MORE?</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Free videos on YouTube. They&rsquo;re extras, not the course. Watch them after you finish.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {YOUTUBE_VIDEOS.map((title) => (
            <article
              key={title}
              className="space-y-2 overflow-hidden rounded-xl border border-border bg-card/60 p-4"
              aria-label={`YouTube video: ${title}`}
            >
              <Tile seed={title} className="aspect-video" />
              <h3 className="text-xs font-semibold leading-snug">{title}</h3>
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Heart className="h-3 w-3" aria-hidden />
                Higgsfield AI · YouTube
              </p>
            </article>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {/* ev: link 24415 'All videos on YouTube' — external href uncaptured → inert */}
          <span title="Live YouTube channel link not captured">
            All videos on YouTube (link not captured)
          </span>
        </p>
      </section>

      {/* FAQ — ev: region 24418, heading 24420, blurb 24423, items 24426-24456 */}
      <section aria-label="Frequently asked questions" className="space-y-5">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight lg:text-3xl">
            <HelpCircle className="h-6 w-6 text-[var(--signal)]" aria-hidden />
            GOT ANY QUESTIONS LEFT?
          </h2>
          <p className="text-sm text-muted-foreground">
            We&rsquo;ve answered the most frequently asked questions
          </p>
        </div>
        <Card className="border-border bg-card px-4 sm:px-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.question} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium">{item.question}</AccordionTrigger>
                <AccordionContent>
                  {item.answer ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground/70">
                      The live answer for this question was not captured (the accordion item was
                      collapsed in the 2026-10-17 survey) — no answer is invented here.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>

      {/* CTA recap + honest alternative into the clone studio */}
      <section
        aria-label="Academy scope note"
        className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 sm:p-6"
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-500">
          <GraduationCap className="h-4 w-4" aria-hidden />
          Demo scope — course player not captured
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The evidence survey captured this landing page only; the course player
          (<code className="rounded bg-muted px-1 py-0.5 text-xs">/academy/courses/$course</code> in
          the live route tree) and its catalog were not. While the course itself is not implemented,
          the clone&rsquo;s generation studio is — every lesson skill maps onto it.
        </p>
        <div className="mt-4">
          <Button asChild variant="secondary" size="sm" className="gap-1.5">
            <Link href="/">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Continue in Cinema Studio
            </Link>
          </Button>
        </div>
      </section>

      {/* Site footer — ev: academy capture heading 24460 (shared with /mcp) */}
      <SiteFooter />
    </div>
  );
}
