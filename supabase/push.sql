-- Satır Arası: haftalık bildirimler için abonelik tablosu.
-- Supabase > SQL Editor'de bir kez çalıştır. Tabloya yalnızca sunucu (service_role anahtarı) erişir.
create table if not exists public.push_subs (
  endpoint text primary key,
  sub jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;   -- politika yok: tarayıcıdan kimse okuyamaz/yazamaz
