/* =========================================================
   Le pass, en Three.js.
   Un badge métallique avec une bande iridescente : il tourne
   au scroll et prend la lumière de la scène.
   ========================================================= */

import * as THREE from '/vendor/three.module.min.js';

const passScene = document.getElementById('pass');
const canvas = passScene ? passScene.querySelector('[data-pass-canvas]') : null;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (passScene && canvas) {
  initPass();
}

function initPass() {
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    canvas.hidden = true;
    return;
  }

  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 3.15);

  /* ── Lumière de scène ── */

  function buildEnvironment() {
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 512;
    const paint = surface.getContext('2d');

    const sky = paint.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#dfe6ef');
    sky.addColorStop(0.42, '#8e97a2');
    sky.addColorStop(0.58, '#3b424a');
    sky.addColorStop(1, '#0b0d10');
    paint.fillStyle = sky;
    paint.fillRect(0, 0, 1024, 512);

    const softbox = (x, y, radius, color, alpha) => {
      const gradient = paint.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      paint.globalAlpha = alpha;
      paint.fillStyle = gradient;
      paint.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      paint.globalAlpha = 1;
    };

    softbox(210, 150, 230, '#ffffff', 0.95);
    softbox(760, 120, 180, '#cfe1ff', 0.75);
    softbox(520, 300, 160, '#ffd9c2', 0.35);

    const texture = new THREE.CanvasTexture(surface);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(texture).texture;
    texture.dispose();
    pmrem.dispose();
  }

  buildEnvironment();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1c1e, 0.7));

  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(2.2, 2.6, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdfe8ff, 1.1);
  fill.position.set(-3, 0.6, 2.6);
  scene.add(fill);

  const rim = new THREE.PointLight(0xffb38a, 8, 6, 2);
  rim.position.set(-1.8, 1.2, -1.4);
  scene.add(rim);

  const glint = new THREE.PointLight(0xbfe3ff, 12, 6, 2);
  glint.position.set(1.2, 0.8, 2.4);
  scene.add(glint);

  /* ── Le badge ── */

  const CARD_W = 0.59;
  const CARD_H = 1.04;
  const CARD_D = 0.035;

  const metal = new THREE.MeshStandardMaterial({
    color: 0xc9d0d7,
    metalness: 0.94,
    roughness: 0.26,
    envMapIntensity: 1.3,
  });

  const edgeMetal = new THREE.MeshStandardMaterial({
    color: 0x8e969e,
    metalness: 0.92,
    roughness: 0.34,
    envMapIntensity: 1.15,
  });

  function roundedShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  const bodyGeometry = new THREE.ExtrudeGeometry(roundedShape(CARD_W, CARD_H, 0.055), {
    depth: CARD_D,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 24,
  });
  bodyGeometry.translate(0, 0, -CARD_D / 2);

  const card = new THREE.Group();
  scene.add(card);

  const body = new THREE.Mesh(bodyGeometry, metal);
  card.add(body);

  // Le clip du haut, comme sur un vrai badge
  const clip = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.055, 0.045),
    edgeMetal
  );
  clip.position.set(0, CARD_H / 2 + 0.012, 0);
  card.add(clip);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 8, 24), edgeMetal);
  ring.position.set(0, CARD_H / 2 + 0.058, 0);
  card.add(ring);

  // Le plane de l'ombre, derrière
  function shadowTexture() {
    const surface = document.createElement('canvas');
    surface.width = 256;
    surface.height = 256;
    const paint = surface.getContext('2d');
    const gradient = paint.createRadialGradient(128, 128, 10, 128, 128, 126);
    gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.22)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(surface);
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.32),
    new THREE.MeshBasicMaterial({
      map: shadowTexture(),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
  );
  shadow.position.z = -0.18;
  scene.add(shadow);

  /* ── Les deux faces du pass, dessinées en canvas ── */

  const FOIL_Y = -0.164;

  function drawRoundRect(paint, x, y, width, height, radius) {
    paint.beginPath();
    paint.moveTo(x + radius, y);
    paint.lineTo(x + width - radius, y);
    paint.quadraticCurveTo(x + width, y, x + width, y + radius);
    paint.lineTo(x + width, y + height - radius);
    paint.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    paint.lineTo(x + radius, y + height);
    paint.quadraticCurveTo(x, y + height, x, y + height - radius);
    paint.lineTo(x, y + radius);
    paint.quadraticCurveTo(x, y, x + radius, y);
    paint.closePath();
  }

  function drawBase(paint) {
    const gradient = paint.createLinearGradient(0, 0, 900, 1840);
    gradient.addColorStop(0, '#f7f8fa');
    gradient.addColorStop(0.45, '#dfe3e8');
    gradient.addColorStop(0.72, '#eef0f3');
    gradient.addColorStop(1, '#c1c7ce');
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 1024, 1840);

    paint.strokeStyle = 'rgba(18,20,22,0.08)';
    paint.lineWidth = 2;
    paint.strokeRect(26, 26, 972, 1788);

    // Micro-rayures de surface
    paint.globalAlpha = 0.16;
    paint.strokeStyle = '#ffffff';
    paint.lineWidth = 1;
    for (let i = 0; i < 22; i += 1) {
      const y = 80 + i * 78;
      paint.beginPath();
      paint.moveTo(0, y);
      paint.lineTo(1024, y + 14);
      paint.stroke();
    }
    paint.globalAlpha = 1;
  }

  function drawPhoto(paint, image) {
    paint.save();
    drawRoundRect(paint, 74, 206, 382, 382, 8);
    paint.clip();
    paint.fillStyle = '#c8cdd3';
    paint.fillRect(74, 206, 382, 382);
    if (image) {
      const scale = Math.max(382 / image.width, 382 / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      paint.drawImage(image, 74 + (382 - w) / 2, 206 + (382 - h) / 2, w, h);
    } else {
      paint.fillStyle = '#5b636b';
      paint.font = '700 110px "Space Grotesk", sans-serif';
      paint.textAlign = 'center';
      paint.fillText('MP', 265, 420);
    }
    paint.restore();
    paint.strokeStyle = 'rgba(18,20,22,0.18)';
    paint.lineWidth = 2;
    drawRoundRect(paint, 74, 206, 382, 382, 8);
    paint.stroke();
  }

  function drawFacts(paint, facts) {
    facts.forEach(([label, value], index) => {
      const y = 890 + index * 76;
      paint.fillStyle = '#5d656d';
      paint.font = '500 22px "JetBrains Mono", monospace';
      paint.textAlign = 'left';
      paint.fillText(label, 74, y);
      paint.fillStyle = '#15181b';
      paint.font = '500 28px "Inter", sans-serif';
      paint.textAlign = 'right';
      paint.fillText(value, 950, y);
      paint.strokeStyle = 'rgba(18,20,22,0.1)';
      paint.lineWidth = 1;
      paint.beginPath();
      paint.moveTo(74, y + 30);
      paint.lineTo(950, y + 30);
      paint.stroke();
    });
  }

  function drawFoil(paint) {
    const x = 74;
    const y = 1120;
    const width = 876;
    const height = 220;

    paint.save();
    drawRoundRect(paint, x, y, width, height, 4);
    paint.clip();

    const metalGradient = paint.createLinearGradient(x, y, x, y + height);
    metalGradient.addColorStop(0, '#fbfcfd');
    metalGradient.addColorStop(0.28, '#c6ccd3');
    metalGradient.addColorStop(0.52, '#f1f3f6');
    metalGradient.addColorStop(0.78, '#b8bfc7');
    metalGradient.addColorStop(1, '#f7f9fb');
    paint.fillStyle = metalGradient;
    paint.fillRect(x, y, width, height);

    const hues = ['#c2619b', '#b8923f', '#3f8fb5', '#4a9c7b', '#7563c9'];
    paint.lineWidth = 2;
    for (let i = 0; i < 15; i += 1) {
      paint.globalAlpha = 0.28;
      paint.strokeStyle = hues[i % hues.length];
      paint.beginPath();
      for (let xx = -20; xx <= width + 20; xx += 12) {
        const yy = y + 18 + i * 13 + Math.sin(xx * 0.035 + i * 0.8) * 4;
        if (xx === -20) paint.moveTo(x + xx, yy);
        else paint.lineTo(x + xx, yy);
      }
      paint.stroke();
    }
    paint.globalAlpha = 1;

    paint.fillStyle = 'rgba(38,44,50,0.55)';
    paint.font = '500 13px "JetBrains Mono", monospace';
    paint.textAlign = 'center';
    paint.fillText('BACKSTAGE · MPRNL · 2027 · BACKSTAGE · MPRNL · BACKSTAGE', x + width / 2, y + 24);
    paint.fillText('TOUR 2027 · ACCÈS PRODUCTION · MPRNL · BACKSTAGE', x + width / 2, y + height - 16);

    paint.fillStyle = '#5c646c';
    paint.font = '700 76px "Space Grotesk", sans-serif';
    paint.fillText('AAA', x + width / 2, y + 134);

    paint.restore();

    paint.strokeStyle = 'rgba(18,20,22,0.16)';
    paint.lineWidth = 1.5;
    drawRoundRect(paint, x, y, width, height, 4);
    paint.stroke();
  }

  function drawBarcode(paint) {
    const bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3];
    let x = 74;
    paint.fillStyle = '#15181b';
    bars.forEach((width, index) => {
      if (index % 2 === 0) paint.fillRect(x, 1580, width, 96);
      x += width + 3;
    });
  }

  function drawFooter(paint) {
    drawBarcode(paint);
    paint.fillStyle = '#5d656d';
    paint.font = '500 22px "JetBrains Mono", monospace';
    paint.textAlign = 'right';
    paint.fillText('mprnl.fr · 2027', 950, 1645);
    paint.textAlign = 'left';
    paint.fillStyle = '#2c3238';
    paint.font = '500 24px "JetBrains Mono", monospace';
    paint.fillText('backstage.mprnl.fr', 74, 1745);
  }

  function frontFace(image) {
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 1840;
    const paint = surface.getContext('2d');

    drawBase(paint);

    paint.fillStyle = '#15181b';
    paint.font = '600 34px "JetBrains Mono", monospace';
    paint.textAlign = 'left';
    paint.fillText('Backstage', 74, 128);

    paint.fillStyle = '#3f8f5f';
    paint.beginPath();
    paint.arc(930, 116, 8, 0, Math.PI * 2);
    paint.fill();

    drawPhoto(paint, image);

    paint.fillStyle = '#101316';
    paint.font = '700 94px "Space Grotesk", sans-serif';
    paint.fillText('Mattia', 74, 686);
    paint.fillText('Parrinello', 74, 780);

    paint.fillStyle = '#4d555d';
    paint.font = '500 30px "Inter", sans-serif';
    paint.fillText('Développeur full-stack', 74, 838);

    drawFacts(paint, [
      ['Accès', 'Production'],
      ['Ville', 'Paris'],
      ['Date', 'Sept. 2027'],
    ]);

    drawFoil(paint);
    drawFooter(paint);

    return surface;
  }

  function backFace() {
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 1840;
    const paint = surface.getContext('2d');

    drawBase(paint);

    paint.fillStyle = '#15181b';
    paint.font = '600 34px "JetBrains Mono", monospace';
    paint.textAlign = 'left';
    paint.fillText('Tour 2027', 74, 128);

    paint.fillStyle = '#3f8f5f';
    paint.beginPath();
    paint.arc(930, 116, 8, 0, Math.PI * 2);
    paint.fill();

    paint.fillStyle = '#101316';
    paint.font = '700 96px "Space Grotesk", sans-serif';
    paint.fillText('Le second', 74, 300);
    paint.fillText('cerveau', 74, 396);

    paint.fillStyle = '#4d555d';
    paint.font = '500 31px "Inter", sans-serif';
    paint.fillText('Une application en production depuis 2026.', 74, 492);
    paint.fillText("Je m'en sers chaque matin.", 74, 538);

    drawFacts(paint, [
      ['Tests', '46 fichiers'],
      ['Routes', '34'],
      ['Mémoire', 'persistante'],
    ]);

    drawFoil(paint);
    drawFooter(paint);

    return surface;
  }

  /* ── Construction de la carte avec les textures ── */

  let cardReady = false;

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function foilMap() {
    const surface = document.createElement('canvas');
    surface.width = 512;
    surface.height = 128;
    const paint = surface.getContext('2d');
    const rainbow = paint.createLinearGradient(0, 0, 512, 0);
    ['#ff9ad5', '#ffd38a', '#9ef0c0', '#9fd0ff', '#c3a8ff', '#ffb0b0'].forEach(
      (color, index) => rainbow.addColorStop(index / 5, color)
    );
    paint.fillStyle = rainbow;
    paint.fillRect(0, 0, 512, 128);

    const gloss = paint.createLinearGradient(0, 0, 0, 128);
    gloss.addColorStop(0, 'rgba(255,255,255,0.8)');
    gloss.addColorStop(0.4, 'rgba(255,255,255,0.1)');
    gloss.addColorStop(0.6, 'rgba(0,0,0,0.12)');
    gloss.addColorStop(1, 'rgba(255,255,255,0.55)');
    paint.fillStyle = gloss;
    paint.fillRect(0, 0, 512, 128);

    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function addFaceTextures(frontCanvas, backCanvas) {
    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    frontTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const faceMaterial = (map) =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.52,
        metalness: 0.06,
        envMapIntensity: 0.4,
      });

    const planeWidth = 0.54;
    const planeHeight = 0.975;

    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      faceMaterial(frontTexture)
    );
    front.position.z = 0.024;
    card.add(front);

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      faceMaterial(backTexture)
    );
    back.position.z = -0.024;
    back.rotation.y = Math.PI;
    card.add(back);

    const foilMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: foilMap(),
      metalness: 0.9,
      roughness: 0.16,
      iridescence: 0.8,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 780],
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.7,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const foilWidth = 0.456;
    const foilHeight = 0.117;

    const foilFront = new THREE.Mesh(
      new THREE.PlaneGeometry(foilWidth, foilHeight),
      foilMaterial
    );
    foilFront.position.set(0, FOIL_Y, 0.026);
    card.add(foilFront);

    const foilBack = new THREE.Mesh(
      new THREE.PlaneGeometry(foilWidth, foilHeight),
      foilMaterial
    );
    foilBack.position.set(0, FOIL_Y, -0.026);
    foilBack.rotation.y = Math.PI;
    card.add(foilBack);

    cardReady = true;
  }

  async function buildCard() {
    await document.fonts.ready;
    const image = await loadImage('/assets/photos/pass-portrait.webp');
    addFaceTextures(frontFace(image), backFace());

    if (reduceMotion.matches) {
      card.rotation.set(0, 0, 0);
      renderer.render(scene, camera);
    }
  }

  buildCard();

  /* ── Cadrage ── */

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Le badge reste entier, avec de l'air autour
    const halfFov = Math.tan((30 * Math.PI) / 360);
    const fitHeight = (CARD_H * 1.34) / (2 * halfFov);
    const fitWidth = (CARD_W * 1.7) / (2 * halfFov * camera.aspect);
    camera.position.z = Math.max(3, fitHeight, fitWidth);

    if (reduceMotion.matches && cardReady) renderer.render(scene, camera);
  }

  resize();
  new ResizeObserver(resize).observe(canvas);

  /* ── Le scroll et la lumière ── */

  let target = reduceMotion.matches ? 0 : 0;
  let progress = target;
  let visible = true;

  const { ScrollTrigger } = window;
  if (ScrollTrigger && !reduceMotion.matches) {
    ScrollTrigger.create({
      trigger: passScene,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress;
      },
    });
  }

  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };

  window.addEventListener('pointermove', (event) => {
    pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
    },
    { rootMargin: '200px' }
  );
  observer.observe(passScene);

  const smooth = (a, b, value) => {
    const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const clamp = (value) => Math.min(1, Math.max(0, value));

  function updateStep(value) {
    passScene.dataset.step = value < 0.26 ? '1' : value < 0.56 ? '2' : '3';
  }

  updateStep(0);

  const clock = new THREE.Clock();
  let elapsed = 0;

  function frame() {
    requestAnimationFrame(frame);
    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;

    if (!visible) return;

    progress += (target - progress) * (1 - Math.exp(-delta * 5));
    pointer.x += (pointerTarget.x - pointer.x) * (1 - Math.exp(-delta * 4));
    pointer.y += (pointerTarget.y - pointer.y) * (1 - Math.exp(-delta * 4));

    if (!cardReady) {
      renderer.render(scene, camera);
      return;
    }

    const settle = smooth(0.06, 0.24, progress);
    const flip = smooth(0.24, 0.46, progress);
    const tilt = smooth(0.46, 0.94, progress);

    card.rotation.y =
      -0.28 + settle * 0.28 + flip * Math.PI + tilt * 0.17 + pointer.x * 0.07;
    card.rotation.x =
      0.08 - settle * 0.03 - flip * 0.03 + Math.sin(elapsed * 0.7) * 0.012 + pointer.y * 0.06;
    card.rotation.z = -0.02 + Math.sin(elapsed * 0.55) * 0.008;
    card.position.y = Math.sin(elapsed * 0.8) * 0.008;
    card.position.x = pointer.x * 0.02;

    // La lumière suit le scroll et le curseur : la bande iridescente réagit
    glint.position.x = 1.1 + Math.sin(elapsed * 0.45) * 1.3 + pointer.x * 1.4;
    glint.position.y = 0.6 + pointer.y * 0.9;
    glint.position.z = 2.2;
    glint.intensity = 9 + Math.sin(elapsed * 1.1) * 3;
    rim.position.x = -1.8 + Math.cos(elapsed * 0.4) * 0.5;
    rim.intensity = 7 + Math.sin(elapsed * 0.8 + 1) * 2;

    shadow.position.x = card.position.x * 0.4;
    shadow.rotation.z = -card.rotation.z * 0.5;

    updateStep(progress);
    renderer.render(scene, camera);
  }

  if (reduceMotion.matches) {
    updateStep(0);
    if (cardReady) renderer.render(scene, camera);
  } else {
    frame();
  }
}
