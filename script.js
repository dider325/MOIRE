
// Moiré — Lenis + restrained image parallax/reveal system
const lenis = new Lenis({
  duration: 1.15,
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 0.9
});

function raf(time){
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

const parallaxItems = document.querySelectorAll('[data-parallax]');
function updateParallax(){
  const vh = window.innerHeight;
  parallaxItems.forEach(el=>{
    const rect = el.getBoundingClientRect();
    const strength = Number(el.dataset.parallax || 0.12);
    const progress = (rect.top + rect.height/2 - vh/2) / (vh + rect.height);
    const y = progress * -100 * strength * 10;
    el.style.transform = `translate3d(0, ${y}px, 0) scale(1.12)`;
  });
}
lenis.on('scroll', updateParallax);
window.addEventListener('resize', updateParallax);
updateParallax();

const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

document.querySelectorAll('.faq-q').forEach(q=>{
  q.addEventListener('click',()=>{
    q.closest('.faq-item').classList.toggle('open');
  });
});

const menu = document.querySelector('.menu');
const navLinks = document.querySelector('.nav-links');
menu?.addEventListener('click',()=>{
  navLinks?.classList.toggle('mobile-open');
  if(navLinks) navLinks.style.display = navLinks.classList.contains('mobile-open') ? 'flex' : '';
});

window.addEventListener('load',()=>setTimeout(updateParallax,100));


// Interactive project galleries — enabled on the Projects page only
const projectModal = document.querySelector('#projectModal');
if (projectModal) {
  const modalMainImage = document.querySelector('#modalMainImage');
  const modalThumbs = document.querySelector('#modalThumbs');
  const modalTitle = document.querySelector('#modalTitle');
  const modalType = document.querySelector('#modalType');
  const modalDescription = document.querySelector('#modalDescription');
  const modalSpace = document.querySelector('#modalSpace');
  const modalYear = document.querySelector('#modalYear');
  let lastProjectTrigger = null;

  function selectGalleryImage(src, alt, button) {
    modalMainImage.src = src;
    modalMainImage.alt = alt;
    modalThumbs.querySelectorAll('.project-modal-thumb').forEach(thumb => thumb.classList.toggle('is-active', thumb === button));
  }

  function openProject(card) {
    lastProjectTrigger = card;
    const title = card.dataset.title || 'Project';
    const images = (card.dataset.images || card.querySelector('img')?.src || '').split('|').filter(Boolean);
    modalTitle.textContent = title;
    modalType.textContent = card.dataset.type || 'Interior design';
    modalDescription.textContent = card.dataset.description || '';
    modalSpace.textContent = card.dataset.space || 'Interior';
    modalYear.textContent = card.dataset.year || 'Design study';
    modalThumbs.innerHTML = '';
    images.forEach((src, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-modal-thumb' + (index === 0 ? ' is-active' : '');
      button.setAttribute('aria-label', `View image ${index + 1} of ${title}`);
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${title} gallery image ${index + 1}`;
      img.loading = 'lazy';
      button.appendChild(img);
      button.addEventListener('click', () => selectGalleryImage(src, img.alt, button));
      modalThumbs.appendChild(button);
    });
    if (images.length) selectGalleryImage(images[0], `${title} gallery image 1`, modalThumbs.firstElementChild);
    projectModal.classList.add('is-open');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    projectModal.querySelector('.project-modal-close')?.focus();
  }

  window.moireOpenProject = openProject;

  function closeProject() {
    projectModal.classList.remove('is-open');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastProjectTrigger) lastProjectTrigger.focus();
  }

  document.querySelectorAll('.portfolio-card[data-title]').forEach(card => card.addEventListener('click', () => openProject(card)));
  projectModal.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeProject));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && projectModal.classList.contains('is-open')) closeProject();
  });
}
