-- ============================================================================
-- UTENTI E PROFILI DI ACCESSO
--
-- Esegui nel SQL Editor di Supabase. È idempotente.
--
-- COME FUNZIONA
--   · `profili`  → un profilo (Pastore, Segreteria, Tesoriere…) con, per ogni
--                  modulo del menu, il livello: nessuno / lettura / completo.
--   · `utenti`   → le persone abilitate, collegate a un profilo e all'account
--                  di Supabase Auth tramite l'e-mail.
--
-- NOTA SULLA SICUREZZA
--   Gli account veri e propri vivono in `auth.users` e non si creano dal
--   browser: servirebbe la service_role key, che non deve mai stare nel
--   codice pubblico. Qui si registra la persona e le si manda un invito.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profili (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome       VARCHAR(100) NOT NULL,
    descrizione TEXT,
    colore     VARCHAR(9) DEFAULT '#A67C3D',
    -- { "Finanze": "completo", "Membri": "lettura", ... }
    permessi   JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- il profilo di sistema vede tutto e non si può eliminare
    sistema    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profili_nome ON public.profili (lower(nome));

-- ============================================================================
-- 2. UTENTI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.utenti (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- collegamento all'account Supabase, riempito al primo accesso
    auth_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome          VARCHAR(150) NOT NULL,
    email         VARCHAR(160) NOT NULL,
    telefono      VARCHAR(50),
    profilo_id    UUID REFERENCES public.profili(id) ON DELETE SET NULL,
    attivo        BOOLEAN DEFAULT TRUE,
    ultimo_accesso TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_utenti_email ON public.utenti (lower(email));

-- ============================================================================
-- 3. COLLEGAMENTO AUTOMATICO CON L'ACCOUNT
--    Al primo accesso l'e-mail viene agganciata alla riga in `utenti`.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.collega_utente_corrente()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.utenti
     SET auth_user_id   = auth.uid(),
         ultimo_accesso = NOW(),
         updated_at     = NOW()
   WHERE lower(email) = lower(auth.jwt() ->> 'email')
     AND (auth_user_id IS NULL OR auth_user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.collega_utente_corrente() TO authenticated;

-- ============================================================================
-- 4. SICUREZZA — solo utenti autenticati
-- ============================================================================

ALTER TABLE public.profili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utenti  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accesso autenticato" ON public.profili;
CREATE POLICY "Accesso autenticato" ON public.profili
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accesso autenticato" ON public.utenti;
CREATE POLICY "Accesso autenticato" ON public.utenti
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. PROFILI INIZIALI
--    I moduli corrispondono alle voci del menu del gestionale.
-- ============================================================================

INSERT INTO public.profili (nome, descrizione, colore, permessi, sistema)
SELECT * FROM (VALUES
  (
    'Pastore',
    'Accesso completo a tutte le sezioni del gestionale.',
    '#A67C3D',
    '{"Home":"completo","Chiese":"completo","Dipartimenti":"completo","Membri":"completo","Finanze":"completo","Utenti":"completo"}'::jsonb,
    TRUE
  ),
  (
    'Segreteria',
    'Gestisce membri e dipartimenti, consulta il resto.',
    '#2563EB',
    '{"Home":"completo","Chiese":"lettura","Dipartimenti":"completo","Membri":"completo","Finanze":"nessuno","Utenti":"nessuno"}'::jsonb,
    FALSE
  ),
  (
    'Tesoriere',
    'Gestisce le finanze della chiesa.',
    '#107C42',
    '{"Home":"completo","Chiese":"lettura","Dipartimenti":"lettura","Membri":"lettura","Finanze":"completo","Utenti":"nessuno"}'::jsonb,
    FALSE
  ),
  (
    'Collaboratore',
    'Sola consultazione, senza dati finanziari.',
    '#7C3AED',
    '{"Home":"completo","Chiese":"lettura","Dipartimenti":"lettura","Membri":"lettura","Finanze":"nessuno","Utenti":"nessuno"}'::jsonb,
    FALSE
  )
) AS p(nome, descrizione, colore, permessi, sistema)
WHERE NOT EXISTS (SELECT 1 FROM public.profili);

-- ============================================================================
-- 6. PRIMO UTENTE
--    Chi ha già un account viene registrato come Pastore, così non resta
--    fuori dal sistema appena i permessi entrano in vigore.
-- ============================================================================

INSERT INTO public.utenti (auth_user_id, nome, email, profilo_id, attivo)
SELECT u.id, COALESCE(u.raw_user_meta_data ->> 'name', 'Pastore'), u.email,
       (SELECT id FROM public.profili WHERE sistema = TRUE LIMIT 1), TRUE
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.utenti)
ORDER BY u.created_at
LIMIT 1;
