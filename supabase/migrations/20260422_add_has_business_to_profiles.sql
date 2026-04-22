alter table if exists public.profiles
add column if not exists has_business boolean not null default false;

alter table if exists public.public_profiles
add column if not exists has_business boolean not null default false;
