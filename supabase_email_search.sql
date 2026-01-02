-- 1. Tambah kolom email ke tabel profiles
alter table profiles 
add column email text;

-- 2. Update Trigger agar email otomatis masuk saat register baru
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- 3. (Optional) Backfill email untuk user lama (Hanya bisa jalan kalau user punya privileges tinggi, atau dijalankan manual per user)
-- Script di bawah ini mungkin gagal jika RLS aktif, tapi dicoba saja via SQL Editor:
-- update profiles p set email = u.email from auth.users u where p.id = u.id;
