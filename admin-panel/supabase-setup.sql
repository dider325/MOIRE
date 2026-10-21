-- MOIRÉ STUDIO CMS — run this in Supabase SQL Editor.
-- STEP 1: Create the admin email/password in Authentication > Users.
-- STEP 2: Replace the email below with that exact admin email, then run this entire script.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.site_content (
  content_key text primary key,
  content_html text not null default '',
  updated_at timestamptz not null default now()
);
create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value text not null default '',
  updated_at timestamptz not null default now()
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('2d','3d')),
  space text not null default '',
  year text not null default '',
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_moire_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;
grant execute on function public.is_moire_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects enable row level security;

-- Remove permissive policies from earlier versions of this CMS if present.
drop policy if exists "Public can read site content" on public.site_content;
drop policy if exists "Authenticated can manage site content" on public.site_content;
drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Authenticated can manage site settings" on public.site_settings;
drop policy if exists "Public can read published projects" on public.projects;
drop policy if exists "Authenticated can manage projects" on public.projects;
drop policy if exists "Public can view project images" on storage.objects;
drop policy if exists "Authenticated can upload project images" on storage.objects;
drop policy if exists "Authenticated can update project images" on storage.objects;
drop policy if exists "Authenticated can delete project images" on storage.objects;

drop policy if exists "Moiré admin can read admin list" on public.admin_users;
create policy "Moiré admin can read admin list" on public.admin_users for select to authenticated using (user_id = auth.uid() and public.is_moire_admin());
drop policy if exists "Public can read website content" on public.site_content;
create policy "Public can read website content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Moiré admins manage website content" on public.site_content;
create policy "Moiré admins manage website content" on public.site_content for all to authenticated using (public.is_moire_admin()) with check (public.is_moire_admin());
drop policy if exists "Public can read website settings" on public.site_settings;
create policy "Public can read website settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Moiré admins manage website settings" on public.site_settings;
create policy "Moiré admins manage website settings" on public.site_settings for all to authenticated using (public.is_moire_admin()) with check (public.is_moire_admin());
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects" on public.projects for select to anon, authenticated using (published = true or public.is_moire_admin());
drop policy if exists "Moiré admins manage projects" on public.projects;
create policy "Moiré admins manage projects" on public.projects for all to authenticated using (public.is_moire_admin()) with check (public.is_moire_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('project-images','project-images',true,12582912,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true,file_size_limit=12582912,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif'];
drop policy if exists "Public can view Moiré images" on storage.objects;
create policy "Public can view Moiré images" on storage.objects for select to anon, authenticated using (bucket_id='project-images');
drop policy if exists "Moiré admins upload images" on storage.objects;
create policy "Moiré admins upload images" on storage.objects for insert to authenticated with check (bucket_id='project-images' and public.is_moire_admin());
drop policy if exists "Moiré admins update images" on storage.objects;
create policy "Moiré admins update images" on storage.objects for update to authenticated using (bucket_id='project-images' and public.is_moire_admin()) with check (bucket_id='project-images' and public.is_moire_admin());
drop policy if exists "Moiré admins delete images" on storage.objects;
create policy "Moiré admins delete images" on storage.objects for delete to authenticated using (bucket_id='project-images' and public.is_moire_admin());

-- IMPORTANT: replace this placeholder with the exact email used in Authentication > Users.
insert into public.admin_users(user_id)
select id from auth.users where lower(email)=lower('REPLACE_WITH_ADMIN_EMAIL')
on conflict (user_id) do nothing;

insert into public.site_settings(setting_key,setting_value) values
('facebook_url','https://www.facebook.com/p/Moir%C3%A9-Studio-61562499697661/'),
('instagram_url','https://www.instagram.com/moire_studiobd/'),
('linkedin_url','https://bd.linkedin.com/company/moire-studio-dhaka')
on conflict (setting_key) do nothing;
