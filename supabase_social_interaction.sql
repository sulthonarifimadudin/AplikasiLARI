-- 1. Enable Public Read for Activities (So everyone can see other's activities)
drop policy if exists "Users can only see their own activities" on activities;
create policy "Activities are viewable by everyone"
  on activities for select
  using ( true );

-- 2. Create LIKES table
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  activity_id bigint references activities(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, activity_id) -- One user can like an activity only once
);

alter table likes enable row level security;

create policy "Likes are viewable by everyone"
  on likes for select
  using ( true );

create policy "Authenticated users can insert likes"
  on likes for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can delete their own likes"
  on likes for delete
  using ( auth.uid() = user_id );

-- 3. Create COMMENTS table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  activity_id bigint references activities(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select
  using ( true );

create policy "Authenticated users can insert comments"
  on comments for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can delete their own comments"
  on comments for delete
  using ( auth.uid() = user_id );

-- 4. View for Comments with Profile Data (To easily show avatar/name in comments list)
create or replace view comments_with_profiles as
select 
  c.id,
  c.user_id,
  c.activity_id,
  c.content,
  c.created_at,
  p.username,
  p.full_name,
  p.avatar_url
from comments c
join profiles p on c.user_id = p.id
order by c.created_at asc;

grant select on comments_with_profiles to anon, authenticated, service_role;
