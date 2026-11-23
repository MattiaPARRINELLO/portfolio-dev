/* =========================================================
   Portfolio Mattia Parrinello, interactions
   GSAP + ScrollTrigger pour les entrées et le pass 3D,
   puis les modules sans animation (photos, contact).
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

  /* Le journal : les commits tombent pendant que la ligne se dessine */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const journalSection = document.querySelector('#journal');
    const journal = journalSection ? journalSection.querySelector('[data-journal]') : null;
    if (!journal) return;

    const rows = [...journal.querySelectorAll('.journal__row')];
    const rail = journal.querySelector('.journal__rail');
    if (!rows.length) return;

    gsap.set(rows, { autoAlpha: 0, y: 14 });
    if (rail) gsap.set(rail, { scaleY: 0, transformOrigin: 'top' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: journalSection,
        start: 'top 80%',
        once: true,
      },
    });

    if (rail) tl.to(rail, { scaleY: 1, duration: 1.2, ease: 'power2.inOut' }, 0);

    rows.forEach((row, index) => {
      const at = 0.12 + index * 0.12;
      tl.to(row, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, at);
      const dot = row.querySelector('.journal__dot');
      if (dot) tl.from(dot, { scale: 0, duration: 0.3, ease: 'back.out(2)' }, at + 0.05);
    });

    return () => {
      gsap.set(rows, { clearProps: 'all' });
      if (rail) gsap.set(rail, { clearProps: 'all' });
    };
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
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
