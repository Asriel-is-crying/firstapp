# Hosted backend setup

Configured on 7 October 2026 for the owner-selected Sunway University campus.

## Applied configuration

- Both repository migrations were applied together in a transaction through the signed-in Supabase SQL Editor after confirming the public schema was empty.
- Migration versions `202610070001` and `202610070002` are recorded in `supabase_migrations.schema_migrations`.
- All 17 application tables have row-level security enabled, with 30 application policies.
- The `campus-images` bucket has three storage policies, a 5 MiB limit, and JPEG/PNG/WebP restrictions. Published images are public; writes require the appropriate profile or organizer ownership.
- `universities` contains Sunway University with timezone `Asia/Kuala_Lumpur`. No demo accounts, clubs, or events were inserted.
- The local ignored `.env` contains the owner-supplied project URL and publishable key, using the app's `EXPO_PUBLIC_*` variable names. The existing `EXPO_PUBLIC_SUPABASE_ANON_KEY` variable accepts the publishable key. No service-role key is used.
- Auth site URL is `http://127.0.0.1:4173`. Exact callback and reset URLs are allowed for that origin and `http://localhost:8081`.
- Email/password signup is enabled and email confirmation remains required.

## Verification

The hosted REST API returned Sunway University and empty event/club catalogs. Anonymous profile reads returned no rows; the event-count RPC succeeded. Anonymous registration was denied with PostgreSQL permission code `42501` (HTTP 401). The rebuilt browser preview has no demo banner and shows the real empty-campus state without a database error.

The first export reused transforms from the earlier unconfigured demo. A clean export fixed this:

```sh
pnpm exec expo export --platform web --max-workers 2 --clear
node scripts/postbuild.mjs
```

Use a clean export after changing frontend environment values, and reload the preview. Environment changes do not alter an already-built bundle.

## Remaining acceptance and launch work

- The owner must create and verify the first real CampusFlow account, then log in. Hosted authenticated writes, email confirmation/reset, and Storage upload acceptance remain pending until a real account is available.
- Custom SMTP is not configured. Supabase's default email service restricts delivery to project-team addresses and is unsuitable for public student signup. Configure a sender/domain and SMTP provider before inviting students; see [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).
- No platform moderator has been granted yet. Ordinary signed-in students can create a club and become its administrator; platform moderation is a separate privileged role.
- The frontend remains a local preview, backed by a hosted database. Public HTTPS hosting, final Auth URLs, and hosted acceptance are still required before launch.
- Keep local demo seeds out of this hosted environment. Future schema changes should be new migrations, not edits to already-applied migration files.
