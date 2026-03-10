'use client'
import { useState, useEffect } from 'react'
import { createClient, formatDual, USD_TO_PKR } from '@/lib/supabase'
import { format } from 'date-fns'

const USD_PKR = USD_TO_PKR

// ── Dual currency display ──
function Dual({ usd }: { usd: number }) {
  const d = formatDual(usd)
  return (
    <span className="font-mono">
      <span className="text-[#0D1A2A]">{d.usd}</span>
      <span className="text-[#0D1A2A]/30 text-[10px] ml-1">{d.pkr}</span>
    </span>
  )
}

const PIPELINE_STAGES = ['Warm-up', 'DM Sent', 'Replied', 'Called', 'Closing']

export default function DashboardPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [nonneg, setNonneg] = useState({ dms_sent: 0, comments_left: 0, post_published: false })
  const [prospects, setProspects] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [saving, setSaving] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const dayLabel = format(new Date(), 'EEEE, MMMM d')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const [prof, nn, prosp, ps, cl, inv, met] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('daily_nonneg').select('*').eq('date', today).single(),
        supabase.from('outreach_prospects').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('content_posts').select('*').gte('scheduled_date', today).order('scheduled_date').limit(7),
        supabase.from('clients').select('*').eq('status', 'active').limit(6),
        supabase.from('invoices').select('*').eq('status', 'pending').limit(5),
        supabase.from('linkedin_metrics').select('*').order('week_of', { ascending: false }).limit(5),
      ])

      setProfile(prof.data)
      if (nn.data) setNonneg(nn.data)
      setProspects(prosp.data || [])
      setPosts(ps.data || [])
      setClients(cl.data || [])
      setInvoices(inv.data || [])
      setMetrics(met.data?.[0] || null)

      // Streak calc
      const { data: nnAll } = await supabase
        .from('daily_nonneg')
        .select('date, dms_sent, comments_left')
        .order('date', { ascending: false })
        .limit(60)
      let s = 0
      for (const r of (nnAll || [])) {
        if (r.dms_sent >= 10 && r.comments_left >= 10) s++; else break
      }
      setStreak(s)
    }
    load()
  }, [])

  async function saveNonneg(field: string, value: any) {
    setSaving(true)
    const update = { ...nonneg, [field]: value, date: today }
    setNonneg((n: any) => ({ ...n, [field]: value }))
    await supabase.from('daily_nonneg').upsert(update, { onConflict: 'date' })
    setSaving(false)
  }

  const byStage = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.stage === s.toLowerCase().replace(' ', '_'))
    return acc
  }, {} as Record<string, any[]>)

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Revenue mock calc
  const monthRevenue = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + b.amount_usd, 0)
  const monthGoal = 1000
  const revPct = Math.min(100, Math.round((monthRevenue / monthGoal) * 100))

  const nonnegItems = [
    { key: 'dms_sent',       label: 'Outreach: 10 LinkedIn DMs',      done: nonneg.dms_sent >= 10    },
    { key: 'comments_left',  label: 'Engagement: 10 targeted comments', done: nonneg.comments_left >= 10 },
    { key: 'post_published', label: 'Content: publish today\'s post',   done: nonneg.post_published    },
  ]
  const nonnegRemaining = nonnegItems.filter(n => !n.done).length

  return (
    <div className="p-8 min-h-screen">
      {/* ── Header ── */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#0D1A2A]/40 font-bold mb-2">{dayLabel}</p>
          <h2 className="text-4xl font-display font-black text-[#0D1A2A]">
            Good morning, {profile?.full_name?.split(' ')[0] || 'Ahmad'}.
          </h2>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-[#0D1A2A]/40 font-bold">Non-Neg Streak</p>
            <p className="text-2xl font-mono font-medium text-[#0D1A2A]">
              {streak} <span className="text-xs uppercase font-sans text-[#0D1A2A]/30">days</span>
            </p>
          </div>
          <div className="w-10 h-10 bg-[#0D1A2A] flex items-center justify-center">
            {/* [SIGNL] bracket logo mark */}
            <span className="font-display font-black text-[#F5A623] text-sm leading-none">S</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* ── LEFT COLUMN ── */}
        <div className="col-span-8 space-y-8">

          {/* Morning Briefing */}
          <section className="bg-white border border-[#D1D5DB] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-[#0D1A2A]">Morning Briefing</h3>
              <span className="text-[10px] font-mono px-2 py-1 bg-[#0D1A2A] text-white">
                {nonnegRemaining} TASKS REMAINING
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              {nonnegItems.map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={e => saveNonneg(item.key, item.key === 'post_published' ? e.target.checked : (e.target.checked ? 10 : 0))}
                    className="w-4 h-4 border-[#0D1A2A] text-[#0D1A2A] focus:ring-0 accent-[#0D1A2A]"
                  />
                  <span className={`text-sm transition-colors ${item.done ? 'line-through text-[#0D1A2A]/30' : 'group-hover:text-[#0D1A2A]'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
              {/* DM counter */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#0D1A2A]/40 font-mono w-20">DMs today:</span>
                <div className="flex gap-1 items-center">
                  <button onClick={() => saveNonneg('dms_sent', Math.max(0, nonneg.dms_sent - 1))} className="w-6 h-6 border border-[#D1D5DB] text-xs font-bold hover:bg-[#F4F7FA] flex items-center justify-center">−</button>
                  <span className="font-mono text-sm w-6 text-center">{nonneg.dms_sent}</span>
                  <button onClick={() => saveNonneg('dms_sent', nonneg.dms_sent + 1)} className="w-6 h-6 border border-[#D1D5DB] text-xs font-bold hover:bg-[#F4F7FA] flex items-center justify-center">+</button>
                  <span className="text-[10px] text-[#0D1A2A]/30 font-mono ml-1">/ 10</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#0D1A2A]/40 font-mono w-20">Comments:</span>
                <div className="flex gap-1 items-center">
                  <button onClick={() => saveNonneg('comments_left', Math.max(0, nonneg.comments_left - 1))} className="w-6 h-6 border border-[#D1D5DB] text-xs font-bold hover:bg-[#F4F7FA] flex items-center justify-center">−</button>
                  <span className="font-mono text-sm w-6 text-center">{nonneg.comments_left}</span>
                  <button onClick={() => saveNonneg('comments_left', nonneg.comments_left + 1)} className="w-6 h-6 border border-[#D1D5DB] text-xs font-bold hover:bg-[#F4F7FA] flex items-center justify-center">+</button>
                  <span className="text-[10px] text-[#0D1A2A]/30 font-mono ml-1">/ 10</span>
                </div>
              </div>
            </div>
            {saving && <p className="text-[10px] font-mono text-[#0D1A2A]/30 mt-4">Saving...</p>}
          </section>

          {/* Outreach Pipeline Kanban */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-[#0D1A2A]">Outreach Pipeline</h3>
              <a href="/outreach" className="text-[10px] font-bold uppercase tracking-widest border-b border-[#0D1A2A] pb-1 hover:opacity-60 transition-opacity">View All</a>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Warm-up', 'DM Sent', 'Replied', 'Called', 'Closing'].slice(0, 3).map(stage => {
                const key = stage.toLowerCase().replace('-', '_').replace(' ', '_')
                const items = prospects.filter(p => p.stage === key)
                return (
                  <div key={stage} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#0D1A2A] pb-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{stage}</span>
                      <span className="font-mono text-xs">{String(items.length).padStart(2, '0')}</span>
                    </div>
                    {items.slice(0, 3).map(p => (
                      <div key={p.id} className="bg-white border border-[#D1D5DB] p-4 space-y-1">
                        <p className="text-xs font-bold text-[#0D1A2A]">{p.name}</p>
                        <p className="text-[10px] text-[#0D1A2A]/40 uppercase tracking-tighter">{p.company}</p>
                        {p.follow_up_date && (
                          <p className="text-[9px] font-mono text-[#B8860B]">
                            Follow up: {format(new Date(p.follow_up_date), 'MMM d')}
                          </p>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="border border-dashed border-[#D1D5DB] p-4 text-[10px] text-[#0D1A2A]/20 text-center">
                        Empty
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Weekly Content Grid */}
          <section className="bg-white border border-[#D1D5DB] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-[#0D1A2A]">Weekly Content Grid</h3>
              <a href="/content" className="text-[10px] font-bold uppercase tracking-widest border-b border-[#0D1A2A] pb-1 hover:opacity-60 transition-opacity">Manage</a>
            </div>
            <div className="grid grid-cols-7 gap-px bg-[#D1D5DB]">
              {weekDays.map(d => (
                <div key={d} className="bg-[#F4F7FA] p-2 text-center text-[10px] font-bold uppercase">{d}</div>
              ))}
              {weekDays.map((d, i) => {
                const post = posts[i]
                const isPostDay = [0, 2, 4].includes(i)
                return (
                  <div key={d + 'cell'} className={`bg-white aspect-square p-3 border-t border-[#D1D5DB] ${!post && !isPostDay ? 'bg-[#F4F7FA]/50' : ''}`}>
                    {post ? (
                      <>
                        <div className={`w-full h-1 mb-1 ${post.status === 'published' ? 'bg-[#1A7A3C]' : post.status === 'ready' ? 'bg-[#0D1A2A]' : 'bg-[#D1D5DB]'}`} />
                        <p className="text-[9px] leading-tight">{post.hook?.slice(0, 40)}...</p>
                        <p className="text-[8px] font-mono text-[#0D1A2A]/30 mt-1 uppercase">{post.post_type}</p>
                      </>
                    ) : isPostDay ? (
                      <div className="w-full h-1 bg-[#D1D5DB]/50 mb-1" />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="col-span-4 space-y-8">

          {/* Revenue Tracker */}
          <section className="bg-white border border-[#D1D5DB] p-6">
            <h3 className="text-xl font-display font-bold text-[#0D1A2A] mb-6">Revenue Tracker</h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#0D1A2A]/40">Actual vs Goal</span>
                  <span className="font-mono text-sm text-[#0D1A2A]">
                    ${monthRevenue.toLocaleString()} <span className="text-[#0D1A2A]/20">/ ${monthGoal.toLocaleString()}</span>
                  </span>
                </div>
                <div className="h-7 w-full bg-[#F4F7FA] relative overflow-hidden">
                  <div className="h-full bg-[#0D1A2A] transition-all duration-700" style={{ width: `${revPct}%` }} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/70">{revPct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F4F7FA]">
                  <p className="text-[9px] uppercase font-bold text-[#0D1A2A]/40">PKR Total</p>
                  <p className="font-mono text-xs mt-1">PKR {(monthRevenue * USD_PKR).toLocaleString('en-PK')}</p>
                </div>
                <div className="p-3 bg-[#F4F7FA]">
                  <p className="text-[9px] uppercase font-bold text-[#0D1A2A]/40">USD Total</p>
                  <p className="font-mono text-xs mt-1">${monthRevenue.toLocaleString()}</p>
                </div>
              </div>
              <a href="/revenue" className="block text-[10px] font-bold uppercase tracking-widest border-b border-[#0D1A2A] pb-1 w-fit hover:opacity-60">Full Report →</a>
            </div>
          </section>

          {/* LinkedIn Channel Health */}
          <section className="bg-white border border-[#D1D5DB] p-6">
            <h3 className="text-xl font-display font-bold text-[#0D1A2A] mb-5">Channel Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">Followers</p>
                  <p className="font-mono text-lg text-[#0D1A2A]">{metrics?.followers?.toLocaleString() || '—'}</p>
                </div>
                <div className="flex items-end gap-[2px] h-6">
                  {[40,60,50,80,100].map((h, i) => (
                    <div key={i} className="w-1 bg-[#0D1A2A]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#D1D5DB]/50 pt-4">
                <div>
                  <p className="text-xs font-bold">Impressions</p>
                  <p className="font-mono text-lg text-[#0D1A2A]">{metrics?.impressions?.toLocaleString() || '—'}</p>
                </div>
                <div className="flex items-end gap-[2px] h-6">
                  {[20,30,40,70,90].map((h, i) => (
                    <div key={i} className="w-1 bg-[#0D1A2A]/30" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#D1D5DB]/50 pt-4">
                <div>
                  <p className="text-xs font-bold">Engagement</p>
                  <p className="font-mono text-lg text-[#0D1A2A]">{metrics?.engagement_rate ? `${metrics.engagement_rate}%` : '—'}</p>
                </div>
                <a href="/analytics" className="text-[10px] font-mono text-[#0D1A2A]/40 border-b border-[#D1D5DB] pb-px hover:text-[#0D1A2A]">Update →</a>
              </div>
            </div>
          </section>

          {/* Active Clients */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-[#0D1A2A]">Key Clients</h3>
              <a href="/clients" className="text-[10px] font-bold uppercase tracking-widest border-b border-[#0D1A2A] pb-1 hover:opacity-60">All →</a>
            </div>
            {clients.slice(0, 2).map((c, i) => (
              <a key={c.id} href={`/clients/${c.id}`} className={`block p-4 ${i === 0 ? 'bg-[#0D1A2A] text-white' : 'bg-white border border-[#D1D5DB]'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className={`font-bold text-sm ${i === 0 ? 'text-white' : 'text-[#0D1A2A]'}`}>{c.company || c.id}</h4>
                    <p className={`text-[10px] uppercase tracking-widest mt-1 ${i === 0 ? 'text-white/40' : 'text-[#0D1A2A]/40'}`}>{c.offer_type}</p>
                  </div>
                  <span className={`text-[9px] font-bold border px-2 py-1 ${i === 0 ? 'border-white/30 text-white' : 'border-[#D1D5DB] text-[#0D1A2A]'}`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <div className={`flex justify-between items-end border-t pt-3 ${i === 0 ? 'border-white/10' : 'border-[#D1D5DB]/50'}`}>
                  <Dual usd={c.monthly_value || 0} />
                  {c.next_call_at && (
                    <span className={`font-mono text-[10px] ${i === 0 ? 'text-white/40' : 'text-[#0D1A2A]/40'}`}>
                      Call: {format(new Date(c.next_call_at), 'MMM d')}
                    </span>
                  )}
                </div>
              </a>
            ))}
            {clients.length === 0 && (
              <a href="/clients/new" className="block border border-dashed border-[#D1D5DB] p-4 text-center">
                <p className="text-xs text-[#0D1A2A]/30 font-mono">No clients yet</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#2E6DA4] mt-1">+ Add First Client →</p>
              </a>
            )}
          </section>

          {/* Pending Invoices */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold text-[#0D1A2A]">Pending Invoices</h3>
              <a href="/revenue" className="text-[10px] font-bold uppercase tracking-widest border-b border-[#0D1A2A] pb-1 hover:opacity-60">All →</a>
            </div>
            <div className="space-y-px bg-[#D1D5DB] border border-[#D1D5DB]">
              {invoices.slice(0, 4).map(inv => (
                <div key={inv.id} className="bg-white p-4 flex justify-between items-center">
                  <div className="text-xs">
                    <p className="font-bold text-[#0D1A2A]">INV-{inv.id.slice(-6).toUpperCase()}</p>
                    <p className="text-[#0D1A2A]/40">{inv.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-[#0D1A2A]">${inv.amount_usd.toFixed(2)}</p>
                    <p className="font-mono text-[10px] text-[#0D1A2A]/30">PKR {(inv.amount_usd * USD_PKR).toLocaleString('en-PK')}</p>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="bg-white p-4 text-center">
                  <p className="text-xs text-[#0D1A2A]/30 font-mono">No pending invoices</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
