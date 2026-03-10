# SIGNL OS

LinkedIn Agency Operating System — Next.js 14 + Supabase + Vercel

---

## Setup in 15 minutes

### 1. Supabase — Run the schema

1. Go to **supabase.com** → your project → **SQL Editor**
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### 2. Set your account as admin

After running the schema, run this SQL (replace with your actual user ID):

```sql
-- First, sign up at your deployed app URL, then get your user ID:
SELECT id, email FROM auth.users;

-- Then set yourself as admin:
UPDATE public.profiles SET role = 'admin' WHERE id = 'paste-your-user-id-here';
```

### 3. Environment Variables

Create `.env.local` (already created with your credentials):

```
NEXT_PUBLIC_SUPABASE_URL=https://buaqfwrcxellwslzehiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   ← GET THIS from Supabase Settings → API
NEXT_PUBLIC_USD_TO_PKR=278
```

**Get the service role key:** Supabase → Settings → API → `service_role` key (secret)

### 4. Deploy to Vercel

```bash
# Install dependencies
npm install

# Test locally
npm run dev

# Deploy
npx vercel --prod
```

Add all env vars in Vercel dashboard: Settings → Environment Variables

---

## User Management

### Creating your admin account
1. Go to `your-app.vercel.app/login`
2. Sign up with `talktoahmadfarooq@gmail.com`
3. Run the SQL above to set yourself as admin
4. Log in — you'll be redirected to `/dashboard`

### Creating client accounts
1. Log in as admin → go to `/clients`
2. Click **+ Add Client**
3. Step 1: Enter client's name, email, temp password → creates their login
4. Step 2: Select offer type, value, start date
5. Client receives email to sign in at `your-app.vercel.app/login`
6. They log in → land on `/portal` with their account only

---

## Pages

| Route | Who | What |
|-------|-----|-------|
| `/login` | Everyone | Auth |
| `/dashboard` | Admin | Morning briefing, pipeline, content, revenue |
| `/outreach` | Admin | Full kanban pipeline with add/advance/delete |
| `/clients` | Admin | Client list + add client + create user |
| `/revenue` | Admin | Revenue tracking, invoices, unit economics |
| `/content` | Admin | Content calendar, post editor |
| `/analytics` | Admin | LinkedIn analytics input |
| `/portal` | Client | Their deliverables, metrics, invoices, notes |

---

## Stack

- **Next.js 14** — App router, React Server Components
- **Supabase** — Postgres + Auth + Row Level Security
- **Tailwind CSS** — SIGNL brand tokens
- **Vercel** — Deploy in 60 seconds
- **Fonts:** Playfair Display + DM Sans + DM Mono

---

## Brand Tokens

| Token | Value |
|-------|-------|
| Primary | `#0D1A2A` |
| Accent | `#2E6DA4` |
| Gold | `#F5A623` |
| Mist | `#EEF3F8` |
| Fog | `#F4F7FA` |
| Success | `#1A7A3C` |
| Warning | `#B8860B` |
| Danger | `#C0392B` |

---

## Currency

All monetary values display dual currency: `$350 · PKR 97,300`
Rate: 1 USD = 278 PKR (update `NEXT_PUBLIC_USD_TO_PKR` env var to change)
