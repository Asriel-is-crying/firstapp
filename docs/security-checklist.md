# Security and release checklist

## Implemented and covered by local tests

- [x] RLS enabled on application tables; private tables are not anonymously readable.
- [x] Table privileges explicitly reset before granting narrow operations.
- [x] Users cannot update disabled state or platform privileges via profile fields/metadata.
- [x] Club/event administration restricted to the relevant club admins.
- [x] Registrations cannot be forged through direct table writes; capacity checked inside a locked transaction.
- [x] Registration calls are idempotent; cancellation promotes the next waitlisted student.
- [x] Draft event registration denied; public queries omit drafts.
- [x] Saves/follows are owner scoped; private availability cannot be forged/read by other students.
- [x] Cross-event conflicts rejected by default; explicit override reason required.
- [x] Assignment responses limited to the assigned member; declined assignments cannot bypass reassignment checks.
- [x] Storage object paths enforce profile/club/event ownership; public uploads limited by bucket size/MIME policy.
- [x] Moderation is restricted; disabled events cannot be republished by club admins; disabled users lose application writes.
- [x] Return URLs restricted to internal paths. No service-role key in frontend code. `.env` excluded from Git.

## Required against the connected production project

- [ ] Apply migrations and inspect Supabase Security Advisor.
- [ ] Verify signup, email confirmation, login, reset, logout and session restoration with actual delivery.
- [ ] Verify Auth redirect allowlist against the deployed HTTPS hostname. Configure SMTP and abuse/rate limits.
- [ ] Verify two independent clients compete for the last seat without exceeding capacity, and race overlapping assignments.
- [ ] Test all roles through real anon/authenticated REST calls, including crafted update/insert requests.
- [ ] Verify uploads of valid images and rejection of oversized/disallowed files against hosted Storage.
- [ ] Review public image privacy with owners; do not upload sensitive documents. Add cleanup for orphaned images as usage grows.
- [ ] Verify disabled-account behavior with an already-issued JWT. Application RLS rejects private operations; Auth-level bans/session revocation require trusted server administration.
- [ ] Confirm real university information, support contact, retention/deletion process and responsible moderator.
- [ ] Do not deploy local seed credentials. Provision production moderators manually.
- [ ] Inspect production build and complete student/organizer acceptance on actual phones.
- [ ] Deploy EAS production and verify direct event/club URLs, images, errors and account flows.

This is a release gate, not a claim of a completed security audit. Local PostgreSQL tests use Supabase-compatible auth/storage fixtures. Full multi-connection races and hosted services are pending account setup.
