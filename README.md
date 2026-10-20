# MOIRÉ STUDIO — Website + Admin Panel

This project is intentionally separated so the website files and admin-only files are not mixed together.

## Folder structure

- `index.html`, `about.html`, `projects.html`, `services.html`, `contact.html`, `faq.html`, `project.html` — public website pages
- `styles.css`, `script.js`, `cms.js`, `supabase-config.js` — public website styling/runtime/CMS connection
- `assets/` — website and project images
- `admin-panel/` — private dashboard files only (`admin.html`, `admin.css`, `admin.js`, `supabase-config.js`, `supabase-setup.sql`)

## Deploy

1. Upload the **contents of this folder** to the website's hosting root so `index.html` opens at the domain root. Keep `admin-panel/` and `assets/` in place.
2. Open `admin-panel/supabase-setup.sql` and run it in the Supabase SQL Editor.
3. Create the admin login in Supabase Authentication (email/password).
4. Add the Supabase Project URL and anon/public key in **both** `supabase-config.js` (website CMS) and `admin-panel/supabase-config.js` (dashboard). Never put the service-role key in either file.
5. Open `/admin-panel/admin.html` to sign in.

## What the admin controls

- Website text for supported `[data-cms-key]` blocks
- Project records, 2D/3D category, gallery images, publish state
- Social links in site settings

## Notes

- The admin panel loads page markup from the website root using relative paths. Keep the folder structure intact after deployment.
- Supabase Storage bucket/policies and Row Level Security are configured by the SQL setup script.
- Use HTTPS in production. The Supabase anon key is public by design; access protection must come from correct RLS policies and Auth.
