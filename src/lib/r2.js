import { supabase } from './supabase'

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-f10bb5e7de3a49c7aa882bcb284a3cec.r2.dev'

export async function uploadImageToStorage(file, folder = 'general') {
  if (!file) throw new Error('Nenhum arquivo fornecido.')

  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop().toLowerCase()
  const safeName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `${folder}/${timestamp}_${safeName}.${fileExt}`

  // Tentar upload via Cloudflare R2 direto (se houver endpoint configurado)
  try {
    const targetUrl = `${R2_PUBLIC_URL}/${fileName}`
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    })
    if (response.ok) return targetUrl
  } catch (e) {
    console.warn('Upload direto R2 falhou, tentando Supabase Storage...', e)
  }

  // Fallback 1: Supabase Storage bucket 'loasi-media'
  try {
    const { data, error } = await supabase.storage
      .from('loasi-media')
      .upload(fileName, file, { upsert: true })

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from('loasi-media')
        .getPublicUrl(fileName)
      return publicUrlData.publicUrl
    }
  } catch (err) {
    console.warn('Fallback Supabase Storage falhou:', err)
  }

  // Fallback 2: Data URL local para preview imediato
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export async function deleteImageFromStorage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return

  // 1. Tentar deletar do Cloudflare R2 (se for URL R2)
  if (imageUrl.includes(R2_PUBLIC_URL)) {
    try {
      const response = await fetch(imageUrl, { method: 'DELETE' })
      if (response.ok) return
    } catch (e) {
      console.warn('Deleção direta R2 falhou:', e)
    }
  }

  // 2. Tentar deletar do Supabase Storage bucket 'loasi-media'
  if (imageUrl.includes('/storage/v1/object/public/loasi-media/')) {
    try {
      const filePath = imageUrl.split('/storage/v1/object/public/loasi-media/')[1]
      if (filePath) {
        await supabase.storage.from('loasi-media').remove([filePath])
      }
    } catch (err) {
      console.warn('Deleção Supabase Storage falhou:', err)
    }
  }
}
