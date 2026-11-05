ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS read_at timestamptz;
GRANT UPDATE (read_at) ON public.reviews TO authenticated;
CREATE POLICY "members mark reviews read" ON public.reviews FOR UPDATE TO authenticated
  USING (public.is_restaurant_member(public.restaurant_of_dish(dish_id)))
  WITH CHECK (public.is_restaurant_member(public.restaurant_of_dish(dish_id)));

CREATE OR REPLACE FUNCTION public.get_branch_analytics(p_branch_id uuid, p_from timestamptz, p_to timestamptz)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tz text; hourly boolean; res jsonb;
BEGIN
  IF NOT public.is_restaurant_member(public.restaurant_of_branch(p_branch_id)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT timezone INTO tz FROM branches WHERE id = p_branch_id;
  hourly := (p_to - p_from) <= interval '1 day 1 hour';

  WITH o AS (
    SELECT * FROM orders WHERE branch_id = p_branch_id AND status <> 'cancelled' AND created_at >= p_from AND created_at < p_to
  ), e AS (
    SELECT * FROM menu_events WHERE branch_id = p_branch_id AND created_at >= p_from AND created_at < p_to
  ), buckets AS (
    SELECT b FROM generate_series(
      date_trunc(CASE WHEN hourly THEN 'hour' ELSE 'day' END, p_from AT TIME ZONE tz),
      date_trunc(CASE WHEN hourly THEN 'hour' ELSE 'day' END, (p_to - interval '1 second') AT TIME ZONE tz),
      CASE WHEN hourly THEN interval '1 hour' ELSE interval '1 day' END) b
  ), series AS (
    SELECT jsonb_agg(jsonb_build_object(
      'bucket', to_char(bk.b, 'YYYY-MM-DD"T"HH24:MI'),
      'scans', (SELECT count(*) FROM e WHERE e.type = 'scan' AND date_trunc(CASE WHEN hourly THEN 'hour' ELSE 'day' END, e.created_at AT TIME ZONE tz) = bk.b),
      'orders', (SELECT count(*) FROM o WHERE date_trunc(CASE WHEN hourly THEN 'hour' ELSE 'day' END, o.created_at AT TIME ZONE tz) = bk.b),
      'revenue', (SELECT coalesce(sum(total),0) FROM o WHERE date_trunc(CASE WHEN hourly THEN 'hour' ELSE 'day' END, o.created_at AT TIME ZONE tz) = bk.b)
    ) ORDER BY bk.b) s FROM buckets bk
  ), heat AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', hr, 'orders', oc, 'scans', sc)), '[]') h FROM (
      SELECT dow, hr, sum(oc) oc, sum(sc) sc FROM (
        SELECT extract(isodow FROM created_at AT TIME ZONE tz)::int dow, extract(hour FROM created_at AT TIME ZONE tz)::int hr, 1 oc, 0 sc FROM o
        UNION ALL
        SELECT extract(isodow FROM created_at AT TIME ZONE tz)::int, extract(hour FROM created_at AT TIME ZONE tz)::int, 0, 1 FROM e WHERE type = 'scan'
      ) x GROUP BY 1, 2
    ) y
  ), views AS (
    SELECT dish_id, count(*) v FROM e WHERE type = 'dish_view' AND dish_id IS NOT NULL GROUP BY 1
  ), ordered AS (
    SELECT oi.dish_id, sum(oi.qty) q, count(DISTINCT oi.order_id) n FROM order_items oi JOIN o ON o.id = oi.order_id WHERE oi.dish_id IS NOT NULL GROUP BY 1
  ), dishstats AS (
    SELECT d.id, d.name, d.photo_url, coalesce(v.v,0) views, coalesce(od.q,0) qty, coalesce(od.n,0) orders
    FROM dishes d JOIN categories c ON c.id = d.category_id JOIN menus m ON m.id = c.menu_id
    LEFT JOIN views v ON v.dish_id = d.id LEFT JOIN ordered od ON od.dish_id = d.id
    WHERE m.branch_id = p_branch_id AND (v.v IS NOT NULL OR od.q IS NOT NULL)
  ), rv AS (
    SELECT r.rating FROM reviews r JOIN orders oo ON oo.id = r.order_id
    WHERE oo.branch_id = p_branch_id AND r.created_at >= p_from AND r.created_at < p_to
  )
  SELECT jsonb_build_object(
    'hourly', hourly,
    'scans', (SELECT count(*) FROM e WHERE type = 'scan'),
    'orders', (SELECT count(*) FROM o),
    'revenue', (SELECT coalesce(sum(total),0) FROM o),
    'series', coalesce((SELECT s FROM series), '[]'),
    'heatmap', (SELECT h FROM heat),
    'top_viewed', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT * FROM dishstats WHERE views > 0 ORDER BY views DESC, qty DESC LIMIT 8) t), '[]'),
    'top_ordered', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT * FROM dishstats WHERE qty > 0 ORDER BY qty DESC, views DESC LIMIT 8) t), '[]'),
    'rating_avg', (SELECT round(avg(rating)::numeric, 2) FROM rv),
    'rating_count', (SELECT count(*) FROM rv),
    'rating_dist', (SELECT jsonb_object_agg(s, (SELECT count(*) FROM rv WHERE rating = s)) FROM generate_series(1,5) s)
  ) INTO res;
  RETURN res;
END $$;
REVOKE ALL ON FUNCTION public.get_branch_analytics(uuid, timestamptz, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_branch_analytics(uuid, timestamptz, timestamptz) TO authenticated;