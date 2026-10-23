-- OTOMO 初期スキーマ
-- 閲覧は誰でも可、作成・編集・削除は本人のみ（RLS）

-- プロフィール（auth.users と 1:1）
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '名無しさん',
  bio text not null default '',
  parts text[] not null default '{}',
  genres text[] not null default '{}',
  area text not null default '',
  link text not null default '',
  created_at timestamptz not null default now()
);

-- サインアップ時にプロフィールを自動作成
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '名無しさん'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- タイムライン投稿
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  music_url text not null default '',
  created_at timestamptz not null default now()
);

-- 作品シェア
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  url text not null,
  description text not null default '',
  genre text not null default '',
  want_feedback boolean not null default true,
  created_at timestamptz not null default now()
);

-- メンバー募集
create table public.recruitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  body text not null default '',
  parts text[] not null default '{}',
  genres text[] not null default '{}',
  area text not null default '',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- ライブ・イベント
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  body text not null default '',
  venue text not null default '',
  area text not null default '',
  starts_at timestamptz not null,
  url text not null default '',
  created_at timestamptz not null default now()
);

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- コメントといいね（posts / tracks / recruitments / events 共通）
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'track', 'recruitment', 'event')),
  target_id uuid not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.likes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'track', 'recruitment', 'event')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index on public.posts (created_at desc);
create index on public.tracks (created_at desc);
create index on public.recruitments (created_at desc);
create index on public.events (starts_at);
create index on public.comments (target_type, target_id, created_at);
create index on public.likes (target_type, target_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tracks enable row level security;
alter table public.recruitments enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

create policy "profiles: 誰でも閲覧" on public.profiles for select using (true);
create policy "profiles: 本人が更新" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['posts', 'tracks', 'recruitments', 'events', 'event_attendees', 'comments', 'likes'] loop
    execute format('create policy "%1$s: 誰でも閲覧" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s: 本人が作成" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: 本人が削除" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
  foreach t in array array['posts', 'tracks', 'recruitments', 'events', 'comments'] loop
    execute format('create policy "%1$s: 本人が更新" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
