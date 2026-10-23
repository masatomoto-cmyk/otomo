-- 通知（アプリ内のベル＋メールのまとめ送信）
-- コメント・応募・リアクション・参加表明があったら、トリガーで相手への通知を作る

alter table public.profiles add column email_notifications boolean not null default true;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade, -- 受け取る人
  actor_id uuid not null references public.profiles (id) on delete cascade, -- 行動した人
  type text not null check (type in ('comment', 'apply', 'reaction', 'attend')),
  target_type text not null check (target_type in ('post', 'track', 'recruitment', 'event')),
  target_id uuid not null,
  kind text not null default '', -- リアクションの種類
  excerpt text not null default '', -- コメントの冒頭
  created_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz
);

create index on public.notifications (user_id, created_at desc);
create index on public.notifications (created_at) where emailed_at is null;

alter table public.notifications enable row level security;
create policy "notifications: 本人だけ閲覧" on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "notifications: 本人が既読にする" on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- 既読にする以外の書き換えはさせない
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;
revoke insert, delete on public.notifications from authenticated, anon;

create function private.notify(recipient uuid, actor uuid, t text, ttype text, tid uuid, k text, ex text)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.notifications (user_id, actor_id, type, target_type, target_id, kind, excerpt)
  select recipient, actor, t, ttype, tid, k, left(ex, 120)
  where recipient is not null and recipient <> actor;
$$;

create function private.on_comment_created()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform private.notify(
    private.target_owner(new.target_type, new.target_id), new.user_id,
    case when new.target_type = 'recruitment' then 'apply' else 'comment' end,
    new.target_type, new.target_id, '', new.body);
  return new;
end;
$$;

create function private.on_reaction_created()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform private.notify(new.owner_id, new.user_id, 'reaction', new.target_type, new.target_id, new.kind, '');
  return new;
end;
$$;

create function private.on_attend_created()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform private.notify(private.target_owner('event', new.event_id), new.user_id, 'attend', 'event', new.event_id, '', '');
  return new;
end;
$$;

create trigger comments_notify after insert on public.comments
  for each row execute function private.on_comment_created();
create trigger reactions_notify after insert on public.reactions
  for each row execute function private.on_reaction_created();
create trigger event_attendees_notify after insert on public.event_attendees
  for each row execute function private.on_attend_created();

revoke execute on function private.notify(uuid, uuid, text, text, uuid, text, text) from public, anon, authenticated;
revoke execute on function private.on_comment_created() from public, anon, authenticated;
revoke execute on function private.on_reaction_created() from public, anon, authenticated;
revoke execute on function private.on_attend_created() from public, anon, authenticated;
