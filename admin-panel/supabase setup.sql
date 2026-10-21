-- Run this in Supabase SQL Editor. Create your admin user first in Authentication > Users.
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
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects enable row level security;
-- Public website can read content/settings and published projects only.
drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Authenticated can manage site content" on public.site_content;
create policy "Authenticated can manage site content" on public.site_content for all to authenticated using (true) with check (true);
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Authenticated can manage site settings" on public.site_settings;
create policy "Authenticated can manage site settings" on public.site_settings for all to authenticated using (true) with check (true);
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects" on public.projects for select to anon, authenticated using (published = true or auth.role() = 'authenticated');
drop policy if exists "Authenticated can manage projects" on public.projects;
create policy "Authenticated can manage projects" on public.projects for all to authenticated using (true) with check (true);
-- Create a public bucket for portfolio images. Public URLs are used on the public site.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('project-images','project-images',true,12582912,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true, file_size_limit=12582912, allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif'];
drop policy if exists "Public can view project images" on storage.objects;
create policy "Public can view project images" on storage.objects for select to anon, authenticated using (bucket_id='project-images');
drop policy if exists "Authenticated can upload project images" on storage.objects;
create policy "Authenticated can upload project images" on storage.objects for insert to authenticated with check (bucket_id='project-images');
drop policy if exists "Authenticated can update project images" on storage.objects;
create policy "Authenticated can update project images" on storage.objects for update to authenticated using (bucket_id='project-images') with check (bucket_id='project-images');
drop policy if exists "Authenticated can delete project images" on storage.objects;
create policy "Authenticated can delete project images" on storage.objects for delete to authenticated using (bucket_id='project-images');
insert into public.site_settings(setting_key,setting_value) values
('facebook_url','https://www.facebook.com/p/Moir%C3%A9-Studio-61562499697661/'),
('instagram_url','https://www.instagram.com/moire_studiobd/'),
('linkedin_url','https://bd.linkedin.com/company/moire-studio-dhaka')
on conflict(setting_key) do nothing;
