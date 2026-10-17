# RozMitra backend

This is a real standalone Node HTTP entry point, not another frontend.
It calls the same authenticated handlers in `src/app/api` so validation and access controls stay consistent.
No Express dependency or separate database password is needed.

Run from the REPOSITORY ROOT, not this directory:

```powershell
npm run backend
```

For local development, Node does not load `.env.local` automatically. Use:

```powershell
node --env-file=.env.local --conditions=react-server --import tsx server/index.ts
```

Render supplies environment variables directly. For a Render Web Service:

- Root Directory: leave empty (the root contains package.json, src, and server).
- Build Command: `npm ci` after you commit package-lock.json; use `npm install` for the first deployment if no lockfile exists yet.
- Start Command: `npm run backend`
- Health Check Path: `/health`
- Node version: 22 or later, supported by your Render runtime.
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
- Set `FRONTEND_ORIGIN` to the exact frontend origin, e.g. `https://your-app.vercel.app` (no path or trailing slash).
- On the frontend, set `NEXT_PUBLIC_API_BASE_URL` to your backend origin and rebuild.

`/health` reports that the HTTP process is running. It does not claim the database or AI credentials have been verified.
Never publish the API key or use your Supabase dashboard credentials as test credentials.
