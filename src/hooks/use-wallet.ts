"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface WalletJson {
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

export function useWallet(enabled = true) {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => api<WalletJson>("/api/user/wallet"),
    enabled,
    retry: false,
  });
}
