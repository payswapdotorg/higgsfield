# HF-START-HERE — the Higgsfield Product Clone Program

> Repo of record for the clone of **higgsfield.ai** (the actual product — the
> AI-native creative suite: studios, generation pipeline, community), NOT the
> marketing website. Issued by the TL station. The repo is the only source of
> truth once it lands on `payswapdotorg/<repo-name>` (GitHub rail pending PAT).

## What we are building

A working clone of the higgsfield.ai PRODUCT, reverse-engineered from the live
authenticated app (operator account, session captured in the replay browser),
built wave-by-wave by dispatched workers (chat.z.ai agents, GLM-5.3,
Full-Stack), verified at a station before merge.

## The stack (target architecture — evidence in `evidence/`)

| Layer | Higgsfield (source, from network capture) | Clone target |
|---|---|---|
| Frontend | TanStack Start (SSR + `/_serverFn/<sha>` server functions), 219+ hashed JS chunks at `assets.higgsfield.ai/tanstack/` | Next.js 16 App Router + TypeScript |
| Auth | Clerk (proxy rollout `/_clerk/v1/*`, accounts.higgsfield.ai hosted pages, Google/Apple/Microsoft OAuth) | NextAuth.js v4 (Google provider) |
| Backend API | `fnf-api-gw.higgsfield.ai/fnf/*` REST gateway | Next.js API routes (route handlers) |
| Data | folders/projects, user/credits, community, contests | Prisma + SQLite |
| CDN/media | `cdn.higgsfield.ai/card_preview/...`, cloudfront | local `/public` + object-store-ready abstraction |
| Bot/analytics | DataDome, Cloudflare, PostHog, GA | none (out of scope) |

## Product surface to clone (the real nav, captured 2026-10-17)

Core (wave 1-2):
1. **Cinema Studio** (`/generate`) — THE product. Composer: Image / Video /
   References tabs, prompt box ("Describe your scene - use @ to add characters
   & locations"), Film setup (Camera / Color palette / Lighting — each Auto or
   manual), model chips (`Cinema Studio 4.0`, `1080p`, `16:9`, `5s`, `On`,
   `1/4`), GENERATE button with credit cost (80), credits balance, projects
   sidebar (New project / All projects, private folders, per-surface).
2. **Projects / folders** — `POST /fnf/folders {name, access_mode:"private",
   surface:"cinematic_studio", workspace_id:null}`, folders/accessible,
   folders/pinned?recent_jobs_count, folders/{id}/children.
3. **Generation pipeline** — job creation → async status polling → result
   (video/image at cdn.higgsfield.ai/card_preview/...) → My generations.
   (Job contract to be deep-captured station-side; workers build the queue,
   worker, polling client, and gallery.)
4. **Credits / billing** — wallet, subscriptions/v2/plans, personal promo,
   credit-package-discount, free-gens/v2, upgrade paywall modal.
5. **Community** (`/community`) — generations/feed, project-publications/
   trending, discovery/creators + header, contests ($1M film festival).

Wider surface (wave 3+): Image, Video, Audio, MCP, API (open platform),
Genjutsu, Katana, AI Influencer, Academy, ChatGPT Plugin, Ads Studio, Effects,
Contests, Marketing Studio, Supercomputer, Edit, Plugins, Canvas, Originals,
Assets, Enterprise.

## Governance (binding)

- Workers implement; the station (TL) reviews, verifies, merges. TL does not
  write product code.
- Every wave lands through: worker delivery (git bundle + MANIFEST via chat
  workspace files) → station clean-room verification → merge → ledger.
- Evidence-first: every feature claim cites the network capture / DOM dumps /
  bundle analysis in `evidence/`. Never invent API contracts.
- Credential-free delivery: no secrets in any artifact.
- Wave order is sequential; each wave's packet cites the exact evidence files.

## Directory layout

- `docs/HF-PROGRAM/` — this file, ROADMAP, WORK-REGISTRY (worker records)
- `evidence/` — the survey dossier (network capture, DOM dumps, bundle maps)
- `src/` — the clone app (created by wave 1)
