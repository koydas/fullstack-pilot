# Client (React + Vite)

A React + TypeScript SPA built with Vite. It proxies `/api` requests to the Node apps-service during local dev and ships a production-ready build via `npm run build`.

## Quick start
```bash
# install deps (or run from repo root: npm run init:client)
npm install

# start dev server with API proxy on http://localhost:5173
npm run dev -- --host
```

## Scripts
- `npm run dev -- --host` – start the Vite dev server
- `npm run build` – production build to `dist/`
- `npm run preview` – preview the production build locally

## Notes
- Environment variables come from `vite.config.ts` and `.env` files (see Vite docs for prefixes). When running via Docker Compose the proxy is preconfigured.
- The UI consumes the Node API at `/api/projects` and can be extended to call the optional Flask and .NET services.
