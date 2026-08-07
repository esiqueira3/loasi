import { useMemo } from 'react'
import { churches } from '../data/site'
import { useSupabaseTable } from './useSupabaseTable'

const pick = (dbValue, staticValue) => {
  if (dbValue === null || dbValue === undefined) return staticValue
  if (typeof dbValue === 'string' && dbValue.trim() === '') return staticValue
  return dbValue
}

export function useChurches() {
  const { rows: dbChiese, loading, isLive } = useSupabaseTable('igrejas', {
    order: { column: 'cidade' },
  })

  const churchesList = useMemo(() => {
    if (!dbChiese || !dbChiese.length) return churches

    const merged = churches.map((base) => {
      const row = dbChiese.find(
        (r) => r.slug === base.slug || r.cidade?.toLowerCase() === base.city?.toLowerCase()
      )
      if (!row) return base

      return {
        ...base,
        id: row.id || base.id,
        slug: row.slug || base.slug,
        city: row.cidade || base.city || '',
        province: base.province || 'LT',
        name: row.nome || base.name || "Chiesa Cristiana Evangelica L'Oasi",
        referente: pick(row.referente || row.responsavel, base.referente),
        phone: pick(row.telefone, base.phone),
        phoneHref: row.telefone ? `tel:${row.telefone.replace(/\s+/g, '')}` : base.phoneHref,
        email: pick(row.email, base.email),
        address: pick(row.endereco, base.address),
        mapsUrl: pick(row.link_maps, base.mapsUrl),
        cover: pick(row.foto_capa_url, base.cover),
        schedule: pick(row.horarios_culto, null),
      }
    })

    dbChiese.forEach((row) => {
      const exists = merged.some(
        (m) => m.slug === row.slug || m.city?.toLowerCase() === row.cidade?.toLowerCase()
      )
      if (!exists) {
        merged.push({
          id: row.id,
          slug: row.slug,
          city: row.cidade,
          province: 'LT',
          name: row.nome || "Chiesa Cristiana Evangelica L'Oasi",
          referente: row.referente || row.responsavel || '',
          phone: row.telefone || '',
          phoneHref: row.telefone ? `tel:${row.telefone.replace(/\s+/g, '')}` : '',
          email: row.email || '',
          address: row.endereco || '',
          mapsUrl: row.link_maps || '#',
          cover: row.foto_capa_url || '/images/home-3-610x458.jpg',
          gallery: [],
          schedule: row.horarios_culto || null,
        })
      }
    })

    return merged
  }, [dbChiese])

  return { churches: churchesList, dbChiese, loading, isLive }
}
