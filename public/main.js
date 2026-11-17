/* =========================================================
   Portfolio Mattia Parrinello, interactions
   Entrées des morceaux, dérive de l'affiche,
   et préparation du message de contact.
   ========================================================= */

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── Entrées : chaque bloc du morceau arrive une fois, décalé ── */
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
      el.style.setProperty('--delay', `${Math.min(index, 6) * 80}ms`);
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
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ── L'affiche respire au scroll ── */
function initPoster() {
  const image = document.querySelector('.poster__photo img');
  if (!image || reduceMotion.matches) return;

  let frame = 0;

  const update = () => {
    frame = 0;
    const y = Math.min(window.scrollY, window.innerHeight);
    image.style.translate = `0 ${(y * 0.12).toFixed(1)}px`;
  };

  const request = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', request, { passive: true });
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
  initPoster();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
