import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Hours } from "@/lib/menu/hours";

export type Branch = {
  id: string; name: string; slug: string; address: string | null; phone: string | null;
  timezone: string; opening_hours: Hours; sort: number;
};

type Ctx = { branches: Branch[]; branch: Branch | null; setBranchId: (id: string) => void; loading: boolean };
const BranchCtx = createContext<Ctx>({ branches: [], branch: null, setBranchId: () => {}, loading: true });

export const branchesKey = (restaurantId: string) => ["branches", restaurantId] as const;

export function useBranchesQuery(restaurantId: string) {
  return useQuery({
    queryKey: branchesKey(restaurantId),
    queryFn: async () => {
      const { data, error } = await supabase.from("branches")
        .select("id, name, slug, address, phone, timezone, opening_hours, sort")
        .eq("restaurant_id", restaurantId).order("sort").order("created_at");
      if (error) throw error;
      return (data ?? []).map((b) => ({ ...b, opening_hours: (b.opening_hours ?? {}) as Hours })) as Branch[];
    },
  });
}

export function BranchProvider({ restaurantId, children }: { restaurantId: string; children: React.ReactNode }) {
  const { data, isLoading } = useBranchesQuery(restaurantId);
  const storeKey = `plated.branch.${restaurantId}`;
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { setId(localStorage.getItem(storeKey)); }, [storeKey]);
  const value = useMemo<Ctx>(() => {
    const branches = data ?? [];
    const branch = branches.find((b) => b.id === id) ?? branches[0] ?? null;
    return {
      branches, branch, loading: isLoading,
      setBranchId: (next) => { localStorage.setItem(storeKey, next); setId(next); },
    };
  }, [data, id, isLoading, storeKey]);
  return <BranchCtx.Provider value={value}>{children}</BranchCtx.Provider>;
}

export const useBranch = () => useContext(BranchCtx);
