/* =========================================================
   Portfolio — faisceaux lumineux volumétriques (WebGL)

   Deux sources invisibles, hors champ à gauche et à droite,
   projettent des faisceaux coniques dans l'atmosphère sombre
   de la page. La couche est purement additive (blend screen) :
   elle simule la diffusion de la lumière sans toucher au HTML —
   aucun style, aucune couleur de texte, aucun événement.

   Décoratif : pointer-events: none, aria-hidden, et libération
   complète des ressources GPU à la destruction.
   ========================================================= */

const BEAM_CONFIG = {
    /* Teinte — deux balances, comme un vrai plateau : la key part
       sur un tungstène chaud, le fill tire vers un blanc très légèrement
       froid. Ce déséquilibre chaud/froid donne la profondeur ; deux
       sources identiques se liraient comme un seul aplat. */
    warm: [1.0, 0.92, 0.79],
    cool: [0.95, 0.96, 1.0],

    /* Intensité — la lumière est concentrée en deux faisceaux serrés.
       On paie la surface perdue par un pic plus haut : le cœur d'un
       projecteur est brillant, c'est le contraste avec le noir qui fait
       la scène. 0.6 ≈ pic à ~#4a3a28 dans l'axe, fond à #0a0a0b. */
    intensity: 0.6,

    /* Key / fill — en studio on n'éclaire jamais deux fois pareil :
       une key plus forte et plus serrée, un fill plus large et plus
       faible qui ouvre les ombres. C'est ce déséquilibre qui donne
       la profondeur au lieu de deux faisceaux jumeaux. */
    keyGain: 1.18,
    fillGain: 0.62,
    fillSpread: 1.15,

    /* Cône — un pinceau, pas un mur. Ouverture et élargissement
       réduits de moitié : le faisceau reste un fût lisible au lieu de
       couvrir le tiers de l'écran.
       falloff = perte en distance : c'est lui qui donne une portée
       finie, donc plus de longue arête rectiligne qui traverse l'image. */
    coneAngle: 0.1,
    coneGrow: 0.018,
    softness: 1.6,
    falloff: 1.5,

    /* Bord — amplitude de l'ondulation du cône (0 = arête géométrique,
       1 = bord déchiqueté). C'est ce bruit qui distingue un volume
       d'un polygone. */
    edgeNoise: 0.22,

    /* Densité — deux couches transversales : un corps large et
       discret (softness) qui porte le volume, un cœur plus serré et
       plus lumineux (coreSharp) qui donne la direction. C'est la
       répartition corps/cœur qui fait un fût de lumière et non une tache. */
    softnessGain: 0.34,
    coreSharp: 3.6,
    coreGain: 0.72,

    /* Striations — le volume est rayé par les poussières en
       suspension. strength = amplitude, freq = écartement des
       raies. N'affecte que le cœur du faisceau. */
    striation: 0.3,
    striationFreq: 15.0,

    /* Halo de diffusion autour des sources, hors cône. */
    halo: 0.18,

    /* Lavoir de fond (haut) et rebond de sol (bas) — l'ambiance qui
       relie les deux spots. Volontairement faibles : ce sont des
       nappes lointaines, pas des sources. Assez fortes pour que le
       fond ne soit pas un aplat noir, assez discrètes pour que le
       titre garde tout son contraste. */
    topLight: 0.13,
    floorLight: 0.07,

    /* Atmosphère — amount = amplitude de la variation (subtile),
       scale = taille des volutes, speed = dérive. Les deux octaves
       dérivent en sens opposés : la brume respire au lieu de glisser
       d'un bloc. */
    hazeAmount: 0.24,
    hazeScale: 1.4,
    hazeSpeed: 0.05,

    /* Pointeur — range = amplitude du basculement (unités écran),
       response = réactivité du ressort (1/s). */
    pointerRange: 0.07,
    pointerResponse: 3.4,
    drift: 0.022,

    /* Introduction (ms) — allumage, ouverture du cône, rotation des
       sources, durée totale (le balayage est fini vers 2200 ms :
       au-delà, la boucle n'a plus rien à recalculer). */
    introIgnite: 520,
    introOpen: 700,
    introSweep: 1650,
    introStagger: 190,
    introTotal: 2350,
    introFlash: 1.35,
    introBurst: 0.5,

    /* Rendu — ratio de pixels max, cadence au repos (ms).
       Le voile est si diffus qu'un agrandissement par le CSS passe
       inaperçu : au-delà de 1, on ne paie que des fragments. Mesuré
       sur GPU intégré : 2,6 ms/image en 1600x900. */
    maxPixelRatio: 1,
    idleInterval: 120,

    /* Sans mouvement — rendu quasi statique, une seule image. */
    reducedIntensity: 0.75,
};

const BEAM_INTRO_KEY = 'mprnl:beams-intro';

/* Le temps de dérive est plafonné : au-delà d'une heure d'affichage
   continu, la brume se fige plutôt que de sauter pour éviter le
   dépassement de précision des shaders. */
const BEAM_TIME_CAP = 3600;

const VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
__PRECISION__ float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uSoftness;
uniform float uConeAngle;
uniform float uConeGrow;
uniform float uFalloff;
uniform float uEdgeNoise;
uniform float uEnvelopeGain;
uniform float uHazeAmount;
uniform float uHazeScale;
uniform float uHazeSpeed;
uniform float uCoreSharp;
uniform float uCoreGain;
uniform float uStriation;
uniform float uStriationFreq;
uniform float uHalo;
uniform float uTopLight;
uniform float uFloorLight;
uniform float uOpeningLeft;
uniform float uOpeningRight;
uniform float uLeftBoost;
uniform float uRightBoost;
uniform vec2  uOriginLeft;
uniform vec2  uAimLeft;
uniform vec2  uOriginRight;
uniform vec2  uAimRight;
uniform vec3  uWarm;
uniform vec3  uCool;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

/* Bruit de valeur à interpolation quintique : aucune discontinuité,
   donc pas l'aspect de bruit numérique. */
float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/* Deux octaves seulement : de grandes volutes lentes, pas de la fumée.
   Elles dérivent en sens opposés, donc la brume se recompose au lieu
   de glisser d'un bloc — et le bruit coûte un tiers de moins qu'à
   trois octaves, ce qui compte sur un GPU intégré. */
float haze(vec2 p, float drift) {
    float sum = 0.0;
    float amp = 0.62;
    for (int i = 0; i < 2; i++) {
        float d = drift * (i == 0 ? 1.0 : -0.6);
        sum += amp * valueNoise(p + vec2(d * 0.7, d));
        p = p * 2.11 + vec2(19.7, 7.3);
        amp *= 0.5;
    }
    return sum / 0.93;
}

/* Renvoie (densité, poids du cœur). Le bruit qui module l'ouverture
   est étiré le long de l'axe : la turbulence suit la lumière au lieu
   de la traverser. */
vec2 beam(vec2 p, vec2 origin, vec2 aim, float seed, float boost, float opening) {
    vec2 dir = aim - origin;
    float axis = length(dir);
    dir /= axis;
    vec2 side = vec2(-dir.y, dir.x);

    vec2 d = p - origin;
    float along = dot(d, dir);
    float across = dot(d, side);

    if (along <= 0.0) return vec2(0.0);

    /* Nappe de turbulence : une seule évaluation de bruit sert à la
       fois au bord, à la densité et aux striations. */
    float n = haze(vec2(along * 0.5 + seed, across * 1.7) * uHazeScale,
                   uTime * uHazeSpeed);

    /* Demi-largeur du cône : il démarre serré et s'ouvre lentement.
       Le plancher évite l'effet rayon laser : sans lui, le cône est
       un trait d'autant plus brillant qu'il est près de la source.
       L'ondulation ±edgeNoise ronge ensuite l'arête, sinon l'œil lit
       un polygone. */
    float width = (uConeAngle + uConeGrow * along) * along * opening + 0.028;
    width *= mix(1.0 - uEdgeNoise, 1.0 + uEdgeNoise, n);

    float s = abs(across) / max(width, 0.0001);
    if (s >= 1.0) return vec2(0.0);

    /* Profil transversal, en pente nulle sur le bord : la densité
       touche zéro sans marche, donc même un cœur brillant n'a pas
       d'arête visible. */
    float fall = 1.0 - s;
    float body = pow(fall, uSoftness);
    float core = pow(fall, uCoreSharp);

    /* Portée finie : un projecteur éclaire une zone, il n'inonde pas
       la salle. La lumière meurt dans son épaisseur au lieu de filer
       jusqu'au bord opposé de l'écran. */
    float atten = exp(-uFalloff * along * along);

    /* Striations : poussières en suspension, rayures fines qui ne
       touchent que le cœur — le bord reste propre. */
    float striation = 0.5
        + 0.5 * sin(across * uStriationFreq + n * 3.4 + seed * 2.0 + uTime * 0.06);
    float coreMod = 1.0 + (striation - 0.5) * uStriation;

    float density =
        (body * uEnvelopeGain + core * coreMod * uCoreGain)
        * atten
        * mix(1.0 - uHazeAmount, 1.0 + uHazeAmount, n)
        * boost;

    return vec2(density, clamp(core * coreMod * 1.6 + body * 0.3, 0.0, 1.0));
}

/* Lavoir et rebond : deux nappes larges et sans bord, l'une au-dessus
   du cadre, l'autre en dessous. Aucune n'est un projecteur — pas de
   cône, pas d'arête : ce sont les sources lointaines qui relient les
   deux spots sans jamais se lire comme des objets.
   Le repli elliptique (1 - |t|²) donne une chute douce à l'intérieur
   du cadre. Une octave de bruit les empêche de ressembler à un
   dégradé CSS. */
vec2 wash(vec2 p, float drift) {
    /* Deux nappes dont le centre tombe hors champ, au-dessus et en
       dessous du cadre : on n'en voit que la retombée. Rien ne se
       pose donc en hotspot derrière le titre — l'ambiance est une
       respiration du fond, pas une source. */
    vec2 t = vec2(p.x / 1.5, (p.y - 0.85) / 0.95);
    float pool = pow(clamp(1.0 - dot(t, t), 0.0, 1.0), 1.9);

    vec2 f = vec2(p.x / 1.2, (p.y + 0.92) / 0.6);
    float bounce = pow(clamp(1.0 - dot(f, f), 0.0, 1.0), 2.2);

    /* Grande échelle : le lavoir respire par grandes nappes plutôt que
       de poser un aplat uniforme sur la page. */
    float n = valueNoise(p * 0.55 + vec2(0.0, drift));
    return vec2(pool * uTopLight, bounce * uFloorLight) * (0.72 + 0.56 * n);
}

void main() {
    vec2 p = (gl_FragCoord.xy / uResolution - 0.5)
           * vec2(uResolution.x / uResolution.y, 1.0);

    vec2 left = beam(p, uOriginLeft, uAimLeft, 0.0, uLeftBoost, uOpeningLeft);
    vec2 right = beam(p, uOriginRight, uAimRight, 7.31, uRightBoost, uOpeningRight);
    vec2 ambient = wash(p, uTime * uHazeSpeed * 0.6);

    /* Halo de diffusion autour de chaque source : hors du cône, la
       lumière fuit quand même de la sortie de l'objectif. C'est ce
       qui « allume » le pourtour de la source au lieu de la laisser
       apparaître comme une découpe franche sur le bord de l'écran. */
    /* Chute rationnelle plutôt qu'exponentielle : même aspect au
       voisinage de la source, sans fonction transcendante par pixel. */
    float hLeft = 1.0 / (1.0 + dot(p - uOriginLeft, p - uOriginLeft) * 11.0);
    float hRight = 1.0 / (1.0 + dot(p - uOriginRight, p - uOriginRight) * 13.0);
    float halo = (hLeft * uLeftBoost + hRight * uRightBoost) * uHalo;

    float density = left.x + right.x;
    float ambientDensity = ambient.x + ambient.y;
    float diffusion = density + ambientDensity + halo;

    if (diffusion < 0.0006) {
        gl_FragColor = vec4(0.0);
        return;
    }

    /* La key (gauche) pèse plus lourd que le fill (droite) : le
       mélange chaud/froid suit la source qui domine le pixel, et le
       cœur de chaque fût est toujours plus chaud que ses bords. */
    float warmth = clamp(left.y * 1.15 + right.y * 0.35, 0.0, 1.0);
    vec3 tint = mix(uCool, uWarm, warmth);

    /* Loi de Beer-Lambert : la somme des sources sature
       naturellement au lieu de devenir un blanc saturé. */
    vec3 col = vec3(1.0) - exp(-tint * density * uIntensity);
    col += mix(uCool, uWarm, 0.35) * (ambientDensity + halo * 0.6) * uIntensity;

    float alpha = max(col.r, max(col.g, col.b));
    col = min(col, vec3(alpha));

    /* Tramage spatial fixe : supprime le banding des dégradés très
       sombres sur affichage 8 bits, sans grain ni scintillement. */
    col += (hash21(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0);

    gl_FragColor = vec4(max(col, 0.0), alpha);
}
`;

const BeamLight = {
    canvas: null,
    gl: null,
    program: null,
    position: null,
    buffer: null,
    uniforms: {},
    contextLost: false,
    destroyed: false,

    /* Environnement */
    motionQuery: null,
    reduced: false,
    coarse: false,
    narrow: false,

    /* Animation */
    rafId: 0,
    idleId: 0,
    lastFrame: 0,
    time: 0,
    elapsed: 0,
    introDone: true,
    settled: false,

    /* Pointeur */
    pointerTarget: 0,
    pointer: 0,

    /* Géométrie à l'échelle de la fenêtre */
    originLeft: [0, 0],
    aimLeft: [0, 0],
    originRight: [0, 0],
    aimRight: [0, 0],
    restLeft: [-0.5, 0.18],
    restRight: [0.48, -0.04],
    pixelRatio: 1,

    init() {
        if (this.destroyed) return;
        this.frame = this.frame.bind(this);

        this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reduced = this.motionQuery.matches;
        this.coarse = window.matchMedia('(hover: none)').matches;

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'beam-layer';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.canvas.setAttribute('role', 'presentation');
        document.body.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: 'low-power',
        });

        if (!this.gl || !this.setup()) {
            this.fallback();
            return;
        }

        this.listen();
        this.layout();

        if (this.reduced) {
            this.introDone = true;
            this.draw();
            return;
        }

        /* L introduction ne se rejoue pas dans la même session. */
        this.introDone = this.hasPlayedIntro();
        if (this.introDone) {
            this.elapsed = BEAM_CONFIG.introTotal;
            this.requestActive();
        } else {
            this.markIntroPlayed();
            this.requestActive();
        }
    },

    /* ---------- Contexte WebGL ---------- */

    setup() {
        const gl = this.gl;
        const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);

        const vertex = this.compile(gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragment = this.compile(
            gl.FRAGMENT_SHADER,
            FRAGMENT_SHADER.replace(
                '__PRECISION__',
                precision && precision.precision > 0 ? 'precision highp' : 'precision mediump'
            )
        );

        if (!vertex || !fragment) return false;

        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn('Faisceaux : shader non lié —', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return false;
        }

        this.program = program;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        );

        this.position = gl.getAttribLocation(program, 'aPosition');

        const names = [
            'uResolution', 'uTime', 'uIntensity', 'uSoftness', 'uConeAngle',
            'uConeGrow', 'uFalloff', 'uHazeAmount', 'uHazeScale', 'uHazeSpeed',
            'uOpeningLeft', 'uOpeningRight', 'uLeftBoost', 'uRightBoost',
            'uEnvelopeGain', 'uEdgeNoise', 'uCoreSharp', 'uCoreGain',
            'uStriation', 'uStriationFreq', 'uHalo',
            'uTopLight', 'uFloorLight',
            'uOriginLeft', 'uAimLeft', 'uOriginRight', 'uAimRight',
            'uWarm', 'uCool',
        ];
        names.forEach((name) => {
            this.uniforms[name] = gl.getUniformLocation(program, name);
        });

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 0);

        return true;
    },

    compile(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn('Faisceaux : shader invalide —', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    },

    /* ---------- Repli sans WebGL ---------- */

    fallback() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.gl = null;
        document.documentElement.classList.add('beams-fallback');
    },

    /* ---------- Écouteurs ---------- */

    listen() {
        this.onResize = () => {
            this.layout();
            if (this.reduced) this.draw();
        };
        window.addEventListener('resize', this.onResize, { passive: true });

        this.onVisibility = () => {
            if (document.hidden) {
                this.stop();
            } else if (!this.reduced && !this.destroyed && !this.contextLost) {
                this.lastFrame = 0;
                this.settle();
            }
        };
        document.addEventListener('visibilitychange', this.onVisibility);

        this.onMotionChange = () => {
            this.reduced = this.motionQuery.matches;
            if (this.reduced) {
                this.introDone = true;
                this.pointerTarget = 0;
                this.pointer = 0;
                this.stop();
                this.draw();
            } else {
                this.settle();
            }
        };
        this.motionQuery.addEventListener('change', this.onMotionChange);

        /* Pas de curseur simulé en tactile : le balayage de lumière
           reste, la parallaxe disparaît. */
        if (!this.coarse) {
            this.onPointerMove = (event) => {
                const x = event.clientX / Math.max(window.innerWidth, 1);
                this.pointerTarget = (x - 0.5) * 2;
                this.requestActive();
            };
            window.addEventListener('pointermove', this.onPointerMove, { passive: true });

            this.onPointerLeave = () => {
                this.pointerTarget = 0;
            };
            document.addEventListener('pointerleave', this.onPointerLeave);
        }

        this.onContextLost = (event) => {
            event.preventDefault();
            this.contextLost = true;
            this.stop();
        };
        this.onContextRestored = () => {
            this.contextLost = false;
            this.program = null;
            this.buffer = null;
            if (!this.setup()) {
                this.fallback();
                return;
            }
            this.layout();
            this.settle();
        };
        this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);
        this.canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
    },

    /* ---------- Mise en page ---------- */

    layout() {
        const width = window.innerWidth;
        const height = Math.max(window.innerHeight, 1);
        const aspect = width / height;

        /* Résolution réduite sur les appareils modestes : l'effet est
           un voile doux, l'agrandissement par le CSS passe inaperçu. */
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const light = cores <= 4 || memory <= 4;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, light ? 1 : BEAM_CONFIG.maxPixelRatio);

        const w = Math.max(1, Math.round(width * this.pixelRatio));
        const h = Math.max(1, Math.round(height * this.pixelRatio));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        this.gl.viewport(0, 0, w, h);

        this.narrow = width < 720;

        /* Sources hors champ : toujours au-delà du bord de la fenêtre.
           Sur écran étroit elles rentrent moins, sinon la lumière
           arrive déjà trop loin pour éclairer la composition. */
        const outside = this.narrow ? 0.22 : 0.3;
        this.originLeft = [-0.5 * aspect - outside, 0.58];
        this.originRight = [0.5 * aspect + outside + 0.04, 0.3];

        /* Au repos, le cœur de chaque faisceau effleure le tiers
           correspondant du contenu plutôt que de l'éclairer en plein. */
        const reach = Math.min(aspect, 1.15);
        this.restLeft = [-0.44 * reach, 0.18];
        this.restRight = [0.42 * reach, -0.04];
    },

    /* ---------- Boucle ---------- */

    requestActive() {
        if (this.destroyed || this.contextLost || this.reduced) return;
        if (this.idleId) {
            clearTimeout(this.idleId);
            this.idleId = 0;
        }
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(this.frame);
        }
    },

    /* Au repos, la dérive est si lente qu une image toutes les
       120 ms est indiscernable d'une animation continue. */
    requestIdle() {
        if (this.destroyed || this.contextLost || this.reduced) return;
        if (!this.rafId && !this.idleId) {
            this.idleId = setTimeout(() => this.frame(performance.now()), BEAM_CONFIG.idleInterval);
        }
    },

    frame(now) {
        this.rafId = 0;
        this.idleId = 0;

        if (this.destroyed || this.contextLost) return;

        const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.06) : 0.016;
        this.lastFrame = now;
        this.time = Math.min(this.time + dt, BEAM_TIME_CAP);
        this.elapsed += dt * 1000;

        /* Ressort exponentiel : indépendant de la fréquence d'images,
           donc le mouvement ne saute jamais d'une image à l'autre. */
        const response = BEAM_CONFIG.pointerResponse;
        const ease = 1 - Math.exp(-response * dt);
        this.pointer += (this.pointerTarget - this.pointer) * ease;

        const intro = this.introProgress();
        this.draw();

        /* La boucle ne s'arrête que lorsque l'introduction est terminée
           ET que le ressort a convergé. */
        this.settled =
            !intro.active && Math.abs(this.pointerTarget - this.pointer) <= 0.0005;

        if (this.settled) {
            this.lastFrame = 0;
            this.requestIdle();
        } else {
            this.requestActive();
        }
    },

    /* Retour au repos : reprend une boucle active tant que
       l'introduction ou le ressort n'est pas terminé. */
    settle() {
        this.elapsed = this.introDone ? BEAM_CONFIG.introTotal : 0;
        this.settled = false;
        this.lastFrame = 0;
        this.requestActive();
    },

    /* Chorégraphie d'introduction. Chaque source s'allume, s'ouvre,
       puis pivote jusqu'à sa position de repos avec un léger
       dépassement : un projecteur sur bras, pas une diapositive.
       Les deux jeux de valeurs sont décalés pour que les sources ne
       bougent jamais en même temps. */
    introProgress() {
        const config = BEAM_CONFIG;
        const elapsed = this.elapsed;

        if (this.introDone) {
            return {
                active: false,
                left: { boost: 1, opening: 1, sweep: 1 },
                right: { boost: 1, opening: 1, sweep: 1 },
            };
        }

        const stage = (offset) => {
            const t = Math.max(elapsed - offset, 0);

            const ignite = Math.min(t / config.introIgnite, 1);
            const open = Math.min(Math.max((t - config.introIgnite * 0.3) / config.introOpen, 0), 1);
            const sweep = Math.min(
                Math.max((t - config.introIgnite * 0.7 - config.introStagger) / config.introSweep, 0),
                1
            );

            /* Le faisceau droit s'allume juste après le gauche. */
            const fade = 1 - Math.pow(1 - ignite, 3);

            /* Pic bref à l'allumage : la décharge d'une lampe qui
               prend, puis l'équilibre. */
            const flash = 1 + (config.introFlash - 1) * Math.pow(1 - ignite, 2.2);

            /* Coup de brume quand la source balaie le contenu. */
            const burst = 1 + config.introBurst * Math.sin(Math.PI * sweep);

            return {
                boost: fade * flash * burst,
                opening: 0.3 + 0.7 * (1 - Math.pow(1 - open, 2.4)),
                sweep,
            };
        };

        return {
            active: elapsed < config.introTotal,
            left: stage(0),
            right: stage(config.introStagger),
        };
    },

    /* ---------- Rendu ---------- */

    draw() {
        const gl = this.gl;
        if (!gl || this.contextLost || !this.program) return;

        const config = BEAM_CONFIG;
        const intro = this.introProgress();
        const narrow = this.narrow ? 0.95 : 1;

        this.layoutTargets(intro);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.position);
        gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);

        const uniforms = this.uniforms;
        gl.uniform2f(uniforms.uResolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(uniforms.uTime, this.time);
        gl.uniform1f(uniforms.uIntensity, config.intensity * narrow * (this.reduced ? config.reducedIntensity : 1));
        gl.uniform1f(uniforms.uSoftness, config.softness);
        gl.uniform1f(uniforms.uConeAngle, config.coneAngle * (this.narrow ? 1.15 : 1));
        gl.uniform1f(uniforms.uConeGrow, config.coneGrow);
        gl.uniform1f(uniforms.uFalloff, config.falloff);
        gl.uniform1f(uniforms.uHazeAmount, config.hazeAmount);
        gl.uniform1f(uniforms.uHazeScale, config.hazeScale);
        gl.uniform1f(uniforms.uHazeSpeed, config.hazeSpeed * (this.coarse ? 0.7 : 1));
        gl.uniform1f(uniforms.uEnvelopeGain, config.softnessGain);
        gl.uniform1f(uniforms.uEdgeNoise, config.edgeNoise);
        gl.uniform1f(uniforms.uCoreSharp, config.coreSharp);
        gl.uniform1f(uniforms.uCoreGain, config.coreGain);
        gl.uniform1f(uniforms.uStriation, config.striation);
        gl.uniform1f(uniforms.uStriationFreq, config.striationFreq);
        gl.uniform1f(uniforms.uHalo, config.halo);
        gl.uniform1f(uniforms.uTopLight, config.topLight * narrow);
        gl.uniform1f(uniforms.uFloorLight, config.floorLight * narrow);
        gl.uniform1f(uniforms.uOpeningLeft, intro.left.opening);
        gl.uniform1f(uniforms.uOpeningRight, intro.right.opening * config.fillSpread);
        gl.uniform1f(uniforms.uLeftBoost, intro.left.boost * config.keyGain);
        gl.uniform1f(uniforms.uRightBoost, intro.right.boost * config.fillGain);
        gl.uniform2f(uniforms.uOriginLeft, this.originLeft[0], this.originLeft[1]);
        gl.uniform2f(uniforms.uAimLeft, this.aimLeft[0], this.aimLeft[1]);
        gl.uniform2f(uniforms.uOriginRight, this.originRight[0], this.originRight[1]);
        gl.uniform2f(uniforms.uAimRight, this.aimRight[0], this.aimRight[1]);
        gl.uniform3f(uniforms.uWarm, config.warm[0], config.warm[1], config.warm[2]);
        gl.uniform3f(uniforms.uCool, config.cool[0], config.cool[1], config.cool[2]);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    /* Position des visées : rotation d'introduction puis parallaxe.
       Le dépassement du bras est faible et amorti — la source
       dépasse sa position de repos puis y revient, comme un
       projecteur qu'on lâche après l'avoir orienté. */
    layoutTargets(intro) {
        const range = BEAM_CONFIG.pointerRange;
        const leftSweep = swingEase(intro.left.sweep);
        const rightSweep = swingEase(intro.right.sweep);

        const pointerLeft = this.pointer * range;
        const pointerRight = this.pointer * range * 0.85;

        /* Dérive propre du plateau : périodes de 70 à 110 s, donc
           jamais perçue comme une animation, seulement comme une
           respiration du décor. Les deux sources sont déphasées. */
        const swayX = Math.sin(this.time * 0.072) * BEAM_CONFIG.drift;
        const swayY = Math.cos(this.time * 0.057) * BEAM_CONFIG.drift * 0.8;
        const swayX2 = Math.sin(this.time * 0.043 + 2.1) * BEAM_CONFIG.drift;
        const swayY2 = Math.cos(this.time * 0.061 + 1.3) * BEAM_CONFIG.drift * 0.8;

        this.aimLeft = [
            this.restLeft[0] - 0.2 * (1 - leftSweep) + pointerLeft + swayX,
            this.restLeft[1] + 0.46 * (1 - leftSweep) + pointerLeft * 0.35 + swayY,
        ];
        this.aimRight = [
            this.restRight[0] + 0.2 * (1 - rightSweep) + pointerRight + swayX2,
            this.restRight[1] - 0.38 * (1 - rightSweep) + pointerRight * 0.3 + swayY2,
        ];
    },

    /* ---------- Session ---------- */

    hasPlayedIntro() {
        try {
            return window.sessionStorage.getItem(BEAM_INTRO_KEY) === '1';
        } catch (error) {
            /* Stockage indisponible (navigation privée, cookies bloqués) :
               l'introduction se rejoue, sans erreur. */
            return false;
        }
    },

    markIntroPlayed() {
        try {
            window.sessionStorage.setItem(BEAM_INTRO_KEY, '1');
        } catch (error) {
            /* Idem : on continue sans mémoriser. */
        }
    },

    /* ---------- Arrêt ---------- */

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        if (this.idleId) {
            clearTimeout(this.idleId);
            this.idleId = 0;
        }
        this.lastFrame = 0;
    },

    destroy() {
        this.stop();

        if (this.motionQuery) {
            this.motionQuery.removeEventListener('change', this.onMotionChange);
        }
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.onVisibility);
        document.removeEventListener('pointerleave', this.onPointerLeave);
        window.removeEventListener('pointermove', this.onPointerMove);

        if (this.canvas) {
            this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
            this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
        }

        if (this.gl) {
            if (this.buffer) this.gl.deleteBuffer(this.buffer);
            if (this.program) this.gl.deleteProgram(this.program);
            const lose = this.gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();
        }
        this.gl = null;
        this.program = null;
        this.buffer = null;
        this.position = null;

        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.destroyed = true;
    },
};

function easeInOut(t) {
    return t * t * (3 - 2 * t);
}

/* Rotation d'un bras mécanique : accélération douce, dépassement
   léger, retour amorti. Le dépassement reste sous les 3 % pour
   qu'on le sente sans le voir. */
function swingEase(t) {
    const damped = easeInOut(t);
    if (t >= 1) return 1;
    return damped + Math.sin(t * Math.PI) * 0.045 * (1 - t);
}

/* Démarrage après le DOM : le calque ne doit jamais retarder le
   rendu du contenu. window.beamLight.destroy() libère la boucle,
   les écouteurs et les ressources GPU. */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BeamLight.init());
} else {
    BeamLight.init();
}

window.beamLight = BeamLight;
