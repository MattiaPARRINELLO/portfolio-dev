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

/* ── Le pass : la carte tourne au rythme du scroll ── */
function initPass() {
  const scene = document.getElementById('pass');
  if (!scene) return;
  if (reduceMotion.matches) {
    scene.style.setProperty('--p', '0.08');
    scene.style.setProperty('--turn', '-16deg');
    scene.dataset.step = '1';
    scene.dataset.face = 'front';
    return;
  }

  let frame = 0;

  const update = () => {
    frame = 0;
    const rect = scene.getBoundingClientRect();
    const run = scene.offsetHeight - window.innerHeight;
    const progress = run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) : 0;
    // Le retournement tient en 20 % du scroll : le reste est une lecture nette
    const turn =
      progress < 0.35
        ? -16 + (progress / 0.35) * 16
        : progress < 0.55
          ? ((progress - 0.35) / 0.2) * 180
          : 180 + ((progress - 0.55) / 0.45) * 10;
    scene.style.setProperty('--p', progress.toFixed(4));
    scene.style.setProperty('--turn', `${turn.toFixed(1)}deg`);
    scene.dataset.step = progress < 0.35 ? '1' : progress < 0.6 ? '2' : '3';
    // Une seule face à la fois : l'autre n'existe pas pour le lecteur ni pour la mise en page
    scene.dataset.face = turn < 90 ? 'front' : 'back';
  };

  const request = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
}

/* ── Photos : la fiche de chaque image dans une feuille ── */
function initPhotos() {
  const dialog = document.getElementById('photo-sheet');
  const figures = [...document.querySelectorAll('[data-photo]')];
  if (!dialog || !figures.length || typeof dialog.showModal !== 'function') return;

  const image = dialog.querySelector('.sheet__img');
  const title = dialog.querySelector('[data-title]');
  const place = dialog.querySelector('[data-place]');
  const meta = dialog.querySelector('[data-meta]');
  const count = dialog.querySelector('[data-count]');
  let index = 0;

  const show = (next) => {
    index = (next + figures.length) % figures.length;
    const figure = figures[index];
    image.src = figure.querySelector('img').currentSrc || figure.querySelector('img').src;
    image.alt = figure.dataset.alt || '';
    title.textContent = figure.dataset.title || '';
    place.textContent = figure.dataset.place || '';
    meta.textContent = figure.dataset.meta || '';
    count.textContent = `${index + 1} / ${figures.length}`;
  };

  figures.forEach((figure, i) => {
    figure.querySelector('.shot__open').addEventListener('click', () => {
      show(i);
      dialog.showModal();
    });
  });

  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => show(index + 1));

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

/* ── Terminal de démonstration, dans Backstage ── */
function initTerminal() {
  const root = document.querySelector('[data-term]');
  if (!root) return;

  const output = root.querySelector('.term__out code');
  const form = root.querySelector('form');
  const input = root.querySelector('input');
  if (!output || !form || !input) return;

  const intro = output.textContent;
  const commands = {
    help: [
      'help    cette liste',
      'stats   les chiffres de Backstage',
      'memory  la mémoire persistante',
      'clear   effacer',
    ].join('\n'),
    stats: [
      '46 fichiers de tests',
      '34 routes serveur',
      '32 000 lignes de TypeScript',
    ].join('\n'),
    memory: [
      "Backstage garde ce qui survit d'une session à l'autre :",
      'un souvenir, sa date, sa source.',
      'Ce terminal, lui, ne retient rien.',
    ].join('\n'),
  };

  let transcript = intro;

  const print = (text) => {
    transcript = `${transcript}\n${text}`.split('\n').slice(-26).join('\n');
    output.textContent = transcript;
    root.scrollTop = root.scrollHeight;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const command = input.value.trim();
    input.value = '';
    if (!command) return;

    if (command === 'clear') {
      transcript = intro;
      output.textContent = intro;
      return;
    }

    const key = command.toLowerCase();
    const answer = commands[key] || `commande inconnue : ${key}. tapez help.`;
    print(`$ ${command}\n${answer}`);
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
  initPoster();
  initPass();
  initPhotos();
  initTerminal();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
