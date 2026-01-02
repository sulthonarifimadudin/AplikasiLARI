-- FIX SCRIPT: Jalankan ini di SQL Editor untuk memperbaiki data profil yang kosong

-- 1. Insert Profile untuk user yang belum punya entry di tabel profiles (Backfill)
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 2. Update Email dan Nama untuk user yang sudah ada tapi masih kosong/null
update public.profiles p
set 
  email = u.email,
  full_name = coalesce(p.full_name, u.raw_user_meta_data->>'full_name'),
  avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url')
from auth.users u
where p.id = u.id
and (p.email is null or p.full_name is null);

-- 3. Pastikan kolom email di-index biar pencarian cepat
create index if not exists profiles_email_idx on profiles (email);
