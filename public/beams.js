/* =========================================================
   Faisceaux de projecteurs, en fond de la première scène.
   Deux cônes très basse intensité, dessinés sur un canvas,
   qui balaient lentement la salle. Rien n'est éclairé
   au point de gêner la lecture : c'est l'ambiance, pas le sujet.
   ========================================================= */

(function () {
  const canvas = document.querySelector('.hero__beams');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const beams = [
    { x: 0.79, spread: 0.2, tilt: -0.26, alpha: 0.26, tint: '214, 228, 255', phase: 0.0, speed: 0.00016 },
    { x: 0.31, spread: 0.12, tilt: 0.2, alpha: 0.14, tint: '255, 233, 208', phase: 2.4, speed: 0.00011 },
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let visible = true;
  let frame = 0;
  let pointer = 0;
  let pointerTarget = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawBeam(beam, time) {
    const sway = Math.sin(time * beam.speed + beam.phase) * 0.035;
    const angle = beam.tilt + sway;
    const apexX = (beam.x + pointer * 0.012) * width;
    const apexY = -0.12 * height;
    const length = 1.45 * height;
    const spread = beam.spread * width;

    const cx = apexX + Math.sin(angle) * length;
    const cy = apexY + Math.cos(angle) * length;

    const nx = Math.cos(angle);
    const ny = -Math.sin(angle);

    const gradient = ctx.createLinearGradient(apexX, apexY, cx, cy);
    gradient.addColorStop(0, `rgba(${beam.tint}, ${beam.alpha})`);
    gradient.addColorStop(0.55, `rgba(${beam.tint}, ${beam.alpha * 0.38})`);
    gradient.addColorStop(1, `rgba(${beam.tint}, 0)`);

    // Un bord flou, comme une vraie lumière dans la fumée
    ctx.save();
    ctx.filter = 'blur(11px)';
    ctx.beginPath();
    ctx.moveTo(apexX, apexY);
    ctx.lineTo(cx + nx * spread, cy + ny * spread);
    ctx.lineTo(cx - nx * spread, cy - ny * spread);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    beams.forEach((beam) => drawBeam(beam, time));
    ctx.globalCompositeOperation = 'source-over';
  }

  let last = 0;

  function loop(now) {
    pointer += (pointerTarget - pointer) * 0.04;
    // 30 images par seconde suffisent pour une lumière qui respire
    if (!last || now - last > 32) {
      last = now;
      draw(now || 0);
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
  draw(0);

  if (reduce.matches) {
    window.addEventListener('resize', () => {
      resize();
      draw(0);
    });
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

  window.addEventListener(
    'pointermove',
    (event) => {
      pointerTarget = event.clientX / window.innerWidth - 0.5;
    },
    { passive: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  reduce.addEventListener('change', (event) => {
    if (event.matches) {
      stop();
      draw(0);
    } else if (visible) {
      start();
    }
  });

  start();
})();
