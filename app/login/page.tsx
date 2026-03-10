'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    // Get role and redirect
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'admin' ? '/dashboard' : '/portal')
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`
    })
    if (error) { setError(error.message); setLoading(false); return }
    setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left — Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 border-r border-white/5">
        <div>
          {/* Logo bracket variant */}
          <div className="flex items-center gap-2 mb-16">
            <span className="text-white/30 font-mono text-2xl">[</span>
            <span className="font-display font-black text-gold text-2xl tracking-tight">SIGNL</span>
            <span className="text-white/30 font-mono text-2xl">]</span>
          </div>
          <h1 className="font-display text-5xl text-white font-black leading-tight mb-4">
            The Operating<br />
            <span className="italic text-white/40">System.</span>
          </h1>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs">
            One login. Everything you need to run SIGNL — clients, revenue, outreach, content, and analytics.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { n: '01', label: 'Morning Briefing + Non-Negotiables' },
            { n: '02', label: 'Outreach Pipeline + CRM' },
            { n: '03', label: 'Client Portal + Deliverables' },
            { n: '04', label: 'Revenue Tracker + Dual Currency' },
            { n: '05', label: 'Content Calendar + Analytics' },
          ].map(item => (
            <div key={item.n} className="flex items-center gap-4 text-white/25">
              <span className="font-mono text-xs">{item.n}</span>
              <span className="h-px flex-1 bg-white/5" />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-20">
        {/* Mobile logo */}
        <div className="lg:hidden mb-12 flex items-center gap-2">
          <span className="text-white/30 font-mono text-xl">[</span>
          <span className="font-display font-black text-gold text-xl">SIGNL</span>
          <span className="text-white/30 font-mono text-xl">]</span>
        </div>

        <div className="max-w-sm w-full">
          {mode === 'login' ? (
            <>
              <div className="mb-10">
                <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2">
                  Secure Access
                </p>
                <h2 className="font-display text-3xl text-white font-bold">Sign in</h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-danger text-xs font-mono bg-danger/10 border border-danger/20 px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-primary py-3 font-bold text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
              </form>

              <button
                onClick={() => setMode('reset')}
                className="mt-6 text-white/25 text-xs hover:text-white/50 transition-colors font-mono"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <>
              <div className="mb-10">
                <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2">
                  Password Reset
                </p>
                <h2 className="font-display text-3xl text-white font-bold">Reset access</h2>
              </div>

              {resetSent ? (
                <div className="bg-success/10 border border-success/20 px-4 py-4">
                  <p className="text-success text-sm font-mono">
                    Reset link sent to {email}. Check your inbox.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  {error && (
                    <p className="text-danger text-xs font-mono bg-danger/10 border border-danger/20 px-3 py-2">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold text-primary py-3 font-bold text-xs uppercase tracking-widest hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link →'}
                  </button>
                </form>
              )}

              <button
                onClick={() => setMode('login')}
                className="mt-6 text-white/25 text-xs hover:text-white/50 transition-colors font-mono"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
