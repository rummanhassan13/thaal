export type PublicDish = {
  id: string; name: string; short_description: string | null; description: string | null;
  price: number; photo_url: string | null; is_veg: boolean; is_spicy: boolean; spice_level: number;
  ingredients: string[]; allergens: string[]; is_sold_out: boolean; is_special: boolean;
  addons: { id: string; name: string; price: number }[];
};
export type PublicCategory = { id: string; name: string; dishes: PublicDish[] };
export type PublicMenu = { id: string; name: string; categories: PublicCategory[]; schedules: { weekdays: number[]; start_time: string; end_time: string }[] };
export type PublicMenuData = {
  restaurant: { id: string; name: string; slug: string; description: string | null; logo_url: string | null; cover_url: string | null; currency: string; plan: string };
  branch: { id: string; name: string; address: string | null; timezone: string; opening_hours: Record<string, { open: string; close: string } | null> };
  theme: { accent: string; font_pairing: string; mode: string; logo_url: string | null; cover_url: string | null } | null;
  generatedAt: string;
  menus: PublicMenu[];
  activeMenuId: string | null;
};

export const formatPrice = (n: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

export function todaysHours(hours: PublicMenuData["branch"]["opening_hours"], timeZone: string) {
  const key = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short" }).format(new Date()).toLowerCase().slice(0, 3);
  const h = hours?.[key];
  return h ? `Open today ${h.open}–${h.close}` : "Closed today";
}
