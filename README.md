# Thaal

QR menus and table ordering for restaurants. A restaurant builds its menu with dish photos, customises the look, and prints QR codes. Guests scan, browse the menu and order from their phone, and orders appear in the restaurant's dashboard.

**Live app:** https://thaal.lovable.app

## Features

**For restaurants (dashboard)**
- Sign-up and onboarding for a restaurant profile
- Menu builder with categories, drag-to-reorder and image upload with cropping
- Design and theme customisation for the public menu
- Branded QR codes, per-table codes and export
- Orders view with live status
- Reviews, analytics and multi-branch support
- Plan tiers with feature gating

**For guests**
- Public menu page per restaurant at `/m/:slug`, optionally for a specific table
- Cart, ordering and live order status without creating an account
- Opening hours and scheduled availability handling
- Progressive web app support

## Security design

Guests never read order tables directly; they use server-side functions that check per-order tracking tokens. Plan and billing fields on a restaurant can only be written by the service role, so users cannot upgrade themselves. Uploaded media paths are keyed by restaurant so storage policies can scope access.

## Tech stack

React, TypeScript, TanStack Start and Router, Tailwind CSS, Framer Motion, Supabase (auth, Postgres with row-level security, Realtime, Storage), Vite, Vitest.

## Running locally

```sh
npm install
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run lint`.

The committed `.env` contains only the project's public Supabase URL and publishable key, so a local run connects to the hosted backend. To run in isolation, point those values at your own Supabase project. Never commit service-role keys.

## Project notes

- `src/routes/` holds the file-based routes; the owner app lives under `_authenticated/dashboard/`.
- `src/lib/menu/` and `src/lib/qr/` contain the menu, cart, hours, scheduling and QR logic, with unit tests.
- Design colours come from tokens in `src/styles.css`.
- `AGENTS.md` records the project's design rules.

## Status and license

Live and actively changing. Unit tests exist for the cart, hours, scheduling, QR, orders and plan logic; they are run with `npm test`. No license has been specified yet.

## Built with

Built with AI assistance using [Lovable](https://lovable.dev) and edited by Rumman Hassan. Changes made in the Lovable editor are committed to this repository. Author: [Rumman Hassan](https://github.com/rummanhassan13) · [rummanhassan.cv](https://rummanhassan.cv)