-- Satır Arası: adsız kullanım sayacı (gün, olay adı, ülke kodu). Kişi/IP/içerik saklanmaz.
-- Zaten Supabase'e uygulandı (migration: app_events_counter). Yeniden kurmak için çalıştırılabilir.
create table if not exists public.app_events (
  day date not null, name text not null, country text not null default 'XX',
  n int not null default 0, last_at timestamptz not null default now(),
  primary key (day, name, country)
);
alter table public.app_events enable row level security;
create or replace function public.bump_event(p_name text, p_country text)
returns void language sql security definer set search_path = public as $$
  insert into public.app_events(day, name, country, n, last_at)
  values (current_date, left(p_name, 40), upper(left(coalesce(nullif(p_country, ''), 'XX'), 2)), 1, now())
  on conflict (day, name, country) do update set n = public.app_events.n + 1, last_at = now()
$$;
revoke all on function public.bump_event(text, text) from public, anon, authenticated;
grant execute on function public.bump_event(text, text) to service_role;
