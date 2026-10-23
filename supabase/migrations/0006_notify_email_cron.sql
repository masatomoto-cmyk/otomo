-- 通知メールのまとめ送信を15分ごとに起動する
-- Edge Function notify-email は、Vault に入れた合言葉（notify_cron_token）を持つ呼び出しだけを受け付ける

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'notify_cron_token');

create function public.check_notify_token(token text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'notify_cron_token' and decrypted_secret = token);
$$;
revoke execute on function public.check_notify_token(text) from public, anon, authenticated;
grant execute on function public.check_notify_token(text) to service_role;

select cron.schedule(
  'notify-email',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://dujgchiimsvnkuqidodp.supabase.co/functions/v1/notify-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-token', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_cron_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
