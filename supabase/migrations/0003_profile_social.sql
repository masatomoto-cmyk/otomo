-- プロフィールの SNS リンク（Instagram / X / YouTube）
-- 画面側でも整えるが、javascript: などを入れられないよう DB でも https の該当ドメインだけに制限する
alter table public.profiles
  add column instagram text not null default ''
    check (instagram = '' or (char_length(instagram) <= 200 and instagram ~ '^https://(www\.)?instagram\.com/')),
  add column x text not null default ''
    check (x = '' or (char_length(x) <= 200 and x ~ '^https://(www\.)?(x|twitter)\.com/')),
  add column youtube text not null default ''
    check (youtube = '' or (char_length(youtube) <= 200 and youtube ~ '^https://((www|m)\.)?(youtube\.com|youtu\.be)/'));
