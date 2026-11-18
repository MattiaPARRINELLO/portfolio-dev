/* =========================================================
   Portfolio Mattia Parrinello, interactions
   GSAP + ScrollTrigger pour les entrées et le pass 3D,
   puis les modules sans animation (photos, terminal, contact).
   ========================================================= */

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hasGsap = !!window.gsap;

/* ── Mouvement : GSAP si disponible, rien sinon ── */
function initMotion() {
  if (!hasGsap || reduceMotion.matches) return;

  const { gsap } = window;
  const { ScrollTrigger } = window;
  if (!ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // La règle CSS qui masque les blocs ne s'active que si GSAP est là
    document.documentElement.classList.add('gsap');

    /* Entrées : chaque bloc du morceau arrive une fois, décalé de 80 ms */
    gsap.set('[data-reveal]', { autoAlpha: 0, y: 24 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 60%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.08,
          overwrite: true,
        }),
    });

    /* L'affiche : la photo respire et dérive au scroll */
    const posterPhoto = document.querySelector('.poster__photo img');
    if (posterPhoto) {
      gsap.to(posterPhoto, {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: {
          trigger: '.poster',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
      gsap.to(posterPhoto, {
        scale: 1.08,
        duration: 26,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }

    return () => {
      document.documentElement.classList.remove('gsap');
    };
  });

  /* Le pass : il apparaît, se retourne une fois, puis s'efface */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const scene = document.getElementById('pass');
    const card = document.querySelector('.pass');
    const wrap = document.querySelector('.pass-wrap');
    const steps = document.querySelectorAll('.pass-step');
    if (!scene || !card || !wrap) return;

    gsap.set(card, { rotationY: -16, rotationX: 9 });
    gsap.set(steps, { autoAlpha: 0, y: 16 });
    gsap.set(wrap, { autoAlpha: 1 });
    scene.dataset.face = 'front';

    const pass = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          scene.dataset.face = self.progress < 0.34 ? 'front' : 'back';
        },
      },
    });

    pass
      .to(card, { rotationY: 0, rotationX: 5, duration: 0.12 }, 0.12)
      .to(card, { rotationY: 180, rotationX: -4, duration: 0.2 }, 0.24)
      .to(card, { rotationY: 190, rotationX: -7, duration: 0.1 }, 0.44)
      .fromTo('.pass-step--1', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0)
      .to('.pass-step--1', { autoAlpha: 0, duration: 0.04 }, 0.2)
      .fromTo('.pass-step--2', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.21)
      .to('.pass-step--2', { autoAlpha: 0, duration: 0.04 }, 0.5)
      .fromTo('.pass-step--3', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.51)
      .to('.pass-step--3', { autoAlpha: 0, duration: 0.05 }, 0.88)
      .to(wrap, { autoAlpha: 0, duration: 0.08 }, 0.9);
  });
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
  initMotion();
  initPhotos();
  initTerminal();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
