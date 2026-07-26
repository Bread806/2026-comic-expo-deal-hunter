import { createClient } from 'npm:@supabase/supabase-js@^2.110.8'

interface PrizePayload {
  id?: string
  booth_id: number
  name: string
  status: 'free' | 'conditional' | 'none'
  condition?: string
  quantity?: string
  editor_name?: string
  note?: string
}

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000 // 30 minutes
const RATE_LIMIT_MAX = 30

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  ip: string
): Promise<void> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { count, error } = await supabaseAdmin
    .from('history')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart)

  if (error) {
    console.error('Rate limit check error:', error)
    return
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    throw new Error('RATE_LIMITED')
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Server misconfigured', { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  let payload: PrizePayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (
    !payload.booth_id ||
    !payload.name?.trim() ||
    !['free', 'conditional', 'none'].includes(payload.status)
  ) {
    return new Response('Missing required fields', { status: 400 })
  }

  const ip = getClientIp(req)

  try {
    await checkRateLimit(supabaseAdmin, ip)
  } catch (err: any) {
    if (err.message === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ error: '操作太頻繁，請稍後再試' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('Rate limit error:', err)
  }

  // Fetch existing prize if updating
  let oldData: Record<string, unknown> | null = null
  if (payload.id) {
    const { data, error } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('id', payload.id)
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (data) {
      oldData = data
    }
  }

  const upsertData = {
    id: payload.id,
    booth_id: payload.booth_id,
    name: payload.name.trim(),
    status: payload.status,
    condition: payload.condition?.trim() || '',
    quantity: payload.quantity?.trim() || '',
    editor_name: payload.editor_name?.trim() || '',
    note: payload.note?.trim() || '',
  }

  const { data: savedPrize, error: upsertError } = await supabaseAdmin
    .from('prizes')
    .upsert(upsertData, { onConflict: 'id' })
    .select()
    .single()

  if (upsertError || !savedPrize) {
    return new Response(
      JSON.stringify({ error: upsertError?.message || 'Upsert failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Write history entry
  const { error: historyError } = await supabaseAdmin.from('history').insert({
    prize_id: savedPrize.id,
    booth_id: payload.booth_id,
    old_data: oldData,
    new_data: savedPrize,
    editor_name: payload.editor_name?.trim() || '',
    ip,
  })

  if (historyError) {
    console.error('History insert error:', historyError)
  }

  return new Response(
    JSON.stringify({ success: true, data: savedPrize }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
