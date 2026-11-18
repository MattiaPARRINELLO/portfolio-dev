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

  /* La scène Backstage : la fenêtre raconte trois temps */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const story = document.querySelector('[data-story]');
    if (!story) return;

    const steps = [...story.querySelectorAll('[data-step]')];
    const panels = [...story.querySelectorAll('[data-panel]')];
    const tabs = [...story.querySelectorAll('[data-tab]')];
    const userText = story.querySelector('[data-user-text]');
    const aiText = story.querySelector('[data-ai-text]');
    const reason = story.querySelector('[data-reason]');
    const tool = story.querySelector('[data-tool]');
    const aiBubble = story.querySelector('[data-ai]');
    const source = story.querySelector('[data-source]');

    const fullUser = userText.textContent.trim();
    const fullAi = aiText.textContent.trim();
    userText.textContent = '';
    aiText.textContent = '';

    gsap.set(reason, { autoAlpha: 0, display: 'none' });
    gsap.set(tool, { autoAlpha: 0, display: 'none' });
    gsap.set(aiBubble, { autoAlpha: 0, y: 10, display: 'none' });
    gsap.set(source, { autoAlpha: 0 });
    gsap.set(steps.slice(1), { autoAlpha: 0, y: 16 });
    gsap.set(steps[0], { autoAlpha: 1, y: 0 });
    gsap.set(panels[0], { autoAlpha: 1 });
    gsap.set(panels[1], { autoAlpha: 0 });

    const user = { n: 0 };
    const ai = { n: 0 };

    const storyTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: story,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4,
        onUpdate: (self) => {
          const index = self.progress < 0.29 ? 0 : 1;
          tabs.forEach((tab, i) => tab.classList.toggle('is-on', i === index));
        },
      },
    });

    storyTl
      .to(steps[0], { autoAlpha: 0, duration: 0.04 }, 0.27)
      .to(panels[0], { autoAlpha: 0, duration: 0.05 }, 0.28)
      .to(panels[1], { autoAlpha: 1, duration: 0.05 }, 0.28)
      .to(steps[1], { autoAlpha: 1, y: 0, duration: 0.05 }, 0.3)
      // la question s'écrit
      .to(
        user,
        {
          n: fullUser.length,
          duration: 0.15,
          snap: { n: 1 },
          onUpdate: () => {
            userText.textContent = fullUser.slice(0, user.n);
          },
        },
        0.33
      )
      // il réfléchit, puis appelle un outil
      .set(reason, { display: 'block' }, 0.5)
      .to(reason, { autoAlpha: 1, duration: 0.05 }, 0.5)
      .to(steps[1], { autoAlpha: 0, duration: 0.04 }, 0.58)
      .set(tool, { display: 'block' }, 0.59)
      .to(tool, { autoAlpha: 1, duration: 0.04 }, 0.59)
      .to(steps[2], { autoAlpha: 1, y: 0, duration: 0.05 }, 0.6)
      .set(aiBubble, { display: 'block' }, 0.64)
      .to(aiBubble, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.64)
      .to(reason, { opacity: 0.55, duration: 0.04 }, 0.64)
      // la réponse s'écrit
      .to(
        ai,
        {
          n: fullAi.length,
          duration: 0.16,
          snap: { n: 1 },
          onUpdate: () => {
            aiText.textContent = fullAi.slice(0, ai.n);
          },
        },
        0.66
      )
      .to(source, { autoAlpha: 1, duration: 0.03 }, 0.84)
      .to({}, { duration: 0.16 }, 0.84);
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

    /* Foil diffractif : l'angle effectif de la face visible décide de tout.
       recto : eff = (ry, rx) ; verso : on mesure par rapport à la normale
       opposée, donc eff = (ry - 180, -rx). L'énergie ne dépend que des
       sinus absolus, donc elle reste continue pendant le retournement. */
    const DEG = Math.PI / 180;
    const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);
    const last = { hue: NaN, energy: NaN, shift: NaN, angle: NaN, x: NaN, y: NaN, glint: NaN };
    const write = (name, value, epsilon, suffix = '') => {
      const key = name.slice(7);
      if (Math.abs(value - last[key]) < epsilon) return;
      last[key] = value;
      card.style.setProperty(name, value.toFixed(2) + suffix);
    };

    const foilUpdate = (progress = 0) => {
      const ry = Number(gsap.getProperty(card, 'rotationY')) || 0;
      const rx = Number(gsap.getProperty(card, 'rotationX')) || 0;
      const isBack = progress >= 0.34;
      const sy = Math.sin(ry * DEG) * (isBack ? -1 : 1);
      const sx = Math.sin(rx * DEG) * (isBack ? -1 : 1);
      const spread = Math.abs(Math.sin(ry * DEG));
      const tilt = Math.abs(Math.sin(rx * DEG));

      // 0 de face, 1 quand la surface est vue de biais
      const energy = clamp01((2 * spread + 0.9 * tilt - 0.18) / 1.5);
      const glint = clamp01(1 - Math.abs(energy - 0.52) / 0.3);

      write('--foil-hue', Math.max(-48, Math.min(48, ry * 0.9 + rx * 2.2)), 0.05, 'deg');
      write('--foil-energy', energy, 0.002);
      write('--foil-shift', clamp01(0.5 + sy * 0.62 - sx * 0.1), 0.002);
      write('--foil-angle', -18 + sy * 11 + sx * 7, 0.05, 'deg');
      write('--foil-x', clamp01(0.5 + sy * 0.5 + sx * 0.08), 0.002);
      write('--foil-y', clamp01(0.5 + sx * 0.55), 0.002);
      write('--foil-glint', glint, 0.004);
    };

    foilUpdate();

    const pass = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
      },
      // le scrub avance sans nouvel événement de scroll : c'est la timeline
      // elle-même qui pilote le foil, sinon les variables figent en cours de route
      onUpdate() {
        const progress = this.progress();
        scene.dataset.face = progress < 0.34 ? 'front' : 'back';
        card.style.setProperty('--sheen', progress.toFixed(3));
        foilUpdate(progress);
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
      // la carte reste en place : la scène s'arrête sans la faire disparaître
      .to({}, { duration: 0.07 }, 0.93);
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

/* ── Fenêtres d'application : onglets accessibles ── */
function initApps() {
  document.querySelectorAll('[data-app]').forEach((app) => {
    const tabs = [...app.querySelectorAll('[role="tab"]')];
    const panels = [...app.querySelectorAll('[role="tabpanel"]')];
    if (!tabs.length || !panels.length) return;

    const select = (index) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
      const image = panels[index].querySelector('img');
      if (image && image.animate) {
        image.animate(
          [
            { opacity: 0.35, transform: 'translateY(4px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 260, easing: 'ease-out' }
        );
      }
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });
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
  initApps();
  initPhotos();
  initTerminal();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
