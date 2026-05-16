# Bugs Logged During Testing - 2026-05-16

## BUG: Google OAuth shows ugly Supabase URL

**Where:** Google sign-in popup
**What user sees:** "Sign in to continue to aqcreatryuvuuynwvnqy.supabase.co"
**Expected:** "Sign in to continue to simplifii-os.app" or "Simplifii-OS"
**Root cause:** Supabase project URL is the default random string. Google OAuth consent screen shows the redirect domain.
**Fix required:** 
1. Add custom domain to Supabase project (Settings > Custom Domains)
2. OR update Google OAuth consent screen in Google Cloud Console:
   - Go to APIs and Services > OAuth consent screen
   - Update "Application name" to "Simplifii-OS"
   - Update "Authorized domains" to include your production domain
   - The "continue to" text comes from the redirect_uri domain
3. In Supabase Dashboard > Authentication > URL Configuration:
   - Set Site URL to: https://simplifii-os-main.vercel.app
   - Set Redirect URLs to include production domain
**Effort:** 15 min (Google Cloud Console + Supabase dashboard config)
**Priority:** P1 (unprofessional first impression)

## BUG: Onboarding questions should not be behind Google login

**Where:** First-time user flow
**What user sees:** Must sign in with Google BEFORE seeing onboarding questions
**Expected:** Onboarding questions (year level, etc.) should start immediately. Google auth can happen after or during.
**Root cause:** App architecture requires auth before ANY content loads (RequireAuth wrapper in index.js)
**Fix options:**
1. Move onboarding BEFORE auth (allow anonymous onboarding, link to account after)
2. Keep auth first but make Google popup less prominent (email magic link as primary)
3. Show a "preview" of onboarding before requiring sign-in
**Effort:** 2-4 hours (architectural change to auth flow)
**Priority:** P1 (friction at the door)

## STATUS: Logged for next session. Not fixing now (P0 architecture fixes in progress).
