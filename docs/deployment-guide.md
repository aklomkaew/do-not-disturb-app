# Deployment Guide: Do Not Disturb App

This guide walks you through deploying the app for real users and scaling it for 500+ users.

---

## Architecture Overview

| Component | Tech | Deployment Target |
|-----------|------|-------------------|
| API Server | Express + Node.js | Railway, Render, or Fly.io |
| Database | PostgreSQL | Neon or Supabase |
| File Storage | Supabase Storage | Already hosted |
| Mobile App | Expo / React Native | EAS Build → App Store, Google Play, Web |

---

## Step 1: Set Up Production Database

### Option A: Neon (Recommended for scale)

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project (e.g. `do-not-disturb-prod`).
3. Copy the **connection string** from the dashboard.
4. For 500+ users, use the **pooled connection string** (it ends with `?sslmode=require` or similar). Neon provides connection pooling by default — important for scaling.

### Option B: Supabase PostgreSQL

1. Go to [supabase.com](https://supabase.com) → your project.
2. Settings → Database → Connection string. Use the **Transaction pooler** URI (port 6543) for connection pooling.

---

## Step 2: Deploy the API Server

### Option A: Railway (Recommended — simple and scalable)

1. **Install Railway CLI** (optional, or use the web UI):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Create a new project** at [railway.app](https://railway.app):
   - New Project → Deploy from GitHub repo
   - Connect your `do-not-disturb-app` repo
   - Select the `server/` directory as the root (or configure Root Directory in settings)

3. **Configure build & start**:
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npx prisma migrate deploy && node dist/server.js`
   - Root Directory: `server`

4. **Add PostgreSQL** (if not using external DB):
   - In project → New → Database → PostgreSQL
   - Railway will set `DATABASE_URL` automatically

5. **Add environment variables** (Railway → your service → Variables):

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Your Neon/Supabase pooled connection string |
   | `JWT_SECRET` | Generate: `openssl rand -base64 32` |
   | `JWT_REFRESH_SECRET` | Generate: `openssl rand -base64 32` |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `30d` |
   | `SMS_PROVIDER` | `twilio` (or `mock` for testing) |
   | `TWILIO_ACCOUNT_SID` | From Twilio console |
   | `TWILIO_AUTH_TOKEN` | From Twilio console |
   | `TWILIO_FROM_NUMBER` | Your Twilio number |
   | `EMAIL_PROVIDER` | `resend` |
   | `RESEND_API_KEY` | From Resend |
   | `EMAIL_FROM_ADDRESS` | Your verified sender |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API |
   | `SUPABASE_BUCKET` | `profiles` |
   | `GEMINI_API_KEY` | From Google AI Studio |

6. **Deploy**: Railway auto-deploys on push to `main`. Get your API URL from the service → Settings → Domains (e.g. `https://do-not-disturb-api.up.railway.app`).

### Option B: Render

1. [render.com](https://render.com) → New → Web Service.
2. Connect GitHub repo, set Root Directory to `server`.
3. Build: `npm install && npm run prisma:generate && npm run build`
4. Start: `npx prisma migrate deploy && node dist/server.js`
5. Add PostgreSQL from Render dashboard (or use external Neon/Supabase).
6. Add all env vars as above.

### Option C: Fly.io

1. Install: `curl -L https://fly.io/install.sh | sh`
2. In `server/` directory:
   ```bash
   fly launch --no-deploy
   ```
3. Attach PostgreSQL: `fly postgres create` or use external.
4. Set secrets: `fly secrets set KEY=value` for each env var.
5. Deploy: `fly deploy`

---

## Step 3: Run Database Migrations

Before the first deploy, run migrations against your production DB:

```bash
cd server
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

Or, if using Railway/Render with DB attached, migrations run automatically from the start command.

---

## Step 4: Configure CORS for Your Domains

The server uses CORS. Ensure your API allows requests from:

- Your web app URL (e.g. `https://do-not-disturb.vercel.app`)
- Expo / EAS hosting URLs
- `localhost` for local dev

Check `server/src/app.ts` — you may need to set `CORS_ORIGIN` or update the `cors()` config for production origins.

---

## Step 5: Deploy the Mobile App

### 5a. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 5b. Configure EAS

In the project root:

```bash
cd mobile
eas build:configure
```

### 5c. Set Production API URL

Create `mobile/.env.production` (or use EAS Secrets):

```
EXPO_PUBLIC_API_BASE_URL=https://your-api-url.railway.app
```

For EAS, set the secret so it’s available at build time:

```bash
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value "https://your-api-url.railway.app"
```

### 5d. Build for Production

**iOS (requires Apple Developer account):**
```bash
eas build --platform ios --profile production
```

**Android:**
```bash
eas build --platform android --profile production
```

**Web (for browser access):**
```bash
npx expo export --platform web
```
Then deploy the `dist/` output to Vercel, Netlify, or any static host.

### 5e. Submit to Stores (optional)

```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## Step 6: Scaling for 500+ Users

### Database

1. **Use connection pooling** — Always use a pooled connection string (Neon, Supabase pooler, or PgBouncer). Prisma can exhaust connections without pooling.
2. **Add indexes** — Ensure indexes on frequently queried columns (e.g. `Match.profileAId`, `Swipe.sourceProfileId`). Run `npx prisma migrate dev` to add them.
3. **Consider read replicas** later if you hit read bottlenecks (Neon and Supabase support this).

### API Server

1. **Horizontal scaling** — Railway, Render, and Fly.io support multiple instances. Increase replicas in the dashboard when traffic grows.
2. **Add rate limiting** — Protect against abuse:
   ```bash
   npm install express-rate-limit
   ```
   Then in `app.ts`:
   ```js
   import rateLimit from 'express-rate-limit';
   app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 req/15min per IP
   ```
3. **Health checks** — Use `/health` for load balancer health checks.

### Mobile / Web

1. **CDN** — Static assets from Expo web build can be served via Vercel/Netlify CDN.
2. **Image optimization** — Supabase Storage can serve resized images; consider adding image variants if needed.

---

## Step 7: Security Checklist

- [ ] Rotate any secrets that were ever committed (JWT, Supabase key, Gemini key, etc.). The `.env.example` must never contain real keys.
- [ ] Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ random bytes).
- [ ] Set `NODE_ENV=production` on the server.
- [ ] Use HTTPS only for the API (Railway/Render/Fly provide this).
- [ ] Restrict Supabase key usage (Row Level Security, storage policies).

---

## Quick Reference: URLs to Update

| Location | What to set |
|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Your production API URL (https) |
| EAS Build secrets | Same URL for mobile builds |
| CORS / `app.ts` | Allow your web and app origins |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Too many connections" | Switch to pooled DB connection string |
| Mobile app can’t reach API | Check CORS, HTTPS, and `EXPO_PUBLIC_API_BASE_URL` |
| Prisma migrate fails | Ensure `DATABASE_URL` is correct and DB is reachable |
| Build fails on Railway | Ensure Root Directory is `server` and build command includes `prisma:generate` |
