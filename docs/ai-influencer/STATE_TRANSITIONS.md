# State transitions

## 1. Generation job lifecycle (existing clone pipeline, reused by wave 7)

The influencer jobs reuse the proven wave-2/4 pipeline (`src/server/worker.ts`,
`prisma/schema.prisma` `Generation`): credits are spent **atomically with job creation**
at POST time (§1a law — one Prisma interactive transaction, CAS-guarded debits, ledger
rows); an in-process worker claims `queued` jobs with a transaction-free CAS
`updateMany` and drives them through `processing` → `done` / `failed`, with **one
automatic retry** for retryable adapter failures (`attempt` 1→2, `maxAttempts = 2`).
Credit spend is not re-executed and not refunded on retry (paid-slot reuse — disclosed
clone-side choice; the reference's retry billing was never captured).

### Clone states → mission §9.2 mapping

| Mission §9.2 state | Clone state / mechanism | Notes |
|---|---|---|
| REQUESTED | client intent — no durable row yet | POST body validation is synchronous |
| VALIDATING | zod validation inside `POST /api/characters/[id]/generate` (+ credit precheck; insufficient credits → terminal 402 **before** any job exists) | Terminal 402 never creates a job (existing law) |
| QUEUED | `Generation.status = "queued"` (+ `attempt = 1`) | Row created atomically with the credit burn |
| RUNNING | `status = "processing"` (`startedAt` set) | CAS claim: `updateMany({ where: { id, status: "queued" } })` — exactly one contender wins |
| FAILED | `status = "failed"` (`error`, `completedAt`) | Retryable + `attempt < 2` → re-enqueued to `queued` instead (below) |
| CANCELLED | **not implemented** | Cancellation semantics uncaptured in the reference; out of wave-7 scope (disclosed) |
| QUALITY_CHECK / REJECTED | **not implemented** | Automated output QA deferred (IDENTITY_EVALUATION.md); no auto-rejection gate in wave 7 |
| COMPLETED | `status = "done"` (`assetUrl`, `assetKind`, `completedAt`) | |

Retry edge (existing H2): retryable failure with attempts left → CAS write back to
`queued` with `attempt + 1`, error/timestamps cleared; attempt ≥ 2 or non-retryable
cause → terminal `failed`. A row deleted mid-flight resolves CAS count=0 with no
follow-up write.

**Refund divergence note (evidence-backed):** the reference's captured notices body
(api-bodies-digest `notices`) warns that when its `ai_influencer` generations fail,
"credits auto-refunded" — while the existing clone pipeline deliberately does **not**
refund on retry/terminal failure (wave-4 disclosed choice). Whether wave-7 influencer
jobs adopt refund-on-terminal-failure is an open TL decision — OPEN_QUESTIONS.md Q15.

### Wave-7 job kinds (clone-side, `spec:`)

| job_set_type | kind | model | credits | created by |
|---|---|---|---|---|
| `influencer_portrait` | image | `ai-influencer` | 0.5625 | `POST /api/characters/[id]/generate` |
| `influencer_fullbody` | image | `ai-influencer` | 0.5625 | `POST /api/characters/[id]/generate` (same submit — atomic pair) |
| `influencer_motion` | video | `wan2.2-i2v-flash` | 1.125 (`spec:` clone-side choice — see API_CONTRACTS.md §motion) | `POST /api/characters/[id]/motion` |

Total for the generate pair = **1.125 credits, matching ev: 2252**. Note: the existing
`Generation.cost` column is `Int` — fractional costs are a known implementation
consideration for W7-B (OPEN_QUESTIONS.md Q1).

## 2. Character record lifecycle (wave-7, clone-side `spec:`)

```
             POST /api/characters {name?, spec}
                        │ (validated: 19 settings, character_type ∈ 9 ev: options)
                        v
                 ┌─────────────┐
      ┌──────────│   created   │  (no jobs, no credits)
      │          └─────────────┘
      │ PATCH {name? | spec? | reference_image?}        DELETE
      v                                                   │
 ┌─────────┐   POST …/generate (1.125 ev:2252)           v
 │ updated │──────────────► generating ──► has-assets ──► deleted
 └─────────┘   POST …/motion   (1.125 spec:)  (portrait/fullBody/motion
                                                 asset links set from
                                                 completed jobs)
```

- **created** → record persists spec JSON (+ optional `reference_image` data-URI).
- **updated** → any PATCH; editing the spec never mutates existing jobs (results are
  historical Generation rows keyed to the user; the character link is metadata).
- **generating** → transient UI state while the character's jobs are queued/processing
  (derived from job status — not a stored character state).
- **has-assets** → portrait/fullBody (and motion) asset links resolved from `done` jobs.
- **deleted** → `DELETE /api/characters/[id]` removes the character record. Its
  Generation rows remain as user-owned history (they are ordinary `Generation` rows);
  the clone does not cascade-delete paid-for outputs (`spec:` choice, disclosed).

Character states are derived, not a stored enum — the durable truth is the character
row + its job rows. This mirrors the mission §3.2 "character as reusable asset"
requirement without inventing a state machine the reference never revealed.
