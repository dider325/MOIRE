/* Moire Studio public CMS runtime: persistent text + project galleries */
(function(){
  const ready=()=>typeof window.supabase!=='undefined'&&window.MOIRE_SUPABASE_URL&&!window.MOIRE_SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.MOIRE_SUPABASE_ANON_KEY&&!window.MOIRE_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
  if(!ready())return;
  const client=window.supabase.createClient(window.MOIRE_SUPABASE_URL,window.MOIRE_SUPABASE_ANON_KEY);
  const page=(location.pathname.split('/').pop()||'index.html').replace('.html','');
  async function loadText(){
    const {data,error}=await client.from('site_content').select('content_key,content_html').like('content_key',page+'.%');
    if(error||!data)return;
    data.forEach(row=>{const el=document.querySelector('[data-cms-key="'+CSS.escape(row.content_key)+'"]');if(el)el.innerHTML=row.content_html;});
  }
  function makeCard(p,home=false){
    const images=Array.isArray(p.images)?p.images:[]; if(!images.length)return null;
    if(home){
      const a=document.createElement('a');a.className='project reveal';a.href='projects.html';
      const img=document.createElement('img');img.src=images[0];img.alt=(p.title||'Moiré project');img.loading='lazy';a.appendChild(img);
      const info=document.createElement('div');info.className='project-info';
      const title=document.createElement('div');title.className='project-title';title.textContent=p.title||'Untitled project';
      const meta=document.createElement('div');meta.className='project-meta';meta.textContent=[p.space,p.year].filter(Boolean).join(' / ');
      info.append(title,meta);a.appendChild(info);return a;
    }
    const card=document.createElement('button');card.type='button';card.className='portfolio-card reveal';
    card.dataset.title=p.title||'Project';card.dataset.type=p.category==='2d'?'2D Work':'Selected project';card.dataset.space=p.space||'Interior';card.dataset.year=p.year||'Selected project';card.dataset.description=p.description||'';card.dataset.images=images.join('|');
    const wrap=document.createElement('span');wrap.className='portfolio-image'+(p.category==='2d'?' plan-image':'');
    const img=document.createElement('img');img.src=images[0];img.alt=(p.title||'Moiré project')+' — project image';img.loading='lazy';wrap.appendChild(img);
    const info=document.createElement('span');info.className='portfolio-card-info';const copy=document.createElement('span');const strong=document.createElement('strong');strong.textContent=p.title||'Untitled project';const small=document.createElement('small');small.textContent=p.space||'Interior';copy.append(strong,small);const arrow=document.createElement('span');arrow.className='portfolio-arrow';arrow.textContent='↗';info.append(copy,arrow);card.append(wrap,info);return card;
  }
  async function loadProjects(){
    const {data,error}=await client.from('projects').select('*').eq('published',true).order('sort_order',{ascending:true});if(error||!data)return;
    if(page==='index'){
      const home=document.querySelector('#homeSelectedProjects');if(!home)return;
      const featured=data.filter(p=>p.featured_home).slice(0,4);home.replaceChildren(...featured.map(p=>makeCard(p,true)).filter(Boolean));
    }
    if(page==='projects'){
      const grid2=document.querySelector('.portfolio-grid-2d'),grid3=document.querySelector('.portfolio-grid-3d');
      const p2=data.filter(p=>p.category==='2d'),p3=data.filter(p=>p.category!=='2d');
      if(grid2){grid2.replaceChildren(...p2.map(p=>makeCard(p)).filter(Boolean));}
      if(grid3){grid3.replaceChildren(...p3.map(p=>makeCard(p)).filter(Boolean));}
      document.dispatchEvent(new CustomEvent('moire:projects-loaded'));
    }
  }
  async function loadSocials(){const {data,error}=await client.from('site_settings').select('setting_key,setting_value').in('setting_key',['facebook_url','instagram_url','linkedin_url']);if(error||!data)return;const map=Object.fromEntries(data.map(x=>[x.setting_key,x.setting_value]));document.querySelectorAll('.socials a').forEach(a=>{const label=a.textContent.toLowerCase();const key=label.includes('facebook')?'facebook_url':label.includes('instagram')?'instagram_url':label.includes('linkedin')?'linkedin_url':null;if(key&&map[key])a.href=map[key];});}
  document.addEventListener('DOMContentLoaded',()=>{loadText();loadProjects();loadSocials();});
})();
