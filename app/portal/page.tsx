'use client'
import { useState, useEffect } from 'react'
import { createClient, formatDual } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function PortalPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [prof, cl] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('clients').select('*').eq('profile_id', user.id).eq('status', 'active').single(),
      ])
      setProfile(prof.data)
      setClient(cl.data)

      if (cl.data) {
        const [del, nt, inv, met] = await Promise.all([
          supabase.from('deliverables').select('*').eq('client_id', cl.data.id).eq('visible_to_client', true).order('due_date'),
          supabase.from('session_notes').select('*').eq('client_id', cl.data.id).eq('visible_to_client', true).order('session_date', { ascending: false }).limit(3),
          supabase.from('invoices').select('*').eq('client_id', cl.data.id).order('issued_date', { ascending: false }).limit(5),
          supabase.from('linkedin_metrics').select('*').eq('profile_id', user.id).order('week_of', { ascending: false }).limit(8),
        ])
        setDeliverables(del.data || [])
        setNotes(nt.data || [])
        setInvoices(inv.data || [])
        setMetrics(met.data || [])
      }
    }
    load()
  }, [])

  const OFFER_LABELS: Record<string, string> = { audit: 'Signal Audit', build: 'SIGNL Build', dwy: 'DWY Partnership', dfy: 'DFY Engine' }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const doneDeliverables = deliverables.filter(d => d.status === 'done').length
  const totalDeliverables = deliverables.length
  const latestMetric = metrics[0]
  const prevMetric = metrics[1]
  const followerGrowth = latestMetric && prevMetric ? latestMetric.followers - prevMetric.followers : null

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#D5E2EE] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* SIGNL. variant in header */}
          <div className="flex items-baseline gap-0.5">
            <span className="font-display font-black text-[#F5A623] text-lg tracking-tight">SIGNL</span>
            <span className="font-display font-black text-[#0D1A2A] text-lg">.</span>
          </div>
          <span className="text-[#0D1A2A]/20 text-sm">/</span>
          <span className="text-xs font-mono text-[#0D1A2A]/40 uppercase tracking-widest">Client Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-[#0D1A2A]/30">{profile?.full_name}</span>
          <button onClick={signOut} className="text-[#0D1A2A]/30 hover:text-[#C0392B] transition-colors">
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Welcome */}
        <section className="mb-12">
          <p className="text-[#2E6DA4] font-mono text-xs uppercase tracking-widest mb-2">
            {client?.offer_type ? OFFER_LABELS[client.offer_type] : 'Your Account'}
          </p>
          <h1 className="font-display font-black text-5xl text-[#0D1A2A] leading-tight">
            Welcome back,<br />{firstName}.
          </h1>
          {client?.start_date && (
            <p className="text-[#0D1A2A]/40 text-sm mt-3">
              Started {format(new Date(client.start_date), 'MMMM d, yyyy')}
            </p>
          )}
        </section>

        <div className="grid grid-cols-12 gap-8">
          {/* Left col */}
          <div className="col-span-8 space-y-8">
            {/* Metrics */}
            {latestMetric && (
              <section className="bg-white border border-[#D5E2EE] p-8">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D1A2A]/40 mb-8">Campaign Overview</h2>
                <div className="grid grid-cols-3 divide-x divide-[#D5E2EE]">
                  <div className="pr-8">
                    <p className="text-xs text-[#0D1A2A]/40 mb-2 uppercase tracking-wider">Followers</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-4xl font-medium">{latestMetric.followers?.toLocaleString() || '—'}</span>
                      {followerGrowth !== null && (
                        <span className={`text-xs font-bold ${followerGrowth > 0 ? 'text-[#1A7A3C]' : 'text-[#C0392B]'}`}>
                          {followerGrowth > 0 ? '+' : ''}{followerGrowth}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-8">
                    <p className="text-xs text-[#0D1A2A]/40 mb-2 uppercase tracking-wider">Impressions</p>
                    <span className="font-mono text-4xl font-medium">{latestMetric.impressions?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="pl-8">
                    <p className="text-xs text-[#0D1A2A]/40 mb-2 uppercase tracking-wider">Engagement</p>
                    <span className="font-mono text-4xl font-medium">{latestMetric.engagement_rate ? `${latestMetric.engagement_rate}%` : '—'}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Deliverables */}
            <section className="bg-white border border-[#D5E2EE] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D1A2A]/40">Deliverables</h2>
                <span className="font-mono text-xs text-[#0D1A2A]/40">{doneDeliverables}/{totalDeliverables} complete</span>
              </div>
              {/* Progress */}
              {totalDeliverables > 0 && (
                <div className="h-1 bg-[#EEF3F8] mb-6">
                  <div className="h-full bg-[#1A7A3C] transition-all" style={{ width: `${Math.round((doneDeliverables / totalDeliverables) * 100)}%` }} />
                </div>
              )}
              <div className="space-y-0 border-t border-[#D5E2EE]">
                {deliverables.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-5 border-b border-[#D5E2EE] last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 flex items-center justify-center border ${d.status === 'done' ? 'bg-[#1A7A3C] border-[#1A7A3C]' : d.status === 'in_progress' ? 'border-[#2E6DA4]' : 'border-[#D5E2EE]'}`}>
                        {d.status === 'done' && <span className="material-symbols-outlined text-white text-xs">check</span>}
                        {d.status === 'in_progress' && <div className="w-2 h-2 bg-[#2E6DA4]" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${d.status === 'done' ? 'line-through text-[#0D1A2A]/30' : 'text-[#0D1A2A]'}`}>{d.title}</p>
                        {d.due_date && d.status !== 'done' && (
                          <p className="text-[10px] font-mono text-[#0D1A2A]/30 mt-0.5">Due {format(new Date(d.due_date), 'MMM d')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-1 ${
                        d.status === 'done' ? 'bg-[#EBF7EE] text-[#1A7A3C]' :
                        d.status === 'in_progress' ? 'bg-[#EDF4FF] text-[#2E6DA4]' :
                        'bg-[#F4F7FA] text-[#0D1A2A]/40'
                      }`}>{d.status.replace('_', ' ')}</span>
                      {d.asset_url && (
                        <a href={d.asset_url} target="_blank" className="text-[#2E6DA4] hover:text-[#0D1A2A] transition-colors">
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {deliverables.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[#0D1A2A]/30">Deliverables will appear here once your engagement starts.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Session Notes */}
            <section className="bg-white border border-[#D5E2EE] p-8">
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D1A2A]/40 mb-8">Session Notes</h2>
              <div className="space-y-6">
                {notes.map(n => (
                  <div key={n.id} className="border-b border-[#D5E2EE] pb-6 last:border-0 last:pb-0">
                    <p className="text-[10px] font-mono text-[#0D1A2A]/30 uppercase mb-2">
                      {format(new Date(n.session_date), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-sm leading-relaxed text-[#0D1A2A]/70">{n.notes}</p>
                    {n.action_items?.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {n.action_items.map((a: string, i: number) => (
                          <li key={i} className="text-xs text-[#0D1A2A]/50 flex gap-2">
                            <span className="text-[#2E6DA4]">→</span>{a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-sm text-[#0D1A2A]/30 text-center py-4">Session notes will appear after your first call.</p>
                )}
              </div>
            </section>
          </div>

          {/* Right col */}
          <div className="col-span-4 space-y-6">
            {/* Investment tracker */}
            {client && (
              <section className="bg-[#0D1A2A] text-white p-6">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 mb-4">Investment</p>
                <div className="mb-3">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">USD</p>
                  <p className="font-mono text-3xl">${client.monthly_value?.toLocaleString()}</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">PKR</p>
                  <p className="font-mono text-xl text-white/60">{(client.monthly_value * 278).toLocaleString('en-PK')}</p>
                </div>
                {client.next_call_at && (
                  <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Next Call</span>
                    <span className="font-mono text-xs text-white/60">{format(new Date(client.next_call_at), 'MMM d, h:mm a')}</span>
                  </div>
                )}
              </section>
            )}

            {/* Invoices */}
            <section className="bg-white border border-[#D5E2EE] p-6">
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D1A2A]/40 mb-6">Invoices</h2>
              <div className="space-y-3">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center py-3 border-b border-[#D5E2EE] last:border-0">
                    <div>
                      <p className="text-xs font-bold text-[#0D1A2A]">{inv.description}</p>
                      <p className="text-[9px] font-mono text-[#0D1A2A]/30">{format(new Date(inv.issued_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">${inv.amount_usd}</p>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 mt-1 block ${
                        inv.status === 'paid' ? 'bg-[#EBF7EE] text-[#1A7A3C]' :
                        inv.status === 'overdue' ? 'bg-[#FDECEA] text-[#C0392B]' :
                        'bg-[#FBF8EE] text-[#B8860B]'
                      }`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && <p className="text-xs text-[#0D1A2A]/30 text-center py-2">No invoices yet</p>}
              </div>
            </section>

            {/* Send message */}
            <section className="bg-white border border-[#D5E2EE] p-6">
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0D1A2A]/40 mb-4">Message Ahmad</h2>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Ask a question or share a note..."
                className="w-full border border-[#D5E2EE] px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0D1A2A] text-[#0D1A2A] placeholder:text-[#0D1A2A]/20"
              />
              <button className="w-full mt-3 bg-[#0D1A2A] text-white py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A3C5E] transition-colors">
                Send Message →
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
