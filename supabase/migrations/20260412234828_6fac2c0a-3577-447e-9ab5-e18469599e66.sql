
-- Fix gs_setting function: add search_path
CREATE OR REPLACE FUNCTION public.gs_setting(key text)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT setting_value FROM public.studio_settings WHERE setting_key = key LIMIT 1;
$$;

-- Fix update_updated_at function: add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
