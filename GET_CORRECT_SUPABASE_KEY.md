# How to Get the Correct Supabase Key

## Problem
You're currently using a **service role secret key** which cannot be used in browser code.

## Solution
You need the **anon (public) key** instead.

### Steps to Get the Correct Key:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (the one with URL: `rlfmqyfdhlikjxxreknd.supabase.co`)
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **API** under Project Settings
5. Look for the section called **Project API keys**
6. Copy the key labeled **`anon` `public`** (NOT the `service_role` key)
   - It should start with `eyJ...` (a JWT token)
   - It will be much longer than the current key

### Update Your .env File:

Replace the current line in `.env`:
```
VITE_SUPABASE_ANON_KEY=sb_secret_84wHgu-GYEKX9PMnU9mAtA_5SlT9ojJ
```

With:
```
VITE_SUPABASE_ANON_KEY=eyJ... (paste your anon public key here)
```

### After Updating:

1. **Restart the dev server** (stop with Ctrl+C and run `npm run dev` again)
2. **Refresh the browser**
3. Try creating a game again

The anon key is safe to use in browser code and is designed for client-side applications.
