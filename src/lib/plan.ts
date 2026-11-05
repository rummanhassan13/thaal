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

/** Display catalog: prices and selling points. Change prices here; landing page and billing page both read it. */
export type PlanInfo = {
  id: Plan; name: string; price: number; currency: "GBP"; period: string; blurb: string; features: string[]; highlight?: boolean;
};
export const PLANS: PlanInfo[] = [
  { id: "free", name: "Free", price: 0, currency: "GBP", period: "forever", blurb: "A full photo menu with one QR code.",
    features: ["1 menu", "Unlimited dishes & photos", "Basic plain QR code", "Browse-only menu"] },
  { id: "pro", name: "Pro", price: 19, currency: "GBP", period: "per month", blurb: "For restaurants that want orders from the table.", highlight: true,
    features: ["Everything in Free", "Unlimited menus", "Table ordering", "Online payment (coming soon)", "Custom themes", "Branded table QR codes", "Analytics"] },
  { id: "business", name: "Business", price: 49, currency: "GBP", period: "per month", blurb: "For restaurants with more than one branch.",
    features: ["Everything in Pro", "Multiple branches"] },
];
export const planInfo = (plan: string | null | undefined) => PLANS.find((p) => p.id === plan) ?? PLANS[0]!;
export const formatPlanPrice = (p: PlanInfo) => `£${p.price}`;

/** Rows for the side-by-side comparison table. */
export const COMPARISON: { label: string; value: (f: PlanFeatures) => string | boolean }[] = [
  { label: "Menus per branch", value: (f) => (f.maxMenusPerBranch === Infinity ? "Unlimited" : String(f.maxMenusPerBranch)) },
  { label: "Branches", value: (f) => (f.maxBranches === Infinity ? "Unlimited" : String(f.maxBranches)) },
  { label: "Table ordering", value: (f) => f.ordering },
  { label: "Custom themes", value: (f) => f.themes },
  { label: "Branded table QR codes", value: (f) => f.tableQr },
  { label: "Analytics", value: (f) => f.analytics },
];
