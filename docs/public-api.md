# Do Not Disturb – Public API, Functions, and Component Guide

> **Audience**: frontend engineers, mobile engineers, backend engineers, QA, and partner integrators.  
> **Version**: v0.1 (Dec 2025)

This document enumerates the public APIs, service functions, and UI components that compose the **Do Not Disturb** dating app. Each section describes the contract, validation rules, and example interactions so integrators can build clients or automate testing without reverse engineering source code.

---

## 1. Domain Models

| Model | Description | Key Fields |
| --- | --- | --- |
| `User` | Authenticated identity from Google or Instagram. | `id`, `email`, `role` (`user` \| `admin`), `createdAt`, `lastLoginAt` |
| `Profile` | Dating persona tied 1:1 with a `User`. | `id`, `userId`, `displayName`, `gender`, `age`, `relationshipStatus`, `bio`, `media` (array of URLs), `preferences`, `location` |
| `Swipe` | One directional intent from a profile. | `id`, `sourceProfileId`, `targetProfileId`, `direction` (`right` \| `left`), `createdAt` |
| `Match` | Pair of profiles with mutual likes. | `id`, `profileAId`, `profileBId`, `createdAt`, `lastInteractionAt`, `channelId` |
| `Message` | Conversation artifact between matched profiles. | `id`, `matchId`, `senderProfileId`, `text`, `attachments`, `sentAt`, `readAt` |
| `Notification` | Delivered when someone likes or matches. | `id`, `profileId`, `type`, `payload`, `readAt` |

All timestamps are ISO 8601 strings in UTC. IDs are ULIDs to guarantee sortable uniqueness.

---

## 2. Authentication APIs

### 2.1 POST `/api/auth/login`
Initiates OAuth with the selected provider.

**Body**
```json
{
  "provider": "google",
  "idToken": "<oauth-id-token>",
  "role": "user"
}
```
- `provider`: `google` \| `instagram`
- `role`: `user` \| `admin` (admins get elevated console access)

**Response 201**
```json
{
  "user": {
    "id": "01HHZ52VGF9J2T0Z2X7T6HB8NQ",
    "email": "me@example.com",
    "role": "user"
  },
  "profileStatus": "needs_profile" | "complete",
  "session": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 3600
  }
}
```

### 2.2 POST `/api/auth/refresh`
Refreshes tokens using a valid refresh token.

```http
POST /api/auth/refresh
Authorization: Bearer <refreshToken>
```

Returns a new access token pair. 401 when the refresh token is revoked.

### 2.3 POST `/api/auth/logout`
Revokes both access and refresh tokens. Idempotent.

---

## 3. Profile APIs

### 3.1 GET `/api/profile/me`
Returns the caller's profile (or 404 if not created).

### 3.2 POST `/api/profile`
Creates a new profile for first-time users. Repeat calls replace the previous record iff `force=true` query parameter is provided by an admin.

**Body**
```json
{
  "displayName": "Jordan",
  "gender": "non-binary",
  "age": 29,
  "relationshipStatus": "single",
  "bio": "Traveler + foodie",
  "media": ["https://cdn.example.com/img/abc.jpg"],
  "preferences": {
    "ageMin": 25,
    "ageMax": 35,
    "showGenders": ["female", "non-binary"]
  }
}
```
Validation:
- `age` must be 18 – 120.
- `media` accepts up to 6 images.
- `bio` limited to 500 characters.

### 3.3 PATCH `/api/profile`
Supports partial updates. Only editable fields may be provided. Use ETag header to avoid race conditions.

### 3.4 GET `/api/profiles`
Catalog endpoint backing the swipe deck.

| Query Param | Type | Notes |
| --- | --- | --- |
| `cursor` | string | ULID cursor for pagination |
| `limit` | int | default 20, max 50 |
| `gender` | string | Optional filter |
| `ageMin/ageMax` | int | Overrides preference defaults |

**Response** returns `items`, `nextCursor`, and `deckSeed` used by the `SwipeDeck` component to preserve order.

---

## 4. Swipe & Interaction APIs

### 4.1 POST `/api/swipes`
Records a swipe action.

```json
{
  "targetProfileId": "01HHZ6KBSY0T8DR0T4GWT5N4W8",
  "direction": "right",
  "deckSeed": "2025-12-04T10:00:00Z",
  "position": 4
}
```

Responses:
- `201` with `{ "match": true, "matchId": "..." }` when the other profile already liked back.
- `200` with `{ "match": false }` for non-mutual swipes.
- `409` when swiping own profile or repeating the same direction.

### 4.2 DELETE `/api/swipes/{swipeId}`
Allows undo within 10 minutes (premium feature toggleable via config flag `features.undoSwipe`).

---

## 5. Matches & Messaging APIs

### 5.1 GET `/api/matches`
Returns matches for the authenticated profile. Supports filtering by `since`, `hasUnread`, and pagination via `cursor`.

### 5.2 GET `/api/matches/{matchId}`
Detailed view, including conversation metadata.

### 5.3 GET `/api/matches/{matchId}/messages`
Returns paginated conversation history scoped to a single match. Supports query params `cursor`, `direction=older|newer`, and `limit` (default 50).

### 5.4 POST `/api/matches/{matchId}/messages`
Creates a text message inside the secure channel. Supports emoji + image attachments (<=5 MB).

Usage example:
```http
POST /api/matches/01HHZ8GV23V3NZS8EJXV6WR2NG/messages
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "text": "Hey! Drinks this week?",
  "attachments": []
}
```

Only mutual matches may call this endpoint; attempts from non-matched profiles return `403`. Messages automatically surface inside the dedicated `Messages` tab so users can jump directly from the bottom navigation bar into any ongoing conversation.

### 5.5 GET `/api/messages`
Inbox-style endpoint powering the `Messages` tab. Returns the latest message per match (thread preview), unread counts, and last activity timestamps so the UI can render conversation lists without fetching each match individually.

---

## 6. Notification & Realtime APIs

- **Webhooks**: `POST https://partner.example.com/dnd/webhooks` for enterprise partners. Events include `like.created`, `match.created`, `message.created`.
- **WebSocket**: `wss://api.do-not-disturb.app/realtime`
  - Subscribe payload: `{ "type": "subscribe", "channels": ["profile:<id>"] }`
  - Events push likes, matches, unread counts.

---

## 7. Admin APIs

| Endpoint | Verb | Description |
| --- | --- | --- |
| `/api/admin/profiles` | GET | Query profiles with filters: `flagged`, `createdAt`, `hasMedia`, `role` |
| `/api/admin/profiles/{id}` | DELETE | Force removes a user profile plus its swipe history (soft-delete with 30-day retention) |
| `/api/admin/profiles/{id}/moderate` | POST | Takes action (`suspend`, `approve`, `request_changes`) |
| `/api/admin/metrics/dau` | GET | Returns daily active numbers, likes per day, match rate |
| `/api/admin/stats` | GET | Aggregated stats: total users, gender split, relationship status counts, likes sent per day, matches per profile |

Admins must pass `X-Admin-Role: superuser` header or belong to `admin` role in the JWT claims. Additionally, backend enforces an allowlisted email roster; the initial list contains `aklomkaew@gmail.com` and will expand via secure config. All admin endpoints reject requests from accounts not in the allowlist even if they possess the `admin` role.

### 7.1 `GET /api/admin/stats` Response Example
```json
{
  "totals": {
    "users": 12500,
    "male": 6100,
    "female": 5800,
    "nonBinary": 600
  },
  "relationshipStatus": {
    "single": 9000,
    "open": 2000,
    "complicated": 1500
  },
  "likesSent": {
    "total": 220000,
    "perProfileMedian": 18
  },
  "matchesPerProfile": {
    "average": 4.2,
    "p95": 15
  }
}
```
Stats are eventually consistent (5-minute lag) and sourced from the analytics warehouse.

---

## 8. Client Functions & Hooks

| Function / Hook | Purpose | Key Parameters / Returns |
| --- | --- | --- |
| `useAuth()` | Manages login/logout state, token refresh. | Returns `{ user, login(provider, role), logout(), isLoading }` |
| `useProfile()` | Fetch + mutate the current profile. | Returns `{ profile, createProfile(data), updateProfile(patch) }` |
| `useSwipeActions()` | Wraps `/api/swipes`. | `{ swipeRight(targetId), swipeLeft(targetId), undoLastSwipe() }` |
| `useMatches()` | Fetch matches and subscribe to realtime updates. | `{ matches, fetchMore(), sendMessage(matchId, payload) }` |
| `useRealtimeChannel(channel)` | Lightweight wrapper for the WebSocket client with auto-reconnect. |
| `useMessages()` | Dedicated messaging data source backing the Messages tab. | `{ threads, openThread(matchId), sendMessage(matchId, payload), unreadCount }` |

### Example: consuming `useSwipeActions`
```tsx
const SwipeButtons: React.FC<{ targetId: string }> = ({ targetId }) => {
  const { swipeRight, swipeLeft, undoLastSwipe } = useSwipeActions();

  return (
    <ButtonRow>
      <GhostButton onPress={() => swipeLeft(targetId)}>Pass</GhostButton>
      <PrimaryButton onPress={() => swipeRight(targetId)}>Like</PrimaryButton>
      <IconButton icon="undo" onPress={undoLastSwipe} disabled={!undoLastSwipe.canUndo} />
    </ButtonRow>
  );
};
```

---

## 9. UI Components

### 9.1 `ProfileWizard`
Guides new users through onboarding questions.

| Prop | Type | Description |
| --- | --- | --- |
| `onComplete` | `(profile: Profile) => void` | Fired once profile creation succeeds |
| `initialValues` | `Partial<Profile>` | Prefills answers when user resumes |
| `requirePhoto` | `boolean` | Optional override per market |

Usage:
```tsx
<ProfileWizard
  initialValues={{ displayName: "Sam" }}
  onComplete={(profile) => navigation.navigate('SwipeDeck')}
  requirePhoto
/>
```

### 9.2 `SwipeDeck`
Renders stacked cards with swipe gestures.

- Props: `profiles`, `onSwipe(direction, profileId)`, `deckSeed`, `isLoading`.
- Emits `onDeckEmpty()` for triggering refetch.

### 9.3 `ProfileCard`
Reusable card showing photos + metadata. Accepts `renderBadges` render prop for experiments.

### 9.4 `MatchesTab`
Bottom-tab screen showing `Liked`, `Mutual`, and `Conversations` segments. Consumes `useMatches()` under the hood.

### 9.5 `BottomNavBar`
Configuration-driven component defining the default tabs: `Swipe`, `Matches`, `Messages`, `Profile`. Accepts an optional `Admin` tab for elevated users and supports market-specific reordering flags.

### 9.6 `MessagesTab`
Standalone conversations surface reachable directly via bottom navigation (`Swipe`, `Matches`, `Messages`, `Profile`, plus optional `Admin`). Displays list of mutual matches with unread indicators, opens threaded chat powered by `useMessages()`, and exposes quick actions (mute conversation, jump to profile).

Each component is exported from `@dnd/ui` and is tree-shakeable.

---

## 10. Data Integrity & Error Model

- Errors follow RFC 7807 format: `{ "type": "https://docs.dnd.app/errors/validation", "title": "Validation Error", "detail": "Age must be >= 18", "fields": { "age": "too_young" } }`.
- Rate limits: 60 write calls/minute per profile, 600 reads/minute.
- Idempotency: All POST endpoints accept `Idempotency-Key` header.

---

## 11. Usage Playbooks

1. **First-time login + profile creation**
   - Call `/api/auth/login`.
   - If `profileStatus === "needs_profile"`, show `ProfileWizard` and POST `/api/profile`.
   - Transition to `SwipeDeck` once profile exists.

2. **Swiping loop**
   - Prefetch `GET /api/profiles?limit=20`.
   - Feed list into `SwipeDeck` and relay gestures to `/api/swipes`.
   - On match, navigate to `MatchesTab`, then allow the user to tap into the `MessagesTab` for the dedicated chat thread.

3. **Admin review**
   - Admin logs in with role `admin`.
   - Use `/api/admin/profiles` with filters to inspect flagged accounts.
   - Call `/api/admin/profiles/{id}/moderate` to suspend or request edits.
   - Pull `/api/admin/stats` for top-line numbers before weekly reporting.
   - Use `DELETE /api/admin/profiles/{id}` when Trust & Safety requires full removal.

---

## 12. Versioning & Change Management

- Each breaking change increments `X-API-Version` header (current `2025-12-01`).
- Client SDKs expose `getApiVersion()` to help emit telemetry when mismatches happen.
- Changelog lives at `/docs/changelog.md` (TBD once codebase grows).

---

## 13. Testing Recommendations

- Use the `sandbox` environment (`https://sandbox.api.do-not-disturb.app`).
- Seed test users via `/api/admin/profiles` with `role=admin`.
- Simulate mutual matches by swiping from two sandbox devices.

---

Future updates will attach specific schema diagrams once the persistence layer ships. For now this guide is the authoritative contract for any integration work.
