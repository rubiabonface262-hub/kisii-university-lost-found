# Kisii University Lost & Found

A responsive web app for the Kisii University community to reunite people with lost belongings.

- **Report** a lost item (what it is, where and when you last had it, how to reach you, optional photo).
- **Report** a found item so the owner can track you down.
- **Search** every open report by keyword, lost/found, category and status.
- **Match** — each report shows open reports from the other side in the same category, so a lost phone shows found phones and vice versa.
- **Resolve** — Lost & Found office admins sign in to the Admin desk and mark cases resolved (or reopen/delete them).

Students don't need an account; only admins sign in.

## Tech

- TanStack Start (React 19, TanStack Router) on Netlify
- Tailwind CSS 4 + shadcn/ui components
- Netlify Database (Postgres) with Drizzle ORM for reports
- Netlify Blobs for item photos, served through the Netlify Image CDN
- Netlify Identity for admin sign-in and the `admin` role

## Run locally

```bash
pnpm install
netlify dev   # emulates the database, blobs, identity and image CDN
```

## Setting up admins

1. In the Netlify dashboard, open **Identity** and choose **Invite users**. Enter the staff member's email.
2. They click the invite link, land on the site and set a password.
3. Open their user in the Identity list, add the role `admin`, and save.
4. They can now sign in at `/admin`.

For security, consider setting Identity registration to **Invite only**.

## Database changes

Edit `db/schema.ts`, then run `npx drizzle-kit generate --name <describe_change>`. Migrations in `netlify/database/migrations/` are applied automatically on deploy.
