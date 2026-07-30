-- ============================================================================
-- GESTIONALE L'OASI — tabelle del sistema riservato
--
-- Esegui questo script nel SQL Editor di Supabase.
-- È idempotente: puoi rilanciarlo senza perdere dati.
--
-- ATTENZIONE ALLA SICUREZZA
-- Le tabelle del sito pubblico (igrejas, eventos, banners…) sono leggibili da
-- chiunque. Le tabelle create qui NO: sono accessibili solo agli utenti
-- autenticati. I dati dei membri e la contabilità non devono mai finire
-- nell'API pubblica.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. DIPARTIMENTI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dipartimenti (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id     UUID REFERENCES public.igrejas(id) ON DELETE SET NULL,
    nome          VARCHAR(150) NOT NULL,
    descrizione   TEXT,
    responsabile  VARCHAR(150),
    colore        VARCHAR(9) DEFAULT '#7C3AED',
    attivo        BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiunta per chi ha già creato la tabella con una versione precedente.
ALTER TABLE public.dipartimenti ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 2. MEMBRI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.membri (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id        UUID REFERENCES public.igrejas(id) ON DELETE SET NULL,
    dipartimento_id  UUID REFERENCES public.dipartimenti(id) ON DELETE SET NULL,
    nome_completo    VARCHAR(200) NOT NULL,
    sesso            CHAR(1) CHECK (sesso IN ('M', 'F')),
    data_nascita     DATE,
    fascia_eta       VARCHAR(20) CHECK (fascia_eta IN ('Bambino', 'Adolescente', 'Giovane', 'Adulto', 'Anziano')),
    telefono         VARCHAR(50),
    email            VARCHAR(150),
    indirizzo        TEXT,
    stato_civile     VARCHAR(30),
    ruolo            VARCHAR(100),
    data_battesimo   DATE,
    foto_url         TEXT,
    note             TEXT,
    attivo           BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membri_dipartimento ON public.membri(dipartimento_id);
CREATE INDEX IF NOT EXISTS idx_membri_igreja       ON public.membri(igreja_id);
CREATE INDEX IF NOT EXISTS idx_membri_attivo       ON public.membri(attivo);

-- ============================================================================
-- 3. CATEGORIE FINANZIARIE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categorie_finanziarie (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome       VARCHAR(120) NOT NULL,
    tipo       VARCHAR(10) NOT NULL CHECK (tipo IN ('entrata', 'uscita')),
    colore     VARCHAR(9) DEFAULT '#107C42',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categorie_nome_tipo
    ON public.categorie_finanziarie (lower(nome), tipo);

-- ============================================================================
-- 4. TITOLI FINANZIARI (il movimento) E RATE (le scadenze)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.titoli_finanziari (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id      UUID REFERENCES public.igrejas(id) ON DELETE SET NULL,
    categoria_id   UUID REFERENCES public.categorie_finanziarie(id) ON DELETE SET NULL,
    descrizione    VARCHAR(255) NOT NULL,
    tipo           VARCHAR(10) NOT NULL CHECK (tipo IN ('entrata', 'uscita')),
    importo_totale NUMERIC(12,2) NOT NULL CHECK (importo_totale >= 0),
    note           TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rate_finanziarie (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- eliminando il titolo spariscono anche le sue rate
    titolo_id          UUID NOT NULL REFERENCES public.titoli_finanziari(id) ON DELETE CASCADE,
    numero             INT NOT NULL,
    totale_rate        INT NOT NULL,
    importo            NUMERIC(12,2) NOT NULL CHECK (importo >= 0),
    scadenza           DATE NOT NULL,
    stato              VARCHAR(10) NOT NULL DEFAULT 'aperta' CHECK (stato IN ('aperta', 'saldata')),
    saldata_il         DATE,
    importo_saldato    NUMERIC(12,2),
    modalita_pagamento VARCHAR(50),
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_titolo   ON public.rate_finanziarie(titolo_id);
CREATE INDEX IF NOT EXISTS idx_rate_scadenza ON public.rate_finanziarie(scadenza);
CREATE INDEX IF NOT EXISTS idx_rate_stato    ON public.rate_finanziarie(stato);

-- ============================================================================
-- 5. PROMEMORIA (note personali nella Home del gestionale)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promemoria (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    testo      TEXT NOT NULL,
    fatto      BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. SICUREZZA — solo utenti autenticati
-- ============================================================================

ALTER TABLE public.dipartimenti           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membri                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorie_finanziarie  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titoli_finanziari      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_finanziarie       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promemoria             ENABLE ROW LEVEL SECURITY;

-- Accesso completo per chi ha fatto login; nessun accesso anonimo.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'dipartimenti', 'membri', 'categorie_finanziarie', 'titoli_finanziari', 'rate_finanziarie'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Accesso autenticato" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Accesso autenticato" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- I promemoria sono privati: ognuno vede solo i propri.
DROP POLICY IF EXISTS "Promemoria personali" ON public.promemoria;
CREATE POLICY "Promemoria personali" ON public.promemoria
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7. CATEGORIE INIZIALI — contesto di chiesa, in italiano
--    Inserite solo se la tabella è ancora vuota.
-- ============================================================================

INSERT INTO public.categorie_finanziarie (nome, tipo, colore)
SELECT * FROM (VALUES
  -- Entrate
  ('Decime',                  'entrata', '#107C42'),
  ('Offerte',                 'entrata', '#14B8A6'),
  ('Donazioni',               'entrata', '#059669'),
  ('Offerte missionarie',     'entrata', '#0891B2'),
  ('Eventi e raccolte',       'entrata', '#84CC16'),
  ('Contributi 8x1000',       'entrata', '#6366F1'),
  ('Altre entrate',           'entrata', '#64748B'),
  -- Uscite
  ('Affitto locale',          'uscita',  '#EF4444'),
  ('Utenze',                  'uscita',  '#F97316'),
  ('Manutenzione',            'uscita',  '#EA580C'),
  ('Attrezzature e strumenti','uscita',  '#D97706'),
  ('Missioni',                'uscita',  '#7C3AED'),
  ('Aiuto sociale',           'uscita',  '#EC4899'),
  ('Materiale e stampe',      'uscita',  '#8B5CF6'),
  ('Assicurazioni e tasse',   'uscita',  '#E11D48'),
  ('Sostentamento ministero', 'uscita',  '#DB2777'),
  ('Altre uscite',            'uscita',  '#64748B')
) AS c(nome, tipo, colore)
WHERE NOT EXISTS (SELECT 1 FROM public.categorie_finanziarie);

-- ============================================================================
-- 8. DIPARTIMENTI INIZIALI — ripresi dai collaboratori pubblicati sul sito
-- ============================================================================

INSERT INTO public.dipartimenti (nome, descrizione, responsabile, colore)
SELECT * FROM (VALUES
  ('Corale',                'Canto e adorazione durante i culti.',              'Palmacci Gianluca', '#7C3AED'),
  ('Gruppo di preghiera',   'Incontri settimanali di preghiera.',               'Marc Mankoussou',   '#6366F1'),
  ('Scuola domenicale',     'Insegnamento biblico per i bambini.',              'Arsene Cristina',   '#F59E0B'),
  ('Adolescenti e giovani', 'Attività, incontri ed evangelizzazione giovani.',  'Jonathan Adriani',  '#0891B2'),
  ('Donne',                 'Incontri e servizio delle sorelle.',               'Simona Di Mario',   '#EC4899'),
  ('Servizio d''ordine',    'Accoglienza e ordine durante i servizi.',          'Stefano Di Mario',  '#2563EB'),
  ('Segreteria e web',      'Amministrazione, comunicazione e sito.',           'Stefano Poldi',     '#64748B')
) AS d(nome, descrizione, responsabile, colore)
WHERE NOT EXISTS (SELECT 1 FROM public.dipartimenti);
