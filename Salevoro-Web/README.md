# Saanvi Couture — Billing (React)

Vite + React 18 + TypeScript, CSS Modules, React Router.

## Run

Requires Node.js 20.19+ on the 20.x release line, or Node.js 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Sign in with a demo account on the login screen (Priya Raman = Admin, Meena K = Store Keeper).

## Structure

```
src/
  main.tsx              boot: styles, icons, theme, data layer, router
  router.tsx            routes (/login, /dashboard, /billing, …)
  app/AppShell.tsx      persistent side menu + top bar; pages render in its <Outlet/>
  pages/<Page>/         one folder per screen: <Page>.tsx + <Page>.module.css
  lib/DCLogic.ts        base class: state + renderVals() → template()
  lib/nav.tsx           <A> link component, scGo() navigation helper
  lib/theme.js          accent/light-dark theme engine (window.scTheme)
  api/db.ts             data layer + mock API / HTTP adapters
  styles/global.css     design tokens and shared classes (.btn, .input, .card…)
```

Roles: Admin sees everything and lands on Dashboard; Store Keeper sees Sales + Masters and lands on New bill. Blocked routes redirect home (see `AppShell.canSee`).

## Connecting a backend

By default data goes through `mockApiAdapter()` (simulated latency, stored in the browser).
Set `VITE_API_URL` in `.env.local` to switch to `httpAdapter`, which expects:

- `GET  {API}/state` → `{ "<key>": "<json string>", … }` for the signed-in store
- `PUT  {API}/state/:key` with the JSON value as body
- `DELETE {API}/state/:key`

Keys and their meaning are listed in `KEYS` in `src/api/db.ts`. To move to resource-style endpoints (e.g. `/customers`), replace the adapter — screens don't change.

## Notes

- Type checking is relaxed (`strict: false`); run `npm run typecheck` to see remaining type warnings. `npm run build` does not type-check.
- The default theme is Light with the Sapphire accent. Profile changes override these defaults and stay in localStorage (`sc_theme`) as a per-device setting.
