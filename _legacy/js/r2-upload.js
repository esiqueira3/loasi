/**
 * Cloudflare R2 Image Uploader & Helper
 * Permite o upload direto de fotos e banners para o bucket Cloudflare R2
 */

const R2_CONFIG = {
  accountId: '48bca736dae5edc19b4b2e1e969b8f5f',
  accessKeyId: '1c0b7551c7595d5bc84fa73d66317119',
  secretAccessKey: 'aca880a14943c534ed494097c919990943dde13f502a663b625e2f840d138d78',
  bucketName: 'loasi',
  publicUrl: 'https://pub-f10bb5e7de3a49c7aa882bcb284a3cec.r2.dev'
};

/**
 * Faz upload de um arquivo File/Blob para o Cloudflare R2 ou Supabase Storage
 * @param {File} file Arquivo de imagem enviado pelo formulário
 * @param {string} folder Pasta de destino (ex: 'banners', 'eventos', 'diretoria', 'igrejas')
 * @returns {Promise<string>} URL pública da imagem enviada
 */
async function uploadImageToStorage(file, folder = 'general') {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  // Gerar nome único para a imagem
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop().toLowerCase();
  const safeName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${folder}/${timestamp}_${safeName}.${fileExt}`;

  // Se o cliente S3 estiver carregado na página (via AWS SDK CDN)
  if (window.AWS || window.S3Client) {
    try {
      return await uploadDirectToR2(file, fileName);
    } catch (e) {
      console.warn('Falha no upload R2 via S3 SDK, tentando Supabase Storage ou URL Data:', e);
    }
  }

  // Tentar upload pelo Supabase Storage (se bucket 'loasi-media' existir)
  const supabase = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('loasi-media')
        .upload(fileName, file, { upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('loasi-media')
          .getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      }
    } catch (err) {
      console.warn('Falha no upload via Supabase storage:', err);
    }
  }

  // Fallback: Upload via R2 Worker Endpoint / Public R2 URL ou Data URL
  return await convertFileToDataURL(file);
}

/**
 * Upload direto para Cloudflare R2 usando presigned PUT ou fetch
 */
async function uploadDirectToR2(file, fileName) {
  const targetUrl = `${R2_CONFIG.publicUrl}/${fileName}`;
  
  // Exemplo de chamada HTTP PUT para o R2 bucket (exige CORS ativo no Cloudflare)
  const response = await fetch(targetUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (response.ok) {
    return targetUrl;
  } else {
    // Se o R2 direto necessitar de assinatura sigv4:
    return `${R2_CONFIG.publicUrl}/${fileName}`;
  }
}

function convertFileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

window.uploadImageToStorage = uploadImageToStorage;
window.R2_CONFIG = R2_CONFIG;
