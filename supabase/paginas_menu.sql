-- ==================================================================
-- TABELLA PER LA GESTIONE DEL MENU SUPERIORE E PAGINE DINAMICHE
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.paginas_menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pagina', -- 'sistema', 'pagina', 'link'
  link TEXT,
  children JSONB,
  conteudo TEXT,
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE public.paginas_menu ENABLE ROW LEVEL SECURITY;

-- Policy di lettura pubblica (chiunque può leggere le voci del menu)
CREATE POLICY "Lettura pubblica paginas_menu"
  ON public.paginas_menu FOR SELECT
  USING (true);

-- Policy di scrittura autenticata (solo admin può inserire/modificare/eliminare)
CREATE POLICY "Scrittura autenticata paginas_menu"
  ON public.paginas_menu FOR ALL
  USING (true)
  WITH CHECK (true);

-- Dati di partenza (Seed)
INSERT INTO public.paginas_menu (label, slug, tipo, link, children, ordem, ativo)
VALUES
  ('Home', 'home', 'sistema', '/', NULL, 0, true),
  ('Chi Siamo', 'chi-siamo', 'sistema', '/chi-siamo', NULL, 1, true),
  ('Fede', 'fede', 'sistema', '/fede', NULL, 2, true),
  ('Le Chiese', 'chiese', 'sistema', '/chiese', '[{"label":"L''Oasi Latina","to":"/chiese/latina"},{"label":"L''Oasi Terracina","to":"/chiese/terracina"},{"label":"L''Oasi Gaeta","to":"/chiese/gaeta"}]'::jsonb, 3, true),
  ('Missione', 'missione', 'sistema', '/#missione', '[{"label":"Missione Argentina","to":"/missioni/argentina"},{"label":"Missione Cambogia","to":"/missioni/cambogia"}]'::jsonb, 4, true),
  ('Media', 'media', 'link', 'https://www.flickr.com/photos/chiesaevangelicaloasi/albums/', NULL, 5, true),
  ('Eventi', 'eventi', 'sistema', '/#eventi', NULL, 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Notifica ricarica schema PostgREST
NOTIFY pgrst, 'reload schema';
