import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // This uses the service role key — only set this in Vercel env vars, never expose to client
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to env vars.' }, { status: 500 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { email, password, full_name, company, linkedin_url } = await req.json()
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'email, password and full_name are required' }, { status: 400 })
  }

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const userId = authData.user.id

  // Create profile
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    role: 'client',
    full_name,
    company: company || null,
    linkedin_url: linkedin_url || null,
  })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ userId, success: true })
}
