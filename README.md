# MOIRÉ STUDIO — Website + Admin Panel

## Website files
- Public pages: `index.html`, `about.html`, `services.html`, `projects.html`, `project.html`, `contact.html`, `faq.html`
- Public CMS: `cms.js` + `supabase-config.js`
- Private admin: `admin-panel/`
- Assets: `assets/`

## Deploy
1. Extract the ZIP and deploy the **contents of `MOIRE WEB FORMAL`** to the hosting root. Keep `assets/`, `admin-panel/`, and all HTML/JS/CSS files together.
2. In Supabase Authentication → Users, create the admin email/password first.
3. Open `admin-panel/supabase-setup.sql`, replace `REPLACE_WITH_ADMIN_EMAIL` with the admin account email, then run the full script in Supabase SQL Editor.
4. Both `supabase-config.js` and `admin-panel/supabase-config.js` already contain the public project URL and anon key. Never put a service-role key in browser code.
5. Open `https://YOUR-DOMAIN/admin-panel/admin.html` and sign in.

## Editing
- Page editor: text and images for elements marked as editable on all seven existing pages.
- Project library: add/edit/delete projects, upload multiple photos, remove or reorder photos using the arrow controls, and publish/unpublish. First photo is the cover.
- Social links: edit Facebook, Instagram and LinkedIn URLs.
- Uploaded images are stored in Supabase Storage, not only in the browser.

## Important
The admin uses Supabase Auth + Row Level Security. The SQL script must be run and the correct admin email must be entered before admin actions will work. Public project changes appear on the Projects page after it reloads.
