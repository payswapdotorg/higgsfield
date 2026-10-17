/**
 * HF-W5 — shared server-side computation of the /fnf/user and /fnf/wallet bodies.
 *
 * Extracted from src/app/api/user/route.ts + src/app/api/user/wallet/route.ts so the
 * /me/settings pages (server components) and the API route handlers render the exact
 * same evidence-shaped bodies (single source of truth — no duplication).
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → `user` and `wallet`.
 * The subscription-state keys added by HF-W5 (billing_period, is_cancel_inited,
 * plan_ends_at, next_credit_allocation_at, cohort, promo_state, has_unlim,
 * auto_publish, lang, is_gift_subscription, pause_* fields, workspace_*) carry the
 * CAPTURED FREE-PLAN values verbatim — the operator account in the 2026-10-17 survey
 * was on the free plan, and the clone has no subscription machinery (the live
 * billing/checkout provider surface is the deferred billing-checkout group in
 * docs/route-parity-report.md). Paid-plan states are therefore never invented.
 */
import { db } from "@/lib/db";
import type { User, CreditPool } from "@prisma/client";

const MODEL_POOL_KEYS: Record<string, string> = {
  wan2_5_video: "wan2_5_video_credits",
  text2keyframes: "text2keyframes_credits",
  face_swap: "face_swap_credits",
  qwen_camera_control: "qwen_camera_control_credits",
  character_swap: "character_swap_credits",
};

/** Verbatim /fnf/user body shape (snake_case) — subscription/usage-relevant keys. */
export interface UserBodyJson {
  id: string;
  enterprise_new_main: boolean;
  plan_type: string;
  subscription_credits: number;
  package_credits: number;
  bonus_credits: number;
  bonus_credits_expire_at: string | null;
  soul_credits: number;
  wan2_5_video_credits: number;
  text2keyframes_credits: number;
  face_swap_credits: number;
  qwen_camera_control_credits: number;
  character_swap_credits: number;
  daily_credits: number;
  total_plan_credits: number;
  billing_period: string | null;
  is_cancel_inited: boolean;
  plan_ends_at: string | null;
  next_credit_allocation_at: string | null;
  cohort: string;
  promo_state: string;
  has_unlim: boolean;
  auto_publish: boolean;
  lang: string;
  is_gift_subscription: boolean;
  pause_starts_at: string | null;
  pause_resumes_at: string | null;
  is_pause_scheduled: boolean;
  is_paused: boolean;
  workspace_id: string;
  workspace_type: string;
  workspace_role: string;
}

/** Verbatim /fnf/wallet body shape (snake_case). */
export interface WalletBodyJson {
  workspace_id: string;
  credits_balance: number;
  subscription_balance: number;
  wallet_created_at: string;
  next_credit_allocation_date: string | null;
  total_credits: number;
  on_demand_credits: number;
  bonus_credits: number;
  bonus_credits_expire_at: string | null;
  expire_days: number;
  credit_limit: number | null;
  group_credit_allocation: unknown;
}

export async function poolsFor(userId: string): Promise<CreditPool[]> {
  return db.creditPool.findMany({ where: { userId } });
}

export function userBody(user: User, pools: CreditPool[]): UserBodyJson {
  const poolBalance = (kind: string) => pools.find((p) => p.kind === kind)?.balance ?? 0;

  const packageCredits = poolBalance("wallet");
  const dailyCredits = poolBalance("daily");
  const bonusCredits = pools
    .filter((p) => p.kind.startsWith("model:"))
    .reduce((sum, p) => sum + p.balance, 0);

  const modelCredits: Pick<
    UserBodyJson,
    | "wan2_5_video_credits"
    | "text2keyframes_credits"
    | "face_swap_credits"
    | "qwen_camera_control_credits"
    | "character_swap_credits"
  > = {
    wan2_5_video_credits: 0,
    text2keyframes_credits: 0,
    face_swap_credits: 0,
    qwen_camera_control_credits: 0,
    character_swap_credits: 0,
  };
  for (const [jobSetType, key] of Object.entries(MODEL_POOL_KEYS)) {
    modelCredits[key as keyof typeof modelCredits] = poolBalance(`model:${jobSetType}`);
  }

  return {
    id: `user_${user.id}`,
    enterprise_new_main: false,
    plan_type: user.planType,
    subscription_credits: 0.0,
    package_credits: packageCredits,
    bonus_credits: bonusCredits,
    bonus_credits_expire_at: null,
    soul_credits: 0.0,
    ...modelCredits,
    daily_credits: dailyCredits,
    total_plan_credits: packageCredits + dailyCredits,
    // Captured free-plan subscription state (digest → user): all null/false/inactive.
    billing_period: null,
    is_cancel_inited: false,
    plan_ends_at: null,
    next_credit_allocation_at: null,
    cohort: "tier_1",
    promo_state: "inactive",
    has_unlim: false,
    auto_publish: false,
    lang: "en",
    is_gift_subscription: false,
    pause_starts_at: null,
    pause_resumes_at: null,
    is_pause_scheduled: false,
    is_paused: false,
    workspace_id: `ws_${user.id}`,
    workspace_type: "private",
    workspace_role: "owner",
  };
}

export function walletBody(user: User, pools: CreditPool[]): WalletBodyJson {
  const wallet = pools.find((p) => p.kind === "wallet")?.balance ?? 0;
  const bonus = pools
    .filter((p) => p.kind.startsWith("model:"))
    .reduce((sum, p) => sum + p.balance, 0);

  return {
    workspace_id: `ws_${user.id}`,
    credits_balance: wallet,
    subscription_balance: 0,
    wallet_created_at: user.createdAt.toISOString(),
    next_credit_allocation_date: null,
    total_credits: wallet + bonus,
    on_demand_credits: 0,
    bonus_credits: bonus,
    bonus_credits_expire_at: null,
    expire_days: 90,
    credit_limit: null,
    group_credit_allocation: null,
  };
}

/** Convenience: both bodies in one db round (settings pages read user + wallet side by side). */
export async function accountBodiesFor(user: User): Promise<{ userBody: UserBodyJson; walletBody: WalletBodyJson }> {
  const pools = await poolsFor(user.id);
  return { userBody: userBody(user, pools), walletBody: walletBody(user, pools) };
}
