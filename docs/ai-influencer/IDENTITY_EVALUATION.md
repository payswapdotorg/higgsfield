# Identity evaluation — protocol (mission §6.4/§6.5)

> Purpose: separate "a generation endpoint returned 200" from "the output is a usable,
> identity-consistent influencer asset". Null = not measured; the protocol exists so
> wave 7 can fill numbers honestly rather than claim quality.

## Fixed benchmark set (mission §6.4)

A pinned, version-controlled set of character cases exercising the axes that break
identity systems. Wave-7 initial set (stored with each case: input spec, reference
asset if any, provider, model, seed/params, output):

1. Ordinary human features, portrait + full-body (the baseline pair).
2. Unusual facial features (e.g. bold character type — ev: 145).
3. Different skin tones and hair types (spec: option values across the curated lists).
4. Slim / muscular / other body builds (spec: `build` values).
5. Front-facing, profile, three-quarter view prompts.
6. Multiple outfits and environments (style/accessories axes).
7. Reference-based identity transfer (uploaded reference → generated portrait).
8. Difficult poses + partial occlusion (full-body prompt variants).
9. Non-human character types (ev: 151 Insect / 154 Frog / 157 Cat / 160 Dog /
   163 Rodent / 166 Bird) — the captured option set's distinctive axis.

## Metrics

| Metric | What it measures | Wave-7 method |
|---|---|---|
| Identity similarity | Same person across portrait/full-body/regenerations/motion frames | **Deferred quantitative scoring (face-embedding) — documented deviation**; human station review only for wave 7 |
| Attribute adherence | Image matches the spec (hair color, build, style…) | Human review checklist keyed to the spec's set values |
| Composition & framing | Correct crop/framing for portrait vs full-body | Human review |
| Anatomy & artifacts | Limbs, hands, distortion, model artifacts | Human review |
| Temporal consistency | Motion clips: character stability across frames | Human review of the archived MP4 |
| Background preservation | (replacement workflows) | N/A — character replacement unavailable (BLOCKED) |

Face-embedding similarity is explicitly NOT the sole metric even where implemented
(mission §6.4: a character can score well on face identity with broken anatomy);
conversely automated metrics never substitute for human evaluation.

## Comparison protocol (mission §6.5)

For every candidate route comparison (wave 7 has one live image route + mock, so
cross-route comparison is minimal — the protocol is banked for future routes):

- Same character specification, same reference images, equivalent scene descriptions.
- Multiple poses and lighting conditions; several seeds.
- Record failures as well as successes; record latency, cost, hardware.
- Never compare one route's cherry-picked best against another's average.

## Benchmark record format (nulls preserved)

```json
{
  "case_id": "identity-fullbody-004",
  "provider": "null-until-measured",
  "model_version": "null-until-measured",
  "identity_score": null,
  "attribute_adherence": null,
  "composition_score": null,
  "human_review": "pending",
  "latency_ms": null,
  "estimated_cost": null,
  "failure": null
}
```

## How wave 7 will actually measure

1. **Golden-path generations archived as evidence** — the station's live golden path
   (create → generate → motion) on the deployed build saves the real outputs (JPEG +
   MP4) with their case metadata into the evidence area; those artifacts ARE the
   benchmark records.
2. **Human review = TL station browser verification** — the TL inspects outputs in the
   station browser (the established wave-1..6 verification pattern) and records
   PASS/FAIL judgments per the metric checklist above in the wave-7 worklog.
3. **Automated face-embedding similarity = deferred**, documented as such here and in
   KNOWN_LIMITATIONS.md — no eval infrastructure exists in wave 7; identity drift vs
   uploaded references stays qualitatively assessed. Thresholds are NOT invented
   (mission §6.6): numerical gates wait for a real baseline.
4. Regression law (mission §9.3): every real defect found (face changes on turn,
   full-body build mismatch, wardrobe edit changes the face, motion distortion) is
   preserved as a benchmark case + documented limitation rather than silently patched.
