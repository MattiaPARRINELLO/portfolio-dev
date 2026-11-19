/* =========================================================
   Le pass, en Three.js.
   Un badge métallique avec une bande iridescente : il tourne
   au scroll et prend la lumière de la scène.
   ========================================================= */

import * as THREE from '/vendor/three.module.min.js';

/* ── Le foil : fonctions GLSL injectées dans le matériau PBR ──
   Le matériau Three garde l'éclairage, l'environnement et l'ombre.
   On y ajoute l'interférence en couche mince, le réseau de
   diffraction, la guilloche, le glint et le shimmer. */

const FOIL_UNIFORMS = /* glsl */ `
uniform float uTime;
uniform vec2 uCardRotation;
uniform float uHueShift;
uniform vec3 uGlintPosW;
uniform vec3 uRimPosW;
uniform vec3 uFoilCenterW;
uniform float uGlintSweep;
uniform float uGlintIntensity;
uniform float uRimIntensity;
uniform float uQuality;
uniform float uReducedMotion;
uniform vec3 uTangentW;
uniform float uFlip;

float foilHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float foilNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = foilHash(i);
  float b = foilHash(i + vec2(1.0, 0.0));
  float c = foilHash(i + vec2(0.0, 1.0));
  float d = foilHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 foilSpectrum(float lambda) {
  return vec3(
    exp(-pow((lambda - 600.0) / 40.0, 2.0)),
    exp(-pow((lambda - 540.0) / 35.0, 2.0)),
    exp(-pow((lambda - 450.0) / 35.0, 2.0))
  );
}

vec3 foilDiffract(vec3 L, vec3 V, vec3 T, float gain, float orderLimit) {
  float dsin = dot(V, T) - dot(L, T);
  vec3 sum = vec3(0.0);
  for (int m = 1; m <= 2; m++) {
    float fm = float(m);
    float lambda = abs(dsin) * 1400.0 / fm;
    // Fenêtre douce : pas de coupure binaire, les ordres apparaissent
    // et disparaissent progressivement quand la carte tourne.
    float w = smoothstep(370.0, 430.0, lambda) * (1.0 - smoothstep(660.0, 730.0, lambda));
    float peak = max(1.0 - abs(lambda - 545.0) / 300.0, 0.12);
    sum += foilSpectrum(lambda) * (gain * w * peak / fm);
    if (fm >= orderLimit) break;
  }
  return sum;
}
`;

const FOIL_EFFECT = /* glsl */ `
  vec3 foilAdd = vec3(0.0);
  vec3 N = normalize(normal);
  vec3 V = normalize(vViewPosition);
  vec2 fuv = vMapUv;
  fuv.x = mix(fuv.x, 1.0 - fuv.x, uFlip);

  mat3 viewRot = mat3(viewMatrix);
  vec3 Tv = viewRot * normalize(uTangentW);
  Tv = normalize(Tv - N * dot(N, Tv));
  vec3 T = Tv;

  vec3 Lkey = normalize(viewRot * normalize(vec3(2.2, 2.6, 4.0)));
  vec3 Lrim = normalize((viewMatrix * vec4(uRimPosW, 1.0)).xyz + vViewPosition);
  vec3 Lglint = normalize((viewMatrix * vec4(uGlintPosW, 1.0)).xyz + vViewPosition);

  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float F = 0.34 + 0.66 * pow(1.0 - NdotV, 2.6);

  float quality = clamp(uQuality, 0.4, 1.0);
  float freq = mix(0.6, 1.0, quality);

  /* Guilloche : deux sinus croisés. Fréquence tenue sous l'aliasing
     à la taille réelle de la bande, encore plus basse sur mobile. */
  float g1 = sin(fuv.x * 72.0 * freq + sin(fuv.y * 18.0) * 2.5);
  float g2 = sin(fuv.y * 46.0 * freq + sin(fuv.x * 12.0) * 2.0);
  float guilloche = 0.5 + 0.5 * g1 * g2;

  /* Shimmer au repos : bruit lent, jamais un clignotement */
  float motion = 1.0 - uReducedMotion;
  float shimmerNoise = foilNoise(
    vec2(fuv.x * 4.0 + uTime * 0.08 * motion, fuv.y * 2.0 - uTime * 0.05 * motion)
  );
  float dNoise = foilNoise(fuv * 3.0 + vec2(uTime * 0.05, uTime * 0.03) * motion);

  /* Interférence en couche mince */
  float n = 1.5;
  float cosThetaT = sqrt(max(0.0, 1.0 - (1.0 - NdotV * NdotV) / (n * n)));
  float thickness = mix(250.0, 700.0, 0.5 + 0.5 * dNoise);
  thickness += (guilloche - 0.5) * 60.0;
  thickness += (shimmerNoise - 0.5) * 40.0;
  // Le bord long de la bande prend une teinte différente de l'autre :
  // c'est ce qui rend la rotation lisible, même presque de face.
  thickness += (fuv.x - 0.5) * 150.0;
  // Deux ou trois franges de diffraction en travers de la bande
  thickness += sin(fuv.x * 11.0 + uHueShift * 5.0 + fuv.y * 1.6) * 70.0;
  // L'angle de la carte décale l'épaisseur optique : la teinte change
  // franchement d'une progression à l'autre, comme sur l'ancien CSS.
  thickness += (uHueShift - 0.5) * 220.0;

  float opd = 2.0 * n * thickness * cosThetaT;
  vec3 lambda = vec3(650.0, 530.0, 450.0);
  vec3 phi = 6.2831853 * opd / lambda + 3.1415926;
  vec3 irid = 0.5 + 0.5 * cos(phi);

  /* Palette holographique sobre : pétrole, nacre, argent chauffé */
  float x = NdotV * 1.5 + fuv.x * 1.1 + uHueShift;
  vec3 holo = vec3(0.55, 0.55, 0.58)
    + vec3(0.22, 0.20, 0.24) * cos(6.2831853 * (vec3(x) + vec3(0.0, 0.15, 0.30)));

  vec3 foilColor = mix(holo, irid, 0.35);
  float gray = dot(foilColor, vec3(0.299, 0.587, 0.114));
  foilColor = mix(vec3(gray), foilColor, 0.74);
  foilColor = mix(vec3(0.58), foilColor, 0.9);

  float warm = clamp(uCardRotation.x * 3.0 + (uHueShift - 0.5) * 2.2, -0.6, 0.6);
  foilColor *= mix(vec3(1.07, 0.97, 0.88), vec3(1.0), clamp(0.5 + warm, 0.0, 1.0));
  foilColor *= mix(vec3(1.0), vec3(0.94, 1.0, 1.05), clamp(0.5 - warm, 0.0, 1.0));

  /* L'iridescence vit sur les zones claires : le AAA sombre reste lisible */
  float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  float mask = smoothstep(0.35, 0.75, luma);
  // les glyphes sombres (AAA, microtextes) restent hors des reflets
  float textMask = smoothstep(0.20, 0.52, luma);

  /* Réseau de diffraction : key, rim, glint ; 1 ordre sur mobile */
  float orders = quality < 0.75 ? 1.0 : 2.0;
  vec3 diffr = foilDiffract(Lkey, V, T, 0.9, orders);
  if (quality >= 0.75) {
    diffr += foilDiffract(Lrim, V, T, uRimIntensity * 0.75, orders);
    diffr += foilDiffract(Lglint, V, T, uGlintIntensity * 0.85, orders);
  }
  diffr *= NdotV * 0.6 + 0.4;

  /* Glint froid et rim chaud : reflet d'un strip lumineux virtuel fixé
     dans l'espace de la carte. On réfléchit la direction de vue sur la
     normale de la surface, puis on mesure la distance
     entre ce rayon et l'axe du strip. Rien n'est plaqué en coordonnées
     écran : le reflet tourne avec la carte et suit le pointeur parce que
     le strip se déplace le long de la tangente. */
  vec3 B = normalize(cross(N, T));
  vec3 Rv = reflect(-V, N);
  vec3 Pv = -vViewPosition;
  vec3 centerV = (viewMatrix * vec4(uFoilCenterW, 1.0)).xyz;

  // strip vertical, à 0,55 au-dessus de la bande, décalé par le pointeur
  vec3 strip = centerV + N * 0.55 + T * (uGlintSweep * 0.20 - 0.06);
  vec3 w0 = Pv - strip;
  float bAxis = dot(Rv, B);
  float dRay = dot(Rv, w0);
  float eAxis = dot(B, w0);
  float den = max(1.0 - bAxis * bAxis, 1e-5);
  float tAxis = clamp((eAxis - bAxis * dRay) / den, -0.15, 0.15);
  vec3 nearest = strip + B * tAxis;
  vec3 toRay = nearest - Pv;
  float rayDist = length(toRay - Rv * dot(toRay, Rv));
  float facing = step(0.0, dot(toRay, Rv));
  // largeur adoucie par les dérivées : trait net sans crénelage
  float glintWidth = max(0.014, fwidth(rayDist) * 1.6);
  float glintCore = exp(-(rayDist * rayDist) / (2.0 * glintWidth * glintWidth));
  float glintHalo = exp(-(rayDist * rayDist) / (2.0 * 0.06 * 0.06));
  vec3 glintCol = vec3(0.85, 0.92, 1.0)
    * (glintCore * 0.55 + glintHalo * 0.035) * facing * uGlintIntensity;

  // le rim chaud est le même strip, de l'autre côté, plus large
  vec3 rimStrip = centerV + N * 0.6 - T * (uGlintSweep * 0.20 - 0.06);
  vec3 rw0 = Pv - rimStrip;
  float rbAxis = dot(Rv, B);
  float rdRay = dot(Rv, rw0);
  float reAxis = dot(B, rw0);
  float rden = max(1.0 - rbAxis * rbAxis, 1e-5);
  float rtAxis = clamp((reAxis - rbAxis * rdRay) / rden, -0.2, 0.2);
  vec3 rnearest = rimStrip + B * rtAxis;
  vec3 rToRay = rnearest - Pv;
  float rDist = length(rToRay - Rv * dot(rToRay, Rv));
  float rFacing = step(0.0, dot(rToRay, Rv));
  float rimCore = exp(-(rDist * rDist) / (2.0 * 0.060 * 0.060));
  vec3 rimCol = vec3(1.0, 0.88, 0.75)
    * rimCore * rFacing * uRimIntensity * 0.22;

  /* Composition : la teinte entre dans l'albédo avant l'éclairage, donc
     dans la réflexion métallique. Le PBR de Three fait le reste. */
  float tintMix = clamp((F + 0.22) * mask, 0.0, 0.94);
  vec3 foilTint = mix(vec3(1.0), foilColor * 1.9, tintMix);
  foilTint *= mix(vec3(1.0), foilColor * 1.2, 0.3 * mask);
  diffuseColor.rgb *= foilTint;
  // Les stries de guilloche restent visibles sur l'argent, sans colorer le AAA
  diffuseColor.rgb *= 1.0 + (guilloche - 0.5) * 0.16 * mask;

  foilAdd = diffr * (F * 0.7 + 0.3) * mask * 0.5;
  foilAdd += glintCol * (0.12 + 0.88 * textMask);
  foilAdd += rimCol * (0.25 + 0.75 * textMask);
`;

const FOIL_ADD = /* glsl */ `
  // opaque_fragment a déjà écrit gl_FragColor : on agit dessus,
  // puis Three applique son tonemapping ACES.
  gl_FragColor.rgb = min(gl_FragColor.rgb + foilAdd, vec3(1.55));
`;

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

  // La base de la bande : argent, microtextes et AAA gravé.
  // Aucun dégradé pastel ici : les couleurs viennent du shader.
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

  // La texture de la bande seule, pour le matériau PBR du foil.
  function foilBaseTexture() {
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 256;
    const paint = surface.getContext('2d');

    const metalGradient = paint.createLinearGradient(0, 0, 0, 256);
    metalGradient.addColorStop(0, '#c9cfd6');
    metalGradient.addColorStop(0.28, '#9aa2ab');
    metalGradient.addColorStop(0.52, '#c0c7ce');
    metalGradient.addColorStop(0.78, '#8d959e');
    metalGradient.addColorStop(1, '#c3cad1');
    paint.fillStyle = metalGradient;
    paint.fillRect(0, 0, 1024, 256);

    paint.fillStyle = 'rgba(38,44,50,0.55)';
    paint.font = '500 15px "JetBrains Mono", monospace';
    paint.textAlign = 'center';
    paint.fillText('BACKSTAGE · MPRNL · 2027 · BACKSTAGE · MPRNL · BACKSTAGE', 512, 28);
    paint.fillText('TOUR 2027 · ACCÈS PRODUCTION · MPRNL · BACKSTAGE', 512, 238);

    // AAA gravé : liseré clair sous l'ombre, acier au milieu
    const steel = paint.createLinearGradient(0, 80, 0, 160);
    steel.addColorStop(0, '#333a41');
    steel.addColorStop(0.28, '#525b64');
    steel.addColorStop(0.5, '#262c32');
    steel.addColorStop(0.72, '#464f57');
    steel.addColorStop(1, '#1d2227');

    paint.font = '700 88px "Space Grotesk", sans-serif';
    paint.fillStyle = 'rgba(255,255,255,0.7)';
    paint.fillText('AAA', 512, 153);
    paint.fillStyle = 'rgba(10,13,16,0.55)';
    paint.fillText('AAA', 512, 157);
    paint.fillStyle = steel;
    paint.fillText('AAA', 512, 155);

    paint.strokeStyle = 'rgba(18,20,22,0.18)';
    paint.lineWidth = 2;
    drawRoundRect(paint, 1, 1, 1022, 254, 4);
    paint.stroke();

    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
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
  const foilFaces = [];
  const tangent = new THREE.Vector3();

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
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

    const foilBase = foilBaseTexture();

    // Un matériau par face : le verso reçoit sa propre tangente et son
    // propre sens d'UV, pour que les bandes défilent dans le même sens
    // physique que sur le recto.
    function createFoilMaterial(flip) {
      const uniforms = {
        uTime: { value: 0 },
        uCardRotation: { value: new THREE.Vector2(0, 0) },
        uHueShift: { value: 0.5 },
        uGlintPosW: { value: glint.position.clone() },
        uRimPosW: { value: rim.position.clone() },
        uFoilCenterW: { value: new THREE.Vector3(0, FOIL_Y, 0) },
        uGlintSweep: { value: 0 },
        uGlintIntensity: { value: 0.7 },
        uRimIntensity: { value: 0.7 },
        uQuality: { value: 1 },
        uReducedMotion: { value: reduceMotion.matches ? 1 : 0 },
        uTangentW: { value: new THREE.Vector3(1, 0, 0) },
        uFlip: { value: flip },
      };

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: foilBase,
        metalness: 0.74,
        roughness: 0.24,
        clearcoat: 0.28,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.9,
        side: THREE.DoubleSide,
      });

      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\n${FOIL_UNIFORMS}`)
          .replace(
            '#include <normal_fragment_begin>',
            `#include <normal_fragment_begin>\n${FOIL_EFFECT}`
          )
          .replace('#include <tonemapping_fragment>', `${FOIL_ADD}\n#include <tonemapping_fragment>`);
      };
      material.customProgramCacheKey = () => 'pass-foil';

      return { material, uniforms };
    }

    const foilWidth = 0.456;
    const foilHeight = 0.117;

    const frontFoil = createFoilMaterial(0);
    const foilFront = new THREE.Mesh(
      new THREE.PlaneGeometry(foilWidth, foilHeight),
      frontFoil.material
    );
    foilFront.position.set(0, FOIL_Y, 0.026);
    card.add(foilFront);

    const backFoil = createFoilMaterial(1);
    const foilBack = new THREE.Mesh(
      new THREE.PlaneGeometry(foilWidth, foilHeight),
      backFoil.material
    );
    foilBack.position.set(0, FOIL_Y, -0.026);
    foilBack.rotation.y = Math.PI;
    card.add(foilBack);

    foilFaces.push({ mesh: foilFront, uniforms: frontFoil.uniforms });
    foilFaces.push({ mesh: foilBack, uniforms: backFoil.uniforms });

    cardReady = true;
  }

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };

  // Pousse l'état de la carte et des lumières dans les uniforms du foil.
  // Le foil reste calme : des intensités bornées, jamais un projecteur.
  function updateFoil(time) {
    const ryDeg = (card.rotation.y * 180) / Math.PI;
    const rxDeg = (card.rotation.x * 180) / Math.PI;
    const hue = clamp(0.5 + (ryDeg * 0.9 + rxDeg * 2.2) / 130);
    const glintPower = 0.35 + clamp(glint.intensity / 18) * 0.65;
    const rimPower = 0.3 + clamp(rim.intensity / 12) * 0.5;

    tangent.set(
      card.matrixWorld.elements[0],
      card.matrixWorld.elements[1],
      card.matrixWorld.elements[2]
    ).normalize();

    foilFaces.forEach(({ mesh, uniforms }) => {
      uniforms.uTime.value = time;
      uniforms.uCardRotation.value.set(card.rotation.x, card.rotation.y);
      uniforms.uHueShift.value = hue;
      uniforms.uGlintPosW.value.copy(glint.position);
      uniforms.uRimPosW.value.copy(rim.position);
      mesh.getWorldPosition(uniforms.uFoilCenterW.value);
      uniforms.uGlintSweep.value = pointer.x;
      uniforms.uGlintIntensity.value = glintPower;
      uniforms.uRimIntensity.value = rimPower;
      uniforms.uTangentW.value.copy(tangent);
    });
  }

  function setFoilQuality() {
    const quality = window.innerWidth < 900 ? 0.7 : 1;
    foilFaces.forEach(({ uniforms }) => {
      uniforms.uQuality.value = quality;
    });
  }

  async function buildCard() {
    await document.fonts.ready;
    const image = await loadImage('/assets/photos/pass-portrait.webp');
    addFaceTextures(frontFace(image), backFace());
    setFoilQuality();

    if (reduceMotion.matches) {
      card.rotation.set(0, 0, 0);
      card.updateMatrixWorld(true);
      // État figé mais coloré : le foil ne doit pas être gris ni vide
      updateFoil(3.7);
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

    setFoilQuality();
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
      -0.28 + settle * 0.28 + flip * Math.PI + tilt * 0.17 + pointer.x * 0.16;
    card.rotation.x =
      0.08 - settle * 0.03 - flip * 0.03 + Math.sin(elapsed * 0.7) * 0.012 + pointer.y * 0.12;
    card.rotation.z = -0.02 + Math.sin(elapsed * 0.55) * 0.008 + pointer.x * 0.02;
    card.position.y = Math.sin(elapsed * 0.8) * 0.008 - pointer.y * 0.03;
    card.position.x = pointer.x * 0.05;

    // La lumière suit le scroll et le curseur : la bande iridescente réagit
    glint.position.x = 1.1 + Math.sin(elapsed * 0.45) * 1.3 + pointer.x * 1.4;
    glint.position.y = 0.6 + pointer.y * 0.9;
    glint.position.z = 2.2;
    glint.intensity = 9 + Math.sin(elapsed * 1.1) * 3;
    rim.position.x = -1.8 + Math.cos(elapsed * 0.4) * 0.5;
    rim.intensity = 7 + Math.sin(elapsed * 0.8 + 1) * 2;

    shadow.position.x = card.position.x * 0.4;
    shadow.rotation.z = -card.rotation.z * 0.5;

    card.updateMatrixWorld();
    updateFoil(elapsed);

    updateStep(progress);
    renderer.render(scene, camera);
  }

  if (reduceMotion.matches) {
    updateStep(0);
    if (cardReady) {
      card.rotation.set(0, 0, 0);
      card.updateMatrixWorld(true);
      updateFoil(3.7);
      renderer.render(scene, camera);
    }
  } else {
    frame();
  }
}
