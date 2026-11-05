ALTER TYPE public.font_pairing RENAME VALUE 'fraunces_inter_tight' TO 'bricolage_figtree';
ALTER TYPE public.font_pairing RENAME VALUE 'instrument_serif_inter' TO 'young_serif_onest';
ALTER TYPE public.font_pairing RENAME VALUE 'dm_serif_dm_sans' TO 'gloock_manrope';
ALTER TYPE public.font_pairing RENAME VALUE 'playfair_work_sans' TO 'gabarito_instrument_sans';
ALTER TABLE public.themes ALTER COLUMN accent SET DEFAULT '#1E2A5A';
UPDATE public.themes SET accent = '#F2A900' WHERE restaurant_id = '11111111-1111-4111-8111-111111111111';