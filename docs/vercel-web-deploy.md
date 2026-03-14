# Deploy Web App to Vercel

Deploy the Do Not Disturb web app (Expo) to Vercel so users can access it in a browser. The API stays on Render.

---

## Prerequisites

- [API deployed on Render](render-deploy.md) — `https://do-not-disturb-app.onrender.com` (or your URL)
- GitHub repo connected
- [Vercel account](https://vercel.com) (free)

---

## Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. Click **Add New… → Project**.
3. Import your `do-not-disturb-app` repo from GitHub.
4. **Do not** deploy yet — configure first.

---

## Step 2: Configure the Project

| Field | Value |
|-------|-------|
| **Framework Preset** | Other |
| **Root Directory** | `mobile` |
| **Build Command** | `npx expo export --platform web` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

## Step 3: Environment Variables

In **Settings → Environment Variables** (or during import), add:

| Key | Value | Environments |
|-----|-------|--------------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://do-not-disturb-app.onrender.com` | Production, Preview, Development |

Use your real Render URL if it differs (e.g. `https://YOUR-SERVICE.onrender.com`).

---

## Step 4: Deploy

1. Click **Deploy**.
2. Wait for the build (~2–5 min).
3. Your web app will be available at `https://do-not-disturb-app-xxx.vercel.app` (or your project name).

---

## Step 5: Allow CORS from Vercel

The Render API must accept requests from your Vercel domain.

1. Open [Render Dashboard](https://dashboard.render.com) → your API service → **Environment**.
2. Add or update `CORS_ORIGIN`:
   - For a single origin: `https://do-not-disturb-app-xxx.vercel.app`
   - For multiple origins (production + preview):  
     `https://do-not-disturb-app-xxx.vercel.app,https://do-not-disturb-app-*.vercel.app`
3. Save and wait for the service to redeploy (or trigger **Manual Deploy**).

> **Note:** Wildcards in `CORS_ORIGIN` may not be supported by all CORS implementations. If preview deploys fail with CORS errors, add each preview URL explicitly or use a single production URL for testing.

---

## Step 6: Verify

1. Open your Vercel URL in a browser.
2. You should see the Do Not Disturb login screen.
3. Log in with phone/email; the app will call your Render API.
4. If you see CORS errors in the console, double-check `CORS_ORIGIN` on Render.

---

## URLs Summary

| Service | URL |
|---------|-----|
| **API** (Render) | `https://do-not-disturb-app.onrender.com` |
| **Web app** (Vercel) | `https://do-not-disturb-app-xxx.vercel.app` |

---

## Troubleshooting

### Build fails: "expo: command not found"

- Ensure **Root Directory** is `mobile`.
- The build runs from the `mobile` folder where `expo` is installed.

### Blank page or 404 on refresh

- `vercel.json` should define `rewrites` to `/index.html` for SPA routing.
- Confirm `mobile/vercel.json` exists and is committed.

### CORS errors when logging in

- Add your Vercel URL to `CORS_ORIGIN` on Render.
- Wait for Render to redeploy after env changes.
- Check the browser Network tab for the exact failing request origin.

### API returns 401 or "Session expired"

- The web app and API use different domains, so cookies may not be shared.
- The app uses token-based auth (stored in SecureStore/AsyncStorage), so it should work.
- If issues persist, confirm `EXPO_PUBLIC_API_BASE_URL` is set correctly in Vercel and that the Render API is reachable.

---

## Custom domain (optional)

1. In Vercel: **Settings → Domains**.
2. Add your domain (e.g. `app.donotdisturb.com`).
3. Follow Vercel’s DNS instructions.
4. Add the new domain to `CORS_ORIGIN` on Render.
