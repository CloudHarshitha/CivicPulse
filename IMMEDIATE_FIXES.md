# 🔥 IMMEDIATE FIXES - Do These 3 Things NOW

## Your Current Issues:
1. ❌ 404 errors on database queries
2. ❌ "email rate limit exceeded" 
3. ❌ Cannot login or register
4. ❌ Production site broken

## Root Cause:
Your **production site (Vercel)** is using the **WRONG Supabase project** credentials.

---

## Fix #1: Update Vercel Environment Variables (2 min)

### Quick Steps:

1. **Open:** https://vercel.com/dashboard
2. **Click** your project: `civic-pulse-gov`
3. **Go to:** Settings → Environment Variables
4. **Edit** `NEXT_PUBLIC_SUPABASE_URL`:
   ```
   From: https://qtspjotbiyxfmudlywjd.supabase.co
   To:   https://mrkemtcddqjpddynmtvg.supabase.co
   ```
5. **Edit** `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ya2VtdGNkZHFqcGRkeW5tdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzYyNjMsImV4cCI6MjEwMTY1MjI2M30.Iyc47wjgguWttJbAiWHWSoRwgSsevRQ-6d_irnuZvQk
   ```
6. **Click** Deployments → Latest deployment → ⋮ → Redeploy
7. **Wait** 30 seconds for deployment

**See detailed guide:** [FIX_VERCEL_ENV.md](./FIX_VERCEL_ENV.md)

---

## Fix #2: Increase Email Rate Limits (1 min)

1. **Open:** https://supabase.com/dashboard/project/mrkemtcddqjpddynmtvg/auth/rate-limits
2. **Change:**
   - "Rate limit for sending emails": `2` → `20`
3. **Click** "Save changes"

---

## Fix #3: Setup Database Trigger (2 min)

1. **Open:** https://supabase.com/dashboard/project/mrkemtcddqjpddynmtvg/sql/new
2. **Copy & Run** this SQL:

```sql
-- Create auto-signup trigger
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

-- Make fields nullable
ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN state DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN district DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN city DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN ward DROP NOT NULL;
```

3. **Verify** it worked:
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Should return: `on_auth_user_created`

---

## ✅ Test After Fixes

### Wait 1-2 minutes for Vercel deployment, then:

1. **Open:** https://civic-pulse-gov.vercel.app
2. **Open** browser console (F12)
3. **Try demo login:**
   ```
   Email: citizen@demo.com
   Password: demo123
   ```

### Success indicators:
```
✓ No 404 errors
✓ auth.user shows user data
✓ Can access dashboard
✓ mrkemtcddqjpddynmtvg.supabase.co (NEW URL)
```

### If still broken:
```
✗ Still see qtspjotbiyxfmudlywjd (old URL)
→ Clear browser cache or use incognito
→ Verify Vercel variables were saved
→ Check latest deployment used new variables
```

---

## 🎯 Priority Order

**Do in this exact order:**

1. ✅ **FIRST:** Fix Vercel environment variables (most important!)
2. ✅ **SECOND:** Increase email rate limits
3. ✅ **THIRD:** Run database trigger SQL
4. ✅ **FOURTH:** Test the site

Total time: **5 minutes**

---

## 💡 Why This Happens

Your **local development** (`.env.local`) has correct credentials:
```
✓ mrkemtcddqjpddynmtvg.supabase.co
```

But **production** (Vercel) still has old credentials:
```
✗ qtspjotbiyxfmudlywjd.supabase.co
```

Local works, production doesn't!

---

## 📊 Quick Comparison

| Environment | Status | URL |
|-------------|--------|-----|
| Local (`npm run dev`) | ✅ Works | mrkemtcddqjpddynmtvg |
| Production (Vercel) | ❌ Broken | qtspjotbiyxfmudlywjd |

**Fix:** Update Vercel to match local!

---

**Start with Fix #1 (Vercel) - that's the biggest issue!**
