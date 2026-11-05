CREATE OR REPLACE FUNCTION public.get_table_label(p_branch_id uuid, p_table text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.label FROM tables t
  WHERE t.branch_id = p_branch_id AND public.is_restaurant_published(public.restaurant_of_branch(p_branch_id))
    AND (t.qr_code_token = p_table OR t.label = p_table)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_dish_reviews(p_dish_id uuid)
RETURNS TABLE (avg_rating numeric, review_count int, recent jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT round(avg(r.rating)::numeric, 1), count(*)::int,
    coalesce((SELECT jsonb_agg(x) FROM (
      SELECT rr.rating, rr.comment, rr.created_at FROM reviews rr
      WHERE rr.dish_id = p_dish_id AND rr.comment IS NOT NULL AND length(trim(rr.comment)) > 0
      ORDER BY rr.created_at DESC LIMIT 3) x), '[]'::jsonb)
  FROM reviews r
  WHERE r.dish_id = p_dish_id AND public.is_restaurant_published(public.restaurant_of_dish(p_dish_id))
$$;

CREATE OR REPLACE FUNCTION public.request_service(p_branch_id uuid, p_table text, p_type public.service_type)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_table uuid; v_now timestamptz := now();
BEGIN
  IF NOT public.is_restaurant_published(public.restaurant_of_branch(p_branch_id)) THEN RAISE EXCEPTION 'Menu not found'; END IF;
  SELECT t.id INTO v_table FROM tables t WHERE t.branch_id = p_branch_id AND (t.qr_code_token = p_table OR t.label = p_table) LIMIT 1;
  IF v_table IS NULL THEN RAISE EXCEPTION 'Unknown table'; END IF;
  IF EXISTS (SELECT 1 FROM service_requests s WHERE s.table_id = v_table AND s.type = p_type AND s.created_at > v_now - interval '60 seconds') THEN
    RAISE EXCEPTION 'Already on its way';
  END IF;
  INSERT INTO service_requests (branch_id, table_id, type) VALUES (p_branch_id, v_table, p_type);
  RETURN v_now;
END $$;

GRANT EXECUTE ON FUNCTION public.get_table_label(uuid, text), public.get_dish_reviews(uuid), public.request_service(uuid, text, public.service_type) TO anon, authenticated;

-- Doorbell: broadcast order status to a topic named by the private tracking token
CREATE OR REPLACE FUNCTION public.broadcast_order_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    BEGIN
      PERFORM realtime.send(jsonb_build_object('status', NEW.status, 'payment_status', NEW.payment_status),
        'status', 'order-' || NEW.tracking_token::text, false);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_broadcast_order_status AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.broadcast_order_status();