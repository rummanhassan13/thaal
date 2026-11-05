CREATE POLICY "menu-media public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'menu-media');

INSERT INTO public.restaurants (id, owner_id, name, slug, description, currency, plan, published, cover_url, plan_status) VALUES
('11111111-1111-4111-8111-111111111111', NULL, 'Lemon & Rye', 'lemon-and-rye',
 'Neighbourhood bakery & kitchen. Sourdough at dawn, good coffee all day.', 'GBP', 'pro', true,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=75&auto=format', 'active');

INSERT INTO public.branches (id, restaurant_id, name, slug, address, phone, timezone, opening_hours) VALUES
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Bermondsey', 'bermondsey',
 '14 Lemon Lane, London SE1', '+44 20 7946 0123', 'Europe/London',
 '{"mon":{"open":"07:00","close":"22:00"},"tue":{"open":"07:00","close":"22:00"},"wed":{"open":"07:00","close":"22:00"},"thu":{"open":"07:00","close":"22:00"},"fri":{"open":"07:00","close":"23:00"},"sat":{"open":"08:00","close":"23:00"},"sun":{"open":"08:00","close":"17:00"}}');

INSERT INTO public.themes (restaurant_id, accent, font_pairing, mode) VALUES
('11111111-1111-4111-8111-111111111111', '#C8553D', 'fraunces_inter_tight', 'light');

INSERT INTO public.tables (branch_id, label)
SELECT '22222222-2222-4222-8222-222222222222', g::text FROM generate_series(1,8) g;

INSERT INTO public.menus (id, branch_id, name, sort) VALUES
('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222222', 'Breakfast', 0),
('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222222', 'All day', 1);

INSERT INTO public.menu_schedules (menu_id, weekdays, start_time, end_time) VALUES
('33333333-3333-4333-8333-333333333301', '{0,1,2,3,4,5,6}', '07:00', '11:30'),
('33333333-3333-4333-8333-333333333302', '{0,1,2,3,4,5,6}', '11:30', '23:00');

INSERT INTO public.categories (id, menu_id, name, sort) VALUES
('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', 'Eggs & toast', 0),
('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', 'Sweet things', 1),
('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333302', 'Plates', 0),
('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333302', 'Bakery', 1),
('44444444-4444-4444-8444-444444444405', '33333333-3333-4333-8333-333333333302', 'Drinks', 2);

INSERT INTO public.dishes (id, category_id, name, short_description, description, price, photo_url, is_veg, is_spicy, spice_level, ingredients, allergens, is_sold_out, is_special, sort) VALUES
('55555555-5555-4555-8555-555555555501','44444444-4444-4444-8444-444444444401','Eggs on rye','Soft eggs, avocado, chilli crisp, house rye.','Two soft-scrambled free-range eggs piled on toasted house rye with crushed avocado and a spoon of our chilli crisp.',11.00,'https://images.unsplash.com/photo-1525351484163-7529414344d8',true,true,1,'{eggs,rye bread,avocado,chilli crisp,lime}','{eggs,gluten,sesame}',false,false,0),
('55555555-5555-4555-8555-555555555502','44444444-4444-4444-8444-444444444401','Shakshuka','Baked eggs, smoky peppers, feta, flatbread.','Eggs baked in slow-cooked tomato and red pepper with smoked paprika, crumbled feta and herbs. Served with warm flatbread.',12.50,'https://images.unsplash.com/photo-1590301157890-4810ed352733',true,true,2,'{eggs,tomato,red pepper,feta,paprika,flatbread}','{eggs,milk,gluten}',false,false,1),
('55555555-5555-4555-8555-555555555503','44444444-4444-4444-8444-444444444401','Smashed avo toast','Sourdough, lemon, chilli flakes, seeds.','Crushed avocado on thick sourdough with lemon, chilli flakes, toasted seeds and a little olive oil.',10.50,'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',true,false,0,'{avocado,sourdough,lemon,pumpkin seeds}','{gluten}',false,false,2),
('55555555-5555-4555-8555-555555555504','44444444-4444-4444-8444-444444444401','The full Lemon & Rye','Eggs, bacon, sausage, beans, mushrooms.','Everything you need before noon: two eggs your way, smoked bacon, Cumberland sausage, beans, roast mushrooms and toast.',15.00,'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2',false,false,0,'{eggs,bacon,sausage,beans,mushrooms,toast}','{eggs,gluten,milk}',false,false,3),
('55555555-5555-4555-8555-555555555505','44444444-4444-4444-8444-444444444402','Brioche French toast','Burnt honey, crème fraîche, roasted plums.','Thick-cut brioche soaked overnight, fried in butter, with burnt honey, crème fraîche and roasted plums.',12.50,'https://images.unsplash.com/photo-1484723091739-30a097e8f929',true,false,0,'{brioche,honey,crème fraîche,plums}','{gluten,eggs,milk}',false,false,0),
('55555555-5555-4555-8555-555555555506','44444444-4444-4444-8444-444444444402','Ricotta hotcakes','Blueberries, lemon curd, maple.','Three fluffy ricotta hotcakes with blueberries, our lemon curd and a generous pour of maple.',13.00,'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',true,false,0,'{ricotta,flour,blueberries,lemon curd,maple}','{gluten,eggs,milk}',false,false,1),
('55555555-5555-4555-8555-555555555507','44444444-4444-4444-8444-444444444402','Yoghurt & granola','House granola, seasonal fruit, honey.','Thick Greek yoghurt with our toasted oat and almond granola, seasonal fruit and honey.',8.50,'https://images.unsplash.com/photo-1488477181946-6428a0291777',true,false,0,'{yoghurt,oats,almonds,fruit,honey}','{milk,nuts}',false,false,2),
('55555555-5555-4555-8555-555555555508','44444444-4444-4444-8444-444444444402','Almond croissant','Twice-baked, frangipane, flaked almonds.','Yesterday''s croissant, filled with frangipane and baked again until crisp. Better than the first time.',4.20,'https://images.unsplash.com/photo-1555507036-ab1f4038808a',true,false,0,'{croissant,almond,butter,sugar}','{gluten,nuts,milk,eggs}',false,false,3),
('55555555-5555-4555-8555-555555555509','44444444-4444-4444-8444-444444444403','Green grain bowl','Farro, charred greens, tahini, pickled shallot.','Warm farro with charred tenderstem and kale, tahini dressing, pickled shallot and toasted seeds.',14.00,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',true,false,0,'{farro,broccoli,kale,tahini,shallot}','{gluten,sesame}',false,false,0),
('55555555-5555-4555-8555-555555555510','44444444-4444-4444-8444-444444444403','Nduja rigatoni','Slow tomato, nduja, pecorino. Gone by 1pm.','Rigatoni in a slow-cooked tomato sauce with spicy nduja, finished with pecorino and basil.',16.00,'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',false,true,2,'{rigatoni,tomato,nduja,pecorino,basil}','{gluten,milk}',true,false,1),
('55555555-5555-4555-8555-555555555511','44444444-4444-4444-8444-444444444403','Market salad','Whatever looked best this morning.','Leaves, roots and herbs from the market, with a sharp mustard dressing. Changes daily.',12.00,'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',true,false,0,'{seasonal leaves,radish,herbs,mustard dressing}','{mustard}',false,false,2),
('55555555-5555-4555-8555-555555555512','44444444-4444-4444-8444-444444444403','Roast tomato soup','With a hunk of buttered rye.','Slow-roasted tomatoes and red onion, blended smooth. Comes with buttered rye.',8.00,'https://images.unsplash.com/photo-1547592180-85f173990554',true,false,0,'{tomato,red onion,garlic,rye bread,butter}','{gluten,milk}',false,false,3),
('55555555-5555-4555-8555-555555555513','44444444-4444-4444-8444-444444444403','Rye club','Roast chicken, bacon, aioli, pickles.','Triple-decker on toasted rye with roast chicken, crisp bacon, garlic aioli, lettuce and house pickles.',13.50,'https://images.unsplash.com/photo-1528207776546-365bb710ee93',false,false,0,'{chicken,bacon,rye bread,aioli,lettuce,pickles}','{gluten,eggs,mustard}',false,false,4),
('55555555-5555-4555-8555-555555555514','44444444-4444-4444-8444-444444444403','Flat iron steak','Today''s special. Chips, salsa verde.','28-day aged flat iron, cooked medium-rare, with skin-on chips and a punchy salsa verde.',22.00,'https://images.unsplash.com/photo-1600891964092-4316c288032e',false,false,0,'{beef,potatoes,parsley,capers,anchovy}','{fish}',false,true,5),
('55555555-5555-4555-8555-555555555515','44444444-4444-4444-8444-444444444403','Halloumi & roast veg bowl','Squeaky halloumi, roast veg, herby yoghurt.','Grilled halloumi with roast squash, peppers and chickpeas, herby yoghurt and pomegranate.',13.00,'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',true,false,0,'{halloumi,squash,peppers,chickpeas,yoghurt,pomegranate}','{milk}',false,false,6),
('55555555-5555-4555-8555-555555555516','44444444-4444-4444-8444-444444444404','Lemon & rye loaf','Our namesake. Sour, a little sweet.','A dark rye sourdough with candied lemon peel. Take one home.',6.00,'https://images.unsplash.com/photo-1509440159596-0249088772ff',true,false,0,'{rye flour,wheat flour,lemon peel,salt}','{gluten}',false,false,0),
('55555555-5555-4555-8555-555555555517','44444444-4444-4444-8444-444444444404','Olive oil cake','Lemon glaze, a little salt.','Soft, golden olive oil cake with a sharp lemon glaze and flaky salt.',4.80,'https://images.unsplash.com/photo-1571091718767-18b5b1457add',true,false,0,'{olive oil,flour,eggs,lemon,sugar}','{gluten,eggs}',false,false,1),
('55555555-5555-4555-8555-555555555518','44444444-4444-4444-8444-444444444405','Flat white','Seasonal espresso, whole or oat.','Double ristretto with silky steamed milk. Ask about this month''s beans.',4.00,'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',true,false,0,'{espresso,milk}','{milk}',false,false,0),
('55555555-5555-4555-8555-555555555519','44444444-4444-4444-8444-444444444405','Iced yuzu soda','Yuzu, soda, a sprig of thyme.','Bright and fizzy. Yuzu juice, house syrup, soda and thyme over ice.',5.00,'https://images.unsplash.com/photo-1556679343-c7306c1976bc',true,false,0,'{yuzu,soda,thyme,sugar}','{}',false,false,1),
('55555555-5555-4555-8555-555555555520','44444444-4444-4444-8444-444444444405','Fresh lemonade','Squeezed this morning.','Lemons, a little sugar, still or sparkling. Nothing else.',4.50,'https://images.unsplash.com/photo-1600271886742-f049cd451bba',true,false,0,'{lemon,sugar,water}','{}',false,false,2);

INSERT INTO public.dish_addons (dish_id, name, price, sort) VALUES
('55555555-5555-4555-8555-555555555501','Extra egg',1.50,0),
('55555555-5555-4555-8555-555555555501','Grilled halloumi',2.50,1),
('55555555-5555-4555-8555-555555555503','Poached egg',1.50,0),
('55555555-5555-4555-8555-555555555509','Roast chicken',3.50,0),
('55555555-5555-4555-8555-555555555518','Oat milk',0.50,0),
('55555555-5555-4555-8555-555555555518','Extra shot',0.60,1);

DO $$
DECLARE
  b uuid := '22222222-2222-4222-8222-222222222222';
  i int; oid uuid; t int; d record; n int; sub numeric; ts timestamptz;
  comments text[] := ARRAY['Lovely, will be back.','Perfect on a cold morning.','Generous portion.','A little salty for me.','Best in the area, honestly.','Came quickly and still hot.', NULL, NULL];
BEGIN
  FOR i IN 1..80 LOOP
    ts := now() - (random() * interval '14 days');
    t := 1 + floor(random() * 8)::int;
    oid := gen_random_uuid(); sub := 0;
    INSERT INTO public.orders (id, branch_id, table_id, table_label, status, payment_method, payment_status, subtotal, total, created_at, updated_at)
    VALUES (oid, b, (SELECT id FROM public.tables WHERE branch_id = b AND label = t::text), t::text, 'served',
      (CASE WHEN random() < 0.6 THEN 'online' ELSE 'counter' END)::public.payment_method, 'paid', 0, 0, ts, ts);
    FOR d IN SELECT id, name, price FROM public.dishes WHERE NOT is_sold_out ORDER BY random() LIMIT (1 + floor(random() * 3)::int) LOOP
      n := 1 + floor(random() * 2)::int;
      INSERT INTO public.order_items (order_id, dish_id, name, unit_price, qty, created_at) VALUES (oid, d.id, d.name, d.price, n, ts);
      sub := sub + d.price * n;
      IF random() < 0.35 THEN
        INSERT INTO public.reviews (dish_id, order_id, rating, comment, created_at)
        VALUES (d.id, oid, 3 + floor(random() * 3)::int, comments[1 + floor(random() * 8)::int], ts + interval '40 minutes')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
    UPDATE public.orders SET subtotal = sub, total = sub WHERE id = oid;
  END LOOP;
END $$;

INSERT INTO public.menu_events (branch_id, type, created_at)
SELECT '22222222-2222-4222-8222-222222222222', 'scan', now() - random() * interval '14 days' FROM generate_series(1, 420);

INSERT INTO public.menu_events (branch_id, type, dish_id, created_at)
SELECT '22222222-2222-4222-8222-222222222222', 'dish_view', d.id, now() - random() * interval '14 days'
FROM generate_series(1, 900) g CROSS JOIN LATERAL (SELECT id FROM public.dishes WHERE g > 0 ORDER BY random() LIMIT 1) d;

INSERT INTO public.menu_events (branch_id, type, dish_id, created_at)
SELECT '22222222-2222-4222-8222-222222222222', 'add_to_cart', d.id, now() - random() * interval '14 days'
FROM generate_series(1, 300) g CROSS JOIN LATERAL (SELECT id FROM public.dishes WHERE g > 0 AND NOT is_sold_out ORDER BY random() LIMIT 1) d;