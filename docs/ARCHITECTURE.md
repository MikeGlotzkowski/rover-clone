# Architecture - Rover Clone MVP

## Overview

Simple monorepo with Next.js frontend and Express backend. Prioritizes speed and simplicity.

```
rover-clone/
├── packages/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── docs/             
└── package.json      # Workspace root
```

---

## Backend (API)

### Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: SQLite (file-based, zero setup)
- **ORM**: **Drizzle** (lighter than Prisma, better DX for small projects)
- **Auth**: JWT access tokens (no refresh tokens for MVP)
- **Validation**: **Zod** (type-safe schema validation)
- **File Uploads**: **Multer** + local disk storage (public/uploads)
- **Email**: **Resend** (simple API, free tier sufficient for MVP)

### Why These Choices?

| Decision | Rationale |
|----------|-----------|
| SQLite | Zero setup, perfect for MVP. Migrate to Postgres only if needed. |
| Drizzle | Lighter than Prisma, faster iteration, great TypeScript support. |
| Zod | Shares types with frontend, catches errors early. |
| Multer | Simple, battle-tested file uploads. No cloud storage needed yet. |
| Resend | Clean API, better deliverability than nodemailer, generous free tier. |

---

### API Routes

```
Authentication
POST   /api/auth/register       # Create account
POST   /api/auth/login          # Get JWT token
GET    /api/auth/me             # Get current user (requires auth)

Users & Profiles
GET    /api/users/:id           # View user profile
PUT    /api/users/:id           # Update profile (requires auth + ownership)

Pets
POST   /api/pets                # Add pet (requires auth)
GET    /api/pets                # List my pets (requires auth)
PUT    /api/pets/:id            # Update pet (requires auth + ownership)
DELETE /api/pets/:id            # Delete pet (requires auth + ownership)

Providers
POST   /api/providers           # Create provider profile (requires auth)
GET    /api/providers           # Search providers (public)
                                # Query params: location, service, startDate, endDate
GET    /api/providers/:id       # View provider profile (public)
PUT    /api/providers/:id       # Update provider profile (requires auth + ownership)
POST   /api/providers/:id/photos  # Upload photos (requires auth + ownership)

Bookings
POST   /api/bookings            # Create booking request (requires auth)
GET    /api/bookings            # List my bookings (requires auth)
                                # Query param: role=owner|provider
GET    /api/bookings/:id        # View booking details (requires auth + involvement)
PATCH  /api/bookings/:id/status # Accept/decline/cancel (requires auth + involvement)
                                # Body: { status: 'CONFIRMED' | 'CANCELLED', message?: string }

Reviews
POST   /api/reviews             # Leave review (requires auth + completed booking)
GET    /api/providers/:id/reviews  # List provider reviews (public)
```

---

### Data Models

```typescript
// User
{
  id: string (uuid)
  email: string (unique)
  passwordHash: string
  name: string
  phone: string
  location: string              // Free text: "Brooklyn, NY" or "90210"
  role: 'OWNER' | 'PROVIDER'    // Single role for MVP (no BOTH)
  createdAt: Date
}

// Pet
{
  id: string (uuid)
  ownerId: string (fk -> User)
  name: string
  breed: string
  size: 'SMALL' | 'MEDIUM' | 'LARGE'
  age: number
  specialNeeds?: string          // Optional notes
  createdAt: Date
}

// ProviderProfile (1:1 with User where role=PROVIDER)
{
  id: string (uuid)
  userId: string (fk -> User, unique)
  bio: string
  servicesOffered: string[]      // JSON array: ['BOARDING', 'WALKING']
  boardingPricePerNight?: number // In cents
  walkingPricePerHour?: number   // In cents
  boardingCapacity?: number      // Max pets at once
  walkingRadius?: number         // Miles
  photos: string[]               // JSON array of file paths
  createdAt: Date
  updatedAt: Date
}

// Booking
{
  id: string (uuid)
  ownerId: string (fk -> User)
  providerId: string (fk -> User)
  petIds: string[]               // JSON array
  serviceType: 'BOARDING' | 'WALKING'
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  
  // Boarding fields
  startDate?: Date
  endDate?: Date
  
  // Walking fields
  walkDate?: Date
  walkDuration?: number          // Minutes: 30 or 60
  
  notes?: string                 // Owner instructions
  totalPrice: number             // In cents
  
  createdAt: Date
  updatedAt: Date
}

// Review
{
  id: string (uuid)
  bookingId: string (fk -> Booking, unique)
  providerId: string (fk -> User)
  ownerId: string (fk -> User)
  rating: number                 // 1-5
  text: string
  createdAt: Date
}
```

### Key Implementation Details

#### Authentication
- **Password hashing**: bcrypt with 10 rounds
- **JWT tokens**: Sign with HS256, expire in 7 days
- **Middleware**: `requireAuth` extracts JWT from `Authorization: Bearer <token>`
- **No refresh tokens** for MVP (users re-login after 7 days)

#### File Uploads
- **Provider photos**: Max 5 photos, 5MB each, JPEG/PNG only
- **Storage**: `packages/api/public/uploads/providers/:userId/:filename`
- **Validation**: Zod schema + Multer file filter
- **Serving**: Express static middleware on `/uploads`

#### Search Logic (Keep It Simple)
For MVP, **text-based location matching**:
- Search by `location` field (substring match)
- Filter by `serviceType` 
- Filter by date range (check if provider has conflicting bookings)

**No geolocation for MVP** - users type "Brooklyn" or "90210", we do text match.
Post-MVP: Add lat/long and use PostGIS or external geocoding API.

#### Email Notifications
Send emails on these events:
1. **Booking created** → Provider receives request
2. **Booking confirmed** → Owner receives confirmation
3. **Booking cancelled** → Both parties notified

**Email templates**: Keep plain text for MVP, use HTML later.

#### Error Handling
- **Validation errors**: Return 400 with Zod error details
- **Auth errors**: Return 401 (missing token) or 403 (forbidden)
- **Not found**: Return 404
- **Server errors**: Return 500, log full error

Global Express error handler middleware.

#### Database Migrations
- Use **Drizzle Kit** for migrations
- Migration files in `packages/api/migrations/`
- Run migrations on server start (simple for SQLite MVP)

---

## Frontend (Web)

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: **shadcn/ui** (copy-paste components, no bloat)
- **Forms**: **React Hook Form** + Zod validation
- **HTTP**: Native `fetch` with wrapper utilities
- **State**: React hooks + Context (no Zustand/Redux for MVP)
- **Date Picker**: **react-day-picker** (for booking dates)

### Why These Choices?

| Decision | Rationale |
|----------|-----------|
| shadcn/ui | Modern, customizable, no runtime bloat. Fast to implement. |
| React Hook Form | Best form performance, works seamlessly with Zod. |
| Native fetch | One less dependency. Wrap in `lib/api.ts` for error handling. |
| No global state library | Context is enough for auth + user data. Keep it simple. |

---

### Pages & Routes

```
Public
/                          # Landing page (hero + CTA)
/login                     # Login form
/register                  # Register (choose role: owner or provider)
/search                    # Search providers (filters: location, service, dates)
/providers/[id]            # Provider profile + booking CTA

Owner Dashboard
/dashboard                 # My bookings (upcoming/past)
/dashboard/pets            # Manage pets (CRUD)
/book/[providerId]         # Booking flow (select pet, dates, confirm)

Provider Dashboard
/provider/dashboard        # My bookings calendar
/provider/profile          # Edit profile (bio, photos, pricing, services)
```

### Component Structure (Suggested)

```
components/
├── ui/                    # shadcn/ui components (Button, Input, Card, etc.)
├── layout/
│   ├── Navbar.tsx
│   └── Footer.tsx
├── auth/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── providers/
│   ├── ProviderCard.tsx
│   ├── ProviderProfile.tsx
│   └── SearchFilters.tsx
├── bookings/
│   ├── BookingCard.tsx
│   ├── BookingForm.tsx
│   └── BookingCalendar.tsx
└── pets/
    └── PetForm.tsx
```

### State Management

**Auth Context** (`contexts/AuthContext.tsx`):
- Store current user + JWT token
- Persist token in `localStorage`
- Provide `login()`, `logout()`, `register()` functions
- Fetch `/api/auth/me` on mount to restore session

**No other global state needed** - fetch data per page, pass props down.

---

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Setup database
cd packages/api
npx drizzle-kit generate
npx drizzle-kit migrate

# Start dev servers (concurrent)
npm run dev          # Root command runs both
```

### Project Scripts (Root `package.json`)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w api\" \"npm run dev -w web\"",
    "build": "npm run build -w api && npm run build -w web",
    "start": "npm run start -w api",
    "lint": "eslint packages/**/src",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Deployment Strategy (MVP)

### Option 1: Single VPS (Simplest)
- **Host**: DigitalOcean droplet ($6/month) or Hetzner
- **Setup**: PM2 for process management, Caddy for HTTPS
- **Files**: SQLite DB + uploads on disk, backup to S3 nightly
- **Cost**: ~$10/month total

### Option 2: Serverless-ish
- **Frontend**: Vercel (free tier)
- **Backend**: Railway or Render ($5-10/month)
- **Files**: Upload to S3/R2 instead of local disk
- **Database**: SQLite on persistent volume or migrate to Postgres

**Recommendation for MVP**: Start with Option 1 (VPS). Easier debugging, no cold starts, full control.

---

## Deferred to Post-MVP

These features are intentionally excluded to ship faster:

### ❌ Not in MVP
- **Payments**: Use offline payment initially (Venmo, cash). Add Stripe later.
- **Messaging**: Use email notifications + phone numbers. In-app chat is complex.
- **Advanced search**: No map view, no radius search. Text location only.
- **Provider availability calendar**: Implicit (check conflicting bookings).
- **Multi-pet discounts**: Fixed pricing only.
- **Dual-role users**: Force users to pick owner OR provider (simplifies UX/DB).
- **Photo galleries**: Limit to 5 photos, no carousel/lightbox (use simple grid).
- **Real-time notifications**: Email only. No WebSockets.

### ✅ In MVP (P0)
- Registration (owner or provider, one role)
- Profile management (users, pets, providers)
- Search providers (text location, service type, date range)
- Create booking requests
- Accept/decline bookings
- View bookings (owner and provider dashboards)
- Basic email notifications

### 📋 P1 (Next Phase)
- Cancel bookings
- Leave reviews
- View reviews on profiles
- Simple payment integration (Stripe checkout link)

---

## Testing Strategy (Minimal but Effective)

For MVP, focus on **integration tests** over unit tests:

### Backend
- **Tool**: Supertest + Vitest
- **Coverage**: One test per API route (happy path)
- **Auth flows**: Register, login, protected routes
- **Run**: `npm test -w api`

### Frontend
- **Tool**: Playwright (E2E)
- **Coverage**: Critical flows only:
  - Register as owner → add pet → search → book
  - Register as provider → setup profile → accept booking
- **Run**: `npm run test:e2e -w web`

**No unit tests for MVP** - too slow, low ROI. Focus on E2E flows.

---

## Security Checklist

- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] JWT tokens validated on every protected route
- [ ] Input validation with Zod on all API endpoints
- [ ] SQL injection prevented (Drizzle uses parameterized queries)
- [ ] File upload validation (size, type, quantity)
- [ ] Rate limiting on auth endpoints (express-rate-limit)
- [ ] CORS configured for frontend origin only
- [ ] HTTPS enforced in production (Caddy handles this)
- [ ] Environment variables for secrets (JWT_SECRET, DB_PATH)

---

## Open Questions / Decisions Needed

1. **Payment MVP approach**: 
   - Option A: Manual coordination (phone/Venmo), no payment processing
   - Option B: Simple Stripe checkout link (no refunds, just redirect)
   
2. **Provider onboarding**:
   - Should providers be manually approved before appearing in search?
   - Or auto-approve and moderate reactively?

3. **Booking flow**:
   - Instant confirmation or always requires provider approval?
   - (Recommendation: Always require approval for MVP - simpler)

4. **Cancellation policy**:
   - Free cancellation anytime for MVP?
   - Or enforce 24-hour notice?

---

## Success Metrics (MVP)

Track these to validate the product:

- [ ] 10 providers registered with complete profiles
- [ ] 50 pet owners registered
- [ ] 20 booking requests created
- [ ] 10 bookings confirmed
- [ ] 5 reviews left
- [ ] <2 second page load times
- [ ] <5% booking request error rate

---

## Timeline Estimate

Assuming 1 full-time developer:

| Phase | Tasks | Time |
|-------|-------|------|
| Setup | Monorepo, DB schema, auth scaffolding | 2 days |
| Backend | All API routes + validation + email | 4 days |
| Frontend | Pages + forms + components | 5 days |
| Integration | Connect frontend to backend, fix bugs | 2 days |
| Testing | E2E tests for critical flows | 1 day |
| Deployment | VPS setup, domain, HTTPS | 1 day |
| **Total** | | **~15 days** |

Add buffer for unknowns: **3 weeks to MVP launch**.

---

## Next Steps

1. **Review and approve this architecture** ✅
2. **Initialize monorepo structure**:
   ```bash
   mkdir -p packages/{api,web}
   npm init -w packages/api -w packages/web
   ```
3. **Set up backend skeleton**:
   - Install dependencies (Express, Drizzle, Zod, etc.)
   - Define Drizzle schema
   - Create initial migration
   - Implement auth endpoints
4. **Set up frontend skeleton**:
   - Create Next.js app
   - Install Tailwind + shadcn/ui
   - Implement auth context + forms
5. **Build iteratively**:
   - Week 1: Auth + profiles + pets
   - Week 2: Provider search + bookings
   - Week 3: Dashboards + email + deployment

---

**Architecture approved? Ready to start building.** 🚀
