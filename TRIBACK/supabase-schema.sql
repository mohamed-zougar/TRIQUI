-- TriQI+ database schema for Supabase.
-- Run this file once in the Supabase SQL Editor. Re-running is safe.

-- ============================================================
-- users
-- ============================================================
create table if not exists public.users (
  id              bigserial primary key,
  account_type    varchar(20) not null default 'individual'
                    check (account_type in ('individual', 'enterprise')),
  first_name      varchar(100) not null,
  last_name       varchar(100) not null,
  company_name    varchar(255),
  company_address text,
  company_website varchar(255),
  date_of_birth   date,
  email           varchar(255) unique,
  phone           varchar(20)  not null unique,
  password        varchar(255) not null,
  role            varchar(50)  not null default 'user',
  image           text,
  operating_city  varchar(120),
  delivery_focus  varchar(120),
  vehicle_type    varchar(80),
  company_size    varchar(80),
  average_daily_orders integer,
  notifications_enabled  boolean not null default true,
  email_verified         boolean not null default false,
  email_verified_at      timestamptz,
  onboarding_completed   boolean not null default false,
  onboarding_completed_at timestamptz,
  status          text default 'available',
  otp_code        varchar(6),
  otp_expires_at  timestamptz,
  otp_purpose     varchar(20),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint users_enterprise_fields_check check (
    account_type = 'individual'
    or (company_name is not null and company_address is not null)
  )
);

alter table public.users add column if not exists email_verified boolean not null default false;
alter table public.users add column if not exists email_verified_at timestamptz;
alter table public.users add column if not exists otp_purpose varchar(20);
alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.users add column if not exists vehicle_image text;

alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;
grant all on table public.users to service_role;

drop policy if exists users_service_role_only on public.users;
create policy users_service_role_only
  on public.users for all to service_role
  using (true) with check (true);

-- ============================================================
-- client_post (delivery requests posted by clients)
-- ============================================================
create table if not exists public.client_post (
  id              bigserial primary key,
  "user"          bigint references public.users(id) on delete set null,
  image           text,
  description     text,
  weight          numeric,
  volume          numeric,
  vehicle_type    varchar(80),
  origin_wilaya   varchar(120) not null,
  destination     varchar(120) not null,
  phone           varchar(30),
  delivery_date   date,
  status          varchar(20) not null default 'open'
                    check (status in ('open', 'matched', 'completed', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.client_post add column if not exists vehicle_type varchar(80);
alter table public.client_post add column if not exists status varchar(20) not null default 'open';
alter table public.client_post add column if not exists updated_at timestamptz not null default now();

create index if not exists client_post_origin_idx       on public.client_post (origin_wilaya);
create index if not exists client_post_destination_idx  on public.client_post (destination);
create index if not exists client_post_user_idx         on public.client_post ("user");
create index if not exists client_post_created_at_idx   on public.client_post (created_at desc);
create index if not exists client_post_status_idx       on public.client_post (status);

alter table public.client_post enable row level security;
revoke all on table public.client_post from anon, authenticated;
grant all on table public.client_post to service_role;

drop policy if exists client_post_service_role_only on public.client_post;
create policy client_post_service_role_only
  on public.client_post for all to service_role
  using (true) with check (true);

-- ============================================================
-- shipper_post (trips offered by shippers)
-- ============================================================
create table if not exists public.shipper_post (
  id                bigserial primary key,
  "user"            bigint references public.users(id) on delete set null,
  origin_wilaya     varchar(120) not null,
  destination       varchar(120) not null,
  wilaya_passage    text,
  type              varchar(80),
  weight            numeric,
  volume            numeric,
  phone             varchar(30),
  description       text,
  image             text,
  availability_date date,
  status            varchar(20) not null default 'open'
                      check (status in ('open', 'matched', 'completed', 'cancelled')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.shipper_post add column if not exists status varchar(20) not null default 'open';
alter table public.shipper_post add column if not exists updated_at timestamptz not null default now();

create index if not exists shipper_post_origin_idx       on public.shipper_post (origin_wilaya);
create index if not exists shipper_post_destination_idx  on public.shipper_post (destination);
create index if not exists shipper_post_user_idx         on public.shipper_post ("user");
create index if not exists shipper_post_created_at_idx   on public.shipper_post (created_at desc);
create index if not exists shipper_post_status_idx       on public.shipper_post (status);

alter table public.shipper_post enable row level security;
revoke all on table public.shipper_post from anon, authenticated;
grant all on table public.shipper_post to service_role;

drop policy if exists shipper_post_service_role_only on public.shipper_post;
create policy shipper_post_service_role_only
  on public.shipper_post for all to service_role
  using (true) with check (true);
