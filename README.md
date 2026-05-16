# DitchApp Accident Alert PWA

A Progressive Web App for tow truck drivers in DitchApp. Shows live traffic incidents from TomTom and sends push notifications when accidents occur near you.

## Stack

- **Next.js** (App Router), **PostgreSQL**, **Prisma**, **Tailwind CSS**
- **TomTom** Maps SDK + Traffic Incidents API v5
- **Web Push** (VAPID) + service worker for notifications

## Setup

### 1. Environment

Copy `.env.example` to `.env` and fill in:

- `TOMTOM_API_KEY` — TomTom API key (Traffic + Maps). Never commit this.
- `NEXT_PUBLIC_TOMTOM_API_KEY` — Same key for map tiles in the browser (required for the map).
- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/traficapp`).
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — Generate with:  
  `npx web-push generate-vapid-keys`
- `CRON_SECRET` — **You create this yourself** (it is not from a third party). Use a long random string to protect the cron endpoint. Generate one with:  
  `openssl rand -hex 32`  
  Put the same value in `.env` and use it when calling the cron URL (see below).

### 2. Database

```bash
npx prisma migrate dev
```

Or, if you created the DB and migration manually:

```bash
npx prisma migrate deploy
```

### Production build / CI

`npm run build` runs **`prisma migrate deploy`**, **`prisma generate`**, and **`next build`** when `prisma/schema.prisma` exists. Your build environment needs **`DATABASE_URL`** so migrations can run. The **`prisma`** CLI is listed under **`dependencies`** so **`migrate deploy`** is available during production installs that omit devDependencies.

`npm start` runs **`next start`** only.

If the builder cannot reach Postgres, run **`npx prisma migrate deploy`** from a release phase or a host that has DB access, then use a build that skips migrate (custom script), or split migrate into your platform’s deploy hooks.

### 3. PWA icons (optional)

Add `public/icon-192x192.png` and `public/icon-512x512.png` for the PWA manifest. Without them, install prompts may still work but icons will 404.

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For push and geolocation, use HTTPS in production (or `npm run dev -- --experimental-https` locally).

## Cron (nearby push alerts + heatmap data)

**Where does heatmap / “Incident history” data come from?**  
The heatmap and Insights page use **IncidentSnapshot** records in the database. Those are created only when the **cron endpoint** runs: it fetches incidents from TomTom and saves them. So you must call the cron URL periodically (or at least once) for heatmap data to appear.

**1. Set `CRON_SECRET` in `.env`**

You **create** this value yourself (it is not from TomTom or any service). Example:

```bash
# Generate a random secret (run in terminal):
openssl rand -hex 32
```

Copy the output and in `.env` set:

```env
CRON_SECRET=paste_the_generated_string_here
```

**2. Call the cron endpoint**

- **Manually (to get heatmap data once):**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/check-nearby-incidents
```

Replace `YOUR_CRON_SECRET` with the same value you put in `.env`. Each call fetches current incidents and saves them for heatmap/history.

- **On a schedule (for push alerts + ongoing heatmap data):**  
  Call the same URL every 1–2 minutes (e.g. system cron, GitHub Actions, or [Vercel Cron](https://vercel.com/docs/cron-jobs)). Use the same `Authorization: Bearer YOUR_CRON_SECRET` header.

## Features

- Live map of DitchApp with incident markers (TomTom)
- Incident list with distance when location is allowed
- Push notifications when incidents are within your radius (default 2 km)
- No login (anonymous device ID + push subscription)
- PWA: installable, standalone, theme and manifest

## API

- `GET /api/incidents` — Returns normalized incidents for DitchApp (from TomTom).
- `POST /api/push/subscribe` — Store push subscription + optional deviceId, lastLat, lastLng.
- `PATCH /api/push/location` — Update last known position (endpoint or deviceId + lat, lng).
- `POST /api/push/unsubscribe` — Remove subscription by endpoint.
- `GET /api/cron/check-nearby-incidents` — Cron: fetch incidents, notify nearby subscribers (requires `CRON_SECRET`).
