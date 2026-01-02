-- Copy dan paste script ini di SQL Editor Supabase kamu

-- 1. Buat tabel profiles (Public profiles linked to auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  bio text
);

-- 2. Enable RLS
alter table profiles enable row level security;

-- 3. Policy: Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- 4. Policy: Users can insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- 5. Policy: Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 6. Trigger: Otomatis buat entry profile saat user baru signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. STORAGE: Create avatars bucket (Jalankan manual di menu Storage jika script ini gagal)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- 8. Storage Policy: Any authenticated user can upload avatar
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

create policy "Anyone can update their own avatar"
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' AND auth.uid() = owner );
