/* =========================================================
   Portfolio Mattia Parrinello, interactions
   Révélations au scroll, dérive des photographies,
   et préparation du message de contact.
   ========================================================= */

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── Révélations : chaque bloc entre une fois, décalé de 70 ms ── */
function initReveal() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const groups = new Map();
  targets.forEach((el) => {
    const section = el.closest('section, header') || document.body;
    const list = groups.get(section) || [];
    list.push(el);
    groups.set(section, list);
  });

  groups.forEach((list) => {
    list.forEach((el, index) => {
      el.style.setProperty('--delay', `${Math.min(index, 6) * 70}ms`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ── Dérive : la photo d'ouverture et les tirages bougent au scroll ── */
function initDrift() {
  const heroImage = document.querySelector('.hero__media img');
  const shots = [...document.querySelectorAll('.ph[data-drift]')];
  if (!heroImage && !shots.length) return;

  let frame = 0;

  const update = () => {
    frame = 0;
    const viewport = window.innerHeight;

    if (heroImage) {
      const y = Math.min(window.scrollY, viewport);
      heroImage.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(1.06)`;
    }

    shots.forEach((shot) => {
      const rate = Number(shot.dataset.drift) || 0.1;
      const rect = shot.getBoundingClientRect();
      // On ne dérive que près de l'écran : la composition au repos reste stable
      const raw = rect.top + rect.height / 2 - viewport / 2;
      const offset = Math.max(-viewport * 0.4, Math.min(viewport * 0.4, raw));
      shot.style.transform = `translate3d(0, ${(-offset * rate).toFixed(2)}px, 0)`;
    });
  };

  const request = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  if (reduceMotion.matches) return;

  update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);

  reduceMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', request);
    if (heroImage) heroImage.style.transform = '';
    shots.forEach((shot) => {
      shot.style.transform = '';
    });
  });
}

/* ── Contact : un nom d'entreprise suffit pour préparer le message ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const field = form.querySelector('input[name="company"]');
  const address = 'contact.mprnl@gmail.com';

  const buildMailto = (company) => {
    const name = company.trim();
    const subject = name
      ? `Alternance développeur : ${name}`
      : 'Alternance développeur, septembre 2027';
    const body = [
      'Bonjour Mattia,',
      '',
      name
        ? `Je vous contacte au sujet d'une alternance au sein de ${name}.`
        : "Je vous contacte au sujet d'une alternance.",
      '',
      'Le poste : ',
      'Les technologies : ',
      'À partir de : septembre 2027',
      '',
      'Bien à vous,',
      '',
    ].join('\n');

    return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = buildMailto(field ? field.value : '');
  });
}

function init() {
  initReveal();
  initDrift();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
