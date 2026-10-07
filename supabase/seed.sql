-- LOCAL DEVELOPMENT ONLY. Never load demo auth accounts into a production project.
create extension if not exists pgcrypto with schema extensions;
insert into public.universities(id,name,timezone) values('00000000-0000-4000-8000-000000000001','Meridian University','Asia/Kuala_Lumpur') on conflict do nothing;
do $$ declare i integer; uid uuid; names text[]:=array['Aisha Rahman','Daniel Tan','Mei Lin','Arjun Kumar','Sofia Lim','Platform Reviewer'];
begin
 for i in 1..6 loop
  uid:=('00000000-0000-4000-8000-'||lpad((1000+i)::text,12,'0'))::uuid;
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
  values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',(array['organizer','committee','student','volunteer','student2','moderator'])[i]||'@campusflow.example',extensions.crypt('CampusFlowDemo!2026',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}',jsonb_build_object('display_name',names[i]),now(),now(),'','','','') on conflict(id) do nothing;
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,created_at,updated_at)
  values(uid,uid,uid::text,jsonb_build_object('sub',uid::text,'email',(array['organizer','committee','student','volunteer','student2','moderator'])[i]||'@campusflow.example'),'email',now(),now()) on conflict do nothing;
  update public.profiles set university_id='00000000-0000-4000-8000-000000000001' where id=uid;
 end loop;
end $$;
insert into public.platform_admins values('00000000-0000-4000-8000-000000001006') on conflict do nothing;
do $$ declare i integer; cid uuid; eid uuid; rid uuid; sid uuid; start_time timestamptz;
 names text[]:=array['Creative Arts Society','Developer Student Club','Outdoor & Adventure','Career Collective','Green Campus','Mindful Students','Science Society','International Students'];
 titles text[]:=array['Open Mic Under the Stars','Build Your First App','Sunrise Trail Walk','Meet Your Future: Career Mixer','Campus Garden Morning','Pause & Breathe','Science After Hours','Around the World Potluck','Printmaking Studio','Hack for Good Weekend','Friday Futsal','CV Clinic & Headshots','Swap, Don’t Shop','Yoga on the Lawn','Astronomy on the Roof','Language Exchange Café','Campus Film Night','Design to Code Workshop','Climbing for Beginners','Internship Stories'];
 categories text[]:=array['Arts & Culture','Technology','Sports','Career','Community','Wellbeing','Academic','Social'];
begin
 for i in 0..7 loop
  cid:=('00000000-0000-4000-8000-'||lpad((10+i)::text,12,'0'))::uuid;
  insert into public.clubs(id,university_id,name,slug,description,contact_email,verified,created_by)
  values(cid,'00000000-0000-4000-8000-000000000001',names[i+1],trim(both '-' from regexp_replace(lower(names[i+1]),'[^a-z0-9]+','-','g')),'A welcoming student community with workshops, socials, and hands-on opportunities. Everyone is welcome.','organizer@campusflow.example',i<6,'00000000-0000-4000-8000-000000001001') on conflict do nothing;
  insert into public.club_memberships(club_id,user_id,role) values(cid,'00000000-0000-4000-8000-000000001001','admin'),(cid,'00000000-0000-4000-8000-000000001002','committee'),(cid,'00000000-0000-4000-8000-000000001004','committee') on conflict do nothing;
 end loop;
 for i in 0..19 loop
  cid:=('00000000-0000-4000-8000-'||lpad((10+i%8)::text,12,'0'))::uuid;
  eid:=('00000000-0000-4000-8000-'||lpad((100+i)::text,12,'0'))::uuid;
  start_time:=date_trunc('day',now())+make_interval(days=>1+i/3,hours=>10+i%4*2);
  insert into public.events(id,club_id,title,slug,description,category,venue,starts_at,ends_at,registration_opens_at,registration_closes_at,capacity,price,waitlist_enabled,status,contact_email)
  values(eid,cid,titles[i+1],trim(both '-' from regexp_replace(lower(titles[i+1]),'[^a-z0-9]+','-','g'))||'-'||(100+i)::text,'Meet students from across campus, learn something new, and make a few good memories. No previous experience needed. Bring your student ID and arrive 15 minutes early. Contact the organizers for accessibility arrangements.',categories[1+i%8],'Student Centre · Main Hall',start_time,start_time+interval '2 hours',now()-interval '7 days',start_time,40+i*5,case when i%5=0 then 10 else 0 end,true,'published','organizer@campusflow.example') on conflict do nothing;
  insert into public.event_registrations(event_id,user_id,status) values(eid,'00000000-0000-4000-8000-000000001003','registered'),(eid,'00000000-0000-4000-8000-000000001005','registered') on conflict do nothing;
  insert into public.event_team_members(event_id,user_id) values(eid,'00000000-0000-4000-8000-000000001002'),(eid,'00000000-0000-4000-8000-000000001004') on conflict do nothing;
  rid:=('00000000-0000-4000-8000-'||lpad((200+i)::text,12,'0'))::uuid;
  insert into public.event_team_roles(id,event_id,name) values(rid,eid,'Registration & welcome') on conflict do nothing;
  sid:=('00000000-0000-4000-8000-'||lpad((300+i)::text,12,'0'))::uuid;
  insert into public.event_shifts(id,event_id,role_id,name,description,location,starts_at,ends_at,required_people)
  values(sid,eid,rid,'Welcome desk','Greet attendees, check names, and help everyone find their way.','Main entrance',start_time-interval '30 minutes',start_time+interval '1 hour',3) on conflict do nothing;
  insert into public.event_availability(id,event_id,user_id,starts_at,ends_at) values(('00000000-0000-4000-8000-'||lpad((400+i)::text,12,'0'))::uuid,eid,'00000000-0000-4000-8000-000000001002',start_time-interval '1 hour',start_time+interval '2 hours') on conflict do nothing;
  insert into public.shift_assignments(shift_id,user_id,assigned_by,status) values(sid,'00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000001001','pending') on conflict do nothing;
 end loop;
end $$;
