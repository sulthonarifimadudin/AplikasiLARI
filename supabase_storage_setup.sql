-- 1. Tambah kolom photo_url ke tabel activities
alter table activities 
add column if not exists photo_url text;

-- 2. Buat Storage Bucket 'activity-photos'
-- Note: Insert ke table 'buckets' di schema 'storage'
insert into storage.buckets (id, name, public)
values ('activity-photos', 'activity-photos', true)
on conflict (id) do nothing;

-- 3. Policy Storage: User bisa upload filenya sendiri
-- (Policy agak tricky via SQL karena tergantung versi Supabase, tapi ini standard)
create policy "User can upload own photo"
on storage.objects for insert
with check (
  bucket_id = 'activity-photos' AND
  auth.uid() = owner
);

create policy "Public can view photos"
on storage.objects for select
using ( bucket_id = 'activity-photos' );

-- NOTE: Kalau policy storage gagal via script, set manual di Dashboard Supabase:
-- Menu Storage -> activity-photos -> Configuration -> Policies
