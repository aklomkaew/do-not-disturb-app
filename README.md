# Do Not Disturb App

Documentation lives under `docs/`:
- `docs/public-api.md`
- `docs/do-not-disturb-prd.md`

## Backend (Phase 1 scaffold)
Located in `server/` and built with **Express + TypeScript + Prisma**.

### Quick start
1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies (already checked in, but run once if needed):
   ```bash
   cd server && npm install
   ```
3. Generate the Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The API listens on `http://localhost:4000` by default and currently exposes stub endpoints for:
   - `/health`
   - `/api/auth/*`
   - `/api/profile*`
   - `/api/swipes`
   - `/api/matches`
   - `/api/messages`
   - `/api/admin/*`

### Project structure
```
server/
  prisma/schema.prisma   # Domain models: User, Profile, Swipe, Match, Message, Notification
  src/
    app.ts               # Express app factory (helmet, CORS, JSON, routers)
    server.ts            # HTTP bootstrap + env loading
    routes/              # Auth, profile, swipe, matches, messages, admin, health
    middleware/          # Error handler
    services/prisma.ts   # Prisma client instance
    config/env.ts        # Dotenv + Zod validation
```

Next steps (Phases 2-6) will add the mobile clients, OAuth, full feature logic, admin dashboard, and realtime/storage integrations on top of this scaffold.