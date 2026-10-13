-- Satır Arası: hesaplar, kullanıcıya özel veri, abonelik durumu ve davet kodu.
-- Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştır. Tekrar çalıştırmak güvenlidir.

-- ========== Tablolar ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  free boolean not null default false,          -- davet koduyla ücretsiz erişim
  plan text not null default 'none',            -- 'none' | 'active' (ödeme eklenince)
  paid_until timestamptz,                       -- aktif aboneliğin bitiş tarihi
  created_at timestamptz not null default now()
);

create table if not exists public.user_state (  -- raf, favoriler, notlar, hedef + alıntı önbelleği
  user_id uuid primary key references auth.users(id) on delete cascade,
  lib jsonb not null default '{}'::jsonb,
  books jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (     -- kayıtlı tasarımlar
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  at bigint,
  thumb text,
  state jsonb,
  photo text,
  primary key (user_id, id)
);

create table if not exists public.invite_codes (
  code text primary key,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  note text
);

create table if not exists public.usage (       -- kullanıcı başına günlük yapay zekâ isteği sayısı
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  n int not null default 0,
  primary key (user_id, day)
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
insert into public.app_settings(key, value) values ('billing_enabled', 'false') on conflict (key) do nothing;

-- ========== Satır düzeyi güvenlik: herkes yalnızca kendi verisini görür ==========
alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.designs enable row level security;
alter table public.invite_codes enable row level security;   -- politika yok: kimse doğrudan okuyamaz
alter table public.usage enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "kendi profilim" on public.profiles;
create policy "kendi profilim" on public.profiles for select using (auth.uid() = id);   -- yazma yok: kimse kendini ücretsiz yapamaz

drop policy if exists "kendi durumum" on public.user_state;
create policy "kendi durumum" on public.user_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "kendi tasarimlarim" on public.designs;
create policy "kendi tasarimlarim" on public.designs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ayarlar herkese acik okunur" on public.app_settings;
create policy "ayarlar herkese acik okunur" on public.app_settings for select using (true);

-- ========== Yeni üye olunca profil oluştur ==========
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ========== Davet kodu: tek kullanımlık, ücretsiz erişim verir ==========
create or replace function public.redeem_invite(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean := false;
begin
  if auth.uid() is null then return false; end if;
  update public.invite_codes set used_by = auth.uid(), used_at = now()
   where code = upper(trim(p_code)) and used_by is null;
  if found then
    insert into public.profiles (id, free) values (auth.uid(), true)
      on conflict (id) do update set free = true;
    ok := true;
  end if;
  return ok;
end $$;
revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;

-- ========== Günlük istek sınırı (ortak yapay zekâ kotasını korur) ==========
create or replace function public.bump_usage(p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare c int;
begin
  if auth.uid() is null then return false; end if;
  insert into public.usage(user_id, day, n) values (auth.uid(), current_date, 1)
    on conflict (user_id, day) do update set n = public.usage.n + 1 returning n into c;
  return c <= p_max;
end $$;
revoke all on function public.bump_usage(int) from public;
grant execute on function public.bump_usage(int) to authenticated;

-- ========== Hesabımdaki verileri sil ==========
create or replace function public.delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  delete from public.designs where user_id = auth.uid();
  delete from public.user_state where user_id = auth.uid();
  delete from public.usage where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end $$;
revoke all on function public.delete_my_data() from public;
grant execute on function public.delete_my_data() to authenticated;

-- ========== Senin yapacakların ==========
-- 1) Ücretsiz kalacak arkadaşın için tek kullanımlık davet kodu üret (kodu istediğin gibi değiştir):
--    insert into public.invite_codes(code, note) values ('KITAPKURDU-2026', 'ücretsiz arkadaş');
-- 2) Ödeme sistemi hazır olunca abonelik zorunluluğunu aç:
--    update public.app_settings set value = 'true' where key = 'billing_enabled';
-- 3) Birine elle ücretsiz erişim vermek istersen:
--    update public.profiles set free = true where email = 'ornek@gmail.com';
