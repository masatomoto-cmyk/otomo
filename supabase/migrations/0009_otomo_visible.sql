-- 姉妹サイト（DTM PICKS など）だけで登録した人を、OTOMO の公開プロフィールに出さない
-- Supabase のアカウントは姉妹サイトと共通。OTOMO で登録した人・OTOMO を使った人だけを公開する

alter table public.profiles add column otomo_visible boolean not null default false;

-- 既存の人：メールで登録した人（OTOMO の登録方法）と、OTOMO に何か書いた人は今までどおり表示
update public.profiles p set otomo_visible = true
where exists (select 1 from auth.identities i where i.user_id = p.id and i.provider = 'email')
   or exists (select 1 from public.posts where user_id = p.id)
   or exists (select 1 from public.tracks where user_id = p.id)
   or exists (select 1 from public.recruitments where user_id = p.id)
   or exists (select 1 from public.events where user_id = p.id)
   or exists (select 1 from public.comments where user_id = p.id);

-- これから登録する人：メール登録（OTOMO）なら表示、Google ログイン（DTM PICKS）なら非表示
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, otomo_visible)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '名無しさん'),
    coalesce(new.raw_app_meta_data ->> 'provider', '') = 'email'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 公開するのは otomo_visible の人だけ。本人は自分の行をいつでも読める
drop policy "profiles: 誰でも閲覧" on public.profiles;
create policy "profiles: 公開の人と本人が閲覧" on public.profiles for select
  using (otomo_visible or (select auth.uid()) = id);
