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

## Mobile (Phase 2 scaffold)
Created with **Expo + React Native + React Navigation** under `mobile/`. The current build focuses on wiring the core navigation tabs (Swipe, Matches, Messages, Profile, Admin) and pinging the backend `/health` endpoint so we can validate connectivity before adding auth or data flows.

### Quick start
```bash
cd mobile
npm install          # already run, but safe if dependencies change
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000 npm run start
```
- Set `EXPO_PUBLIC_ENABLE_ADMIN=true` to reveal the admin tab (defaults to hidden).
- The mobile app currently displays placeholder copy on each tab plus an API health banner on the Swipe screen.
- Use the Expo Go app or simulator via `npm run ios` / `npm run android`.

### Mobile structure
```
mobile/
  App.tsx                    # bootstraps fonts + RootNavigator
  src/navigation/RootNavigator.tsx
  src/screens/*              # Placeholder Swipe/Matches/Messages/Profile/Admin views
  src/hooks/useHealthCheck.ts
  src/components/ScreenContainer.tsx, StatusBanner.tsx
  src/constants/config.ts    # Reads EXPO_PUBLIC_API_BASE_URL
```

Next steps (Phases 2-6) will add the mobile clients, OAuth, full feature logic, admin dashboard, and realtime/storage integrations on top of this scaffold.