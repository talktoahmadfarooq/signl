'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', icon: 'dashboard',      label: 'Dashboard'  },
  { href: '/outreach',  icon: 'view_column',     label: 'Pipeline'   },
  { href: '/content',   icon: 'calendar_month',  label: 'Calendar'   },
  { href: '/clients',   icon: 'group',           label: 'Clients'    },
  { href: '/revenue',   icon: 'payments',        label: 'Revenue'    },
  { href: '/analytics', icon: 'insights',        label: 'Analytics'  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true)
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const w = expanded ? 'w-[200px]' : 'w-[52px]'
  const ml = expanded ? 'ml-[200px]' : 'ml-[52px]'

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex">
      {/* ── Sidebar ── */}
      <aside className={`${w} fixed left-0 top-0 h-screen border-r border-[#D1D5DB] bg-white z-50 flex flex-col transition-all duration-200`}>

        {/* Logo */}
        <div className={`h-14 border-b border-[#D1D5DB] flex items-center ${expanded ? 'px-5 justify-between' : 'justify-center'}`}>
          {expanded ? (
            <>
              {/* SIGNL. variant */}
              <div className="flex items-baseline gap-0.5">
                <span className="font-display font-black text-[#F5A623] text-xl tracking-tight leading-none">SIGNL</span>
                <span className="font-display font-black text-[#0D1A2A] text-xl leading-none">.</span>
              </div>
              <button onClick={() => setExpanded(false)} className="text-[#0D1A2A]/20 hover:text-[#0D1A2A]/60 text-xs transition-colors">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
            </>
          ) : (
            /* [SIGNL] bracket variant */
            <button onClick={() => setExpanded(true)} className="flex items-center gap-0 leading-none">
              <span className="font-mono text-[#0D1A2A]/30 text-sm">[</span>
              <span className="font-display font-black text-[#F5A623] text-sm">S</span>
              <span className="font-mono text-[#0D1A2A]/30 text-sm">]</span>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  active ? 'bg-[#0D1A2A] text-white' : 'text-[#0D1A2A]/40 hover:text-[#0D1A2A] hover:bg-[#F4F7FA]'
                } ${!expanded ? 'justify-center' : ''}`}
              >
                <span className="material-symbols-outlined text-[20px] leading-none">{item.icon}</span>
                {expanded && <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className={`border-t border-[#D1D5DB] p-2 space-y-1`}>
          <Link
            href="/clients/new"
            className={`flex items-center gap-3 px-3 py-2.5 bg-[#0D1A2A] text-white hover:bg-[#1A3C5E] transition-colors ${!expanded ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] leading-none">add</span>
            {expanded && <span className="text-xs font-bold uppercase tracking-widest">New Client</span>}
          </Link>
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[#0D1A2A]/30 hover:text-[#C0392B] transition-colors ${!expanded ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] leading-none">logout</span>
            {expanded && <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={`${ml} flex-1 transition-all duration-200`}>
        {children}
      </main>
    </div>
  )
}
