# Deploying Bloom

**Read this first.** Bloom is no longer a static site. It is a React SPA **plus** a Node/Express + SQLite API that enforces authentication, school tenancy, the 20-voice anonymity threshold and the 24-hour safeguarding SLA. Publishing only the `dist/` folder to a static host gives you a login screen that can never log in.

So there are two supported shapes:

| | What runs where | Best for |
|---|---|---|
| **Option A** (simplest) | One Node service runs the API *and* serves the built SPA | Getting a working demo fastest |
| **Option B** (Netlify) | Netlify serves the SPA, proxies `/api/*` to a Node API host | You specifically want it on Netlify |

Both are configured in this repo and both have been verified end-to-end.

---

## Option A — one service, everything works (~5 minutes)

`server/index.mjs` serves `dist/` automatically whenever a production build is present, so the SPA and API share one origin. That keeps the `HttpOnly; SameSite=Lax; Secure` session cookie first-party, which means no CORS and no cross-site cookie configuration.

### Render (blueprint included)

1. Push this branch to GitHub (already done).
2. Render → **New → Blueprint** → select this repo. It reads `render.yaml`:
   - build `npm ci && npm run build`, start `node server/index.mjs`
   - health check `/api/health`
   - a 1 GB persistent disk at `/var/data` with `BLOOM_DB=/var/data/bloom.sqlite`
   - `BLOOM_SEED=1` so the demo school and pilot accounts exist on first boot
3. Deploy. Open the URL and sign in with the demo accounts below.

The persistent disk matters: **without it the SQLite file lives on an ephemeral filesystem and every safeguarding record is lost on restart.** Fly.io and Railway work the same way — attach a volume and point `BLOOM_DB` at it.

### Run it locally instead

```bash
npm ci
npm run build
BLOOM_SEED=1 node server/index.mjs      # http://localhost:8787
```

---

## Option B — Netlify (SPA on Netlify, API elsewhere)

Netlify Functions are ephemeral and have no persistent disk, so the API cannot live there with SQLite. Deploy the API first (Option A), then point Netlify at it.

1. **Deploy the API** via Render/Fly/Railway as above. Note its origin, e.g. `https://bloom-api.onrender.com`.
2. **Netlify → Add new site → Import from Git**, select this repo.
   Build settings come from `netlify.toml` (`npm run build`, publish `dist`, Node 22) — no manual entry needed.
3. **Site settings → Environment variables** → add:
   ```
   BLOOM_API_ORIGIN = https://bloom-api.onrender.com     (no trailing slash)
   ```
4. Deploy.

### Why the proxy, not a direct call

`netlify.toml` proxies `/api/*` to `BLOOM_API_ORIGIN` **server-side** (status 200, not a redirect). The browser therefore only ever sees one origin, so the session cookie stays first-party and works unchanged. Calling the API host directly from the browser instead would need CORS *and* `SameSite=None` cookies — weaker, and unnecessary.

The SPA fallback rule must stay **after** the `/api` rule; Netlify matches in file order.

---

## Option C — Vercel (demo only, ephemeral)

`vercel.json` and `api/index.mjs` are configured (all `/api/*` traffic is routed by an explicit `vercel.json` rewrite — do not rename the function to a `[...slug]` catch-all, which Vercel inferred as a single-segment route and broke sign-in), and `VITE_BLOOM_DEMO=1` is baked into the build env so the deployment always carries a **"Demo build"** banner. Vercel has no persistent disk: data resets on cold start, concurrent instances diverge, and the 24-hour SLA sweep does not run. Fine for showing people the app; not for a pilot.

Vercel project creation needs a team role that can create projects (Owner/Admin) — a Member/Contributor token gets `403 forbidden`. To set it up:

1. Vercel → **Add New → Project → Import Git Repository** → `leoanthony2009-crypto/edutrendapp2026`.
2. **Set the production branch to `claude/bloom-app-scaffold-build-6smu3s`** (Settings → Git), or merge that branch to `main` first — the app does not exist on `main`.
3. Deploy. `vercel.json` supplies build command, output directory, function budget, rewrites and the demo flag; nothing needs entering by hand.

---

## Demo accounts (seeded when `BLOOM_SEED=1`)

School code `STJ` — passcode pattern is `petal-<code>`:

| Role | Code | Passcode | Shows |
|---|---|---|---|
| Student | `student` | `petal-student` | Your Voice Today, pulse carousel, You said → We did |
| Teacher | `teacher` | `petal-teacher` | Daily Pulse, micro-move, **1 pulse from the Survey Builder unlock** |
| Leader · Champion | `leader` | `petal-leader` | Leadership view, Champion workspace, Weekly Bridge, BSC export |

A second school, `HCR` (`leader` / `petal-leader`), exists deliberately: it is small enough to sit **below** the 20-voice threshold, so you can see suppression working rather than just being told it exists.

**Turn `BLOOM_SEED` off (`0`) before any real school data goes in.** The seed is demo content and should not sit alongside real pupils.

---

## Before real pupils use a deployment

This is a demo/pilot deploy guide, not a go-live checklist. `BLOOM_SCHOOL_PILOT_READINESS.md` lists the eight items still needing human sign-off — safeguarding policy, DPIA/data-protection review, deployment hardening (HTTPS/HSTS, secrets management, tested restores), monitoring and on-call for the SLA sweep, a contracted notification channel, editorial citation verification, school governance, and an independent penetration test.

### Verify a deploy before trusting it

```bash
npm run verify:clean
```

This clones what **git actually holds** (not your working tree), installs with `--ignore-scripts` the way Vercel does, builds, and boots the API. A passing local build does not prove a deploy works: a `.gitignore` rule once swallowed a source file that existed on disk, so every local check passed while the hosted build failed on the missing module. Run this before any deploy you intend to show someone.

### A note on the SQLite driver

The server uses Node's built-in `node:sqlite` (Node ≥22.5), falling back to `better-sqlite3` on older runtimes. This removes the native `node-gyp` build step, which hosts increasingly block by default. Node prints `ExperimentalWarning: SQLite is an experimental feature` — the API is stable enough for a pilot and is covered by `server/__tests__/driver.test.mjs`, but **this is worth a decision before production**: either pin to a Node version where it is stable (Node 24+), or set `BLOOM_FORCE_BETTER_SQLITE` aside and install `better-sqlite3` with install scripts permitted.

Two deployment specifics worth repeating here:

- **Set `NODE_ENV=production`** so the session cookie is issued with `Secure`.
- **Back up the SQLite volume.** It holds the safeguarding record, including the audit trail that is deliberately immutable at the database level.
