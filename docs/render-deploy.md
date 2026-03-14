# Deploy API to Render (Testing)

Use Render's free tier for testing. You can switch to Railway later for production.

> **Note:** Free tier spins down after 15 min idle (~1 min cold start). Fine for testing.

---

## Step 1: Connect GitHub

1. Go to [render.com](https://render.com) and sign up (or log in).
2. **New → Web Service**.
3. Connect your GitHub account and select the `do-not-disturb-app` repo.
4. Choose the **main** branch (or your default branch).

---

## Step 2: Configure the Service

| Field | Value |
|-------|-------|
| **Name** | `do-not-disturb-api` (or any name) |
| **Region** | Choose closest to your users |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run prisma:generate && npm run build` |
| **Start Command** | `npx prisma migrate deploy && node dist/server.js` |

---

## Step 3: Environment Variables

In the Render dashboard, go to **Environment** and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | Leave empty (Render sets it) |
| `DATABASE_URL` | Your **Neon pooled** connection string |
| `JWT_SECRET` | `openssl rand -base64 32` (generate locally) |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 32` (different from above) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `SMS_PROVIDER` | `twilio` (for real SMS). See `docs/twilio-sms-setup.md` |
| `TWILIO_ACCOUNT_SID` | From [Twilio Console](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | From Twilio Console |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number (e.g. `+15551234567`) |
| `EMAIL_PROVIDER` | `mock` (for testing; use `resend` for real email) |
| `SUPABASE_URL` | From Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API |
| `SUPABASE_BUCKET` | `profiles` |
| `GEMINI_API_KEY` | Your Gemini key (optional; AI features need it) |

Copy from `server/.env`. For real SMS verification, you must set `SMS_PROVIDER=twilio` and add the Twilio variables — see `docs/twilio-sms-setup.md`.

---

## Step 4: Deploy

1. Click **Create Web Service**.
2. Render will build and deploy. Watch the **Logs** tab.
3. When complete, your API URL will be: `https://do-not-disturb-api.onrender.com` (or similar).

---

## Step 5: Verify

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
```

Expected: `{"status":"ok"}` or similar JSON.

---

## Step 6: Point Mobile App at Render API

For local testing with the deployed API:
```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://do-not-disturb-api.onrender.com npm start
```

For production builds (EAS), set `EXPO_PUBLIC_API_BASE_URL` as an EAS secret to this URL.

---

## Troubleshooting: "No open ports detected"

1. **Do not set `PORT`** — Render sets it automatically. Remove `PORT` from your Render env vars if you added it.
2. **Check the Logs** — The service may be crashing before it starts. Common causes:
   - `prisma migrate deploy` fails → check `DATABASE_URL` is correct and Neon DB is reachable
   - Missing env vars → JWT_SECRET, SUPABASE_*, etc. must all be set
   - Build failed → ensure Build Command completes; check for TypeScript errors
3. **Start command** must be exactly: `npx prisma migrate deploy && node dist/server.js` (no `npm run`, no `nodemon`).
4. The server binds to `0.0.0.0` so Render can reach it.

---

## Free Tier Limits

- Spins down after **15 min** without traffic.
- First request after idle: ~1 min cold start.
- 750 free hours/month.

---

## Switching to Railway Later

When you're ready for production:
1. Create a Railway project, deploy from the same GitHub repo.
2. Use Root Directory `server`, same env vars.
3. Update `EXPO_PUBLIC_API_BASE_URL` to the new Railway URL.
4. Delete or pause the Render service.

See `docs/deployment-guide.md` for Railway steps.
