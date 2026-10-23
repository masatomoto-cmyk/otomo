-- 通報・ブロック、外部イベントのキャッシュ

-- API に公開しないスキーマ（RLS から呼ぶ security definer 関数を置く）
create schema if not exists private;
grant usage on schema private to authenticated;

-- 投稿・作品などの持ち主を返す
create function private.target_owner(t text, target uuid)
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select case t
    when 'post' then (select user_id from public.posts where id = target)
    when 'track' then (select user_id from public.tracks where id = target)
    when 'recruitment' then (select user_id from public.recruitments where id = target)
    when 'event' then (select user_id from public.events where id = target)
    when 'comment' then (select user_id from public.comments where id = target)
    when 'profile' then target
  end;
$$;

-- ブロック: blocker は blocked のコンテンツを見ない。blocked は blocker の投稿にコメント・リアクションできない
create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;
create policy "blocks: 本人だけ閲覧" on public.blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);
create policy "blocks: 本人が作成" on public.blocks for insert to authenticated
  with check ((select auth.uid()) = blocker_id);
create policy "blocks: 本人が解除" on public.blocks for delete to authenticated
  using ((select auth.uid()) = blocker_id);

-- 対象の持ち主にブロックされているか（blocks の RLS を越えて調べるため definer）
create function private.is_blocked_by_owner(t text, target uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where blocker_id = private.target_owner(t, target)
      and blocked_id = (select auth.uid())
  );
$$;

revoke execute on function private.target_owner(text, uuid) from public, anon;
revoke execute on function private.is_blocked_by_owner(text, uuid) from public, anon;
grant execute on function private.target_owner(text, uuid) to authenticated;
grant execute on function private.is_blocked_by_owner(text, uuid) to authenticated;

drop policy "comments: 本人が作成" on public.comments;
create policy "comments: 本人が作成（ブロックされていなければ）" on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id and not private.is_blocked_by_owner(target_type, target_id));

drop policy "reactions: 本人が作成" on public.reactions;
create policy "reactions: 本人が作成（ブロックされていなければ）" on public.reactions for insert to authenticated
  with check ((select auth.uid()) = user_id and not private.is_blocked_by_owner(target_type, target_id));

-- 通報: 送った本人だけが見られる。運営は Supabase ダッシュボードで確認する
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'track', 'recruitment', 'event', 'comment', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'impersonation', 'other')),
  detail text not null default '' check (char_length(detail) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index on public.reports (status, created_at desc);

alter table public.reports enable row level security;
create policy "reports: 本人だけ閲覧" on public.reports for select to authenticated
  using ((select auth.uid()) = reporter_id);
create policy "reports: 本人が作成" on public.reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id and status = 'open');

-- 外部イベント API の結果キャッシュ（Edge Function が service role で読み書きする。クライアントからは触らない）
create table public.external_events_cache (
  key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.external_events_cache enable row level security;
