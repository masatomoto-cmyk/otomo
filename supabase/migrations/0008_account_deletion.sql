-- 退会の準備: 退会する人の投稿・作品・募集・イベントに付いた「他の人の」コメントと通知を消す。
-- （コメントや通知は target_id で投稿を指しているだけで外部キーがないため、アカウント削除の連鎖では消えない）
-- 本人のデータそのものは、auth.users を消すと profiles 経由の on delete cascade で全部消える。
-- Edge Function delete-account が service role で呼ぶ。

create function public.prepare_account_deletion(target_user uuid)
returns void
language sql
security definer set search_path = ''
as $$
  with owned as (
    select 'post' as target_type, id as target_id from public.posts where user_id = target_user
    union all select 'track', id from public.tracks where user_id = target_user
    union all select 'recruitment', id from public.recruitments where user_id = target_user
    union all select 'event', id from public.events where user_id = target_user
  ),
  del_comments as (
    delete from public.comments c using owned o
    where c.target_type = o.target_type and c.target_id = o.target_id
  )
  delete from public.notifications n using owned o
  where n.target_type = o.target_type and n.target_id = o.target_id;
$$;

revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
