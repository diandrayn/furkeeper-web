-- Run this AFTER creating the "product-images" bucket (Storage → New bucket,
-- Public bucket = ON) in the Supabase dashboard.
--
-- Files are uploaded under a path like "<user_id>/<random>.jpg" — these
-- policies only let a seller write inside their own "<user_id>/..." folder.
-- Reading is already open to everyone because the bucket is public.

create policy "sellers upload own product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "sellers update own product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "sellers delete own product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
