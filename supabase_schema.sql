-- ========================================================
-- ESQUEMA DO BANCO DE DADOS SUPABASE - CHIESA L'OASI
-- Executar no SQL Editor do Supabase (https://supabase.com)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE IGREJAS / COMUNIDADES
CREATE TABLE IF NOT EXISTS public.igrejas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- 'latina', 'terracina', 'gaeta'
    nome VARCHAR(150) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    endereco TEXT NOT NULL,
    telefone VARCHAR(50),
    email VARCHAR(100),
    link_maps TEXT,
    horarios_culto TEXT,
    foto_capa_url TEXT,
    referente TEXT,
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GALERIA DE FOTOS POR IGREJA
CREATE TABLE IF NOT EXISTS public.igreja_fotos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES public.igrejas(id) ON DELETE CASCADE,
    foto_url TEXT NOT NULL,
    legenda VARCHAR(255),
    ordem INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DIRETORIA / TIME DE LIDERANÇA POR IGREJA
CREATE TABLE IF NOT EXISTS public.diretoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES public.igrejas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    cargo VARCHAR(100) NOT NULL, -- ex: Pastor Presidente, Tesoureiro, Diácono
    foto_url TEXT,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BANNERS (TOP SLIDER HOME)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    subtitulo TEXT,
    imagem_url TEXT NOT NULL,
    link_botao TEXT,
    texto_botao VARCHAR(50) DEFAULT 'Per saperne di più',
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. EVENTOS
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES public.igrejas(id) ON DELETE SET NULL, -- NULL se for evento geral
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
    local VARCHAR(255),
    imagem_url TEXT,
    link_inscricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DEPOIMENTOS / TESTEMUNHOS
CREATE TABLE IF NOT EXISTS public.depoimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    cargo_ou_igreja VARCHAR(150),
    mensagem TEXT NOT NULL,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- INSERÇÃO DE DADOS INICIAIS (SEED DATA)
-- ========================================================

INSERT INTO public.igrejas (slug, nome, cidade, endereco, telefone, email, link_maps, horarios_culto, foto_capa_url)
VALUES 
('latina', 'Chiesa Cristiana Evangelica L’Oasi - Latina', 'Latina', 'Via Don Torello 118, 04100 Latina (LT)', '+39 347 123 4567', 'latina@chiesaloasi.it', 'https://maps.google.com', 'Domenica: ore 10:30 | Mercoledì: ore 19:30', 'images/slide-1.jpg'),
('terracina', 'Chiesa Cristiana Evangelica L’Oasi - Terracina', 'Terracina', 'Via Appia 45, 04019 Terracina (LT)', '+39 347 765 4321', 'terracina@chiesaloasi.it', 'https://maps.google.com', 'Domenica: ore 17:30 | Giovedì: ore 19:30', 'images/slide-2.jpg'),
('gaeta', 'Chiesa Cristiana Evangelica L’Oasi - Gaeta', 'Gaeta', 'Via Flacca 10, 04024 Gaeta (LT)', '+39 347 999 8888', 'gaeta@chiesaloasi.it', 'https://maps.google.com', 'Domenica: ore 18:00', 'images/slide-3.jpg')
ON CONFLICT (slug) DO NOTHING;

-- ========================================================
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ========================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.igrejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.igreja_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diretoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE LEITURA PÚBLICA (Qualquer visitante do site pode ler)
DROP POLICY IF EXISTS "Leitura pública de igrejas" ON public.igrejas;
CREATE POLICY "Leitura pública de igrejas" ON public.igrejas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de fotos de igrejas" ON public.igreja_fotos;
CREATE POLICY "Leitura pública de fotos de igrejas" ON public.igreja_fotos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública da diretoria" ON public.diretoria;
CREATE POLICY "Leitura pública da diretoria" ON public.diretoria FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de banners" ON public.banners;
CREATE POLICY "Leitura pública de banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de eventos" ON public.eventos;
CREATE POLICY "Leitura pública de eventos" ON public.eventos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de depoimentos" ON public.depoimentos;
CREATE POLICY "Leitura pública de depoimentos" ON public.depoimentos FOR SELECT USING (true);

-- POLÍTICAS DE ESCRITA/EDIÇÃO (Apenas usuários autenticados no Supabase Auth - o Pastor)
DROP POLICY IF EXISTS "Escrita autenticada em igrejas" ON public.igrejas;
CREATE POLICY "Escrita autenticada em igrejas" ON public.igrejas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Escrita autenticada em fotos de igrejas" ON public.igreja_fotos;
CREATE POLICY "Escrita autenticada em fotos de igrejas" ON public.igreja_fotos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Escrita autenticada na diretoria" ON public.diretoria;
CREATE POLICY "Escrita autenticada na diretoria" ON public.diretoria FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Escrita autenticada em banners" ON public.banners;
CREATE POLICY "Escrita autenticada em banners" ON public.banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Escrita autenticada em eventos" ON public.eventos;
CREATE POLICY "Escrita autenticada em eventos" ON public.eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Escrita autenticada em depoimentos" ON public.depoimentos;
CREATE POLICY "Escrita autenticada em depoimentos" ON public.depoimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
