import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
let db: PGlite;
const id = (n: number) =>
  "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
async function as(user: number | null, sql: string) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role " + (user ? "authenticated" : "anon"));
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
      user ? id(user) : "",
    ]);
    return tx.query(sql);
  });
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated; grant select,insert,delete on storage.objects to anon,authenticated;`);
  await db.exec(
    readFileSync("supabase/migrations/202610070001_core.sql", "utf8"),
  );
  await db.exec(
    readFileSync("supabase/migrations/202610070002_storage.sql", "utf8"),
  );
  for (let i = 1; i <= 5; i++)
    await db.query("insert into auth.users values($1,$2,$3)", [
      id(i),
      "person" + i + "@example.edu",
      { display_name: "Person " + i, role: "admin" },
    ]);
  await db.exec(
    `insert into universities(id,name) values('${id(10)}','Test University'); insert into platform_admins values('${id(5)}');`,
  );
  await as(
    1,
    `select create_club('Club One','club-one','${id(10)}','A great club','a@example.edu')`,
  );
  await db.exec(`update clubs set id='${id(20)}' where false;`); // IDs below are selected from the real creation RPC.
  const club = (await db.query<{ id: string }>("select id from clubs")).rows[0]
    .id;
  await as(1, `select add_member('${club}','person2@example.edu','committee')`);
  for (let n = 100; n < 103; n++)
    await db.exec(
      `insert into events(id,club_id,title,slug,category,venue,starts_at,ends_at,registration_opens_at,registration_closes_at,capacity,waitlist_enabled,status,contact_email) values('${id(n)}','${club}','Event ${n}','event-${n}','Technology','Hall',now()+interval '2 days',now()+interval '2 days 2 hours',now()-interval '1 day',now()+interval '1 day',1,true,'${n === 102 ? "draft" : "published"}','a@example.edu');`,
    );
  await as(1, `select add_team_member('${id(100)}','${id(2)}')`);
  await as(1, `select add_team_member('${id(101)}','${id(2)}')`);
  for (let n = 100; n < 102; n++)
    await db.exec(
      `insert into event_team_roles(id,event_id,name) values('${id(n + 100)}','${id(n)}','Welcome');insert into event_shifts(id,event_id,role_id,name,location,starts_at,ends_at,required_people) values('${id(n + 200)}','${id(n)}','${id(n + 100)}','Welcome desk','Hall',now()+interval '2 days',now()+interval '2 days 1 hour',2);`,
    );
  await as(
    2,
    `insert into event_availability(event_id,user_id,starts_at,ends_at) values('${id(100)}','${id(2)}',now()+interval '1 day',now()+interval '3 days'),('${id(101)}','${id(2)}',now()+interval '1 day',now()+interval '3 days')`,
  );
});
afterAll(async () => {
  await db?.close();
});
describe("PostgreSQL authorization and transactions", () => {
  it("anonymous users can browse public events but cannot see drafts or private data", async () => {
    expect((await as(null, "select * from events")).rows).toHaveLength(2);
    for (const t of [
      "profiles",
      "event_availability",
      "event_registrations",
      "reports",
      "shift_assignments",
    ])
      expect((await as(null, "select * from " + t)).rows).toHaveLength(0);
  });
  it("profile metadata cannot grant platform administration", async () =>
    expect((await as(3, "select is_platform_admin() as yes")).rows[0]).toEqual({
      yes: false,
    }));
  it("cannot escalate account privileges or edit another profile", async () => {
    await expect(
      as(3, `update profiles set disabled=false where id='${id(3)}'`),
    ).rejects.toThrow();
    await as(
      3,
      `update profiles set display_name='hacked' where id='${id(1)}'`,
    );
    expect(
      (await db.query("select display_name from profiles where id=$1", [id(1)]))
        .rows[0],
    ).toEqual({ display_name: "Person 1" });
  });
  it("cannot publish by writing directly to events", async () => {
    await expect(
      as(3, `update events set status='published' where id='${id(102)}'`),
    ).rejects.toThrow();
    await expect(
      as(
        3,
        `select save_event('${id(102)}',(select id from clubs limit 1),'{}')`,
      ),
    ).rejects.toThrow("Not authorized");
  });
  it("registration is idempotent and capacity creates a waitlist", async () => {
    expect(
      (await as(3, `select register_event('${id(100)}') as status`)).rows[0],
    ).toEqual({ status: "registered" });
    expect(
      (await as(3, `select register_event('${id(100)}') as status`)).rows[0],
    ).toEqual({ status: "registered" });
    expect(
      (await as(4, `select register_event('${id(100)}') as status`)).rows[0],
    ).toEqual({ status: "waitlisted" });
    expect(
      (await as(3, "select * from event_registrations")).rows,
    ).toHaveLength(1);
  });
  it("cancellation promotes the next student", async () => {
    await as(3, `select cancel_registration('${id(100)}')`);
    expect(
      (await as(4, "select status from event_registrations")).rows[0],
    ).toEqual({ status: "registered" });
  });
  it("cannot register for drafts or forge registrations", async () => {
    await expect(as(3, `select register_event('${id(102)}')`)).rejects.toThrow(
      "not open",
    );
    await expect(
      as(
        3,
        `insert into event_registrations(event_id,user_id,status) values('${id(101)}','${id(4)}','registered')`,
      ),
    ).rejects.toThrow();
  });
  it("saved events and follows remain private and owner scoped", async () => {
    await as(
      3,
      `insert into saved_events(event_id,user_id) values('${id(100)}','${id(3)}');`,
    );
    expect((await as(4, "select * from saved_events")).rows).toHaveLength(0);
    await expect(
      as(
        3,
        `insert into club_followers(club_id,user_id) values((select id from clubs limit 1),'${id(4)}')`,
      ),
    ).rejects.toThrow();
  });
  it("availability is private and cannot be forged", async () => {
    expect((await as(3, "select * from event_availability")).rows).toHaveLength(
      0,
    );
    expect((await as(1, "select * from event_availability")).rows).toHaveLength(
      2,
    );
    await expect(
      as(
        3,
        `insert into event_availability(event_id,user_id,starts_at,ends_at) values('${id(100)}','${id(2)}',now(),now()+interval '1 hour')`,
      ),
    ).rejects.toThrow();
  });
  it("blocks conflicting shifts across different events", async () => {
    await as(1, `select assign_shift('${id(300)}','${id(2)}')`);
    expect(
      (
        await as(
          1,
          `select candidate_status('${id(301)}','${id(2)}') as status`,
        )
      ).rows[0],
    ).toEqual({ status: "Already Assigned Elsewhere" });
    await expect(
      as(1, `select assign_shift('${id(301)}','${id(2)}')`),
    ).rejects.toThrow("override reason");
    await as(
      1,
      `select assign_shift('${id(301)}','${id(2)}','Member agreed to cover the overlap')`,
    );
  });
  it("only the assigned member may respond and a decline cannot be reactivated", async () => {
    const aid = (
      await db.query<{ id: string }>("select id from shift_assignments limit 1")
    ).rows[0].id;
    await expect(
      as(3, `select respond_assignment('${aid}','confirmed')`),
    ).rejects.toThrow();
    await as(2, `select respond_assignment('${aid}','declined')`);
    await expect(
      as(2, `select respond_assignment('${aid}','confirmed')`),
    ).rejects.toThrow();
  });
  it("unauthorized users cannot inspect candidate schedules", async () =>
    await expect(
      as(3, `select candidate_status('${id(300)}','${id(2)}')`),
    ).rejects.toThrow("Not authorized"));
  it("storage rejects cross-account paths", async () => {
    await as(
      3,
      `insert into storage.objects(bucket_id,name) values('campus-images','profiles/${id(3)}/photo.png')`,
    );
    await expect(
      as(
        3,
        `insert into storage.objects(bucket_id,name) values('campus-images','profiles/${id(4)}/photo.png')`,
      ),
    ).rejects.toThrow();
    await expect(
      as(
        null,
        `insert into storage.objects(bucket_id,name) values('campus-images','profiles/${id(3)}/photo.png')`,
      ),
    ).rejects.toThrow();
  });
  it("moderation cannot be invoked by students and disabled accounts lose write access", async () => {
    await expect(
      as(
        3,
        `select moderate('disable_user','${id(4)}','Testing unauthorized moderation')`,
      ),
    ).rejects.toThrow();
    await as(
      5,
      `select moderate('disable_user','${id(4)}','Confirmed repeated abusive activity')`,
    );
    await expect(as(4, `select register_event('${id(101)}')`)).rejects.toThrow(
      "active account",
    );
    expect((await as(3, "select * from moderation_log")).rows).toHaveLength(0);
  });
  it("moderation-disabled events cannot be republished by club admins", async () => {
    await as(
      5,
      `select moderate('disable_event','${id(101)}','Confirmed inappropriate event content')`,
    );
    await expect(
      as(
        1,
        `select save_event('${id(101)}',(select id from clubs limit 1),'{"status":"published"}')`,
      ),
    ).rejects.toThrow("unavailable");
  });
});
