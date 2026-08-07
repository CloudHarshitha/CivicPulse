# 🚨 URGENT: Fix Vercel Environment Variables

## Problem

Your **production website** is still using the **OLD Supabase credentials**, causing:
- ❌ 404 errors on all database queries
- ❌ Email rate limit exceeded
- ❌ Cannot login or register

**The errors show:**
```
qtspjotbiyxfmudlywjd.supabase.co  ← OLD project (WRONG!)
```

**Should be:**
```
mrkemtcddqjpddynmtvg.supabase.co  ← NEW project (CORRECT!)
```

Your local `.env.local` is correct, but **Vercel still has old values**.

---

## ✅ Fix It NOW (2 minutes)

### Step 1: Open Vercel Dashboard

Go to: **https://vercel.com/dashboard**

### Step 2: Find Your Project

Look for: **civic-pulse-gov** or **CivicPulse**

Click on it.

### Step 3: Go to Settings → Environment Variables

1. Click **"Settings"** tab
2. Click **"Environment Variables"** in the left sidebar

### Step 4: Update These Variables

Find and **EDIT** these two variables:

#### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`

**Old (WRONG) value:**
```
https://qtspjotbiyxfmudlywjd.supabase.co
```

**New (CORRECT) value:**
```
https://mrkemtcddqjpddynmtvg.supabase.co
```

**How to edit:**
1. Find `NEXT_PUBLIC_SUPABASE_URL` in the list
2. Click the **three dots (⋮)** on the right
3. Click **"Edit"**
4. Change the value to: `https://mrkemtcddqjpddynmtvg.supabase.co`
5. Select **Production**, **Preview**, and **Development**
6. Click **"Save"**

#### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Old (WRONG) value:**
```
(Some old key starting with eyJ...)
```

**New (CORRECT) value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ya2VtdGNkZHFqcGRkeW5tdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzYyNjMsImV4cCI6MjEwMTY1MjI2M30.Iyc47wjgguWttJbAiWHWSoRwgSsevRQ-6d_irnuZvQk
```

**How to edit:**
1. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the list
2. Click the **three dots (⋮)** on the right
3. Click **"Edit"**
4. Change the value to the key above
5. Select **Production**, **Preview**, and **Development**
6. Click **"Save"**

### Step 5: Redeploy

After saving both variables:

1. Go to the **"Deployments"** tab
2. Find the **latest deployment** (top of the list)
3. Click the **three dots (⋮)** on the right
4. Click **"Redeploy"**
5. Confirm by clicking **"Redeploy"** again

**Wait 30-60 seconds** for the deployment to complete.

---

## 🎯 Alternative: Use Vercel CLI

If you have Vercel CLI installed:

```powershell
# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://mrkemtcddqjpddynmtvg.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste the new anon key

# Redeploy
vercel --prod
```

---

## 📋 Double-Check Your Values

### ✅ Correct Values (NEW project):
```env
NEXT_PUBLIC_SUPABASE_URL=https://mrkemtcddqjpddynmtvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ya2VtdGNkZHFqcGRkeW5tdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzYyNjMsImV4cCI6MjEwMTY1MjI2M30.Iyc47wjgguWttJbAiWHWSoRwgSsevRQ-6d_irnuZvQk
```

### ❌ Wrong Values (OLD project - DO NOT USE):
```env
NEXT_PUBLIC_SUPABASE_URL=https://qtspjotbiyxfmudlywjd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<some different key>
```

---

## 🔍 How to Verify the Fix

After redeploying, visit your site:
```
https://civic-pulse-gov.vercel.app
```

**Open browser console (F12) and check:**

### ✅ Success indicators:
```
✓ auth.user (onAuthStateChange) {id: "...", email: "..."}
✓ [SupabaseDataProvider] DB reports count: 0
✓ No 404 errors
✓ No rate limit errors
✓ URL shows: mrkemtcddqjpddynmtvg.supabase.co
```

### ❌ Still broken if you see:
```
✗ 404 errors
✗ qtspjotbiyxfmudlywjd.supabase.co (old URL)
✗ "email rate limit exceeded"
```

If still broken, **clear browser cache** or try incognito mode.

---

## 🎯 Fix Email Rate Limits

Once the Vercel config is fixed, also fix the rate limits in Supabase:

1. Go to: https://supabase.com/dashboard/project/mrkemtcddqjpddynmtvg/auth/rate-limits
2. Change **"Rate limit for sending emails"** from `2` to `20`
3. Click **"Save changes"**

---

## ⚡ Quick Test After Fix

### Test 1: Demo Login
```
Email: citizen@demo.com
Password: demo123
```

Should work immediately (no database needed).

### Test 2: Real Signup
Try signing up with a NEW email (not one you tried before).

### Test 3: Check Database
Console should show:
```
[SupabaseDataProvider] DB reports count: <number>
```

Not 404 errors!

---

## 📸 Visual Guide

### Where to Find Environment Variables in Vercel:

```
Vercel Dashboard
  └── Your Project (civic-pulse-gov)
      └── Settings (tab at top)
          └── Environment Variables (sidebar)
              └── NEXT_PUBLIC_SUPABASE_URL (click ⋮ to edit)
              └── NEXT_PUBLIC_SUPABASE_ANON_KEY (click ⋮ to edit)
```

---

## 🆘 Still Not Working?

### Check 1: Verify Vercel Variables
In Vercel → Settings → Environment Variables, you should see:

| Key | Value | Environment |
|-----|-------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | https://mrkemtcddqjpddynmtvg... | Production ✓ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIs... | Production ✓ |

### Check 2: Verify Deployment Used New Variables
In Vercel → Deployments:
- Latest deployment should be AFTER you changed the variables
- Click on deployment → "Environment Variables" tab
- Verify it shows the NEW values

### Check 3: Hard Refresh Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
Or use Incognito/Private mode
```

---

## 🎉 After Fix Works

Once working, you should be able to:
- ✅ Login with demo accounts
- ✅ Sign up new users
- ✅ See issues feed
- ✅ Create new reports
- ✅ All features work

---

**Do this NOW! It takes 2 minutes and will fix everything.**

The issue is NOT in your code - it's just wrong environment variables in Vercel!
