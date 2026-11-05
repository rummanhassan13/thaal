<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Plated UI primitives live in `src/components/plated/`; marketing sections in `src/components/landing/`. Why: keeps brand primitives separate from stock shadcn.
- All colours come from tokens in `src/styles.css` (paper/ink/terracotta/sand/olive + shadcn aliases). Why: dark mode and theming.
- Diner/public menu reads go through `getPublicMenu` (server fn, publishable key, anon RLS); diners never read orders directly — they use RPCs `place_order` / `get_order_status` / `submit_review`. Why: server-side prices and per-order tracking tokens.
- Owner app lives under `src/routes/_authenticated/`; the dashboard layout's `beforeLoad` loads the user's restaurant and redirects to `/onboarding` if none. Why: one gate, client-side session.
- Media uploads use `uploadMenuImage` (`src/lib/image-upload.ts`) with paths `<restaurant_id>/<kind>/…` in bucket `menu-media`. Why: storage policies key off the first folder.
- Plan/Stripe fields on restaurants are only writable by service role (trigger guard). Why: users can't self-upgrade.
