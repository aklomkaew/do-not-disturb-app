# Product Requirements Document – Do Not Disturb

| Version | Date | Author | Stakeholders |
| --- | --- | --- | --- |
| 0.1 | 2025-12-04 | GPT-5.1 Codex (PM) | CEO, Eng Lead, Design Lead, Data, Trust & Safety |

## 1. Executive Summary
Do Not Disturb (DND) is a swipe-based dating application where users authenticate with Google or Instagram, build expressive profiles, browse other members, and form matches when likes are mutual. The differentiator is intentional quiet time: users can control when and how they are discoverable to reduce notification fatigue while still using familiar dating patterns.

## 2. Objectives & Success Metrics
- **O1** – Launch Android/iOS MVP with <30s onboarding time for 90% of new users.
- **O2** – Achieve Day-7 retention ≥ 35% among activated users.
- **O3** – Maintain >95% uptime for authentication and swipe APIs.
- **O4** – Ensure >90% of likes store successfully and appear in the Matches tab within 5 seconds.

**North Star**: Meaningful matches per weekly active user (target 2.0).  
**Supporting Metrics**: onboarding completion rate, swipe volume/day, match conversion rate, time-to-first-like, abuse reports.

## 3. Non-Goals (v1)
- In-app audio/video calling.
- Monetization layers (subscriptions, boosts) beyond undo swipe setting flag.
- Web client (mobile apps only).
- Third-party integrations besides Google/Instagram auth.

## 4. Personas
1. **The Focused Explorer (primary user)** – 27 y/o professional, wants curated matches without constant interruptions. Goals: fast onboarding, easy browsing, private mode.
2. **The Social Admin** – Internal or contracted moderator managing flagged accounts and verifying photos. Needs review tooling.
3. **The Returning Romantic** – Past user reinstalling; expects previous likes/matches to persist and start right where they left off.

## 5. Experience Principles
- *Intentionality over volume*: encourage thoughtful swipes via limited daily deck sizes.
- *Respect boundaries*: Do Not Disturb schedules reduce noise and boost trust.
- *Transparency*: clearly show when likes are sent, stored, and reciprocated.

## 6. Feature Requirements
### 6.1 Authentication & Roles
- Google or Instagram OAuth sign-in with explicit provider selector.
- User chooses `User` or `Admin` role before redirect; admin attempts require backend allowlist.
- Persist sessions with refresh tokens; auto-logout on role switches.

### 6.2 Profile Creation
- Mandatory steps: gender, age, relationship status, short bio, at least one photo upload.
- Optional prompts (favorite downtime activity, ideal DND scenario) for differentiation.
- Age validation (>=18) and automatic photo moderation queue.
- Profile completion meter; allow resume if app backgrounded.

### 6.3 Browsing & Swipe Deck
- Infinite scroll deck limited to 20 active cards; regen when <5 remain.
- Card displays photo carousel, badges (age, status), micro-bio, DND availability icon.
- Gestures: swipe right (like), left (pass), tap info for expanded details.
- Quick action buttons for accessibility.

### 6.4 Likes Storage & Match Logic
- Every right swipe persists in `Liked` list accessible offline.
- Mutual likes immediately create `Match` records; notify both parties.
- Display timestamp + location context when match happened.

### 6.5 Matches Tab
- Accessible via bottom navigation bar (`Swipe`, `Matches`, `Profile`).
- Segments: `Mutual` (two-way), `Liked You` (incoming likes awaiting response), `You Liked` (outbound likes).
- Cards show avatar, snippet of bio, last activity, and quick CTA to message or keep browsing.
- Messaging CTA now routes into a dedicated `Messages` tab so conversations are always one tap away from the bottom navigation.

### 6.6 Do Not Disturb Mode (Differentiator)
- Users set quiet hours (per weekday/weekend) and choose visibility: `visible`, `ghost` (cannot be shown but can complete onboarding), `auto-reply` (sends courtesy note to new matches).
- Swipes made on a DND user queue until they are visible again.
- Educate users via onboarding tooltip.

### 6.7 Admin Console
- Web-only internal view listing new profiles, flagged content, abuse reports.
- Bulk actions (approve/suspend) and audit trail per profile.
- Role-based access enforced via `admin` login option.

### 6.8 Notifications & Suggestions
- Push notifications for matches, new likes, and admin actions respecting DND settings.
- Encouragement tips ("Complete your profile" or "Three people liked you") limited to 1/day.
- Optional prompt to sync calendar for smarter DND scheduling (stretch goal).

### 6.9 Messaging & Conversations
- Mutual matches unlock threaded messaging (text + emoji, attachments backlog).
- Dedicated `Messages` tab in bottom navigation with inbox-style list, unread badges, and quick filters (All, Unread, Favorites).
- Message composer includes typing indicator, read receipts, and respect for DND settings (sends \"user muted\" banner when appropriate).
- Conversation detail shows profile peek panel with ability to jump back to Swipe or Matches.

## 7. Information Architecture
- **Bottom Nav Tabs**: `Swipe`, `Matches`, `Messages`, `Profile`, plus conditional `Admin`.
- **Swipe Stack**: Feed screen with profile cards, bottom CTA row, status toasts.
- **Messages Tab**: Inbox list → conversation detail views → attachments tray.
- **Profile Tab**: Edit form, DND schedule, account settings, logout.
- **Admin Tab** (role-gated): Table view of profiles + filters.

## 8. User Flows (Happy Paths)
1. **Onboarding**
   1. Launch app → choose login provider → OAuth success.
   2. If new, guided questionnaire collects gender, age, relationship status, bio, photo.
   3. Set DND schedule (optional) → review screen → submit → land on Swipe deck.
2. **Browsing & Matching**
   1. Swipe through cards; likes stored immediately.
   2. On mutual like, toast + push; tap to enter Matches tab.
   3. From Matches tab, user taps \"Message\" to open the Messages tab and continue the conversation thread.
3. **Admin Review**
   1. Admin login → Admin tab.
   2. Filter to "Needs photo verification" → approve or suspend.

## 9. Technical Constraints
- Single backend (Node/TypeScript) exposing REST + WebSocket per API doc.
- Cloud storage for media with signed upload URLs.
- Real-time events delivered via managed pub/sub (Ably, Pusher, or AWS AppSync) with 5s SLA.
- Must comply with GDPR: consent logging, delete-my-data workflow (backlog for v2).

## 10. Launch Plan
| Phase | Scope | Exit Criteria |
| --- | --- | --- |
| Alpha (Internal) | Auth, onboarding, swipe only | 50 employees complete onboarding, <5 Sev-1 bugs |
| Beta (Friends & Family) | Full matches tab, messaging | 200 users, crash-free sessions > 99% |
| GA | Add DND settings, admin console | App store rating ≥4.5, support queue <24h response |

## 11. Risks & Mitigations
- **High drop-off during onboarding** → instrument each step, add progress bar, allow skip photo temporarily.
- **Spam/abuse** → automated image moderation + manual admin workflow, rate limits on likes.
- **OAuth dependency outages** → cache recent tokens, display status page, allow fallback login queue.
- **Privacy concerns with DND visibility** → clear copy and default to visible but notify users when hidden.

## 12. Analytics & Telemetry
- Log funnel events: `auth_success`, `profile_created`, `swipe_right`, `match_created`, `message_sent`.
- Track DND schedule usage to validate differentiator.
- Monitor latency for `/api/swipes` and `/api/matches` (p95 < 300ms).

## 13. Open Questions
1. Should messaging support photos in v1 or wait until abuse tooling matures?
2. Do we limit daily likes to encourage intentional behavior? (e.g., 100/day).
3. Should we expose a "panic button" to hide profile instantly?
4. Are admin logins limited to corporate domains only?

## 14. Appendices
- **Glossary**: DND Window (user-defined quiet period), Mutual Match (two-way like), Ghost Mode (hidden profile state).
- **Dependencies**: Google OAuth, Instagram Basic Display API, Firebase Cloud Messaging (push), CDN for images.

---
This PRD will iterate with design mocks and engineering estimates; future revisions will lock MVP scope before sprint planning.
