'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'

const STAGES = [
  { key: 'warmup',   label: 'Warm-up',  color: '#D5E2EE' },
  { key: 'dm_sent',  label: 'DM Sent',  color: '#B8860B' },
  { key: 'replied',  label: 'Replied',  color: '#2E6DA4' },
  { key: 'called',   label: 'Called',   color: '#5A3E8A' },
  { key: 'closed',   label: 'Closed',   color: '#1A7A3C' },
]
const CHANNELS = ['linkedin_dm', 'cold_email', 'referral', 'inbound']

export default function OutreachPage() {
  const supabase = createClient()
  const [prospects, setProspects] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', linkedin_url: '', email: '', followers: '', stage: 'warmup', channel: 'linkedin_dm', notes: '', follow_up_date: '' })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  async function load() {
    const { data } = await supabase.from('outreach_prospects').select('*').order('created_at', { ascending: false })
    setProspects(data || [])
  }

  useEffect(() => { load() }, [])

  async function addProspect() {
    setLoading(true)
    await supabase.from('outreach_prospects').insert({
      ...form,
      followers: form.followers ? parseInt(form.followers) : null,
      last_contact: new Date().toISOString().split('T')[0],
    })
    setForm({ name: '', company: '', linkedin_url: '', email: '', followers: '', stage: 'warmup', channel: 'linkedin_dm', notes: '', follow_up_date: '' })
    setShowAdd(false)
    setLoading(false)
    load()
  }

  async function updateStage(id: string, stage: string) {
    await supabase.from('outreach_prospects').update({ stage, last_contact: new Date().toISOString().split('T')[0] }).eq('id', id)
    load()
  }

  async function deleteProspect(id: string) {
    await supabase.from('outreach_prospects').delete().eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? prospects : prospects.filter(p => p.channel === filter)
  const byStage = STAGES.reduce((acc, s) => {
    acc[s.key] = filtered.filter(p => p.stage === s.key)
    return acc
  }, {} as Record<string, any[]>)

  const followUps = prospects.filter(p => p.follow_up_date && p.follow_up_date <= new Date().toISOString().split('T')[0] && !['closed', 'dead'].includes(p.stage))

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mb-1">Project 05</p>
            <h1 className="text-4xl font-display font-black text-[#0D1A2A]">Outreach Pipeline</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-px border border-[#D1D5DB]">
              {['all', 'linkedin_dm', 'cold_email'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${filter === f ? 'bg-[#0D1A2A] text-white' : 'bg-white text-[#0D1A2A]/40 hover:text-[#0D1A2A]'}`}>
                  {f === 'all' ? 'All' : f === 'linkedin_dm' ? 'LinkedIn' : 'Email'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="bg-[#0D1A2A] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A3C5E] transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              Add Prospect
            </button>
          </div>
        </div>

        {/* Follow-up alert */}
        {followUps.length > 0 && (
          <div className="mb-6 border border-[#B8860B] bg-[#FBF8EE] p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#B8860B]">schedule</span>
            <p className="text-xs font-bold text-[#B8860B]">{followUps.length} follow-up{followUps.length > 1 ? 's' : ''} due: {followUps.map(f => f.name).join(', ')}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-px bg-[#D1D5DB] border border-[#D1D5DB] mb-8">
          {STAGES.map(s => (
            <div key={s.key} className="bg-white px-4 py-3 text-center">
              <p className="font-mono text-2xl font-medium text-[#0D1A2A]">{byStage[s.key]?.length || 0}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#0D1A2A]/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <div key={stage.key} className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#0D1A2A] pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest">{stage.label}</span>
                <span className="font-mono text-xs">{String(byStage[stage.key]?.length || 0).padStart(2, '0')}</span>
              </div>
              {byStage[stage.key]?.map(p => (
                <div key={p.id} className="bg-white border border-[#D1D5DB] p-3 group relative">
                  <p className="text-xs font-bold text-[#0D1A2A] mb-1">{p.name}</p>
                  <p className="text-[10px] text-[#0D1A2A]/40 uppercase tracking-tighter mb-2">{p.company}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${p.channel === 'linkedin_dm' ? 'bg-[#EEF3F8] text-[#2E6DA4]' : 'bg-[#FBF8EE] text-[#B8860B]'}`}>
                      {p.channel === 'linkedin_dm' ? 'LI' : 'Email'}
                    </span>
                    {p.followers && <span className="text-[9px] font-mono text-[#0D1A2A]/30">{(p.followers / 1000).toFixed(1)}k</span>}
                  </div>
                  {p.follow_up_date && (
                    <p className="text-[9px] font-mono text-[#B8860B]">↑ {format(new Date(p.follow_up_date), 'MMM d')}</p>
                  )}
                  {/* Stage advance */}
                  <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {stage.key !== 'closed' && (
                      <button
                        onClick={() => {
                          const nextIdx = STAGES.findIndex(s => s.key === stage.key) + 1
                          if (nextIdx < STAGES.length) updateStage(p.id, STAGES[nextIdx].key)
                        }}
                        className="flex-1 bg-[#0D1A2A] text-white text-[8px] font-bold uppercase py-1 px-2 hover:bg-[#1A3C5E]"
                      >
                        Advance →
                      </button>
                    )}
                    {p.linkedin_url && (
                      <a href={p.linkedin_url} target="_blank" className="px-2 py-1 border border-[#D1D5DB] text-[#0D1A2A]/40 hover:text-[#0D1A2A] text-[10px] flex items-center">
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                    )}
                    <button onClick={() => deleteProspect(p.id)} className="px-2 py-1 border border-[#D1D5DB] text-[#C0392B]/40 hover:text-[#C0392B] text-[10px] flex items-center">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              {(!byStage[stage.key] || byStage[stage.key].length === 0) && (
                <div className="border border-dashed border-[#D1D5DB] p-4 text-center">
                  <p className="text-[9px] text-[#0D1A2A]/20 font-mono">Empty</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Prospect Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-[#0D1A2A]/60 z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold">Add Prospect</h2>
                <button onClick={() => setShowAdd(false)} className="text-[#0D1A2A]/30 hover:text-[#0D1A2A]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Company</label>
                    <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">LinkedIn URL</label>
                  <input value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Channel</label>
                    <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A] bg-white">
                      <option value="linkedin_dm">LinkedIn DM</option>
                      <option value="cold_email">Cold Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Followers</label>
                    <input type="number" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" placeholder="2500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Follow-up Date</label>
                  <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#0D1A2A]/40 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-[#D1D5DB] px-3 py-2 text-sm focus:outline-none focus:border-[#0D1A2A] resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={addProspect} disabled={!form.name || loading} className="flex-1 bg-[#0D1A2A] text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#1A3C5E] disabled:opacity-40 transition-colors">
                  {loading ? 'Adding...' : 'Add to Pipeline →'}
                </button>
                <button onClick={() => setShowAdd(false)} className="px-6 border border-[#D1D5DB] text-xs font-bold uppercase tracking-widest hover:bg-[#F4F7FA]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
