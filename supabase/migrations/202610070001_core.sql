-- The browser is untrusted. Sensitive mutations are transactional RPCs.
create table public.universities (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 timezone text not null default 'Asia/Kuala_Lumpur', created_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null default '' check(length(display_name)<=100),
 university_id uuid references public.universities, avatar_url text,
 disabled boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.platform_admins (user_id uuid primary key references public.profiles on delete cascade);
create table public.clubs (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities,
 name text not null check(length(name) between 2 and 100), slug text not null unique check(slug ~ '^[a-z0-9-]+$'),
 description text not null default '', contact_email text not null,
 logo_url text, banner_url text, verified boolean not null default false,
 created_by uuid not null references public.profiles, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.club_memberships (
 id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 role text not null check(role in ('admin','committee')), unique(club_id,user_id), created_at timestamptz not null default now()
);
create table public.club_followers (
 id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs on delete cascade,
 user_id uuid not null references public.profiles on delete cascade, unique(club_id,user_id), created_at timestamptz not null default now()
);
create table public.events (
 id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs on delete cascade,
 title text not null check(length(title) between 3 and 160), slug text not null unique check(slug ~ '^[a-z0-9-]+$'),
 description text not null default '', category text not null, venue text not null,
 starts_at timestamptz not null, ends_at timestamptz not null, registration_opens_at timestamptz not null default now(),
 registration_closes_at timestamptz not null, capacity integer check(capacity>0),
 price numeric(10,2) not null default 0 check(price>=0), currency text not null default 'MYR',
 waitlist_enabled boolean not null default false, status text not null default 'draft' check(status in ('draft','published','cancelled','disabled')),
 cover_url text, contact_email text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at>starts_at), check(registration_closes_at<=starts_at), check(registration_opens_at<registration_closes_at)
);
create table public.event_registrations (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 status text not null check(status in ('registered','waitlisted','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(event_id,user_id)
);
create table public.saved_events (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 user_id uuid not null references public.profiles on delete cascade, unique(event_id,user_id), created_at timestamptz not null default now()
);
create table public.event_team_roles (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 name text not null check(length(name) between 1 and 80), unique(event_id,name), unique(id,event_id), created_at timestamptz not null default now()
);
create table public.event_team_members (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 user_id uuid not null references public.profiles on delete cascade, unique(event_id,user_id), created_at timestamptz not null default now()
);
create table public.event_availability (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null, check(ends_at>starts_at),
 foreign key(event_id,user_id) references public.event_team_members(event_id,user_id) on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.event_shifts (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 role_id uuid not null, name text not null check(length(name) between 1 and 100), description text not null default '', location text not null,
 starts_at timestamptz not null, ends_at timestamptz not null, required_people integer not null check(required_people between 1 and 500),
 check(ends_at>starts_at), foreign key(role_id,event_id) references public.event_team_roles(id,event_id), created_at timestamptz not null default now()
);
create table public.shift_assignments (
 id uuid primary key default gen_random_uuid(), shift_id uuid not null references public.event_shifts on delete cascade,
 user_id uuid not null references public.profiles on delete cascade,
 status text not null default 'pending' check(status in ('pending','confirmed','declined')),
 override_reason text, assigned_by uuid not null references public.profiles,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(shift_id,user_id)
);
create table public.notification_preferences (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles on delete cascade,
 email_enabled boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles,
 event_id uuid references public.events, reported_user_id uuid references public.profiles,
 reason text not null check(length(reason) between 10 and 2000), status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(), check(num_nonnulls(event_id,reported_user_id)=1)
);
create table public.moderation_log (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles,
 action text not null, target_id uuid not null, reason text not null, created_at timestamptz not null default now()
);
create index events_discovery on public.events(status,starts_at);
create index events_club on public.events(club_id);
create index events_search on public.events using gin(to_tsvector('english',title || ' ' || description));
create index memberships_user on public.club_memberships(user_id);
create index registrations_user on public.event_registrations(user_id,status);
create index registrations_event on public.event_registrations(event_id,status);
create index saved_user on public.saved_events(user_id);
create index followers_user on public.club_followers(user_id);
create index team_user on public.event_team_members(user_id);
create index availability_event on public.event_availability(event_id,user_id);
create index shifts_event on public.event_shifts(event_id,starts_at);
create index assignments_user on public.shift_assignments(user_id,status);

create function public.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and not disabled)
$$;
create function public.is_platform_admin() returns boolean language sql stable security definer set search_path='' as $$
 select public.active_user() and exists(select 1 from public.platform_admins where user_id=auth.uid())
$$;
create function public.is_club_admin(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.active_user() and exists(select 1 from public.club_memberships where club_id=cid and user_id=auth.uid() and role='admin')
$$;
create function public.manages_event(eid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.events where id=eid and public.is_club_admin(club_id))
$$;
create function public.on_team(eid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.active_user() and exists(select 1 from public.event_team_members where event_id=eid and user_id=auth.uid())
$$;
create function public.event_visible(eid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.events where id=eid and status in ('published','cancelled'))
$$;
create function public.bootstrap_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name','Student'),100));
 return new;
end $$;
create trigger auth_user_created after insert on auth.users for each row execute function public.bootstrap_profile();
create function public.touch_updated() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['profiles','clubs','events','event_registrations','event_availability','shift_assignments','notification_preferences'] loop
 execute format('create trigger touch_updated before update on public.%I for each row execute function public.touch_updated()',t);
 end loop;
end $$;

do $$ declare t text; begin
 foreach t in array array['universities','profiles','platform_admins','clubs','club_memberships','club_followers','events','event_registrations','saved_events','event_team_roles','event_team_members','event_availability','event_shifts','shift_assignments','notification_preferences','reports','moderation_log'] loop
 execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;
create policy universities_read on public.universities for select using(true);
create policy profiles_read on public.profiles for select using(id=auth.uid() or public.is_platform_admin() or (public.active_user() and (exists(select 1 from public.club_memberships m where m.user_id=profiles.id and public.is_club_admin(m.club_id)) or exists(select 1 from public.event_registrations r where r.user_id=profiles.id and public.manages_event(r.event_id)))));
create policy profiles_update on public.profiles for update using(id=auth.uid() and public.active_user()) with check(id=auth.uid());
create policy admin_read on public.platform_admins for select using(user_id=auth.uid() and public.active_user());
create policy clubs_read on public.clubs for select using(true);
create policy clubs_update on public.clubs for update using(public.is_club_admin(id)) with check(public.is_club_admin(id));
create policy memberships_read on public.club_memberships for select using((user_id=auth.uid() and public.active_user()) or public.is_club_admin(club_id));
create policy followers_read on public.club_followers for select using(user_id=auth.uid() and public.active_user());
create policy followers_insert on public.club_followers for insert with check(user_id=auth.uid() and public.active_user());
create policy followers_delete on public.club_followers for delete using(user_id=auth.uid() and public.active_user());
create policy events_read on public.events for select using(status in ('published','cancelled') or public.manages_event(id) or public.on_team(id) or public.is_platform_admin());
create policy registrations_read on public.event_registrations for select using((user_id=auth.uid() and public.active_user()) or public.manages_event(event_id));
create policy saved_read on public.saved_events for select using(user_id=auth.uid() and public.active_user());
create policy saved_insert on public.saved_events for insert with check(user_id=auth.uid() and public.active_user() and public.event_visible(event_id));
create policy saved_delete on public.saved_events for delete using(user_id=auth.uid() and public.active_user());
create policy roles_read on public.event_team_roles for select using(public.manages_event(event_id) or public.on_team(event_id));
create policy roles_write on public.event_team_roles for all using(public.manages_event(event_id)) with check(public.manages_event(event_id));
create policy team_read on public.event_team_members for select using(public.manages_event(event_id) or (user_id=auth.uid() and public.active_user()));
create policy availability_read on public.event_availability for select using(public.manages_event(event_id) or (user_id=auth.uid() and public.active_user()));
create policy availability_insert on public.event_availability for insert with check(user_id=auth.uid() and public.on_team(event_id));
create policy availability_update on public.event_availability for update using(user_id=auth.uid() and public.on_team(event_id)) with check(user_id=auth.uid() and public.on_team(event_id));
create policy availability_delete on public.event_availability for delete using(user_id=auth.uid() and public.on_team(event_id));
create policy shifts_read on public.event_shifts for select using(public.manages_event(event_id) or public.on_team(event_id));
create policy shifts_insert on public.event_shifts for insert with check(public.manages_event(event_id));
create policy shifts_delete on public.event_shifts for delete using(public.manages_event(event_id));
create policy assignments_read on public.shift_assignments for select using((user_id=auth.uid() and public.active_user()) or exists(select 1 from public.event_shifts s where s.id=shift_id and public.manages_event(s.event_id)));
create policy preferences_own on public.notification_preferences for all using(user_id=auth.uid() and public.active_user()) with check(user_id=auth.uid() and public.active_user());
create policy reports_insert on public.reports for insert with check(reporter_id=auth.uid() and public.active_user() and status='open');
create policy reports_read on public.reports for select using(public.is_platform_admin());
create policy moderation_read on public.moderation_log for select using(public.is_platform_admin());

-- Column grants prevent changing privileged fields even when row ownership matches.
revoke all on all tables in schema public from anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select on all tables in schema public to anon,authenticated;
grant update(display_name,university_id,avatar_url) on public.profiles to authenticated;
grant update(name,description,contact_email,logo_url,banner_url) on public.clubs to authenticated;
grant insert,delete on public.club_followers,public.saved_events to authenticated;
grant insert,update,delete on public.event_team_roles,public.event_availability,public.notification_preferences to authenticated;
grant insert,delete on public.event_shifts to authenticated;
grant insert on public.reports to authenticated;

create function public.create_club(p_name text,p_slug text,p_university uuid,p_description text,p_email text) returns uuid
language plpgsql security definer set search_path='' as $$ declare cid uuid; begin
 if not public.active_user() then raise exception 'Sign in with an active account'; end if;
 insert into public.clubs(name,slug,university_id,description,contact_email,created_by)
 values(p_name,p_slug,p_university,p_description,p_email,auth.uid()) returning id into cid;
 insert into public.club_memberships(club_id,user_id,role) values(cid,auth.uid(),'admin'); return cid;
end $$;
create function public.add_member(p_club uuid,p_email text,p_role text default 'committee') returns uuid
language plpgsql security definer set search_path='' as $$ declare uid uuid; begin
 if not public.is_club_admin(p_club) then raise exception 'Not authorized'; end if;
 select id into uid from auth.users where lower(email)=lower(trim(p_email));
 if uid is null then raise exception 'Student must create an account first'; end if;
 insert into public.club_memberships(club_id,user_id,role) values(p_club,uid,p_role)
 on conflict(club_id,user_id) do nothing; return uid;
end $$;
create function public.add_team_member(p_event uuid,p_user uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 if not public.manages_event(p_event) then raise exception 'Not authorized'; end if;
 if not exists(select 1 from public.events e join public.club_memberships m on m.club_id=e.club_id where e.id=p_event and m.user_id=p_user) then raise exception 'Add the student to the club first'; end if;
 insert into public.event_team_members(event_id,user_id) values(p_event,p_user) on conflict do nothing;
end $$;
create function public.save_event(p_event uuid,p_club uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$ declare eid uuid; begin
 if not public.is_club_admin(p_club) then raise exception 'Not authorized'; end if;
 if coalesce(p_data->>'status','draft') not in ('draft','published','cancelled') then raise exception 'Invalid status'; end if;
 if p_event is not null then
  perform 1 from public.events where id=p_event and club_id=p_club and status<>'disabled' for update;
  if not found then raise exception 'Event unavailable'; end if;
  update public.events set title=p_data->>'title',description=p_data->>'description',category=p_data->>'category',venue=p_data->>'venue',
  starts_at=(p_data->>'starts_at')::timestamptz, ends_at=(p_data->>'ends_at')::timestamptz,
  registration_opens_at=(p_data->>'registration_opens_at')::timestamptz,registration_closes_at=(p_data->>'registration_closes_at')::timestamptz,
  capacity=(p_data->>'capacity')::integer,price=(p_data->>'price')::numeric,contact_email=p_data->>'contact_email',
  cover_url=p_data->>'cover_url',waitlist_enabled=coalesce((p_data->>'waitlist_enabled')::boolean,false),status=p_data->>'status' where id=p_event;
  if exists(select 1 from public.events e where e.id=p_event and e.capacity < (select count(*) from public.event_registrations r where r.event_id=e.id and r.status='registered')) then raise exception 'Capacity below existing registrations'; end if;
  return p_event;
 end if;
 insert into public.events(club_id,title,slug,description,category,venue,starts_at,ends_at,registration_opens_at,registration_closes_at,capacity,price,contact_email,cover_url,waitlist_enabled,status)
 values(p_club,p_data->>'title',p_data->>'slug',p_data->>'description',p_data->>'category',p_data->>'venue',(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,
 (p_data->>'registration_opens_at')::timestamptz,(p_data->>'registration_closes_at')::timestamptz,(p_data->>'capacity')::integer,(p_data->>'price')::numeric,p_data->>'contact_email',p_data->>'cover_url',coalesce((p_data->>'waitlist_enabled')::boolean,false),coalesce(p_data->>'status','draft')) returning id into eid; return eid;
end $$;
create function public.register_event(p_event uuid) returns text
language plpgsql security definer set search_path='' as $$ declare e public.events; current_status text; result text; seats integer; begin
 if not public.active_user() then raise exception 'Sign in with an active account'; end if;
 select * into e from public.events where id=p_event for update;
 if not found or e.status<>'published' or now()<e.registration_opens_at or now()>=e.registration_closes_at or now()>=e.starts_at then raise exception 'Registration is not open'; end if;
 select status into current_status from public.event_registrations where event_id=p_event and user_id=auth.uid();
 if current_status in ('registered','waitlisted') then return current_status; end if;
 select count(*) into seats from public.event_registrations where event_id=p_event and status='registered';
 result := 'registered';
 if e.capacity is not null and seats>=e.capacity then
  if not e.waitlist_enabled then raise exception 'Event is full'; end if; result:='waitlisted';
 end if;
 insert into public.event_registrations(event_id,user_id,status) values(p_event,auth.uid(),result)
 on conflict(event_id,user_id) do update set status=excluded.status,created_at=now(); return result;
end $$;
create function public.cancel_registration(p_event uuid) returns void
language plpgsql security definer set search_path='' as $$ declare e public.events; old_status text; begin
 if not public.active_user() then raise exception 'Not authorized'; end if;
 select * into e from public.events where id=p_event for update;
 update public.event_registrations set status='cancelled' where event_id=p_event and user_id=auth.uid();
 -- Fill every free seat fairly, including after capacity changes. No promotion after registration closes.
 if e.status='published' and now()<e.registration_closes_at then
  update public.event_registrations set status='registered' where id in (
   select r.id from public.event_registrations r join public.profiles p on p.id=r.user_id
   where r.event_id=p_event and r.status='waitlisted' and not p.disabled order by r.created_at,r.id
   limit greatest(0,coalesce(e.capacity,2147483647)-(select count(*)::integer from public.event_registrations where event_id=p_event and status='registered'))
  );
 end if;
end $$;
create function public.event_counts() returns table(event_id uuid,registered bigint) language sql stable security definer set search_path='' as $$
 select e.id,count(r.id) from public.events e left join public.event_registrations r on r.event_id=e.id and r.status='registered'
 where e.status in ('published','cancelled') or public.manages_event(e.id) group by e.id
$$;
create function public.candidate_status(p_shift uuid,p_user uuid) returns text
language plpgsql stable security definer set search_path='' as $$ declare s public.event_shifts; covered boolean; begin
 select * into s from public.event_shifts where id=p_shift;
 if not found or not public.manages_event(s.event_id) then raise exception 'Not authorized'; end if;
 if exists(select 1 from public.shift_assignments a join public.event_shifts other on other.id=a.shift_id where a.user_id=p_user and a.status<>'declined' and a.shift_id<>p_shift and other.starts_at<s.ends_at and other.ends_at>s.starts_at) then return 'Already Assigned Elsewhere'; end if;
 select coalesce(range_agg(tstzrange(starts_at,ends_at,'[)')) @> tstzrange(s.starts_at,s.ends_at,'[)'),false) into covered from public.event_availability where event_id=s.event_id and user_id=p_user;
 if covered then return 'Available'; end if;
 if exists(select 1 from public.event_availability where event_id=s.event_id and user_id=p_user and starts_at<s.ends_at and ends_at>s.starts_at) then return 'Partially Available'; end if;
 return 'Unavailable';
end $$;
create function public.assign_shift(p_shift uuid,p_user uuid,p_override_reason text default null) returns uuid
language plpgsql security definer set search_path='' as $$ declare s public.event_shifts; aid uuid; classification text; begin
 select * into s from public.event_shifts where id=p_shift;
 if not found or not public.manages_event(s.event_id) then raise exception 'Not authorized'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if not exists(select 1 from public.event_team_members t join public.profiles p on p.id=t.user_id where t.event_id=s.event_id and t.user_id=p_user and not p.disabled) then raise exception 'Member is not on this event team'; end if;
 classification:=public.candidate_status(p_shift,p_user);
 if classification<>'Available' and length(trim(coalesce(p_override_reason,'')))<10 then raise exception 'Assignment requires an explicit override reason: %',classification; end if;
 insert into public.shift_assignments(shift_id,user_id,assigned_by,override_reason) values(p_shift,p_user,auth.uid(),p_override_reason)
 on conflict(shift_id,user_id) do update set status='pending',override_reason=excluded.override_reason,assigned_by=excluded.assigned_by returning id into aid; return aid;
end $$;
create function public.respond_assignment(p_assignment uuid,p_status text) returns void
language plpgsql security definer set search_path='' as $$ begin
 if not public.active_user() or p_status not in ('confirmed','declined') then raise exception 'Not authorized'; end if;
 update public.shift_assignments set status=p_status where id=p_assignment and user_id=auth.uid() and status<>'declined';
 if not found then raise exception 'Assignment not found'; end if;
end $$;
create function public.remove_assignment(p_assignment uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 delete from public.shift_assignments a using public.event_shifts s where a.id=p_assignment and s.id=a.shift_id and public.manages_event(s.event_id);
 if not found then raise exception 'Not authorized'; end if;
end $$;
create function public.moderate(p_action text,p_target uuid,p_reason text) returns void
language plpgsql security definer set search_path='' as $$ begin
 if not public.is_platform_admin() or length(trim(p_reason))<10 then raise exception 'Moderator and reason required'; end if;
 case p_action
 when 'verify_club' then update public.clubs set verified=true where id=p_target;
 when 'disable_event' then update public.events set status='disabled' where id=p_target;
 when 'disable_user' then
  if p_target=auth.uid() then raise exception 'Cannot disable yourself'; end if;
  update public.profiles set disabled=true where id=p_target;
 when 'resolve_report' then update public.reports set status='resolved' where id=p_target;
 else raise exception 'Unknown moderation action'; end case;
 insert into public.moderation_log(actor_id,action,target_id,reason) values(auth.uid(),p_action,p_target,p_reason);
end $$;
-- PostgreSQL defaults to PUBLIC function execution; explicitly narrow the RPC surface.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.active_user(),public.is_platform_admin(),public.is_club_admin(uuid),public.manages_event(uuid),public.on_team(uuid),public.event_visible(uuid),public.event_counts() to anon,authenticated;
grant execute on function public.create_club(text,text,uuid,text,text),public.add_member(uuid,text,text),public.add_team_member(uuid,uuid),public.save_event(uuid,uuid,jsonb),public.register_event(uuid),public.cancel_registration(uuid),public.candidate_status(uuid,uuid),public.assign_shift(uuid,uuid,text),public.respond_assignment(uuid,text),public.remove_assignment(uuid),public.moderate(text,uuid,text) to authenticated;
