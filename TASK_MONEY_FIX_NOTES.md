# Task Money runtime and admin fixes

## Supabase environment variables
Set these in Vercel Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The server client also accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as a fallback.

## Changes

- Unified both Supabase server-client imports so pages no longer depend on different environment-key names.
- Added a page error boundary with a reload action and an error reference.
- Admin navigation remains visible on every `/admin` route.
- Rebuilt Create Task into six complete sections.
- Task creation retries with the core task schema if optional UI columns have not yet been added.
