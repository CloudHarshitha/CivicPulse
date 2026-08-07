# Supabase Backend Setup & Deployment Guide for CivicPulse

This guide details how to configure and deploy the PostgreSQL + PostGIS backend database, authentication, storage buckets, and serverless API pipelines for **CivicPulse**.

---

## 1. Prerequisites

- A [Supabase Account](https://supabase.com) (Free tier works perfectly)
- A Supabase project created (e.g. `civicpulse-prod`)
- Your project **URL** and **Anon Key** from `Project Settings -> API`

---

## 2. Database & PostGIS Setup

### Step A: Enable PostGIS & Run Migration
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to **SQL Editor**.
3. Create a new query, paste the contents of [`supabase/migrations/001_initial_schema.sql`](file:///C:/Users/harsh/.gemini/antigravity/scratch/civicpulse/supabase/migrations/001_initial_schema.sql), and click **Run**.

This script automatically:
- Enables the `postgis` spatial geometry extension.
- Creates `profiles`, `issues`, `issue_photos`, `upvotes`, `comments`, `departments`, `assignments`, `resolutions`, and `notifications` tables.
- Creates PostGIS `GIST` indexes (`idx_issues_location`).
- Deploys database functions:
  - `find_nearby_issues` (30m spatial radius check & 48h deduplication)
  - `get_locality_feed` (Hyper-local 5km spatial feed & Ward filter)
  - `update_upvote_count` (Auto APS score recalculation trigger)
- Sets up Row Level Security (RLS) policies.

---

## 3. Storage Bucket Configuration

1. In the **SQL Editor**, open a new query tab.
2. Paste the contents of [`supabase/storage.sql`](file:///C:/Users/harsh/.gemini/antigravity/scratch/civicpulse/supabase/storage.sql) and click **Run**.

This initializes 3 public storage buckets with security policies:
- `issue-photos`: Citizen evidence upload bucket.
- `resolution-photos`: Field contractor proof-of-work upload bucket.
- `avatars`: User profile picture bucket.

---

## 4. Environment Variables Configuration

Copy `.env.local.example` or update `.env.local` in your root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Elevated Admin Role Key (For AI Triage & SLA Escalation Workers)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional Cron Secret for Vercel Cron Job Security
CRON_SECRET=your-secure-cron-secret-token
```

On Vercel, navigate to **Project Settings -> Environment Variables** and add the 3 variables above.

---

## 5. API Endpoints Reference

The backend features 6 dedicated serverless pipeline endpoints:

| Endpoint | Method | Purpose | PDF Pipeline Stage |
|----------|--------|---------|--------------------|
| `/api/issues` | `GET`, `POST` | Fetch filtered locality feed / Submit geotagged issue | Stage 02 & Stage 04 |
| `/api/triage` | `POST` | Computer vision classification, priority tagging & SLA assignment | Stage 03 |
| `/api/dedup` | `POST` | PostGIS 30m spatial deduplication check & auto-merge | Stage 03 |
| `/api/upvote` | `POST` | Upvote ticket & trigger dynamic APS score recalculation | Stage 04 |
| `/api/sla` | `GET`, `POST` | SLA deadline monitoring worker & escalation alerter | Stage 05 |
| `/api/verify` | `POST`, `PATCH` | Resolution upload with 15m GPS audit & 48h citizen sign-off | Stage 06 |
| `/api/comments` | `GET`, `POST` | Discussion comments on reported tickets | Stage 04 |
| `/api/notifications` | `GET`, `PATCH` | In-app user notifications & unread tracker | System |
| `/api/departments` | `GET`, `POST` | Municipal department listing & contractor dispatch | Stage 05 |

---

## 6. Seed Data (Optional for Demo)

To populate your database with realistic demo tickets in Saket, New Delhi:
1. Open Supabase **SQL Editor**.
2. Run [`supabase/seed.sql`](file:///C:/Users/harsh/.gemini/antigravity/scratch/civicpulse/supabase/seed.sql).
