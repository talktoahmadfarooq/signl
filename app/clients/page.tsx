'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient, formatDual } from '@/lib/supabase'
import { format } from 'date-fns'

const OFFER_TYPES = ['audit', 'build', 'dwy', 'dfy']
const OFFER_LABELS: Record<string, string> = { audit: 'Signal Audit', build: 'SIGNL Build', dwy: 'DWY Partnership', dfy: 'DFY Engine' }
const OFFER_PRICES: Record<string, number> = { audit: 350, build: 1500, dwy: 700, dfy: 2500 }

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [step, setStep] = useState<'user' | 'client'>('user')
  const [newUserId, setNewUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', company: '', linkedin_url: '' })
  const [clientForm, setClientForm] = useState({ offer_type: 'audit', monthly_value: 350, start_date: new Date().toISOString().split('T')[0], next_call_at: '', referral_source: 'linkedin_dm' })

  async function load() {
    const { data } = await supabase.from('clients').select(`*, profiles(full_name, company, linkedin_url)`).order('created_at', { ascending: false })
    setClients(data || [])
  }
  useEffect(() => { load() }, [])

  async function createUser() {
    setLoading(true); setError('')
    // Create auth user via admin API — calls our server action
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to create user'); setLoading(false); return }
    setNewUserId(json.userId)
    setStep('client')
    setLoading(false)
  }

  async function createClient_() {
    setLoading(true); setError('')
    const { error } = await supabase.from('clients').insert({
      profile_id: newUserId,
      ...clientForm,
      status: 'active',
    })
    if (error) { setError(error.message); setLoading(false); return }
    setShowAdd(false); setStep('user')
    setUserForm({ email: '', password: '', full_name: '', company: '', linkedin_url: '' })
    setNewUserId('')
    setLoading(false)
    load()
  }

  const activeCount = clients.filter(c => c.status === 'active').length
  const capacity = 3 // DFY hard cap

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mb-1">Project 03</p>
            <h1 className="text-4xl font-display font-black text-[#0D1A2A]">Clients</h1>
          </div>
          <button onClick={() => { setShowAdd(true); setStep('user') }} className="bg-[#0D1A2A] text-white px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A3C5E] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Client
          </button>
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-4 gap-px bg-[#D1D5DB] border border-[#D1D5DB] mb-8">
          <div className="bg-white p-4 text-center">
            <p className="font-mono text-2xl">{activeCount}</p>
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mt-1">Active Clients</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="font-mono text-2xl">{capacity - activeCount}</p>
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mt-1">DFY Slots Left</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="font-mono text-2xl">{clients.filter(c => c.status === 'completed').length}</p>
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mt-1">Completed</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="font-mono text-sm">{Math.round((activeCount / capacity) * 100)}%</p>
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mt-1">Capacity Used</p>
            <div className="h-1 bg-[#F4F7FA] mt-2">
              <div className="h-full bg-[#0D1A2A]" style={{ width: `${Math.min(100, (activeCount / capacity) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Client list */}
        <div className="space-y-px bg-[#D1D5DB] border border-[#D1D5DB]">
          {/* Table header */}
          <div className="bg-[#F4F7FA] px-6 py-3 grid grid-cols-12 gap-4">
            {['Client', 'Offer', 'Value', 'Status', 'Next Call', 'Action'].map((h, i) => (
              <div key={h} className={`text-[9px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 ${i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-2' : 'col-span-1'}`}>{h}</div>
            ))}
          </div>
          {clients.map(c => (
            <div key={c.id} className="bg-white px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-[#F4F7FA] transition-colors">
              <div className="col-span-3">
                <p className="text-sm font-bold text-[#0D1A2A]">{c.profiles?.full_name || '—'}</p>
                <p className="text-[10px] text-[#0D1A2A]/40">{c.profiles?.company || c.company}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold bg-[#EEF3F8] text-[#1A3C5E] px-2 py-1 uppercase tracking-wide">
                  {OFFER_LABELS[c.offer_type] || c.offer_type}
                </span>
              </div>
              <div className="col-span-2">
                <p className="font-mono text-sm text-[#0D1A2A]">${c.monthly_value?.toFixed(0)}</p>
                <p className="font-mono text-[9px] text-[#0D1A2A]/30">PKR {(c.monthly_value * 278).toLocaleString('en-PK')}</p>
              </div>
              <div className="col-span-1">
                <span className={`text-[9px] font-bold uppercase px-2 py-1 ${
                  c.status === 'active' ? 'bg-[#EBF7EE] text-[#1A7A3C]' :
                  c.status === 'paused' ? 'bg-[#FBF8EE] text-[#B8860B]' :
                  c.status === 'completed' ? 'bg-[#EEF3F8] text-[#2E6DA4]' :
                  'bg-[#FDECEA] text-[#C0392B]'
                }`}>{c.status}</span>
              </div>
              <div className="col-span-2">
                <p className="font-mono text-xs text-[#0D1A2A]/50">
                  {c.next_call_at ? format(new Date(c.next_call_at), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <div className="col-span-1 flex gap-2">
                <a href={`/clients/${c.id}`} className="text-[#2E6DA4] hover:text-[#0D1A2A] transition-colors">
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                </a>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="bg-white p-12 text-center">
              <p className="font-display text-2xl text-[#0D1A2A]/20 mb-2">No clients yet</p>
              <p className="text-sm text-[#0D1A2A]/30">First client by March 31 — you've got this.</p>
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-[#0D1A2A]/60 z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg p-8">
              {/* Steps */}
              <div className="flex items-center gap-0 mb-8">
                {['Create User Login', 'Client Details'].map((s, i) => (
                  <div key={s} className={`flex items-center ${i === 1 ? 'flex-1' : ''}`}>
                    <div className={`flex items-center gap-2 px-4 py-2 ${(i === 0 && step === 'user') || (i === 1 && step === 'client') ? 'bg-[#0D1A2A] text-white' : 'bg-[#F4F7FA] text-[#0D1A2A]/40'}`}>
                      <span className="font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{s}</span>
                    </div>
                    {i === 0 && <div className="w-4 h-px bg-[#D1D5DB]" />}
                  </div>
                ))}
                <button onClick={() => setShowAdd(false)} className="ml-auto text-[#0D1A2A]/30 hover:text-[#0D1A2A]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {step === 'user' ? (
                <>
                  <h2 className="text-xl font-display font-bold mb-6">Create Client Login</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Full Name *</label>
                        <input value={userForm.full_name} onChange={e => setUserForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Company</label>
                        <input value={userForm.company} onChange={e => setUserForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Email *</label>
                      <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Temp Password *</label>
                      <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" placeholder="Min 8 characters" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">LinkedIn URL</label>
                      <input value={userForm.linkedin_url} onChange={e => setUserForm(f => ({ ...f, linkedin_url: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                    </div>
                  </div>
                  {error && <p className="text-[#C0392B] text-xs font-mono mt-3 bg-[#FDECEA] border border-[#C0392B]/20 px-3 py-2">{error}</p>}
                  <button onClick={createUser} disabled={!userForm.email || !userForm.password || !userForm.full_name || loading} className="w-full mt-6 bg-[#0D1A2A] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#1A3C5E] disabled:opacity-40">
                    {loading ? 'Creating...' : 'Create Login → Next Step'}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-display font-bold mb-6">Client Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Offer Type</label>
                      <div className="grid grid-cols-2 gap-px bg-[#D1D5DB] border border-[#D1D5DB]">
                        {OFFER_TYPES.map(o => (
                          <button key={o} onClick={() => setClientForm(f => ({ ...f, offer_type: o, monthly_value: OFFER_PRICES[o] }))}
                            className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${clientForm.offer_type === o ? 'bg-[#0D1A2A] text-white' : 'bg-white text-[#0D1A2A]/40 hover:text-[#0D1A2A]'}`}>
                            {OFFER_LABELS[o]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Value (USD)</label>
                        <input type="number" value={clientForm.monthly_value} onChange={e => setClientForm(f => ({ ...f, monthly_value: Number(e.target.value) }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A] font-mono" />
                        <p className="text-[9px] font-mono text-[#0D1A2A]/30 mt-1">= PKR {(clientForm.monthly_value * 278).toLocaleString('en-PK')}</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Start Date</label>
                        <input type="date" value={clientForm.start_date} onChange={e => setClientForm(f => ({ ...f, start_date: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Next Call</label>
                        <input type="datetime-local" value={clientForm.next_call_at} onChange={e => setClientForm(f => ({ ...f, next_call_at: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Source</label>
                        <select value={clientForm.referral_source} onChange={e => setClientForm(f => ({ ...f, referral_source: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A] bg-white">
                          <option value="linkedin_dm">LinkedIn DM</option>
                          <option value="cold_email">Cold Email</option>
                          <option value="referral">Referral</option>
                          <option value="inbound">Inbound</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-[#C0392B] text-xs font-mono mt-3 bg-[#FDECEA] border border-[#C0392B]/20 px-3 py-2">{error}</p>}
                  <button onClick={createClient_} disabled={loading} className="w-full mt-6 bg-[#1A7A3C] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#155f2e] disabled:opacity-40">
                    {loading ? 'Saving...' : '✓ Create Client'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
