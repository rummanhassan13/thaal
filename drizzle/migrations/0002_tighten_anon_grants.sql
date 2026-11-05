REVOKE ALL ON public.profiles, public.restaurants, public.restaurant_members, public.branches,
  public.themes, public.menus, public.menu_schedules, public.categories, public.dishes, public.dish_addons, public.tables,
  public.orders, public.order_items, public.service_requests, public.reviews, public.menu_events FROM anon;
GRANT SELECT (id, name, slug, logo_url, cover_url, description, currency, plan, published, created_at) ON public.restaurants TO anon;
GRANT SELECT ON public.branches, public.themes, public.menus, public.menu_schedules, public.categories, public.dishes, public.dish_addons TO anon;
GRANT INSERT ON public.service_requests, public.menu_events TO anon;
REVOKE EXECUTE ON FUNCTION public.can_write_media(text) FROM anon;