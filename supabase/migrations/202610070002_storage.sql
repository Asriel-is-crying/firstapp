insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('campus-images','campus-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
-- Object paths: profiles/<user UUID>/<random filename>, clubs/<club UUID>/..., events/<event UUID>/...
create function public.can_upload_image(object_name text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[]; entity uuid;
begin
 if not public.active_user() then return false; end if;
 parts:=string_to_array(object_name,'/');
 if array_length(parts,1)<>3 then return false; end if;
 begin entity:=parts[2]::uuid; exception when invalid_text_representation then return false; end;
 return (parts[1]='profiles' and entity=auth.uid()) or (parts[1]='clubs' and public.is_club_admin(entity)) or (parts[1]='events' and public.manages_event(entity));
end $$;
revoke all on function public.can_upload_image(text) from public;
grant execute on function public.can_upload_image(text) to authenticated;
create policy campus_images_read on storage.objects for select using(bucket_id='campus-images');
create policy campus_images_insert on storage.objects for insert to authenticated with check(bucket_id='campus-images' and public.can_upload_image(name));
create policy campus_images_delete on storage.objects for delete to authenticated using(bucket_id='campus-images' and public.can_upload_image(name));
