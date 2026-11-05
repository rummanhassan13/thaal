/** Single source of truth for what each plan unlocks. Stripe flips `restaurants.plan`; everything else reads this. */
export type Plan = "free" | "pro" | "business";

export type PlanFeatures = {
  maxBranches: number;
  maxMenusPerBranch: number;
  ordering: boolean;
  themes: boolean;
  analytics: boolean;
  /** Accent-coloured, logo-centred QR codes for each table. Free gets one plain QR for the menu. */
  tableQr: boolean;
};

const FEATURES: Record<Plan, PlanFeatures> = {
  free: { maxBranches: 1, maxMenusPerBranch: 1, ordering: false, themes: false, analytics: false, tableQr: false },
  pro: { maxBranches: 1, maxMenusPerBranch: Infinity, ordering: true, themes: true, analytics: true, tableQr: true },
  business: { maxBranches: Infinity, maxMenusPerBranch: Infinity, ordering: true, themes: true, analytics: true, tableQr: true },
};

export function planFeatures(plan: string | null | undefined): PlanFeatures {
  return FEATURES[(plan as Plan) in FEATURES ? (plan as Plan) : "free"];
}

export const canAddBranch = (plan: string, current: number) => current < planFeatures(plan).maxBranches;
export const canAddMenu = (plan: string, current: number) => current < planFeatures(plan).maxMenusPerBranch;
