-- プロフィールのアイコン画像
-- 画像は Storage の avatars バケットに「<ユーザーID>/<ファイル名>」で置き、公開 URL を profiles.avatar_url に入れる

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- 自分のフォルダにだけ置ける・消せる（公開 URL での表示にポリシーは不要。一覧取得は本人のフォルダだけ）
create policy "avatars: 本人のフォルダを閲覧" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: 本人のフォルダに追加" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: 本人のフォルダから削除" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.profiles
  add column avatar_url text not null default ''
    check (avatar_url = '' or avatar_url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/avatars/');
