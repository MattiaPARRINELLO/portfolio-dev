/* =========================================================
   La lumière de la salle
   Un canvas fixe derrière le contenu. Un halo circulaire
   éclaire le titre le plus proche du centre, et les faisceaux
   convergent vers lui. Tout est calculé au scroll : quand on
   s'arrête, l'image ne bouge plus.
   ========================================================= */

(function () {
  const canvas = document.querySelector('.room');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headings = [
    ...document.querySelectorAll('.poster__name, .pass-title, .track__title'),
  ];
  const sections = [...document.querySelectorAll('[data-cue]')];

  const DEFAULT = { r: 223, g: 232, b: 255 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;

  const hexToRgb = (hex) => {
    const value = String(hex || '').trim().replace('#', '');
    if (value.length !== 6) return { ...DEFAULT };
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  };

  const colors = sections.map((section) => hexToRgb(section.dataset.cue));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Le titre le plus proche du centre : le halo s'y accroche, puis glisse
  // vers le suivant quand le premier sort de l'écran.
  const range = document.createRange();

  function focusAt() {
    const centre = height * 0.42;
    let sum = 0;
    let x = 0;
    let y = 0;
    let radius = 0;

    for (const heading of headings) {
      // le texte réel, pas la largeur de la colonne
      range.selectNodeContents(heading);
      const box = range.getBoundingClientRect();
      if (!box.width) continue;
      const hx = box.left + box.width / 2;
      const hy = box.top + box.height / 2;
      const distance = (hy - centre) / 260;
      const weight = 1 / (1 + distance * distance * 6);
      sum += weight;
      x += hx * weight;
      y += hy * weight;
      radius += (box.height * 0.5 + 170) * weight;
    }

    if (!sum) return null;
    return {
      x: x / sum,
      y: y / sum,
      radius: radius / sum,
      weight: Math.min(1, sum),
    };
  }

  // La teinte du morceau en cours, interpolée entre les sections
  function cueAt() {
    const centre = window.scrollY + height * 0.5;
    let sum = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    let light = 0;

    sections.forEach((section, index) => {
      const box = section.getBoundingClientRect();
      const top = box.top + window.scrollY;
      const middle = top + box.height / 2;
      const distance = (centre - middle) / (box.height / 2 + 400);
      const weight = 1 / (1 + distance * distance * 4);
      const color = colors[index] || DEFAULT;
      sum += weight;
      r += color.r * weight;
      g += color.g * weight;
      b += color.b * weight;
      light += (section.dataset.light === '0' ? 0 : 1) * weight;
    });

    if (!sum) return { ...DEFAULT, light: 1 };
    return { r: r / sum, g: g / sum, b: b / sum, light: light / sum };
  }

  function drawHalo(focus, tint, light) {
    const radius = Math.max(120, focus.radius);
    const strength = light * (focus.weight || 0);
    const gradient = ctx.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, radius);
    gradient.addColorStop(0, `rgba(${tint}, ${0.2 * strength})`);
    gradient.addColorStop(0.55, `rgba(${tint}, ${0.1 * strength})`);
    gradient.addColorStop(1, `rgba(${tint}, 0)`);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(focus.x, focus.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function drawBeam(tint, alpha, apexX, targetX, targetY, spread, sway) {
    const apexY = -0.12 * height;
    const angle = Math.atan2(targetX - apexX, Math.max(1, targetY - apexY)) + sway;
    const length = Math.hypot(targetX - apexX, targetY - apexY) + height * 0.5;
    const cx = apexX + Math.sin(angle) * length;
    const cy = apexY + Math.cos(angle) * length;
    const nx = Math.cos(angle);
    const ny = -Math.sin(angle);

    const gradient = ctx.createLinearGradient(apexX, apexY, cx, cy);
    gradient.addColorStop(0, `rgba(${tint}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${tint}, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${tint}, 0)`);

    ctx.beginPath();
    ctx.moveTo(apexX, apexY);
    ctx.lineTo(cx + nx * spread, cy + ny * spread);
    ctx.lineTo(cx - nx * spread, cy - ny * spread);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const cue = cueAt();
    if (cue.light < 0.02) return;

    const tint = `${Math.round(cue.r)}, ${Math.round(cue.g)}, ${Math.round(cue.b)}`;
    const focus = focusAt();
    const page = window.scrollY / Math.max(1, document.body.scrollHeight - height);
    const sway = reduce.matches ? 0 : Math.sin(page * Math.PI * 3.2) * 0.02;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(14px)';

    if (focus) {
      drawHalo(focus, tint, cue.light);
      drawBeam(tint, 0.18 * cue.light, focus.x - width * 0.3, focus.x, focus.y, width * 0.16, sway);
      drawBeam(tint, 0.1 * cue.light, focus.x + width * 0.28, focus.x, focus.y, width * 0.09, -sway);
    } else {
      drawBeam(tint, 0.16 * cue.light, width * 0.78, width * 0.5, height * 0.5, width * 0.18, sway);
      drawBeam(tint, 0.09 * cue.light, width * 0.32, width * 0.5, height * 0.5, width * 0.1, -sway);
    }

    ctx.restore();
  }

  function request() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      draw();
    });
  }

  resize();
  draw();

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      resize();
      draw();
    },
    { passive: true }
  );
  reduce.addEventListener('change', request);
})();
