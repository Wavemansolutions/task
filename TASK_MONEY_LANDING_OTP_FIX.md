# Task Money landing page and SMS OTP fix

## Changes

- `app/page.tsx` is the default landing page at `/`.
- Replaced unsupported `FiWallet` with `FiCreditCard`.
- Removed the inactive mobile-menu button.
- Improved `app/login/page.tsx` so literal `{}` errors are replaced with a useful message.
- Kept Supabase phone OTP signup/sign-in flow.
- Improved KudiSMS response rejection detection.
- Production cannot use development SMS mode because it requires `NODE_ENV !== production`.

## Required production environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SEND_SMS_HOOK_SECRET=...
KUDISMS_API_URL=https://my.kudisms.net/api/sms
KUDISMS_API_KEY=...
KUDISMS_SENDER_ID=YOUR_APPROVED_SENDER_ID
SMS_DEVELOPMENT_MODE=false
```

After changing Vercel variables, redeploy.

## Checks performed

`tsc --noEmit` completed successfully. A full Next.js build could not be completed in the workspace because the Linux SWC package was unavailable from the internal package mirror.
