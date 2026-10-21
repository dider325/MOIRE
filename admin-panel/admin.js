const $ = id => document.getElementById(id);
const configured = () => window.MOIRE_SUPABASE_URL && !window.MOIRE_SUPABASE_URL.includes('YOUR_PROJECT_ID') && window.MOIRE_SUPABASE_ANON_KEY && !window.MOIRE_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
const db = configured() && window.supabase ? window.supabase.createClient(window.MOIRE_SUPABASE_URL, window.MOIRE_SUPABASE_ANON_KEY) : null;
const pageMeta = {
  index:{title:'Home',description:'Edit the homepage hero, studio introduction, selected work, services and closing call to action.'},
  about:{title:'About Us',description:'Edit the studio story, approach, team introduction, values and design philosophy.'},
  services:{title:'Services',description:'Edit the architecture, interiors, renovation and design-direction services plus the process section.'},
  projects:{title:'Projects',description:'Edit the portfolio introduction, 2D planning section and how-we-work content.'},
  project:{title:'Project Detail',description:'Edit the default project detail page’s title, narrative and next-project text.'},
  faq:{title:'FAQ & Journal',description:'Edit the FAQ answers, journal cards and privacy text.'},
  contact:{title:'Contact',description:'Edit the contact introduction, enquiry guidance, studio location and contact-page copy.'}
};
let currentPage = 'index';
let loadedFields = [];
let currentImages = [];
let allProjects = [];
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function msg(id, text, error=false){const el=$(id);if(!el)return;el.textContent=text||'';el.classList.toggle('error',!!error)}
function setConnected(ok,text){$('connection').textContent=text;$('connection').classList.toggle('connected',ok)}
function showLogin(){ $('loginView').classList.remove('hidden');$('appView').classList.add('hidden'); }
function showApp(){ $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');$('logout').classList.remove('hidden');setConnected(true,'Connected');openDashboard();loadProjects();loadSocials(); }
function hideViews(){['dashboardView','pageEditorView','projectToolView','socialToolView'].forEach(id=>$(id).classList.add('hidden'));}
function openDashboard(){hideViews();$('dashboardView').classList.remove('hidden');$('breadcrumbCurrent').textContent='Dashboard';document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',!b.dataset.page&&!b.dataset.tool));}
function openTool(tool){hideViews();$(tool==='projects'?'projectToolView':'socialToolView').classList.remove('hidden');$('breadcrumbCurrent').textContent=tool==='projects'?'Project Library':'Social Links';document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));if(tool==='projects')loadProjects();if(tool==='social')loadSocials();}
function openPage(page){currentPage=page;hideViews();$('pageEditorView').classList.remove('hidden');$('breadcrumbCurrent').textContent=pageMeta[page].title;$('pageTitle').textContent=pageMeta[page].title;$('pageEyebrow').textContent='EDIT WEBSITE PAGE';$('pageDescription').textContent=pageMeta[page].description;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));loadPageText(page);}
function normalizeLabel(text){return String(text||'').replace(/\s+/g,' ').trim().replace(/^\d+\s*[/.·—-]+\s*/,'');}
function sectionTitle(section, index, pageDoc=null){
  let title='Section '+String(index+1).padStart(2,'0');
  const labels=[...section.querySelectorAll('.section-label')];
  const meaningful=el=>{const text=normalizeLabel(el.textContent);return text&&text.length<95&&!/^\d+$/.test(text)};
  const ordered=[...labels,...section.querySelectorAll('.eyebrow,h1,h2,h3,h4,.display,.footer-title')];
  for(const el of ordered){if(!meaningful(el))continue;title=normalizeLabel(el.textContent);break}
  if(section.closest('footer')) title='Footer & closing call to action';
  if(pageDoc?.title?.toLowerCase().includes('faq') && index===1 && title.startsWith('Section ')) title='Frequently asked questions';
  const faqItem=section.matches('.faq-item')?section:null;
  if(faqItem){const summary=faqItem.querySelector('summary');if(summary)title=normalizeLabel(summary.textContent)}
  return title;
}
function fieldLabel(el){
  const cls=el.classList||[];const text=normalizeLabel(el.textContent);const tag=el.tagName.toLowerCase();
  if(cls.contains('section-label'))return 'Section label';
  if(cls.contains('eyebrow'))return 'Small label / eyebrow';
  if(cls.contains('meta'))return 'Supporting label';
  if(cls.contains('hero-note')||cls.contains('intro-copy')||cls.contains('thinking-lead'))return 'Introductory text';
  if(cls.contains('footer-title'))return 'Footer headline';
  if(cls.contains('display'))return 'Display headline';
  if(tag==='h1')return 'Main heading';
  if(tag==='h2'||tag==='h3'||tag==='h4')return 'Heading';
  if(tag==='a')return 'Link text';
  if(tag==='p')return 'Paragraph / description';
  if(tag==='span')return 'Short text';
  if(text.length<42)return 'Short text';
  return 'Content text';
}
function groupForElement(el, pageDoc, index){
  const section=el.closest('section');
  if(section){return {node:section,title:sectionTitle(section,[...pageDoc.querySelectorAll('section')].indexOf(section),pageDoc)}}
  const footer=el.closest('footer');
  if(footer)return {node:footer,title:'Footer & closing call to action'};
  const faqItem=el.closest('.faq-item,details');
  if(faqItem){const summary=faqItem.querySelector('summary');return {node:faqItem,title:summary?normalizeLabel(summary.textContent):'Question & answer'};}
  const parent=el.parentElement;
  return {node:parent,title:sectionTitle(parent||pageDoc,index,pageDoc)};
}
async function loadPageText(page){
  if(!db){$('sectionGroups').innerHTML='<div class="loading-card">Supabase is not configured. Check the admin-panel configuration file before editing website content.</div>';msg('pageMessage','Database is not connected.',true);setConnected(false,'Not configured');return}
  $('sectionGroups').innerHTML='<div class="loading-card">Reading the real page sections…</div>';msg('pageMessage','');
  try{
    const response=await fetch('../'+page+'.html',{cache:'no-store'});
    if(!response.ok)throw new Error('Could not read '+page+'.html. Keep the admin-panel folder beside the website pages.');
    const source=await response.text();const doc=new DOMParser().parseFromString(source,'text/html');
    const nodes=[...doc.querySelectorAll('[data-cms-key]')];
    const keys=nodes.map(el=>el.dataset.cmsKey).filter(Boolean);
    const {data,error}=keys.length?await db.from('site_content').select('content_key,content_html').in('content_key',keys):{data:[],error:null};
    if(error)throw error;
    const saved=Object.fromEntries((data||[]).map(row=>[row.content_key,row.content_html]));
    const groups=new Map();loadedFields=[];
    nodes.forEach((el,index)=>{
      const key=el.dataset.cmsKey;if(!key)return;
      const group=groupForElement(el,doc,index);let groupKey=group.title;
      if(!groups.has(groupKey))groups.set(groupKey,{title:group.title,fields:[]});
      const field={key,label:fieldLabel(el),originalLabel:normalizeLabel(el.textContent).slice(0,100),html:saved[key]??el.innerHTML,tag:el.tagName.toLowerCase(),section:group.title,index:loadedFields.length};
      loadedFields.push(field);groups.get(groupKey).fields.push(field);
    });
    const groupArray=[...groups.values()];
    $('sectionCount').textContent=`${groupArray.length} sections · ${loadedFields.length} editable content items`;
    $('sectionGroups').innerHTML=groupArray.map((group,i)=>`<details class="section-card" ${i===0?'open':''}><summary class="section-summary"><span class="section-number">${String(i+1).padStart(2,'0')}</span><span class="section-summary-copy"><strong>${escapeHtml(group.title)}</strong><small>${group.fields.length} editable ${group.fields.length===1?'item':'items'}</small></span><span class="chevron">›</span></summary><div class="section-body"><p class="section-help">Edit only the text for this part of the ${escapeHtml(pageMeta[page].title)} page. The website’s layout and styling stay the same.</p><div class="field-grid">${group.fields.map(field=>renderField(field)).join('')}</div><div class="form-footer"><span class="message" data-section-message="${escapeHtml(group.title)}"></span><button class="primary" type="button" data-save-section="${escapeHtml(group.title)}">Save this section <span>↗</span></button></div></div></details>`).join('')||'<div class="loading-card">No editable text fields were found on this page.</div>';
    $('sectionGroups').querySelectorAll('[data-save-section]').forEach(button=>button.addEventListener('click',()=>saveFields(button.dataset.saveSection)));
    $('sectionGroups').querySelectorAll('.format-tools button').forEach(button=>button.addEventListener('click',()=>{const target=$(button.dataset.target);if(!target)return;target.focus();if(button.dataset.command==='insertLineBreak')document.execCommand('insertLineBreak');else document.execCommand(button.dataset.command,false,null)}));
  }catch(error){$('sectionGroups').innerHTML=`<div class="loading-card">${escapeHtml(error.message||'Unable to load this page.')}</div>`;msg('pageMessage',error.message||'Unable to load page content.',true)}
}
function renderField(field){
  const full=['h1','h2','h3'].includes(field.tag)||field.label==='Paragraph / description'||field.label==='Introductory text'||field.label==='Display headline'||field.label==='Content text';
  return `<div class="content-field ${full?'full':''}"><label for="editor-${field.index}"><span>${escapeHtml(field.label)}</span><span class="field-kind">${escapeHtml(field.tag.toUpperCase())}</span></label><div class="format-tools"><button type="button" data-command="bold" data-target="editor-${field.index}" title="Bold"><b>B</b></button><button type="button" data-command="italic" data-target="editor-${field.index}" title="Italic"><i>I</i></button><button type="button" data-command="insertLineBreak" data-target="editor-${field.index}" title="New line">↵ Line break</button></div><div id="editor-${field.index}" class="visual-editor" contenteditable="true" data-content-key="${escapeHtml(field.key)}" data-section-title="${escapeHtml(field.section)}" role="textbox" aria-label="${escapeHtml(field.label)}">${field.html}</div><div class="field-tip">Currently on website: ${escapeHtml(field.originalLabel||'Text block').slice(0,100)}</div></div>`;
}
async function saveFields(sectionTitleFilter=null){
  if(!db)return msg('pageMessage','Database is not connected.',true);
  const editors=[...$('sectionGroups').querySelectorAll('.visual-editor')].filter(el=>!sectionTitleFilter||el.dataset.sectionTitle===sectionTitleFilter);
  const rows=editors.map(el=>({content_key:el.dataset.contentKey,content_html:el.innerHTML,updated_at:new Date().toISOString()}));
  if(!rows.length)return;
  const targetMessage=sectionTitleFilter?[...document.querySelectorAll('[data-section-message]')].find(el=>el.dataset.sectionMessage===sectionTitleFilter):$('pageMessage');
  if(targetMessage){targetMessage.textContent='Saving…';targetMessage.classList.remove('error')}
  const {error}=await db.from('site_content').upsert(rows,{onConflict:'content_key'});
  if(targetMessage){targetMessage.textContent=error?error.message:(sectionTitleFilter?'Section saved successfully.':'Page changes saved successfully.');targetMessage.classList.toggle('error',!!error)}
  if(!error&&sectionTitleFilter){msg('pageMessage',`${sectionTitleFilter} saved.`)}
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();if(!db)return msg('loginMessage','Supabase is not configured. Please check the configuration file.',true);msg('loginMessage','Signing in…');const {error}=await db.auth.signInWithPassword({email:$('email').value,password:$('password').value});if(error)msg('loginMessage',error.message,true);else showApp()});
$('logout').addEventListener('click',async()=>{if(db)await db.auth.signOut();showLogin()});
$('pageNav').addEventListener('click',e=>{const button=e.target.closest('[data-page]');if(button)openPage(button.dataset.page)});
document.querySelectorAll('[data-page]').forEach(button=>{if(button.closest('#pageNav'))return;button.addEventListener('click',()=>openPage(button.dataset.page))});
document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>openTool(button.dataset.tool)));
$('backDashboard').addEventListener('click',openDashboard);$('savePage').addEventListener('click',()=>saveFields());$('savePageBottom').addEventListener('click',()=>saveFields());

// Project library: same Supabase tables and storage bucket as the original site CMS.
async function loadProjects(){if(!db)return;const {data,error}=await db.from('projects').select('*').order('sort_order',{ascending:true});if(error){$('projectList').innerHTML=`<p class="message error">${escapeHtml(error.message)}</p>`;return}allProjects=data||[];$('projectList').innerHTML=allProjects.map(p=>`<article class="project-row"><img src="${escapeHtml((p.images||[])[0]||'')}" alt=""><div><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml((p.category||'3d').toUpperCase())} · ${(p.images||[]).length} photos · ${p.published?'Published':'Draft'}</small></div><div class="project-row-actions"><button class="quiet" data-edit="${escapeHtml(p.id)}">Edit</button><button class="quiet danger" data-delete="${escapeHtml(p.id)}">Delete</button></div></article>`).join('')||'<p class="muted">No projects have been added yet. Use “Add project” to start.</p>';}
function resetProject(){ $('projectForm').reset();$('projectId').value='';$('projectPublished').checked=true;currentImages=[];renderImages();$('projectFormTitle').textContent='New project';$('projectForm').classList.remove('hidden');$('projectForm').scrollIntoView({behavior:'smooth',block:'start'});}
$('newProject').addEventListener('click',resetProject);$('cancelProject').addEventListener('click',()=>$('projectForm').classList.add('hidden'));
function renderImages(){ $('imagePreview').innerHTML=currentImages.map((src,i)=>`<div class="preview-item"><img src="${escapeHtml(src)}" alt="Project image ${i+1}"><button type="button" data-remove-image="${i}" aria-label="Remove image">×</button></div>`).join('');}
$('imagePreview').addEventListener('click',e=>{const b=e.target.closest('[data-remove-image]');if(b){currentImages.splice(Number(b.dataset.removeImage),1);renderImages()}});
$('projectList').addEventListener('click',async e=>{const edit=e.target.closest('[data-edit]');const del=e.target.closest('[data-delete]');if(edit){const {data,error}=await db.from('projects').select('*').eq('id',edit.dataset.edit).single();if(error)return msg('projectMessage',error.message,true);resetProject();$('projectFormTitle').textContent='Edit project';$('projectId').value=data.id;$('projectTitle').value=data.title||'';$('projectCategory').value=data.category||'3d';$('projectSpace').value=data.space||'';$('projectYear').value=data.year||'';$('projectDescription').value=data.description||'';$('projectPublished').checked=!!data.published;currentImages=data.images||[];renderImages();}if(del&&confirm('Delete this project from the website?')){const {error}=await db.from('projects').delete().eq('id',del.dataset.delete);if(error)alert(error.message);else loadProjects()}});
$('projectForm').addEventListener('submit',async e=>{e.preventDefault();if(!db)return;msg('projectMessage','Uploading photos…');const files=[...$('projectImages').files];for(const file of files){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from('project-images').upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});if(error){msg('projectMessage',error.message,true);return}const {data}=db.storage.from('project-images').getPublicUrl(path);currentImages.push(data.publicUrl)}const payload={title:$('projectTitle').value.trim(),category:$('projectCategory').value,space:$('projectSpace').value.trim(),year:$('projectYear').value.trim(),description:$('projectDescription').value.trim(),images:currentImages,published:$('projectPublished').checked,updated_at:new Date().toISOString()};let result;if($('projectId').value)result=await db.from('projects').update(payload).eq('id',$('projectId').value);else{const {count}=await db.from('projects').select('*',{count:'exact',head:true});payload.sort_order=count||0;result=await db.from('projects').insert(payload)}if(result.error){msg('projectMessage',result.error.message,true);return}msg('projectMessage','Project saved successfully.');$('projectForm').classList.add('hidden');$('projectImages').value='';await loadProjects()});
async function loadSocials(){if(!db)return;const {data,error}=await db.from('site_settings').select('setting_key,setting_value');if(error){msg('socialMessage',error.message,true);return}const map=Object.fromEntries((data||[]).map(x=>[x.setting_key,x.setting_value]));$('facebookUrl').value=map.facebook_url||'';$('instagramUrl').value=map.instagram_url||'';$('linkedinUrl').value=map.linkedin_url||'';}
$('socialForm').addEventListener('submit',async e=>{e.preventDefault();if(!db)return;const rows=[['facebook_url',$('facebookUrl').value.trim()],['instagram_url',$('instagramUrl').value.trim()],['linkedin_url',$('linkedinUrl').value.trim()]].map(([setting_key,setting_value])=>({setting_key,setting_value,updated_at:new Date().toISOString()}));const {error}=await db.from('site_settings').upsert(rows,{onConflict:'setting_key'});msg('socialMessage',error?'Could not save social links: '+error.message:'Social links saved successfully.',!!error)});
if(!configured()){setConnected(false,'Not configured');showLogin()}else if(db){db.auth.getSession().then(({data})=>{if(data?.session)showApp();else showLogin()});db.auth.onAuthStateChange((_event,session)=>{if(session)showApp();else showLogin()})}else{setConnected(false,'Not connected');showLogin()}
