# DOM dumps — the authenticated product surface (2026-10-17, operator session)

Source: replay browser (durable profile), CDP evaluation of live DOM at
higgsfield.ai. All text below is verbatim `document.body.innerText` unless
marked otherwise.

## /generate — Cinema Studio (the core product surface)

```
Cinema Studio
Higgsfield AI
Home
My generations
My elements
My favorites
Community

Projects

New project

Learn to make movies

Practical workflows from working AI filmmakers

Learn more
All projects
Pricing
55% OFF
yaslen
Explore
BRING YOUR STORIES TO LIFE
Image
Video
References
0/50
Film setup
Auto
Camera
Auto
Color palette
Auto
Lighting
Auto
[ prompt: "A serene mountain lake at sunrise, mist rising off the water, cinematic photography" ]
Cinema Studio 4.0
1080p
16:9
5s
On
1/4
GENERATE
80
Describe the scene you imagine...
My projects
Create new project
New project
Private
```

DOM facts (CDP queries):
- Login button (logged-out header): `button.hfnav-auth.hfnav-auth-login`,
  center (1299, 27) at 1439px viewport
- Auth modal buttons: "Continue with Google" / Apple / Microsoft stacked,
  then email input + "Continue" (email-first modal)
- Prompt input: contenteditable DIV (not a textarea)
- GENERATE button: text "GENERATE\n80" (cost embedded)
- Composer tabs: Image / Video / References (References count "0/50")
- Settings chips render as buttons: `Cinema Studio 4.0`, `1080p`, `16:9`,
  `5s`, `On`, `1/4`

## Onboarding quiz (/quiz, post-signup)

Steps (multi-select + Continue each):
1. "What do you want to achieve with Higgsfield?" — Viral content & UGC
   videos / High-converting marketing / Automate workflows with
   Supercomputer & MCP/CLI / Cinematic visuals & AI films / Create avatars &
   product visuals / Just exploring
2. Skill level: Beginner (Simple, guided, one-c…) / …
3+ subsequent steps (feature interest, discovery channel, pain points)
Final: "Claim your username" — auto-generated `radiatingcapybara1609`, Edit,
terms checkbox (real input[type=checkbox] at (773, 424)), Continue →
pricing special offer (yasl_PERSONAL_PROMO 55% OFF, 2h countdown, Monthly/
Annual, STARTER/PLUS tiers, "Skip this offer")

## /community — the full product nav (verbatim)

```
Explore
Image
Video
Audio
MCP
API
Genjutsu
Top
Katana
New
AI Influencer
Academy
New
ChatGPT Plugin
Ads Studio
Effects
Cinema Studio
Contests
Contests
Marketing Studio
Supercomputer
Edit
Community
Plugins
Canvas
Originals
Pricing
55% OFF
Enterprise
Assets
```

## Contests API body (GET /fnf/contests?size=50)

```json
{"items":[{"id":"4263b5fb-fead-441d-aa37-62f8aa367aa1",
"slug":"higgsfield-global-film-festival","title":"Higgsfield Festival",
"description":"Higgsfield AI Film Festival — $1,000,000 Prize Pool",
"start_at":"2026-07-16T00:00:00Z","end_at":"2026-07-30T23:59:00Z",
"status":"open",
"preview_image":"https://static.higgsfield.ai/contest/festival-hero/higgs_6_fix_v2-poster.webp",
"preview_video":"https://sta…"}]}
```

## Personal promo (GET /fnf/user/personal-promo)

```json
{"id":"453d9169-4ffd-435c-88f9-abdc6d2fbfdb",
"expired_at":"2026-10-17T09:48:45.734740+00:00",
"promo_code":"yasl_PERSONAL_PROMO","is_claimed":false,
"type":"first_purchase","is_viewed":false}
```

## Route preload manifest

`GET /api/route-preload-manifest?v=<chunk>.js` → per-route chunk lists from
`assets.higgsfield.ai/tanstack/assets/` (219+ chunks on /community).
