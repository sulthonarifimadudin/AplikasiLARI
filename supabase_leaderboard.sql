-- View untuk Leaderboard (Total Jarak)
create or replace view leaderboard as
select 
  p.id as user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  coalesce(sum(a.distance), 0) as total_distance
from profiles p
left join activities a on p.id = a.user_id
group by p.id, p.username, p.full_name, p.avatar_url
order by total_distance desc;

-- Berikan akses select ke public
grant select on leaderboard to anon, authenticated, service_role;
