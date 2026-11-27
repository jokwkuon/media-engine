insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('media-engine-assets','media-engine-assets',false,6291456,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy media_engine_assets_read on storage.objects for select to authenticated
using (bucket_id='media-engine-assets' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.brands b where b.owner_id=(select auth.uid()) and b.id::text=(storage.foldername(storage.objects.name))[2]));
create policy media_engine_assets_upload on storage.objects for insert to authenticated
with check (bucket_id='media-engine-assets' and (storage.foldername(name))[1]=(select auth.uid())::text and array_length(storage.foldername(name),1)=2 and exists(select 1 from public.brands b where b.owner_id=(select auth.uid()) and b.id::text=(storage.foldername(storage.objects.name))[2]));
create policy media_engine_assets_remove on storage.objects for delete to authenticated
using (bucket_id='media-engine-assets' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.brands b where b.owner_id=(select auth.uid()) and b.id::text=(storage.foldername(storage.objects.name))[2]));
;
