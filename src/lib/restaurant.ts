import { supabase } from "@/integrations/supabase/client";

/** The signed-in user's first restaurant (owner or staff), or null. */
export async function fetchMyRestaurant(userId: string) {
  const { data } = await supabase
    .from("restaurant_members")
    .select("role, restaurants(id, name, slug, description, currency, plan, published, logo_url, cover_url)")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!data?.restaurants) return null;
  return { ...data.restaurants, role: data.role };
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export const CURRENCIES = ["GBP", "EUR", "USD", "AUD", "CAD", "NZD", "INR", "AED", "SGD", "ZAR", "CHF", "SEK", "NOK", "DKK", "JPY"];
