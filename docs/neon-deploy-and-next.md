# Neon Deploy Config + What's Next

## Step 1: Verify Neon Is Configured Correctly

Run these in order:

```bash
cd server
```

### 1.1 Test database connection
```bash
npx prisma db execute --stdin <<< "SELECT 1 as ok"
```
**Pass:** No errors. You may see output or "Command successfully executed."

### 1.2 Check migrations
```bash
npx prisma migrate status
```
**Pass:** `Database schema is up to date` (or all migrations applied).

### 1.3 Start server + health check
```bash
npm run dev
```
In another terminal:
```bash
curl http://localhost:4000/health
```
**Pass:** Returns JSON (e.g. `{"status":"ok"}`).

### 1.4 Confirm pooled connection
Open `server/.env` and verify `DATABASE_URL` host contains **`-pooler`**:
```
ep-xxx-pooler.region.aws.neon.tech
```
**Pass:** Uses pooled connection for scalability.

---

## Step 2: What's Next — Deploy So Others Can Use It

Right now the app runs only on your machine. To make it accessible to real users:

### 2.1 Deploy the API

**Testing:** Use **Render** — see `docs/render-deploy.md` for step-by-step.

**Production (later):** Use **Railway** — see `docs/deployment-guide.md`.

| Platform | Use case | Quick action |
|----------|----------|--------------|
| **Render** | Testing (free, spins down when idle) | `docs/render-deploy.md` |
| **Railway** | Production (always on, no cold starts) | New Project → Root: `server` → Add env vars |
| **Fly.io** | Production (global edge) | `fly launch` in `server/` |

Set these env vars in the host's dashboard:
- `DATABASE_URL` ← Your Neon pooled connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` ← Generate with `openssl rand -base64 32`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` ← From your Supabase project
- `GEMINI_API_KEY` ← If using AI features
- Plus Twilio, Resend, etc. if using SMS/email

### 2.2 Point the mobile app at the deployed API

When building for production:
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-api-url.railway.app
```
Set this as an EAS secret or in your build config so the app calls your deployed API, not localhost.

### 2.3 Optional: Publish the app

- **iOS/Android:** Use EAS Build → Submit to App Store / Google Play
- **Web:** `npx expo export --platform web` → Deploy `dist/` to Vercel, Netlify, etc.

---

## Summary

| Done? | Task |
|-------|------|
| ☐ | Neon connection string in `server/.env` (pooled) |
| ☐ | `npx prisma migrate deploy` |
| ☐ | `curl localhost:4000/health` works |
| ☐ | Deploy API to Railway / Render / Fly.io |
| ☐ | Set `EXPO_PUBLIC_API_BASE_URL` for production builds |
| ☐ | Build & ship mobile app (EAS) or web |

Full deployment details: `docs/deployment-guide.md`
