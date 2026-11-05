CREATE TYPE public.plan_tier AS ENUM ('free','pro','business');
CREATE TYPE public.member_role AS ENUM ('owner','staff');
CREATE TYPE public.font_pairing AS ENUM ('fraunces_inter_tight','instrument_serif_inter','dm_serif_dm_sans','playfair_work_sans');
CREATE TYPE public.theme_mode AS ENUM ('light','dark');
CREATE TYPE public.order_status AS ENUM ('new','preparing','served','cancelled');
CREATE TYPE public.payment_method AS ENUM ('online','counter');
CREATE TYPE public.payment_status AS ENUM ('unpaid','paid');
CREATE TYPE public.service_type AS ENUM ('waiter','bill');
CREATE TYPE public.service_status AS ENUM ('open','done');
CREATE TYPE public.menu_event_type AS ENUM ('scan','dish_view','add_to_cart');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 2 AND 60),
  logo_url text, cover_url text, description text,
  currency text NOT NULL DEFAULT 'GBP',
  plan public.plan_tier NOT NULL DEFAULT 'free',
  stripe_customer_id text, stripe_subscription_id text, plan_status text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.member_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, user_id)
);

CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL, slug text NOT NULL,
  address text, phone text,
  timezone text NOT NULL DEFAULT 'Europe/London',
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, slug)
);

CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  accent text NOT NULL DEFAULT '#C8553D' CHECK (accent ~ '^#[0-9A-Fa-f]{6}$'),
  font_pairing public.font_pairing NOT NULL DEFAULT 'fraunces_inter_tight',
  mode public.theme_mode NOT NULL DEFAULT 'light',
  logo_url text, cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX themes_scope_uniq ON public.themes (restaurant_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE TABLE public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL, sort int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  weekdays int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}' CHECK (weekdays <@ '{0,1,2,3,4,5,6}'::int[]),
  start_time time NOT NULL, end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name text NOT NULL, sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL, short_description text, description text,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  photo_url text,
  is_veg boolean NOT NULL DEFAULT false, is_spicy boolean NOT NULL DEFAULT false,
  spice_level int NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
  ingredients text[] NOT NULL DEFAULT '{}', allergens text[] NOT NULL DEFAULT '{}',
  is_sold_out boolean NOT NULL DEFAULT false, is_special boolean NOT NULL DEFAULT false,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dish_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  name text NOT NULL, price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0), sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  label text NOT NULL,
  qr_code_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, label)
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  table_label text,
  status public.order_status NOT NULL DEFAULT 'new',
  payment_method public.payment_method NOT NULL DEFAULT 'counter',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  subtotal numeric(10,2) NOT NULL DEFAULT 0, total numeric(10,2) NOT NULL DEFAULT 0,
  customer_note text,
  tracking_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dish_id uuid REFERENCES public.dishes(id) ON DELETE SET NULL,
  name text NOT NULL, unit_price numeric(10,2) NOT NULL, qty int NOT NULL CHECK (qty > 0),
  addons jsonb NOT NULL DEFAULT '[]'::jsonb, note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  type public.service_type NOT NULL,
  status public.service_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, dish_id)
);

CREATE TABLE public.menu_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  type public.menu_event_type NOT NULL,
  dish_id uuid REFERENCES public.dishes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.restaurant_members (user_id);
CREATE INDEX ON public.branches (restaurant_id);
CREATE INDEX ON public.menus (branch_id);
CREATE INDEX ON public.menu_schedules (menu_id);
CREATE INDEX ON public.categories (menu_id);
CREATE INDEX ON public.dishes (category_id);
CREATE INDEX ON public.dish_addons (dish_id);
CREATE INDEX ON public.tables (branch_id);
CREATE INDEX ON public.orders (branch_id, created_at DESC);
CREATE INDEX ON public.order_items (order_id);
CREATE INDEX ON public.service_requests (branch_id, created_at DESC);
CREATE INDEX ON public.reviews (dish_id);
CREATE INDEX ON public.menu_events (branch_id, created_at DESC);

CREATE TRIGGER t_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_restaurant_member(_restaurant_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM restaurant_members WHERE restaurant_id = _restaurant_id AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_restaurant_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM restaurant_members WHERE restaurant_id = _restaurant_id AND user_id = auth.uid() AND role = 'owner')
$$;
CREATE OR REPLACE FUNCTION public.is_restaurant_published(_restaurant_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM restaurants WHERE id = _restaurant_id AND published)
$$;
CREATE OR REPLACE FUNCTION public.restaurant_of_branch(_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT restaurant_id FROM branches WHERE id = _id $$;
CREATE OR REPLACE FUNCTION public.restaurant_of_menu(_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.restaurant_id FROM menus m JOIN branches b ON b.id = m.branch_id WHERE m.id = _id $$;
CREATE OR REPLACE FUNCTION public.restaurant_of_category(_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.restaurant_id FROM categories c JOIN menus m ON m.id = c.menu_id JOIN branches b ON b.id = m.branch_id WHERE c.id = _id $$;
CREATE OR REPLACE FUNCTION public.restaurant_of_dish(_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.restaurant_id FROM dishes d JOIN categories c ON c.id = d.category_id JOIN menus m ON m.id = c.menu_id JOIN branches b ON b.id = m.branch_id WHERE d.id = _id $$;
CREATE OR REPLACE FUNCTION public.restaurant_of_order(_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.restaurant_id FROM orders o JOIN branches b ON b.id = o.branch_id WHERE o.id = _id $$;

CREATE OR REPLACE FUNCTION public.slug_available(_slug text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = lower(_slug)) $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.guard_restaurant_billing() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon','authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan := 'free'; NEW.stripe_customer_id := NULL; NEW.stripe_subscription_id := NULL; NEW.plan_status := NULL;
      NEW.owner_id := auth.uid();
    ELSIF NEW.plan IS DISTINCT FROM OLD.plan OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id OR NEW.plan_status IS DISTINCT FROM OLD.plan_status
       OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'Billing and ownership fields cannot be changed directly';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_guard_billing BEFORE INSERT OR UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.guard_restaurant_billing();

CREATE OR REPLACE FUNCTION public.add_owner_membership() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO restaurant_members (restaurant_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_owner_member AFTER INSERT ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.add_owner_membership();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.restaurants, public.restaurant_members, public.branches,
  public.themes, public.menus, public.menu_schedules, public.categories, public.dishes, public.dish_addons, public.tables,
  public.orders, public.order_items, public.service_requests, public.reviews, public.menu_events TO authenticated;
GRANT ALL ON public.profiles, public.restaurants, public.restaurant_members, public.branches,
  public.themes, public.menus, public.menu_schedules, public.categories, public.dishes, public.dish_addons, public.tables,
  public.orders, public.order_items, public.service_requests, public.reviews, public.menu_events TO service_role;
GRANT SELECT (id, name, slug, logo_url, cover_url, description, currency, plan, published, created_at) ON public.restaurants TO anon;
GRANT SELECT ON public.branches, public.themes, public.menus, public.menu_schedules, public.categories, public.dishes, public.dish_addons TO anon;
GRANT INSERT ON public.service_requests, public.menu_events TO anon;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "public published restaurants" ON public.restaurants FOR SELECT TO anon USING (published);
CREATE POLICY "members read restaurant" ON public.restaurants FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_restaurant_member(id));
CREATE POLICY "create own restaurant" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "members update restaurant" ON public.restaurants FOR UPDATE TO authenticated USING (public.is_restaurant_member(id)) WITH CHECK (public.is_restaurant_member(id));
CREATE POLICY "owners delete restaurant" ON public.restaurants FOR DELETE TO authenticated USING (public.is_restaurant_owner(id));

CREATE POLICY "members read members" ON public.restaurant_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_restaurant_member(restaurant_id));
CREATE POLICY "owners add members" ON public.restaurant_members FOR INSERT TO authenticated WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "owners update members" ON public.restaurant_members FOR UPDATE TO authenticated USING (public.is_restaurant_owner(restaurant_id)) WITH CHECK (public.is_restaurant_owner(restaurant_id));
CREATE POLICY "owners remove members" ON public.restaurant_members FOR DELETE TO authenticated USING (public.is_restaurant_owner(restaurant_id));

CREATE POLICY "public read" ON public.branches FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(restaurant_id));
CREATE POLICY "members all" ON public.branches FOR ALL TO authenticated USING (public.is_restaurant_member(restaurant_id)) WITH CHECK (public.is_restaurant_member(restaurant_id));

CREATE POLICY "public read" ON public.themes FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(restaurant_id));
CREATE POLICY "members all" ON public.themes FOR ALL TO authenticated USING (public.is_restaurant_member(restaurant_id)) WITH CHECK (public.is_restaurant_member(restaurant_id));

CREATE POLICY "public read" ON public.menus FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(public.restaurant_of_branch(branch_id)));
CREATE POLICY "members all" ON public.menus FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_branch(branch_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_branch(branch_id)));

CREATE POLICY "public read" ON public.menu_schedules FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(public.restaurant_of_menu(menu_id)));
CREATE POLICY "members all" ON public.menu_schedules FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_menu(menu_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_menu(menu_id)));

CREATE POLICY "public read" ON public.categories FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(public.restaurant_of_menu(menu_id)));
CREATE POLICY "members all" ON public.categories FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_menu(menu_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_menu(menu_id)));

CREATE POLICY "public read" ON public.dishes FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(public.restaurant_of_category(category_id)));
CREATE POLICY "members all" ON public.dishes FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_category(category_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_category(category_id)));

CREATE POLICY "public read" ON public.dish_addons FOR SELECT TO anon, authenticated USING (public.is_restaurant_published(public.restaurant_of_dish(dish_id)));
CREATE POLICY "members all" ON public.dish_addons FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_dish(dish_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_dish(dish_id)));

CREATE POLICY "members all" ON public.tables FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_branch(branch_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_branch(branch_id)));

CREATE POLICY "members all" ON public.orders FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_branch(branch_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_branch(branch_id)));
CREATE POLICY "members all" ON public.order_items FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_order(order_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_order(order_id)));

CREATE POLICY "members all" ON public.service_requests FOR ALL TO authenticated USING (public.is_restaurant_member(public.restaurant_of_branch(branch_id))) WITH CHECK (public.is_restaurant_member(public.restaurant_of_branch(branch_id)));
CREATE POLICY "diners create request" ON public.service_requests FOR INSERT TO anon, authenticated WITH CHECK (
  status = 'open' AND public.is_restaurant_published(public.restaurant_of_branch(branch_id))
  AND (table_id IS NULL OR EXISTS (SELECT 1 FROM public.tables t WHERE t.id = table_id AND t.branch_id = service_requests.branch_id))
);

CREATE POLICY "members read reviews" ON public.reviews FOR SELECT TO authenticated USING (public.is_restaurant_member(public.restaurant_of_dish(dish_id)));
CREATE POLICY "members delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.is_restaurant_member(public.restaurant_of_dish(dish_id)));

CREATE POLICY "members read events" ON public.menu_events FOR SELECT TO authenticated USING (public.is_restaurant_member(public.restaurant_of_branch(branch_id)));
CREATE POLICY "diners log events" ON public.menu_events FOR INSERT TO anon, authenticated WITH CHECK (
  public.is_restaurant_published(public.restaurant_of_branch(branch_id))
  AND (dish_id IS NULL OR public.restaurant_of_dish(dish_id) = public.restaurant_of_branch(branch_id))
);

CREATE OR REPLACE FUNCTION public.table_in_branch(_table_id uuid, _branch_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM tables WHERE id = _table_id AND branch_id = _branch_id) $$;
DROP POLICY "diners create request" ON public.service_requests;
CREATE POLICY "diners create request" ON public.service_requests FOR INSERT TO anon, authenticated WITH CHECK (
  status = 'open' AND public.is_restaurant_published(public.restaurant_of_branch(branch_id))
  AND (table_id IS NULL OR public.table_in_branch(table_id, branch_id))
);

CREATE OR REPLACE FUNCTION public.resolve_table(_token text) RETURNS TABLE (table_id uuid, label text, branch_id uuid, restaurant_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.label, t.branch_id, r.slug FROM tables t JOIN branches b ON b.id = t.branch_id JOIN restaurants r ON r.id = b.restaurant_id
  WHERE t.qr_code_token = _token AND r.published
$$;

CREATE OR REPLACE FUNCTION public.place_order(
  p_branch_id uuid, p_table text, p_items jsonb,
  p_payment_method public.payment_method DEFAULT 'counter', p_note text DEFAULT NULL
) RETURNS TABLE (order_id uuid, tracking_token uuid, total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rest restaurants%ROWTYPE; v_table_id uuid; v_label text; v_order uuid; v_token uuid;
  v_item jsonb; v_dish record; v_qty int; v_addons jsonb; v_addon_sum numeric; v_sub numeric := 0;
BEGIN
  SELECT r.* INTO v_rest FROM restaurants r JOIN branches b ON b.restaurant_id = r.id WHERE b.id = p_branch_id;
  IF NOT FOUND OR NOT v_rest.published THEN RAISE EXCEPTION 'Menu not found'; END IF;
  IF v_rest.plan NOT IN ('pro','business') THEN RAISE EXCEPTION 'This restaurant does not take orders online'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Your order is empty'; END IF;
  IF p_note IS NOT NULL AND length(p_note) > 500 THEN RAISE EXCEPTION 'Note is too long'; END IF;

  IF p_table IS NOT NULL AND p_table <> '' THEN
    SELECT t.id, t.label INTO v_table_id, v_label FROM tables t
    WHERE t.branch_id = p_branch_id AND (t.qr_code_token = p_table OR t.label = p_table) LIMIT 1;
    IF v_table_id IS NULL THEN RAISE EXCEPTION 'Unknown table'; END IF;
  END IF;

  INSERT INTO orders (branch_id, table_id, table_label, payment_method, customer_note)
  VALUES (p_branch_id, v_table_id, v_label, p_payment_method, p_note)
  RETURNING orders.id, orders.tracking_token INTO v_order, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := coalesce((v_item->>'qty')::int, 1);
    IF v_qty < 1 OR v_qty > 20 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT d.id, d.name, d.price, d.is_sold_out INTO v_dish
    FROM dishes d JOIN categories c ON c.id = d.category_id JOIN menus m ON m.id = c.menu_id
    WHERE d.id = (v_item->>'dish_id')::uuid AND m.branch_id = p_branch_id;
    IF v_dish.id IS NULL THEN RAISE EXCEPTION 'A dish in your order is no longer on the menu'; END IF;
    IF v_dish.is_sold_out THEN RAISE EXCEPTION '% just sold out', v_dish.name; END IF;

    SELECT coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'price', a.price) ORDER BY a.sort), '[]'::jsonb),
           coalesce(sum(a.price), 0)
      INTO v_addons, v_addon_sum
    FROM dish_addons a
    WHERE a.dish_id = v_dish.id
      AND a.id IN (SELECT (x)::uuid FROM jsonb_array_elements_text(coalesce(v_item->'addon_ids', '[]'::jsonb)) x);

    INSERT INTO order_items (order_id, dish_id, name, unit_price, qty, addons, note)
    VALUES (v_order, v_dish.id, v_dish.name, v_dish.price + v_addon_sum, v_qty, v_addons, left(v_item->>'note', 200));
    v_sub := v_sub + (v_dish.price + v_addon_sum) * v_qty;
  END LOOP;

  UPDATE orders SET subtotal = v_sub, total = v_sub WHERE orders.id = v_order;
  RETURN QUERY SELECT v_order, v_token, v_sub;
END $$;

CREATE OR REPLACE FUNCTION public.get_order_status(p_order_id uuid, p_token uuid)
RETURNS TABLE (id uuid, status public.order_status, payment_status public.payment_status, total numeric, table_label text, created_at timestamptz, items jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.status, o.payment_status, o.total, o.table_label, o.created_at,
    coalesce((SELECT jsonb_agg(jsonb_build_object('dish_id', i.dish_id, 'name', i.name, 'qty', i.qty, 'unit_price', i.unit_price, 'addons', i.addons)) FROM order_items i WHERE i.order_id = o.id), '[]'::jsonb)
  FROM orders o WHERE o.id = p_order_id AND o.tracking_token = p_token
$$;

CREATE OR REPLACE FUNCTION public.submit_review(p_order_id uuid, p_token uuid, p_dish_id uuid, p_rating int, p_comment text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'Rating must be 1 to 5'; END IF;
  IF NOT EXISTS (SELECT 1 FROM orders o JOIN order_items i ON i.order_id = o.id
     WHERE o.id = p_order_id AND o.tracking_token = p_token AND o.status <> 'cancelled' AND i.dish_id = p_dish_id) THEN
    RAISE EXCEPTION 'You can only review dishes from your own order';
  END IF;
  INSERT INTO reviews (dish_id, order_id, rating, comment) VALUES (p_dish_id, p_order_id, p_rating, left(p_comment, 1000))
  ON CONFLICT (order_id, dish_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
  RETURNING reviews.id INTO v_id;
  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.place_order(uuid, text, jsonb, public.payment_method, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid, uuid), public.submit_review(uuid, uuid, uuid, int, text), public.resolve_table(text), public.slug_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_write_media(_path text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  v := substring(_path from '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/');
  IF v IS NULL THEN RETURN false; END IF;
  RETURN public.is_restaurant_member(v::uuid);
END $$;
GRANT EXECUTE ON FUNCTION public.can_write_media(text) TO authenticated;

CREATE POLICY "menu-media members insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-media' AND public.can_write_media(name));
CREATE POLICY "menu-media members update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'menu-media' AND public.can_write_media(name)) WITH CHECK (bucket_id = 'menu-media' AND public.can_write_media(name));
CREATE POLICY "menu-media members delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'menu-media' AND public.can_write_media(name));

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders, public.service_requests, public.dishes;