# CivicPulse Setup Guide

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/CloudHarshitha/CivicPulse.git
cd CivicPulse
npm install
```

### 2. Configure Supabase

Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** URL should NOT end with `/rest/v1/`

Get credentials from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

### 3. Initialize Database

Run this SQL in Supabase SQL Editor:
```sql
-- From supabase/migrations/001_initial_schema.sql
-- Copy and run the entire file
```

### 4. Run Development Server
```bash
npm run dev
```

Open: http://localhost:3000

## Demo Accounts

Test the app without signup:
```
Email: citizen@demo.com
Password: demo123

Email: authority@demo.com
Password: demo123
```

## Common Issues

### "Database error saving new user"
Run these in Supabase SQL Editor:

1. **Create signup trigger:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, role, 
    state, district, city, ward, is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'ward', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_verified')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

2. **Make fields nullable:**
```sql
ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN state DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN district DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN city DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN ward DROP NOT NULL;
```

### Email Rate Limit Exceeded

In Supabase Dashboard → Auth → Rate Limits:
- Change "Rate limit for sending emails" from `2` to `20` or higher

### 404 Errors on API Calls

Check your `.env.local`:
- ❌ Wrong: `https://xxx.supabase.co/rest/v1/`
- ✅ Correct: `https://xxx.supabase.co`

## Deployment

### Vercel
1. Connect GitHub repo to Vercel
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

Auto-deploys on every push to main branch.

## Project Structure

```
civicpulse/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Protected pages
│   │   ├── login/          # Auth pages
│   │   └── register/
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   │   ├── supabase/       # Database clients
│   │   └── auth-context.tsx
│   └── types/              # TypeScript types
├── supabase/               # Database
│   ├── migrations/         # SQL schema
│   └── seed.sql           # Test data
└── public/                 # Static assets
```

## Features

- ✅ Multi-role authentication (Citizen/Authority/Admin)
- ✅ Issue reporting with photo & GPS
- ✅ PostGIS geospatial deduplication
- ✅ Community upvoting
- ✅ SLA tracking
- ✅ Authority dashboard
- ✅ Interactive maps (Leaflet)
- ✅ PWA support

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS + Auth)
- **Deployment:** Vercel
- **Maps:** Leaflet + React-Leaflet

## Support

For issues, check:
- Browser console for errors
- Supabase logs: Dashboard → Logs
- Network tab for failed API calls

Built for Smart India Hackathon 2024
