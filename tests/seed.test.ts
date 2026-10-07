import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
it("loads realistic local seed twice without duplicate accounts, events or assignments", async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema extensions;
  create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
  create table auth.users(instance_id uuid,id uuid primary key,aud text,role text,email text unique,encrypted_password text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz,confirmation_token text,recovery_token text,email_change_token_new text,email_change text);
  create table auth.identities(id uuid primary key,user_id uuid references auth.users,provider_id text,identity_data jsonb,provider text,created_at timestamptz,updated_at timestamptz,unique(provider_id,provider));`);
    await db.exec(
      readFileSync("supabase/migrations/202610070001_core.sql", "utf8"),
    );
    const seed = readFileSync("supabase/seed.sql", "utf8");
    await db.exec(seed);
    await db.exec(seed);
    for (const [table, count] of Object.entries({
      universities: 1,
      profiles: 6,
      clubs: 8,
      events: 20,
      event_registrations: 40,
      club_memberships: 24,
      event_team_roles: 20,
      event_team_members: 40,
      event_availability: 20,
      event_shifts: 20,
      shift_assignments: 20,
    }))
      expect(
        (
          await db.query<{ count: number }>(
            `select count(*)::int as count from public.${table}`,
          )
        ).rows[0].count,
      ).toBe(count);
    expect(
      (
        await db.query<{ valid: boolean }>(
          "select bool_and(encrypted_password=extensions.crypt('CampusFlowDemo!2026',encrypted_password)) as valid from auth.users",
        )
      ).rows[0].valid,
    ).toBe(true);
  } finally {
    await db.close();
  }
}, 60000);
