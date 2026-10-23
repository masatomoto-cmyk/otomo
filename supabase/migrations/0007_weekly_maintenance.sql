-- 週1回（月曜 3:00 JST）の自動お掃除
-- データベースの中だけで完結する機械的な処理をここに置く。点検とレポートは Claude の週次タスクが行う

create function private.weekly_maintenance()
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  n_notifications int;
  n_cache int;
  n_cron int;
begin
  -- 既読から90日、または作成から180日たった通知
  delete from public.notifications
  where (read_at is not null and read_at < now() - interval '90 days')
     or created_at < now() - interval '180 days';
  get diagnostics n_notifications = row_count;

  -- 外部ライブ情報のキャッシュ（2日以上前のもの）
  delete from public.external_events_cache where fetched_at < now() - interval '2 days';
  get diagnostics n_cache = row_count;

  -- 定期実行の履歴（15分ごとの通知メールで増え続けるため14日分だけ残す）
  delete from cron.job_run_details where end_time < now() - interval '14 days';
  get diagnostics n_cron = row_count;

  return jsonb_build_object(
    'ran_at', now(),
    'deleted_notifications', n_notifications,
    'deleted_cache', n_cache,
    'deleted_cron_history', n_cron
  );
end;
$$;

revoke execute on function private.weekly_maintenance() from public, anon, authenticated;

-- 月曜 3:00 JST = 日曜 18:00 UTC
select cron.schedule('weekly-maintenance', '0 18 * * 0', $$ select private.weekly_maintenance(); $$);
