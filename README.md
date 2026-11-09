# Thaal

Project name: Plated. Plated is a restaurant digital menu SaaS: restaurants sign up, build a menu with dish photos, customise its look and get branded QR codes; diners scan, browse, order and pay from their phone. We will build it step by step. THIS FIRST STEP: the design system, app shell/routing, and the marketing landing page. Do not build the backend yet (we'll enable Lovable Cloud next).

DESIGN DIRECTION (critical: it must NOT look AI-generated)
- Feel: sleek and warm, friendly, clean, very minimal, like a well-designed independent cafe brand.
- Avoid: purple/blue gradients, glassmorphism, generic hero with three feature cards, icons everywhere, emoji, shadows on everything, centred-everything layouts, "Unlock the power of" style copy.
- Palette as CSS variables/Tailwind tokens: base warm off-white #FAF7F2, ink near-black #1C1A17, one confident accent terracotta #C8553D, plus muted sand (~#E8DFD0 / #D9CBB4) and olive (~#6B6B47 / #8A8A5C) neutrals. Also a dark mode variant (warm charcoal, not blue-black).
- Type: Fraunces (editorial serif) for headings, Inter Tight for UI, via Google Fonts. Generous size contrast (very large display headings, small calm UI text).
- Layout: asymmetric editorial grids, lots of whitespace, thin 1px dividers in sand/ink-10%, food photography as the hero, restrained rounded corners 8-12px. Shadows almost never.
- Motion (use framer-motion): subtle and physical — spring-sliding sheets, gliding pills (layoutId), micro-bounce on add-to-cart. Nothing flashy.
- Copy: short, human, a bit playful ("Hungry? Start here.").

Set up shared primitives in this style: Button (solid ink, accent, ghost/underline link), Pill, Tag (veg = olive, spicy = terracotta, small text tags not icons), Divider, Section heading, Bottom Sheet (spring), Input, Toggle.

ROUTES to scaffold (placeholder pages fine except landing): / (landing), /login, /signup, /m/:slug (customer menu, optional ?table=N), /dashboard/* (owner app).

LANDING PAGE at /:
- Top nav: wordmark "Plated" in Fraunces, links (How it works, Pricing, Log in), "Start free" button.
- Asymmetric hero: big left-aligned serif headline (e.g. "Your menu, but the good kind."), a short line of supporting copy, CTA, and on the right a realistic phone mockup showing a working demo menu for a fictional cafe "Lemon & Rye": cover photo, logo, opening hours, sticky category pills, big photo dish cards with name, short description, price, veg/spicy tags, one card sold out. Make the phone content actually scrollable and the pills interactive. Use high-quality Unsplash food photos (lazy-loaded, sized with w= params).
- A "How it works" section as an editorial numbered list (01 Build your menu, 02 Make it yours, 03 Print your QR codes, 04 Take orders) with an asymmetric layout and photography, not three cards.
- A section showing the owner side (live orders/kitchen view snippet, theme customiser snippet) as styled UI fragments.
- Pricing: Free (1 menu, basic QR), Pro (ordering, themes, analytics), Business (multi-branch) — laid out as a clean table/columns with 1px dividers, Pro highlighted with accent only.
- A short closing CTA and a minimal footer.
- Fully responsive, mobile-first, fast.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thaal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b9d21854-517a-4eeb-a420-5ee9c2ab8aa8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
