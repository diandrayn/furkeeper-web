-- Run this AFTER creating the "service-images" bucket (Storage → New
-- bucket, Public bucket = ON) in the Supabase dashboard. Mirrors
-- storage_policies.sql but for the service-provider photo bucket.

create policy "providers upload own service images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'service-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "providers update own service images"
on storage.objects for update to authenticated
using (
  bucket_id = 'service-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "providers delete own service images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'service-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
