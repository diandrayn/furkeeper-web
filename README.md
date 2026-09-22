# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Backend (Supabase)

Auth (sign up, login, Google OAuth) is already wired to Supabase — see
`src/lib/supabaseClient.js` and `src/utils/api.js`. The rest of the app's
data (products, services, orders, bookings, chat, reviews, etc.) still runs
on the mock files in `src/data/`.

To start the real backend:

1. Create a project at https://supabase.com.
2. In **Project Settings → API**, copy the Project URL and the `anon` public key.
3. Copy `.env.example` to `.env` and fill those two values in.
4. In **SQL Editor**, run `supabase/schema.sql` — it creates every table
   (profiles, addresses, pets, stores, products, services, orders, bookings,
   reviews, chat, notifications, partner applications) with Row Level
   Security policies already applied.
5. In **Authentication → Providers**, make sure Email is enabled (and Google,
   if you want that login button to work).
6. Restart `npm run dev` so Vite picks up the new `.env` values.

From there, each context in `src/context/` (CartContext, PetContext,
DashboardContext, ChatContext, etc.) still needs its mock-data calls swapped
for `supabase.from('table').select()/insert()/update()` calls — the schema
and RLS policies are ready for that, table by table.
