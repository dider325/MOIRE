
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
