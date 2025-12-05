-- Create a table for public profiles
create table profiles (
  wallet_address text primary key,
  username text unique,
  updated_at timestamp with time zone,
  avatar_url text,
  website text
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (true); 

create policy "Users can update own profile." on profiles
  for update using (true);

-- Function to get player rank based on wallet or username
-- Returns the rank (1-based index) of the player's high score
create or replace function get_player_rank(search_query text)
returns table(rank bigint, score bigint, username text, wallet_address text) 
language plpgsql
as $$
begin
  return query
  with ranked_scores as (
    select 
      gs.wallet_address,
      gs.score,
      p.username,
      rank() over (order by gs.score desc) as r
    from game_scores gs
    left join profiles p on gs.wallet_address = p.wallet_address
  )
  select 
    r as rank,
    rs.score,
    rs.username,
    rs.wallet_address
  from ranked_scores rs
  where rs.wallet_address = search_query or rs.username = search_query
  limit 1;
end;
$$;
