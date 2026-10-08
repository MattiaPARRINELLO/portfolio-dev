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

    /* Pointeur — chaque bras a son propre ressort amorti : la key est
       raide, elle répond ; le fill est plus souple, il traîne. Deux
       projecteurs tenus par deux personnes ne basculent jamais
       ensemble, et c'est ce décalage qui enlève le côté robot.
       stiffness = raideur (1/s²), damping = frottement (1/s) :
       sous l'amortissement critique, le bras dépasse puis se cale.
       range = amplitude du basculement (unités écran). */
    pointerRange: 0.07,
    keyStiffness: 17.0,
    keyDamping: 5.1,
    fillStiffness: 9.0,
    fillDamping: 3.95,

    /* Dérive du plateau — faite de bruit, pas de sinus. Un sinus se
       repère au bout de deux cycles : on sent la boucle s'installer.
       amplitude en unités écran, speed en cellules de bruit par
       seconde (0.055 ≈ une cellule toutes les 18 s). */
    drift: 0.022,
    driftSpeed: 0.055,

    /* Introduction (ms) — chaque source suit sa propre partition :
       mêmes gestes, deux mains différentes. C'est le déséquilibre des
       timings qui fait deux projecteurs, là où un seul jeu de valeurs
       joué deux fois se lit comme une animation.
       ignite = montée de la lampe, open = ouverture de l'iris,
       sweepAt = départ de la rotation du bras, sweepDur = durée de
       cette rotation, sputter/sputterFreq = crachotement de l'allumage
       (bruit, donc irrégulier), introStagger = retard global du fill. */
    introFlash: 1.35,
    introBurst: 0.5,
    introSputter: 0.24,
    introBow: 0.03,
    introStagger: 190,
    introTotal: 2500,
    keyIntro: { ignite: 460, open: 640, sweepAt: 320, sweepDur: 1500, sputter: 6.5, sputterFreq: 0.028 },
    fillIntro: { ignite: 580, open: 800, sweepAt: 470, sweepDur: 1720, sputter: 4.6, sputterFreq: 0.022 },

    /* Rotations d'introduction — paramètres de l'oscillateur amorti
       (voir swingEase) : w fixe la pulsation du dépassement, k la
       vitesse à laquelle le bras se cale. Le fill dépasse davantage
       et met plus longtemps à retomber. */
    keySwing: { k: 4.6, w: 5.8 },
    fillSwing: { k: 5.0, w: 4.6 },

    /* Chorégraphie de scroll — le plateau ne bouge plus seulement au
       pointeur : il est aussi mis en scène le long de la page. Chaque
       pose est un décalage ajouté à la visée de repos (x/y), un facteur
       d'intensité (boost) et un facteur d'iris (opening). Le scroll est
       amorti comme le pointeur, donc les deux mouvements se superposent
       au lieu de se remplacer : la scène reste vivante à l'arrêt et
       démarre en même temps qu'on descend.

       `at` accepte une ancre (#id) résolue au moment du layout, ou un
       pourcentage de la course. L'ancre suit la section : si le contenu
       change de hauteur, les poses restent sur les mêmes blocs.
       Les deux bras ne partagent pas les mêmes valeurs, donc jamais le
       même geste des deux côtés. */
    scroll: {
        stiffness: 8.5,
        damping: 4.4,
        keys: [
            { at: '#hero',    key: { x:  0.10, y:  0.05, boost: 1.00, opening: 0.92 }, fill: { x: -0.09, y: -0.04, boost: 1.00, opening: 0.92 } },
            { at: '#about',   key: { x: -0.06, y:  0.10, boost: 0.96, opening: 1.00 }, fill: { x:  0.07, y:  0.08, boost: 1.02, opening: 1.06 } },
            { at: '#work',    key: { x:  0.08, y: -0.02, boost: 1.06, opening: 1.12 }, fill: { x: -0.10, y:  0.03, boost: 0.96, opening: 1.02 } },
            { at: '#journey', key: { x: -0.02, y:  0.18, boost: 1.02, opening: 0.86 }, fill: { x:  0.05, y: -0.16, boost: 1.06, opening: 1.16 } },
            { at: '#stack',   key: { x:  0.12, y: -0.10, boost: 0.94, opening: 1.16 }, fill: { x: -0.06, y: -0.12, boost: 1.00, opening: 0.88 } },
            { at: '#contact', key: { x:  0.02, y:  0.16, boost: 1.10, opening: 1.08 }, fill: { x: -0.02, y: -0.14, boost: 1.14, opening: 1.18 } },
        ],
    },

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
    reducedFrame: 0,
    lastFrame: 0,
    time: 0,
    elapsed: 0,
    introDone: true,
    settled: false,

    /* Pointeur — un ressort amorti par bras, position + vitesse.
       Deux états séparés : c'est ce qui fait que les deux fûts ne se
       déplacent pas comme un seul objet rigide. */
    pointerTarget: 0,
    springs: {
        key: { pos: 0, vel: 0 },
        fill: { pos: 0, vel: 0 },
    },

    /* Scroll — même ressort amorti, mais sur la progression de la page
       (0 = haut, 1 = bas) et non sur une position de pointeur. La
       progression est lissée par le ressort, donc un scroll à la molette
       ne se lit jamais comme une secousse. */
    scrollTarget: 0,
    scrollSpring: { pos: 0, vel: 0 },
    scrollAnchors: [],

    /* Géométrie à l'échelle de la fenêtre */
    originLeft: [0, 0],
    aimLeft: [0, 0],
    originRight: [0, 0],
    aimRight: [0, 0],
    restLeft: [-0.5, 0.18],
    restRight: [0.48, -0.04],
    pixelRatio: 1,

    /* Sortie de layoutTargets, lue par draw() */
    openingKey: 1,
    openingFill: 1,
    boostKey: 1,
    boostFill: 1,

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

        /* La progression de page est lue après layout : les ancres de la
           chorégraphie ne sont justes qu'une fois les sections mesurées.
           Un rechargement au milieu de la page s'ouvre donc déjà posé. */
        this.onScroll();

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
                this.restSprings();
                this.stop();
                this.draw();
            } else {
                this.settle();
            }
        };
        this.motionQuery.addEventListener('change', this.onMotionChange);

        /* Le scroll met le plateau en scène : il réveille la boucle et
           prend la main sur les visées, en plus du pointeur. */
        this.onScroll = () => {
            const doc = document.documentElement;
            const range = Math.max(doc.scrollHeight - window.innerHeight, 1);
            this.scrollTarget = Math.min(Math.max(window.scrollY / range, 0), 1);

            if (this.reduced) {
                /* Sans mouvement, le scroll ne redessine pas une image
                   par événement : une seule par frame, au plus. */
                this.scrollSpring.pos = this.scrollTarget;
                this.scrollSpring.vel = 0;
                if (!this.reducedFrame) {
                    this.reducedFrame = requestAnimationFrame(() => {
                        this.reducedFrame = 0;
                        this.draw();
                    });
                }
                return;
            }

            this.requestActive();
        };
        window.addEventListener('scroll', this.onScroll, { passive: true });

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

        this.resolveScrollAnchors();
    },

    /* Chaque pose est calée sur le haut de sa section : une ancre
       '#work' est vraie tant que #work existe, où qu'elle tombe dans la
       course. Une ancre introuvable retombe sur la position précédente,
       donc une section renommée ne vide pas la chorégraphie. */
    resolveScrollAnchors() {
        const keys = BEAM_CONFIG.scroll.keys;
        const doc = document.documentElement;
        const range = Math.max(doc.scrollHeight - window.innerHeight, 1);

        this.scrollAnchors = keys.map((key, index) => {
            if (typeof key.at === 'number') return key.at;

            const el = document.querySelector(key.at);
            if (!el) {
                return this.scrollAnchors[index - 1] ?? index / (keys.length - 1);
            }

            /* On vise le moment où la section atteint le tiers haut de
               l'écran : c'est là que le contenu entre dans le cadre et
               que la pose a lieu de jouer. */
            const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.34;
            return clamp01(top / range);
        });
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

        /* Chaque bras est un ressort amorti (position + vitesse),
           intégré en semi-implicite : stable quel que soit le pas de
           temps. Un lissage exponentiel colle à la souris — ça se voit
           tout de suite. Le dépassement, lui, donne le poids : le bras
           part, dépasse sa cible, revient. */
        const config = BEAM_CONFIG;
        const step = (spring, stiffness, damping, target) => {
            const accel = (target - spring.pos) * stiffness
                - spring.vel * damping;
            spring.vel += accel * dt;
            spring.pos += spring.vel * dt;
        };
        step(this.springs.key, config.keyStiffness, config.keyDamping, this.pointerTarget);
        step(this.springs.fill, config.fillStiffness, config.fillDamping, this.pointerTarget);

        /* La progression de page est amortie elle aussi : le scroll
           pousse le plateau, il ne le téléporte pas. */
        const scroll = BEAM_CONFIG.scroll;
        step(this.scrollSpring, scroll.stiffness, scroll.damping, this.scrollTarget);

        const intro = this.introProgress();
        this.draw();

        /* La boucle ne s'arrête que lorsque l'introduction est terminée
           et que les deux bras sont retombés — position ET vitesse. Le
           ressort de scroll compte aussi : sinon la pose resterait en
           vol dès que la page s'arrête. */
        const atRest = (spring, target) =>
            Math.abs(target - spring.pos) <= 0.003
            && Math.abs(spring.vel) <= 0.006;
        this.settled = !intro.active
            && atRest(this.springs.key, this.pointerTarget)
            && atRest(this.springs.fill, this.pointerTarget)
            && atRest(this.scrollSpring, this.scrollTarget);

        if (this.settled) {
            this.lastFrame = 0;
            this.requestIdle();
        } else {
            this.requestActive();
        }
    },

    /* Repos immédiat des deux bras : utilisé quand l'animation est
       coupée (mouvement réduit), où l'on dessine une seule image. */
    restSprings() {
        this.springs.key.pos = 0;
        this.springs.key.vel = 0;
        this.springs.fill.pos = 0;
        this.springs.fill.vel = 0;
    },

    /* Retour au repos : reprend une boucle active tant que
       l'introduction ou les ressorts ne sont pas terminés. */
    settle() {
        this.elapsed = this.introDone ? BEAM_CONFIG.introTotal : 0;
        this.settled = false;
        this.lastFrame = 0;
        this.requestActive();
    },

    /* Chorégraphie d'introduction. Chaque source suit sa propre
       partition : la key s'allume et se cale plus vite, le fill traîne
       derrière. Un seul jeu de valeurs joué deux fois se lit comme une
       animation ; deux partitionnements distincts se lisent comme deux
       projecteurs. */
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

        const stage = (profile, seed, offset) => {
            const t = Math.max(elapsed - offset, 0);

            const ignite = clamp01(t / profile.ignite);

            /* Allumage d'une lampe à décharge : elle prend d'un coup,
               puis crachote quelques centaines de millisecondes. Le
               tremblement vient d'un bruit irrégulier et non d'une
               sinusoïde — un scintillement sinusoïdal scintille
               proprement, et ça n'existe pas. */
            const sputter = Math.exp(-profile.sputter * (t / 1000))
                * driftNoise(t * profile.sputterFreq, seed);

            /* Iris : les lamelles s'écartent puis se calent. */
            const open = clamp01((t - profile.ignite * 0.3) / profile.open);

            /* Bras : rotation relâchée, dépassement amorti (swingEase). */
            const sweep = clamp01((t - profile.sweepAt) / profile.sweepDur);

            const fade = 1 - Math.pow(1 - ignite, 3);

            /* Détente de la lampe : pic bref à l'allumage, puis
               équilibre, bruité par le crachotement. */
            const flash = 1
                + (config.introFlash - 1) * Math.pow(1 - ignite, 2.2)
                + sputter * config.introSputter;

            /* Coup de brume quand le fût balaie le contenu. */
            const burst = 1 + config.introBurst * Math.sin(Math.PI * sweep);

            return {
                boost: fade * burst * flash,
                /* L'iris tremble aussi : le crachotement se voit sur le
                   cône, pas seulement sur l'intensité. */
                opening: 0.3 + 0.7 * (1 - Math.pow(1 - open, 2.4))
                    - sputter * config.introSputter * 0.5,
                sweep,
            };
        };

        return {
            active: elapsed < config.introTotal,
            left: stage(config.keyIntro, 0, 0),
            right: stage(config.fillIntro, 13.7, config.introStagger),
        };
    },

    /* ---------- Rendu ---------- */

    draw() {
        const gl = this.gl;
        if (!gl || this.contextLost || !this.program) return;

        const config = BEAM_CONFIG;
        const narrow = this.narrow ? 0.95 : 1;

        this.layoutTargets(this.introProgress());

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
        gl.uniform1f(uniforms.uOpeningLeft, this.openingKey);
        gl.uniform1f(uniforms.uOpeningRight, this.openingFill * config.fillSpread);
        gl.uniform1f(uniforms.uLeftBoost, this.boostKey * config.keyGain);
        gl.uniform1f(uniforms.uRightBoost, this.boostFill * config.fillGain);
        gl.uniform2f(uniforms.uOriginLeft, this.originLeft[0], this.originLeft[1]);
        gl.uniform2f(uniforms.uAimLeft, this.aimLeft[0], this.aimLeft[1]);
        gl.uniform2f(uniforms.uOriginRight, this.originRight[0], this.originRight[1]);
        gl.uniform2f(uniforms.uAimRight, this.aimRight[0], this.aimRight[1]);
        gl.uniform3f(uniforms.uWarm, config.warm[0], config.warm[1], config.warm[2]);
        gl.uniform3f(uniforms.uCool, config.cool[0], config.cool[1], config.cool[2]);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    /* Pose de scroll : lecture de la chorégraphie à la progression
       courante. Les deux keyframes encadrantes sont interpolées avec
       un ease — un lerp brut fait suivre les poses en ligne droite et
       ça se lit comme une interpolation d'animation, pas comme un
       projecteur qu'on déplace. La dernière pose tient jusqu'en bas :
       le pied de page n'a pas de clé à lui, mais la scène ne retombe
       pas pour autant. */
    scrollPose() {
        const keys = BEAM_CONFIG.scroll.keys;
        const anchors = this.scrollAnchors;
        const p = clamp01(this.scrollSpring.pos);

        if (!anchors.length) {
            return { key: keys[0].key, fill: keys[0].fill, t: 0 };
        }

        let index = anchors.length - 1;
        for (let i = 0; i < anchors.length - 1; i += 1) {
            if (p <= anchors[i + 1]) {
                index = i;
                break;
            }
        }

        const from = keys[index];
        const to = keys[Math.min(index + 1, keys.length - 1)];
        const span = anchors[index + 1] !== undefined
            ? anchors[index + 1] - anchors[index]
            : 0;

        /* Hors course (avant la première ancre ou après la dernière),
           la pose tient : aucune extrapolations vers le vide. */
        if (span <= 0) return { key: from.key, fill: from.fill, t: 0 };

        const t = easeInOut(clamp01((p - anchors[index]) / span));
        return {
            key: mixPose(from.key, to.key, t),
            fill: mixPose(from.fill, to.fill, t),
            t,
        };
    },

    /* Position des visées : rotation d'introduction, parallaxe, dérive,
       pose de scroll. Chaque source a son propre ressort, donc ses
       propres décalage et dépassement ; rien ne bouge en miroir. */
    layoutTargets(intro) {
        const config = BEAM_CONFIG;

        const pointerLeft = this.springs.key.pos * config.pointerRange;
        const pointerRight = this.springs.fill.pos * config.pointerRange * 0.9;

        /* Le scroll vient s'ajouter au pointeur, pas le remplacer : les
           deux se cumulent et c'est ce cumul qui fait la transition —
           on lance la page et les projecteurs sont déjà en place. */
        const pose = this.scrollPose();

        /* Dérive du plateau : du bruit, donc jamais deux fois le même
           trajet. Les deux sources dérivent à des vitesses différentes,
           avec des octaves différentes, pour qu'elles ne se recroisent
           jamais aux mêmes instants. */
        const speed = config.driftSpeed;
        const d = config.drift;
        const swayXL = driftNoise(this.time * speed, 3.1) * d;
        const swayYL = driftNoise(this.time * speed * 0.83, 11.7) * d * 0.8;
        const swayXR = driftNoise(this.time * speed * 0.71, 27.3) * d;
        const swayYR = driftNoise(this.time * speed * 1.09, 41.9) * d * 0.8;

        /* Trajet d'introduction : une rotation de bras décrit un arc,
           pas une droite. Le bombé est porté par l'axe horizontal —
           c'est là qu'on gagne à rester en marge du texte — avec une
           petite composante verticale pour que ce soit une rotation et
           non une translation. Nul aux deux bouts : une fois le bras
           calé, plus rien ne bouge. Volontairement plus faible que le
           dépassement du ressort, sinon il le masquerait. */
        const bowL = Math.sin(Math.PI * intro.left.sweep) * config.introBow;
        const bowR = Math.sin(Math.PI * intro.right.sweep) * config.introBow * 0.75;

        const dropL = 1 - swingEase(intro.left.sweep, config.keySwing.k, config.keySwing.w);
        const dropR = 1 - swingEase(intro.right.sweep, config.fillSwing.k, config.fillSwing.w);

        /* L'iris et l'intensité suivent aussi la pose : une section
          change la mise en scène, pas seulement l'orientation. */
        this.openingKey = intro.left.opening * pose.key.opening;
        this.openingFill = intro.right.opening * pose.fill.opening;
        this.boostKey = intro.left.boost * pose.key.boost;
        this.boostFill = intro.right.boost * pose.fill.boost;

        this.aimLeft = [
            this.restLeft[0] - 0.2 * dropL + pointerLeft + swayXL - bowL + pose.key.x,
            this.restLeft[1] + 0.46 * dropL + pointerLeft * 0.35 + swayYL + bowL * 0.3 + pose.key.y,
        ];
        this.aimRight = [
            this.restRight[0] + 0.2 * dropR + pointerRight + swayXR + bowR + pose.fill.x,
            this.restRight[1] - 0.38 * dropR + pointerRight * 0.3 + swayYR - bowR * 0.3 + pose.fill.y,
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
        if (this.reducedFrame) {
            cancelAnimationFrame(this.reducedFrame);
            this.reducedFrame = 0;
        }
        this.lastFrame = 0;
    },

    destroy() {
        this.stop();

        if (this.motionQuery) {
            this.motionQuery.removeEventListener('change', this.onMotionChange);
        }
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('scroll', this.onScroll);
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

function clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
}

/* Quintique : pente nulle aux deux bouts, donc la pose ne démarre ni
   ne s'arrête net entre deux sections. */
function easeInOut(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

/* Interpolation d'une pose de keyframe. Les deux bras gardent leurs
   propres valeurs : aucune symmetry à reconstruire ici. */
function mixPose(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        boost: a.boost + (b.boost - a.boost) * t,
        opening: a.opening + (b.opening - a.opening) * t,
    };
}

/* Bruit de valeur 1D, même famille que celui du shader : continu, et
   surtout sans période. C'est lui qui remplace les sinus de dérive. */
function hash11(x) {
    const s = Math.sin(x * 127.1) * 43758.5453123;
    return s - Math.floor(s);
}

function noise1(x) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * f * (f * (f * 6 - 15) + 10);
    return (hash11(i) * (1 - u) + hash11(i + 1) * u) * 2 - 1;
}

/* Deux octaves : une dérive longue et une respiration plus courte.
   Le rapport des fréquences est volontairement non entier, sinon les
   deux octaves se recroiseraient toujours au même endroit et le
   motif se répéterait. */
function driftNoise(x, seed) {
    return noise1(x + seed) * 0.66
        + noise1(x * 2.17 + seed * 1.7 + 19.7) * 0.34;
}

/* Rotation d'un bras qu'on oriente puis qu'on lâche : le geste part
   vite, dépasse sa cible, puis se cale. C'est la réponse d'un
   oscillateur amorti — un easeInOut se pose net et se lit comme une
   animation, pas comme un objet.
   k = vitesse d'amortissement, w = pulsation du dépassement.
   Le premier pic tombe vers pi/w et culmine à exp(-k·pi/w). */
function swingEase(t, k, w) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return 1 - Math.exp(-k * t) * (Math.cos(w * t) + (k / w) * Math.sin(w * t));
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
