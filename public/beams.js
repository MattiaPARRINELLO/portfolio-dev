/* =========================================================
   La lumière de la salle
   Un canvas fixe derrière le contenu. Deux faisceaux qui
   balaient lentement, et changent de teinte à chaque morceau.
   La feuille de papier du rappel coupe la lumière.
   ========================================================= */

(function () {
  const canvas = document.querySelector('.room');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections = [...document.querySelectorAll('[data-cue]')];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let visible = true;
  let frame = 0;
  let last = 0;
  let pointer = 0;
  let pointerTarget = 0;

  const DEFAULT = { r: 223, g: 232, b: 255 };
  let current = { ...DEFAULT };
  let target = { ...DEFAULT };
  let intensity = 1;
  let targetIntensity = 1;

  const hexToRgb = (hex) => {
    const value = hex.trim().replace('#', '');
    if (value.length !== 6) return { ...DEFAULT };
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  };

  function readCue() {
    const mid = window.innerHeight * 0.55;
    let active = null;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= mid) active = section;
    }
    if (!active) {
      target = { ...DEFAULT };
      targetIntensity = 1;
      return;
    }
    const cue = active.dataset.cue;
    target = cue ? hexToRgb(cue) : { ...DEFAULT };
    targetIntensity = active.dataset.light === '0' ? 0 : 1;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readCue();
  }

  function drawBeam(tint, alpha, x, spread, tilt, time, phase) {
    const sway = Math.sin(time * 0.00018 + phase) * 0.03;
    const angle = tilt + sway;
    const apexX = (x + pointer * 0.01) * width;
    const apexY = -0.14 * height;
    const length = 1.5 * height;
    const half = spread * width;

    const cx = apexX + Math.sin(angle) * length;
    const cy = apexY + Math.cos(angle) * length;
    const nx = Math.cos(angle);
    const ny = -Math.sin(angle);

    const gradient = ctx.createLinearGradient(apexX, apexY, cx, cy);
    gradient.addColorStop(0, `rgba(${tint}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${tint}, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${tint}, 0)`);

    ctx.save();
    ctx.filter = 'blur(16px)';
    ctx.beginPath();
    ctx.moveTo(apexX, apexY);
    ctx.lineTo(cx + nx * half, cy + ny * half);
    ctx.lineTo(cx - nx * half, cy - ny * half);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    pointer += (pointerTarget - pointer) * 0.04;

    // On rejoint la teinte du morceau sans à-coup
    current.r += (target.r - current.r) * 0.05;
    current.g += (target.g - current.g) * 0.05;
    current.b += (target.b - current.b) * 0.05;
    intensity += (targetIntensity - intensity) * 0.06;

    if (intensity < 0.01) return;

    const tint = `${Math.round(current.r)}, ${Math.round(current.g)}, ${Math.round(current.b)}`;

    ctx.globalCompositeOperation = 'lighter';
    drawBeam(tint, 0.24 * intensity, 0.78, 0.19, -0.24, time, 0);
    drawBeam(tint, 0.13 * intensity, 0.32, 0.11, 0.19, time, 2.4);
    drawBeam(tint, 0.07 * intensity, 0.52, 0.05, -0.04, time, 4.8);
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(now) {
    // 30 images par seconde suffisent pour une lumière qui respire
    if (!last || now - last > 33) {
      last = now;
      draw(now);
    }
    frame = visible ? window.requestAnimationFrame(loop) : 0;
  }

  function start() {
    if (frame) return;
    pointer = pointerTarget = 0;
    frame = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  resize();
  readCue();
  if (reduce.matches) {
    // Lumière fixe : la teinte suit le morceau, sans balayage
    draw(0);
    window.addEventListener(
      'scroll',
      () => {
        readCue();
        current = { ...target };
        intensity = targetIntensity;
        draw(0);
      },
      { passive: true }
    );
    window.addEventListener(
      'resize',
      () => {
        resize();
        readCue();
        current = { ...target };
        intensity = targetIntensity;
        draw(0);
      },
      { passive: true }
    );
    return;
  }

  window.addEventListener(
    'resize',
    () => {
      resize();
      draw(performance.now());
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      readCue();
      if (!frame && visible) start();
    },
    { passive: true }
  );

  window.addEventListener(
    'pointermove',
    (event) => {
      pointerTarget = event.clientX / window.innerWidth - 0.5;
    },
    { passive: true }
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    );
    observer.observe(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  reduce.addEventListener('change', (event) => {
    if (event.matches) {
      stop();
      current = { ...target };
      intensity = targetIntensity;
      draw(0);
    } else if (visible) {
      start();
    }
  });

  start();
})();
