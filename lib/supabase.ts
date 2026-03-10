import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const USD_TO_PKR = Number(process.env.NEXT_PUBLIC_USD_TO_PKR) || 278

export function toPKR(usd: number): string {
  return (usd * USD_TO_PKR).toLocaleString('en-PK')
}

export function formatDual(usd: number): { usd: string; pkr: string } {
  return {
    usd: `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pkr: `PKR ${toPKR(usd)}`,
  }
}
