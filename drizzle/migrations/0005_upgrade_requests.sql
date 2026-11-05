CREATE TABLE public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  plan public.plan_tier NOT NULL,
  contact text NOT NULL CHECK (char_length(contact) BETWEEN 5 AND 40),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.upgrade_requests TO authenticated;
GRANT ALL ON public.upgrade_requests TO service_role;
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read requests" ON public.upgrade_requests FOR SELECT TO authenticated
  USING (public.is_restaurant_member(restaurant_id));
CREATE POLICY "owners create requests" ON public.upgrade_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_restaurant_owner(restaurant_id) AND user_id = auth.uid() AND status = 'pending' AND plan <> 'free');
CREATE INDEX ON public.upgrade_requests (restaurant_id, created_at DESC);