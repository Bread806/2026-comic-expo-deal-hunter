import { createClient } from '@supabase/supabase-js'
import type { Booth, Prize } from '../types'
import { mockBooths } from '../data/mockBooths'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null

const USE_MOCK = !supabase

let localPrizes: Prize[] = []
let nextLocalId = 1

export async function fetchBooths(): Promise<Booth[]> {
  if (USE_MOCK) return mockBooths

  const { data, error } = await supabase!.from('booths').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchPrizes(): Promise<Prize[]> {
  if (USE_MOCK) {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('comic-map-prizes') : null
    localPrizes = saved ? JSON.parse(saved) : []
    nextLocalId = localPrizes.length > 0
      ? Math.max(...localPrizes.map((p) => Number(p.id) || 0)) + 1
      : 1
    return localPrizes
  }

  const { data, error } = await supabase!.from('prizes').select('*')
  if (error) throw error
  return data ?? []
}

export async function savePrize(
  prize: Partial<Prize> & Omit<Prize, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  if (USE_MOCK) {
    const existingIndex = prize.id
      ? localPrizes.findIndex((p) => p.id === prize.id)
      : -1

    if (existingIndex >= 0) {
      localPrizes[existingIndex] = {
        ...localPrizes[existingIndex],
        ...prize,
        updated_at: new Date().toISOString(),
      }
    } else {
      localPrizes.push({
        ...prize,
        id: String(nextLocalId++),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Prize)
    }

    localStorage.setItem('comic-map-prizes', JSON.stringify(localPrizes))
    return
  }

  const res = await fetch(
    `${supabaseUrl}/functions/v1/update-prize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(prize),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || '更新失敗')
  }
}
