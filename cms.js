/* Moiré Studio public CMS runtime — applies saved page copy, page images, projects and social links. */
(function () {
  const ready = () => window.supabase && window.MOIRE_SUPABASE_URL && window.MOIRE_SUPABASE_ANON_KEY && !window.MOIRE_SUPABASE_URL.includes('YOUR_PROJECT_ID');
  if (!ready()) return;
  const db = window.supabase.createClient(window.MOIRE_SUPABASE_URL, window.MOIRE_SUPABASE_ANON_KEY);
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  const safe = (fn) => Promise.resolve().then(fn).catch(() => {});
  async function loadTextAndImages() {
    const { data, error } = await db.from('site_content').select('content_key,content_html').like('content_key', page + '.%');
    if (error || !Array.isArray(data)) return;
    data.forEach(row => {
      if (row.content_key.startsWith(page + '.image.')) {
        const el = document.querySelector('[data-cms-image-key="' + CSS.escape(row.content_key) + '"]');
        if (el && row.content_html) { el.src = row.content_html; el.removeAttribute('srcset'); }
        return;
      }
      const el = document.querySelector('[data-cms-key="' + CSS.escape(row.content_key) + '"]');
      if (el) el.innerHTML = row.content_html;
    });
  }
  function makeCard(project) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'portfolio-card reveal';
    const images = Array.isArray(project.images) ? project.images : [];
    card.dataset.title = project.title || 'Project';
    card.dataset.type = project.category === '2d' ? '2D Interior Design' : '3D Interior Design';
    card.dataset.space = project.space || 'Interior'; card.dataset.year = project.year || 'Selected project';
    card.dataset.description = project.description || ''; card.dataset.images = images.join('|');
    const imageWrap = document.createElement('span'); imageWrap.className = 'portfolio-image' + (project.category === '2d' ? ' plan-image' : '');
    const img = document.createElement('img'); img.src = images[0] || ''; img.alt = (project.title || 'Moiré project') + ' — project image'; img.loading = 'lazy'; imageWrap.appendChild(img);
    const info = document.createElement('span'); info.className = 'portfolio-card-info';
    const copy = document.createElement('span'); const strong = document.createElement('strong'); strong.textContent = project.title || 'Untitled project'; const small = document.createElement('small'); small.textContent = project.space || 'Interior'; copy.append(strong, small);
    const arrow = document.createElement('span'); arrow.className = 'portfolio-arrow'; arrow.textContent = '↗'; info.append(copy, arrow); card.append(imageWrap, info); return card;
  }
  async function loadProjects() {
    const grids = [...document.querySelectorAll('.portfolio-grid-2d,.portfolio-grid-3d')]; if (!grids.length) return;
    const { data, error } = await db.from('projects').select('*').eq('published', true).order('sort_order', { ascending: true });
    if (error || !Array.isArray(data) || !data.length) return;
    ['2d','3d'].forEach(category => {
      const grid = document.querySelector(category === '2d' ? '.portfolio-grid-2d' : '.portfolio-grid-3d');
      const matching = data.filter(project => project.category === category);
      if (grid) { grid.replaceChildren(); matching.forEach(project => grid.appendChild(makeCard(project))); }
    });
    document.querySelectorAll('.portfolio-card[data-title]').forEach(card => card.addEventListener('click', () => window.moireOpenProject?.(card)));
    document.dispatchEvent(new CustomEvent('moire:projects-loaded'));
  }
  async function loadSocials() {
    const { data, error } = await db.from('site_settings').select('setting_key,setting_value').in('setting_key', ['facebook_url','instagram_url','linkedin_url']);
    if (error || !Array.isArray(data)) return;
    const map = Object.fromEntries(data.map(x => [x.setting_key, x.setting_value]));
    document.querySelectorAll('.socials a').forEach(a => {
      const label = (a.getAttribute('aria-label') || a.textContent || '').toLowerCase();
      const key = label.includes('facebook') ? 'facebook_url' : label.includes('instagram') ? 'instagram_url' : label.includes('linkedin') ? 'linkedin_url' : null;
      if (key && map[key]) a.href = map[key];
    });
  }
  document.addEventListener('DOMContentLoaded', () => { safe(loadTextAndImages); safe(loadProjects); safe(loadSocials); });
})();
