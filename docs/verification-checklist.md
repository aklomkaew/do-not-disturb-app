# Verification Checklist: Neon, Scalability & Accessibility

Use this checklist to confirm your app is configured correctly and ready for real users.

---

## Part 1: Verify Neon Database Connection

### 1.1 Local connection test

```bash
cd server
npx prisma db execute --stdin <<< "SELECT 1 as ok"
```

**Expected:** Output shows `ok: 1` (or similar). No errors.

### 1.2 Schema & migrations

```bash
cd server
npx prisma migrate status
```

**Expected:** "Database schema is up to date" or lists applied migrations.

### 1.3 Prisma Studio (optional visual check)

```bash
cd server
npx prisma studio
```

Open http://localhost:5555 — you should see your tables (User, Profile, Swipe, Match, etc.). Create a test record if you like.

### 1.4 API health + DB via server

```bash
cd server
npm run dev
```

In another terminal:
```bash
curl http://localhost:4000/health
```

**Expected:** `{"status":"ok"}` (or similar). If the server starts and responds, Prisma can connect to Neon.

---

## Part 2: Verify Scalability (500+ Users)

### 2.1 Connection string uses pooling

Your `DATABASE_URL` host should contain **`-pooler`**:

```
ep-xxx-pooler.region.aws.neon.tech
```

**Without pooling:** Each request can open a new DB connection → hits PostgreSQL `max_connections` limit as users grow.

### 2.2 Neon dashboard check

1. Go to [console.neon.tech](https://console.neon.tech) → your project
2. **Settings → General** — Note compute size. Free tier is fine to start; Scale plan supports more connections.
3. **Monitoring** — After traffic, check connections and query performance.

### 2.3 Rate limiting enabled

Confirm `server/src/app.ts` uses `express-rate-limit` when `NODE_ENV=production`. Protects against abuse and DoS.

---

## Part 3: Verify Accessibility by Other Users

For others to use your app, the **API must be publicly reachable** and the **mobile app must point to it**.

### 3.1 API must be deployed (not just localhost)

| Environment | Accessible by |
|-------------|---------------|
| `localhost:4000` | Only you on your machine |
| Deployed (Railway, Render, Fly.io) | Anyone with the URL |

**Check:** Your API has a public URL like `https://your-app.up.railway.app`.

### 3.2 Test API from another device/network

From your phone or another computer:
```bash
curl https://YOUR-API-URL/health
```

**Expected:** JSON response. If it fails, the API is not reachable (firewall, wrong URL, or not deployed).

### 3.3 Mobile app uses production API

The mobile app reads `EXPO_PUBLIC_API_BASE_URL`. For production builds:

- **EAS build:** Set `EXPO_PUBLIC_API_BASE_URL` as an EAS secret or in `app.config.js` for production.
- **Web:** Set it when building (`EXPO_PUBLIC_API_BASE_URL=https://... npx expo export --platform web`).

**Check:** Built app calls your production API URL, not localhost.

### 3.4 CORS allows your frontend

If you have a web app, ensure `CORS_ORIGIN` (or your CORS config) includes your frontend URL. Otherwise browsers will block requests.

---

## Quick Summary

| Check | Command / Action | Pass? |
|-------|------------------|-------|
| Neon connects | `npx prisma db execute --stdin <<< "SELECT 1"` | □ |
| Migrations applied | `npx prisma migrate status` | □ |
| Server starts | `npm run dev` then `curl localhost:4000/health` | □ |
| Pooled connection | `DATABASE_URL` contains `-pooler` | □ |
| API deployed | Has `https://` URL (Railway/Render/Fly) | □ |
| API reachable | `curl https://YOUR-API/health` from phone/other network | □ |
| Mobile points to prod | `EXPO_PUBLIC_API_BASE_URL` = production URL in build | □ |

---

## Common Issues

| Problem | Fix |
|---------|-----|
| "Connection refused" or timeout | API not deployed, or wrong URL. Deploy to Railway/Render/Fly. |
| "Too many connections" | Switch to pooled connection string (`-pooler` in host). |
| Mobile app can't reach API | Set `EXPO_PUBLIC_API_BASE_URL` for production builds. |
| CORS errors in browser | Add your web app URL to `CORS_ORIGIN` on the server. |
