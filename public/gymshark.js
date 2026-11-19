/* =========================================================
   Maquette : Gymshark-Sync, la machine locale.
   Three.js dessine une boîte mécanique ; le scroll ouvre le
   capot, engrène les neuf roues et fait sortir les tokens.
   ========================================================= */

import * as THREE from '/vendor/three.module.min.js';

const section = document.querySelector('[data-scene]');
const canvas = section ? section.querySelector('[data-canvas]') : null;
const viewport = canvas ? canvas.parentElement : null;
const steps = section ? [...section.querySelectorAll('[data-step]')] : [];
const hint = section ? section.querySelector('[data-hint]') : null;
const fallback = section ? section.querySelector('[data-fallback]') : null;
const still = section ? section.querySelector('[data-still]') : null;
const handoff = section ? section.querySelector('[data-handoff]') : null;
const handoffInner = section ? section.querySelector('[data-handoff-inner]') : null;
const handoffVeil = section ? section.querySelector('.gs3d-veil') : null;
const copy = section ? section.querySelector('.gs3d-copy') : null;
const readout = section ? section.querySelector('.gs3d-readout') : null;
const journalHeader = document.querySelector('#journal .track__head');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const smooth = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
} catch (error) {
  if (canvas) canvas.hidden = true;
  if (still) still.hidden = false;
  if (section) section.classList.add('gs3d--fallback');
  if (fallback) fallback.hidden = true;
  throw error;
}

renderer.setClearAlpha(0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

/* ── Lumière : un plateau sombre, une source verte dans la machine ── */

function buildEnvironment() {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 512;
  const paint = surface.getContext('2d');

  const sky = paint.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#182027');
  sky.addColorStop(0.42, '#2f3941');
  sky.addColorStop(0.58, '#11161a');
  sky.addColorStop(1, '#060708');
  paint.fillStyle = sky;
  paint.fillRect(0, 0, 1024, 512);

  // Deux grandes boîtes à lumière : les métaux ont enfin quoi refléter
  const softbox = (x, y, radius, color, alpha) => {
    const gradient = paint.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    paint.globalAlpha = alpha;
    paint.fillStyle = gradient;
    paint.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    paint.globalAlpha = 1;
  };
  softbox(190, 170, 250, '#dce9ff', 0.9);
  softbox(760, 150, 210, '#f4f7f2', 0.7);

  // Trois faisceaux flous : ils donnent leur reflet aux métaux
  const streak = (x, width, color, alpha) => {
    const gradient = paint.createLinearGradient(x - width, 0, x + width, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    paint.globalAlpha = alpha;
    paint.fillStyle = gradient;
    paint.fillRect(x - width, 30, width * 2, 330);
    paint.globalAlpha = 1;
  };
  streak(170, 70, '#d6e6ff', 0.85);
  streak(620, 90, '#b7e3a1', 0.4);
  streak(880, 46, '#ffe8cb', 0.45);

  const texture = new THREE.CanvasTexture(surface);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
}

buildEnvironment();

scene.add(new THREE.HemisphereLight(0x9fb8d8, 0x090a0b, 0.72));

const key = new THREE.DirectionalLight(0xdfe8ff, 2.1);
key.position.set(3.2, 4.4, 5.4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xc9d8ea, 1.4);
fill.position.set(-3.4, 1.2, 5.6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xb7e3a1, 1.1);
rim.position.set(-4, 1.6, -2.4);
scene.add(rim);

const inner = new THREE.PointLight(0xb7e3a1, 4, 5, 2);
inner.position.set(-0.35, -0.15, 0.85);
scene.add(inner);

const face = new THREE.DirectionalLight(0xf2f6ff, 1.5);
face.position.set(0.4, 1.8, 6);
scene.add(face);

/* ── Matières ── */

const steel = new THREE.MeshStandardMaterial({
  color: 0x4c545b,
  metalness: 0.94,
  roughness: 0.3,
  envMapIntensity: 1.15,
});

const panel = new THREE.MeshStandardMaterial({
  color: 0x252b31,
  metalness: 0.55,
  roughness: 0.42,
  envMapIntensity: 1.1,
});

const panelInset = new THREE.MeshStandardMaterial({
  color: 0x1f252a,
  metalness: 0.62,
  roughness: 0.48,
  envMapIntensity: 0.95,
});

const steelBright = new THREE.MeshStandardMaterial({
  color: 0x767d84,
  metalness: 0.96,
  roughness: 0.22,
  envMapIntensity: 1.35,
});

const steelDark = new THREE.MeshStandardMaterial({
  color: 0x181c1f,
  metalness: 0.82,
  roughness: 0.5,
  envMapIntensity: 0.75,
});

const gearSteel = new THREE.MeshStandardMaterial({
  color: 0x6d757d,
  metalness: 0.74,
  roughness: 0.3,
  envMapIntensity: 1.6,
});

const glow = new THREE.MeshStandardMaterial({
  color: 0x0d1a12,
  emissive: 0xb7e3a1,
  emissiveIntensity: 2.4,
  metalness: 0.2,
  roughness: 0.6,
});

/* ── Aides de construction ── */

const boxOf = (width, height, depth, material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
};

const cylinder = (radius, height, material, segments = 14) =>
  new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);

/* ── La boîte ── */

const W = 3.3;
const H = 2.15;
const D = 1.3;

const stage = new THREE.Group();
scene.add(stage);

const machine = new THREE.Group();
machine.position.y = 0.02;
stage.add(machine);

// Panneaux : fond, dessus, dessous, côtés
machine.add(boxOf(W, H, 0.07, panel, 0, 0, -D / 2));
machine.add(boxOf(W, 0.07, D, panel, 0, H / 2, 0));
machine.add(boxOf(W, 0.07, D, panel, 0, -H / 2, 0));
machine.add(boxOf(0.07, H, D, panel, -W / 2, 0, 0));
machine.add(boxOf(0.07, H, D, panel, W / 2, 0, 0));

// Cadre avant : il donne de l'épaisseur à l'ouverture
const rail = 0.075;
machine.add(boxOf(W, rail, rail, steelBright, 0, H / 2, D / 2));
machine.add(boxOf(W, rail, rail, steelBright, 0, -H / 2, D / 2));
machine.add(boxOf(rail, H, rail, steelBright, -W / 2, 0, D / 2));
machine.add(boxOf(rail, H, rail, steelBright, W / 2, 0, D / 2));

// Pieds
machine.add(boxOf(0.28, 0.07, 0.72, steelDark, -W / 2 + 0.34, -H / 2 - 0.05, 0));
machine.add(boxOf(0.28, 0.07, 0.72, steelDark, W / 2 - 0.34, -H / 2 - 0.05, 0));

// Grilles de ventilation sur le côté droit
for (let i = 0; i < 6; i += 1) {
  machine.add(boxOf(0.012, 0.02, 0.62, steelDark, W / 2 + 0.005, 0.52 - i * 0.09, -0.04));
}

// Liserés lumineux à l'intérieur
machine.add(boxOf(0.014, H * 0.74, 0.02, glow, -W / 2 + 0.055, 0.05, -D / 2 + 0.055));
machine.add(boxOf(0.014, H * 0.3, 0.02, glow, W / 2 - 0.055, -0.62, -D / 2 + 0.055));

// Boulons du cadre
for (const x of [-W / 2 + 0.09, W / 2 - 0.09]) {
  for (const y of [-H / 2 + 0.09, H / 2 - 0.09]) {
    const bolt = cylinder(0.026, 0.022, steelBright, 10);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(x, y, D / 2 + 0.04);
    machine.add(bolt);
  }
}

/* ── La façade : le site, puis le métal ── */

const doorLeft = new THREE.Group();
doorLeft.position.set(-W / 2, 0, D / 2 + 0.03);
machine.add(doorLeft);
doorLeft.add(boxOf(W / 2 - 0.02, H - 0.06, 0.05, panel, W / 4, 0, 0));
doorLeft.add(boxOf(W / 4 - 0.18, H - 0.34, 0.004, panelInset, W / 4, 0, 0.026));
doorLeft.add(boxOf(0.03, 0.03, 0.012, glow, W / 2 - 0.13, -0.92, 0.031));

const doorRight = new THREE.Group();
doorRight.position.set(W / 2, 0, D / 2 + 0.03);
machine.add(doorRight);
doorRight.add(boxOf(W / 2 - 0.02, H - 0.06, 0.05, panel, -W / 4, 0, 0));
doorRight.add(boxOf(W / 4 - 0.18, H - 0.34, 0.004, panelInset, -W / 4, 0, 0.026));
doorRight.add(boxOf(0.03, 0.03, 0.012, glow, -W / 2 + 0.13, -0.92, 0.031));

// Le cadre avant est d'une seule pièce : il masque la jointure des portes
machine.add(boxOf(W, 0.09, 0.025, panel, 0, 1.03, D / 2 + 0.062));
machine.add(boxOf(W, 0.09, 0.025, panel, 0, -1.03, D / 2 + 0.062));
machine.add(boxOf(0.09, H, 0.025, panel, -1.605, 0, D / 2 + 0.062));
machine.add(boxOf(0.09, H, 0.025, panel, 1.605, 0, D / 2 + 0.062));

// La page est une seule surface devant les portes : aucune coupure au milieu
const appMaterial = new THREE.MeshBasicMaterial({
  color: 0x0b1210,
  toneMapped: false,
  transparent: true,
  opacity: 1,
});

const appPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 1.79), appMaterial);
appPlane.position.set(0, -0.09, D / 2 + 0.075);
machine.add(appPlane);

new THREE.TextureLoader().load('/assets/projects/gymshark-home.webp', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  appMaterial.map = texture;
  appMaterial.color.set(0xffffff);
  appMaterial.needsUpdate = true;
  if (reduceMotion.matches) renderer.render(scene, camera);
});

// La barre de navigateur : ce que l'on voit est bien le site, pas une maquette
function browserBarTexture() {
  const surface = document.createElement('canvas');
  surface.width = 1024;
  surface.height = 64;
  const paint = surface.getContext('2d');
  paint.fillStyle = '#14181a';
  paint.fillRect(0, 0, 1024, 64);

  ['#ff5f57', '#febc2e', '#28c840'].forEach((color, i) => {
    paint.beginPath();
    paint.fillStyle = color;
    paint.arc(28 + i * 22, 32, 7, 0, Math.PI * 2);
    paint.fill();
  });

  paint.fillStyle = '#9aa39d';
  paint.font = '500 24px "JetBrains Mono", monospace';
  paint.textBaseline = 'middle';
  paint.fillText('gymshark-sync  ·  local', 118, 34);

  // La marque de l'auteur, visible avant même d'ouvrir
  paint.fillStyle = '#b7e3a1';
  paint.textAlign = 'right';
  paint.font = '600 22px "JetBrains Mono", monospace';
  paint.fillText('mprnl.fr', 982, 34);

  paint.beginPath();
  paint.arc(1002, 32, 6, 0, Math.PI * 2);
  paint.fill();

  const texture = new THREE.CanvasTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const browserBar = new THREE.Mesh(
  new THREE.PlaneGeometry(3.12, 0.18),
  new THREE.MeshBasicMaterial({
    map: browserBarTexture(),
    toneMapped: false,
    transparent: true,
  })
);
browserBar.position.set(0, 0.895, D / 2 + 0.075);
machine.add(browserBar);

// Le balayage qui dissout l'interface en métal
const scanMaterial = new THREE.MeshBasicMaterial({
  color: 0xb7e3a1,
  transparent: true,
  opacity: 0,
  toneMapped: false,
});
const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 0.012), scanMaterial);
scan.position.set(0, 0.985, D / 2 + 0.08);
machine.add(scan);

/* ── Les roues ── */

function gearShape(teeth, radius, thickness, holeRadius) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  const tooth = 0.038;

  for (let i = 0; i < teeth; i += 1) {
    const angle = i * step;
    const points = [
      [radius, angle],
      [radius + tooth, angle + step * 0.17],
      [radius + tooth, angle + step * 0.33],
      [radius, angle + step * 0.5],
    ];
    points.forEach(([r, a], index) => {
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0 && index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();

  const circle = (r, x, y) => {
    const path = new THREE.Path();
    path.absarc(x, y, r, 0, Math.PI * 2, true);
    return path;
  };

  shape.holes.push(circle(holeRadius, 0, 0));
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.5;
    shape.holes.push(
      circle(radius * 0.11, Math.cos(angle) * radius * 0.54, Math.sin(angle) * radius * 0.54)
    );
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 2,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

const gearZ = -D / 2 + 0.37;

// Neuf roues : un cluster qui s'engrène autour de la grande roue centrale
const gearPlan = [
  { teeth: 28, radius: 0.392, x: 0.0, y: 0.0 },
  { teeth: 18, radius: 0.252, x: -0.585, y: -0.315 },
  { teeth: 14, radius: 0.196, x: -0.89, y: -0.63 },
  { teeth: 20, radius: 0.28, x: 0.6, y: -0.33 },
  { teeth: 12, radius: 0.168, x: 0.83, y: 0.06 },
  { teeth: 16, radius: 0.224, x: 0.115, y: 0.6 },
  { teeth: 10, radius: 0.14, x: 0.48, y: 0.6 },
  { teeth: 22, radius: 0.308, x: -0.39, y: 0.73 },
  { teeth: 9, radius: 0.126, x: -0.92, y: -0.05 },
];

const gears = [];

gearPlan.forEach((plan, index) => {
  const thickness = index === 0 ? 0.14 : 0.1;
  const holeRadius = 0.045 + plan.radius * 0.1;
  const gear = new THREE.Group();
  gear.position.set(plan.x, plan.y, gearZ + (index % 3) * 0.02 - 0.02);

  const disk = new THREE.Mesh(
    gearShape(plan.teeth, plan.radius, thickness, holeRadius),
    index % 4 === 0 ? steelBright : gearSteel
  );
  gear.add(disk);

  const hub = cylinder(holeRadius * 1.6, thickness + 0.03, steelDark, 16);
  hub.rotation.x = Math.PI / 2;
  gear.add(hub);

  const pin = cylinder(holeRadius * 0.55, thickness + 0.09, steelBright, 12);
  pin.rotation.x = Math.PI / 2;
  gear.add(pin);

  const shaft = cylinder(0.03, Math.abs(gearZ + 0.37 - (-D / 2 + 0.05)), steelDark, 10);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(plan.x, plan.y, (gearZ + (-D / 2 + 0.05)) / 2);
  machine.add(shaft);

  machine.add(gear);
  gears.push({
    group: gear,
    rate: 9 / plan.teeth,
    dir: index % 2 === 0 ? 1 : -1,
    offset: index * 0.72,
  });
});

/* ── Le tapis et les tokens ── */

const tokens = [];
const tokenMaterial = new THREE.MeshStandardMaterial({
  color: 0x0d1a12,
  emissive: 0xb7e3a1,
  emissiveIntensity: 2.6,
  transparent: true,
  opacity: 0,
});

machine.add(boxOf(2.25, 0.035, 0.15, steelDark, 0, -0.925, 0.16));

for (let i = 0; i < 13; i += 1) {
  const token = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.052, 0.052), tokenMaterial);
  token.position.set(-1.05 + (i / 13) * 2.1, -0.9, 0.16);
  machine.add(token);
  tokens.push(token);
}

/* ── La signature : le mécanisme porte son auteur ── */

function makerPlateTexture() {
  const surface = document.createElement('canvas');
  surface.width = 512;
  surface.height = 200;
  const paint = surface.getContext('2d');
  paint.fillStyle = '#2b3034';
  paint.fillRect(0, 0, 512, 200);
  paint.strokeStyle = '#4a5158';
  paint.lineWidth = 4;
  paint.strokeRect(10, 10, 492, 180);

  paint.textAlign = 'center';
  paint.fillStyle = '#eef2ec';
  paint.font = '700 76px "Space Grotesk", sans-serif';
  paint.fillText('MPRNL', 256, 96);

  paint.fillStyle = '#b7e3a1';
  paint.font = '500 24px "JetBrains Mono", monospace';
  paint.fillText('MATTIA PARRINELLO', 256, 138);

  paint.fillStyle = '#9aa39d';
  paint.font = '500 20px "JetBrains Mono", monospace';
  paint.fillText('conçu et codé · 2026', 256, 168);

  const texture = new THREE.CanvasTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const makerPlate = new THREE.Mesh(
  new THREE.PlaneGeometry(0.68, 0.266),
  new THREE.MeshStandardMaterial({ map: makerPlateTexture(), metalness: 0.7, roughness: 0.42 })
);
makerPlate.position.set(-1.2, 0.72, -D / 2 + 0.045);
machine.add(makerPlate);

/* ── La sortie : les tokens quittent la machine par une fente ── */

const port = new THREE.Group();
port.position.set(1.08, -0.915, 0.16);
machine.add(port);
port.add(boxOf(0.2, 0.16, 0.12, steelDark, 0, 0, 0));
port.add(boxOf(0.15, 0.045, 0.015, glow, 0, -0.01, 0.065));

const portGlow = new THREE.PointLight(0xb7e3a1, 1.5, 2.2, 2);
portGlow.position.set(1.08, -0.85, 0.35);
machine.add(portGlow);

/* ── Cadrage ── */

let baseZ = 7.4;

function resize() {
  const rect = viewport.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;

  // En portrait, on recule pour garder la machine entière
  baseZ = width / height < 1.05 ? 8.8 : 7.1;
  camera.updateProjectionMatrix();

  if (reduceMotion.matches) renderer.render(scene, camera);
}

resize();
new ResizeObserver(resize).observe(viewport);

/* ── Le scroll pilote la scène ── */

let target = reduceMotion.matches ? 0.64 : 0;
let progress = target;
let power = 0;

const { ScrollTrigger } = window;
if (ScrollTrigger && !reduceMotion.matches) {
  window.gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      target = self.progress;
    },
  });
}

function updateCopy(value) {
  const index = value < 0.2 ? 0 : value < 0.62 ? 1 : 2;
  steps.forEach((step, i) => step.classList.toggle('is-on', i === index));
  if (hint) hint.classList.toggle('is-off', value > 0.06);
}

steps.forEach((step, i) => step.classList.toggle('is-on', i === 0));
updateCopy(target);

/* ── Parallaxe souris ── */

const pointer = { x: 0, y: 0 };
const pointerTarget = { x: 0, y: 0 };

section.addEventListener('pointermove', (event) => {
  const rect = section.getBoundingClientRect();
  pointerTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerTarget.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
});

/* ── La boucle ── */

const clock = new THREE.Clock();
let visible = true;
let elapsed = 0;

const observer = new IntersectionObserver(
  (entries) => {
    visible = entries[0].isIntersecting;
  },
  { rootMargin: '200px' }
);
observer.observe(section);

function frame() {
  requestAnimationFrame(frame);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  if (!visible) return;

  progress += (target - progress) * (1 - Math.exp(-delta * 5));
  pointer.x += (pointerTarget.x - pointer.x) * (1 - Math.exp(-delta * 4));
  pointer.y += (pointerTarget.y - pointer.y) * (1 - Math.exp(-delta * 4));

  const dissolve = smooth(0.02, 0.14, progress);
  const doorLevel = smooth(0.15, 0.38, progress);
  const spin = smooth(0.34, 0.52, progress);
  const tokenLevel = smooth(0.44, 0.64, progress);
  const portLevel = smooth(0.5, 0.72, progress);
  const dive = smooth(0.68, 0.86, progress);
  const handoffLevel = smooth(0.66, 0.86, progress);

  power += (spin - power) * (1 - Math.exp(-delta * 5));

  // Le site se dissout en métal, puis les portes s'ouvrent
  appMaterial.opacity = 1 - dissolve;
  browserBar.material.opacity = 1 - dissolve;
  browserBar.visible = dissolve < 0.99;

  scan.position.y = 0.985 - dissolve * 1.97;
  scanMaterial.opacity = Math.sin(Math.PI * dissolve) * 0.9;
  scan.visible = dissolve > 0.01 && dissolve < 0.99;

  doorLeft.rotation.y = -doorLevel * 1.64;
  doorRight.rotation.y = doorLevel * 1.64;

  // La machine tourne, la vitesse suit le scroll
  gears.forEach((gear) => {
    gear.group.rotation.z += delta * gear.rate * gear.dir * (0.02 + power * 3.4);
  });

  // Les tokens avancent vers la sortie
  tokenMaterial.opacity = tokenLevel * 0.95;
  tokens.forEach((token, i) => {
    const t = ((elapsed * (0.06 + power * 0.18) + i / tokens.length) % 1 + 1) % 1;
    token.position.x = -1.02 + t * 2.02;
    token.position.y = -0.89 + Math.sin(t * Math.PI * 6 + i) * 0.008;
    token.visible = tokenLevel > 0.02;
  });

  // La sortie s'allume quand les tokens arrivent
  portGlow.intensity = 0.6 + portLevel * 4;
  inner.intensity = 2 + power * 11;
  beamIntensity(power);

  const zoom = smooth(0, 0.55, progress);
  camera.position.x = pointer.x * 0.18 * (1 - dive);
  camera.position.y = 0.42 + pointer.y * 0.12 - zoom * 0.05 - dive * 0.32;
  camera.position.z = baseZ - zoom * 0.75 - dive * (baseZ - 1.5);
  camera.lookAt(0.1 * (1 - dive), 0.05, 0);

  stage.rotation.y = (-0.14 + progress * 0.3) * (1 - dive * 0.6);
  stage.rotation.x = (-0.015 + progress * 0.03) * (1 - dive * 0.6);

  // Le texte de la suite arrive en même temps que la caméra entre dans la boîte
  if (handoff) handoff.style.opacity = smooth(0.68, 0.79, progress).toFixed(3);
  if (handoffInner) {
    handoffInner.style.transform = `scale(${(0.035 + handoffLevel * 0.965).toFixed(3)})`;
    handoffInner.style.filter = `blur(${((1 - handoffLevel) * 7).toFixed(2)}px)`;
    handoffInner.style.opacity = (1 - smooth(0.95, 0.985, progress)).toFixed(3);
    // Le teaser s'efface quand le vrai header du journal se révèle (60 % du viewport)
    const headerReady = journalHeader
      ? journalHeader.getBoundingClientRect().top < window.innerHeight * 0.6
      : false;
    handoffInner.style.visibility =
      headerReady || target >= 0.995 ? 'hidden' : 'visible';
  }
  // La machine s'efface derrière un aplat quand le texte a fini de grandir
  if (handoffVeil) handoffVeil.style.opacity = smooth(0.84, 0.88, progress).toFixed(3);

  // La copie s'efface pendant la plongée, l'écran ne garde que la machine
  const hide = smooth(0.66, 0.76, progress);
  if (copy) copy.style.opacity = (1 - hide).toFixed(3);
  if (readout) readout.style.opacity = (1 - hide).toFixed(3);

  // Le cadre de la scène s'élargit pour que la machine remplisse l'écran
  if (viewport) {
    const grow = smooth(0.8, 0.88, progress);
    viewport.style.transform = `scale(${(1 + grow * 1.6).toFixed(3)})`;
  }

  updateCopy(progress);
  renderer.render(scene, camera);
}

function beamIntensity(value) {
  glow.emissiveIntensity = 1.2 + value * 2.2;
}

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  canvas.hidden = true;
  if (still) still.hidden = false;
  if (section) section.classList.add('gs3d--fallback');
  if (fallback) fallback.hidden = true;
});

if (reduceMotion.matches) {
  // Pas de scroll, pas de boucle : le mécanisme ouvert, immobile
  appMaterial.opacity = 0;
  browserBar.material.opacity = 0;
  browserBar.visible = false;
  scan.visible = false;
  doorLeft.rotation.y = -1.64;
  doorRight.rotation.y = 1.64;
  if (handoff) handoff.style.opacity = '0';
  gears.forEach((gear, i) => {
    gear.group.rotation.z = gear.offset + i * 0.12;
  });
  tokenMaterial.opacity = 0.9;
  tokens.forEach((token) => {
    token.visible = true;
  });
  inner.intensity = 13;
  portGlow.intensity = 4;
  camera.position.set(0, 0.35, baseZ - 0.5);
  camera.lookAt(0.1, 0.05, 0);
  renderer.render(scene, camera);
} else {
  frame();
}
