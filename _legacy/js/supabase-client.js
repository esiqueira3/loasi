/**
 * Supabase Client & API Helper Functions
 * Configurações para acesso ao banco de dados Supabase da Chiesa L'Oasi
 */

const SUPABASE_URL = 'https://gntksxjtjvjoatksamir.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ezeah3D8qHVscrJ5es6auA_-_GQZhz-';

// Carrega o SDK do Supabase se ainda não estiver global
let supabase = null;

if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Utilitário para garantir inicialização
function getSupabaseClient() {
  if (!supabase && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// API de consulta pública de dados
const LoasiAPI = {
  // Banners
  async getBanners() {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client
      .from('banners')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });
    if (error) {
      console.error('Erro ao buscar banners:', error);
      return [];
    }
    return data || [];
  },

  // Eventos
  async getEventos(limit = 6) {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client
      .from('eventos')
      .select('*, igrejas(nome, slug)')
      .eq('ativo', true)
      .order('data_evento', { ascending: true })
      .limit(limit);
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
    return data || [];
  },

  // Depoimentos
  async getDepoimentos() {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client
      .from('depoimentos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar depoimentos:', error);
      return [];
    }
    return data || [];
  },

  // Igrejas
  async getIgrejaBySlug(slug) {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client
      .from('igrejas')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) {
      console.error(`Erro ao buscar igreja ${slug}:`, error);
      return null;
    }
    return data;
  },

  // Galeria de Fotos de uma Igreja
  async getFotosIgreja(igrejaId) {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client
      .from('igreja_fotos')
      .select('*')
      .eq('igreja_id', igrejaId)
      .order('ordem', { ascending: true });
    if (error) {
      console.error('Erro ao buscar fotos da igreja:', error);
      return [];
    }
    return data || [];
  },

  // Diretoria / Liderança de uma Igreja
  async getDiretoriaIgreja(igrejaId) {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client
      .from('diretoria')
      .select('*')
      .eq('igreja_id', igrejaId)
      .order('ordem', { ascending: true });
    if (error) {
      console.error('Erro ao buscar diretoria:', error);
      return [];
    }
    return data || [];
  }
};

window.LoasiAPI = LoasiAPI;
window.getSupabaseClient = getSupabaseClient;
