'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/outreach',  icon: '◎', label: 'Pipeline' },
  { href: '/content',   icon: '▦', label: 'Content' },
  { href: '/clients',   icon: '◈', label: 'Clients' },
  { href: '/revenue',   icon: '◉', label: 'Revenue' },
  { href: '/analytics', icon: '▲', label: 'Analytics' },
]

export default function AdminSidebar() {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen border-r border-border bg-white z-50 flex flex-col transition-all duration-200 ${expanded ? 'w-[200px]' : 'w-[52px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-border h-14 ${expanded ? 'px-5 gap-2' : 'justify-center'}`}>
        {expanded ? (
          // Full logo — SIGNL. variant
          <>
            <span className="font-display font-black text-gold text-xl tracking-tight">SIGNL</span>
            <span className="font-display font-black text-primary text-xl">.</span>
            <button onClick={() => setExpanded(false)} className="ml-auto text-primary/20 hover:text-primary/60 text-xs">←</button>
          </>
        ) : (
          // Icon logo — bracket variant
          <button onClick={() => setExpanded(true)} className="flex items-center gap-0.5">
            <span className="font-mono text-primary/30 text-sm">[</span>
            <span className="font-display font-black text-gold text-sm">S</span>
            <span className="font-mono text-primary/30 text-sm">]</span>
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
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors group ${
                active
                  ? 'bg-primary text-white'
                  : 'text-primary/40 hover:text-primary hover:bg-fog'
              } ${!expanded ? 'justify-center' : ''}`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {expanded && (
                <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-border p-2 space-y-1`}>
        <Link
          href="/clients/new"
          className={`flex items-center gap-3 px-3 py-2.5 bg-gold text-primary hover:bg-gold/80 transition-colors ${!expanded ? 'justify-center' : ''}`}
        >
          <span className="text-base leading-none font-bold">+</span>
          {expanded && <span className="text-xs font-bold uppercase tracking-widest">New Client</span>}
        </Link>
        <button
          onClick={signOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-primary/30 hover:text-danger transition-colors ${!expanded ? 'justify-center' : ''}`}
        >
          <span className="text-base">⎋</span>
          {expanded && <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
