/* =========================================================
   Intro 3D — champ de particules volumétrique
   Chargé en différé, uniquement sur poste large.
   Ne bloque jamais le contenu : le site reste lisible et
   indexable derrière, la scène est purement décorative.

   volontairement en matériaux natifs Three.js (PointsMaterial)
   plutôt qu'en ShaderMaterial : le rendu est vérifié, et le
   mouvement est fait côté CPU sur ~2 000 particules, ce qui
   reste très en dessous du budget d'une frame.
   ========================================================= */

const intro = (() => {
    const DURATION = 3000; // ms avant fermeture automatique
    const SESSION_KEY = 'intro3d-seen';
    const COUNT = 2000;
    const DEPTH = 42; // profondeur du volume de particules

    return {
    // Pas d'intro sur mobile, ou si l'utilisateur a demandé moins
    // de mouvement.
    supported:
        window.matchMedia('(min-width: 1024px)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches,

    started: false,

    init() {
        let seen = false;
        try {
            seen = sessionStorage.getItem(SESSION_KEY) === '1';
        } catch (error) {
            // Navigation privée : on montre l'intro à chaque visite
            seen = false;
        }

        if (!this.supported || seen) return;

        // Ne charger Three.js qu'une fois la page au repos : le hero
        // s'affiche immédiatement, la 3D arrive après.
        const start = () => {
            if (this.started) return;
            this.started = true;
            this.load();
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(start, { timeout: 800 });
        } else {
            setTimeout(start, 250);
        }
    },

    async load() {
        try {
            const THREE = await import('/assets/vendor/three.module.min.js');
            this.mount(THREE);
        } catch (error) {
            console.warn('Intro 3D non chargée', error);
        }
    },

    mount(THREE) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'intro-canvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.canvas);

        this.overlay = document.createElement('div');
        this.overlay.className = 'intro-overlay';
        this.overlay.setAttribute('aria-hidden', 'true');

        this.hint = document.createElement('button');
        this.hint.className = 'intro-skip';
        this.hint.type = 'button';
        this.hint.textContent = 'Passer';
        this.hint.addEventListener('click', () => this.close());
        this.overlay.appendChild(this.hint);

        document.body.appendChild(this.overlay);
        document.body.classList.add('has-intro');

        // --- Renderer -------------------------------------------------
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
        this.camera.position.set(0, 0, 12);

        this.buildField(THREE);

        // --- Parallaxe souris -----------------------------------------
        this.pointer = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.onPointerMove = (event) => {
            this.target.x = (event.clientX / window.innerWidth - 0.5) * 2;
            this.target.y = (event.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('pointermove', this.onPointerMove, {
            passive: true,
        });

        this.clock = new THREE.Clock();
        this.elapsed = 0;
        this.running = true;
        this.onResize = () => this.resize();
        window.addEventListener('resize', this.onResize, { passive: true });

        // Suspendre la boucle en arrière-plan : évite de brûler le GPU
        // et supprime les sauts d'images au retour sur l'onglet.
        this.onVisibilityChange = () => {
            if (document.hidden) this.pause();
            else this.resume();
        };
        document.addEventListener('visibilitychange', this.onVisibilityChange);

        try {
            sessionStorage.setItem(SESSION_KEY, '1');
        } catch (error) {
            /* rien à faire */
        }

        this.timer = setTimeout(() => this.close(), DURATION);
        this.animate();
    },

    buildField(THREE) {
        const positions = new Float32Array(COUNT * 3);
        const colors = new Float32Array(COUNT * 3);

        // Vitesse et phase par particule, pour un mouvement non uniforme
        this.speeds = new Float32Array(COUNT);
        this.phases = new Float32Array(COUNT);

        const accent = new THREE.Color(0xa5b4fc);
        const cool = new THREE.Color(0x7aa2f7);
        const soft = new THREE.Color(0xc7d2fe);
        const warm = new THREE.Color(0xfbbf24);
        const tmp = new THREE.Color();

        const spread = 17;

        for (let i = 0; i < COUNT; i++) {
            const index = i * 3;

            positions[index] = (Math.random() - 0.5) * spread;
            positions[index + 1] = (Math.random() - 0.5) * spread;
            positions[index + 2] = -Math.random() * DEPTH;

            // 10 % de particules chaudes : évite l'uniformité bleue
            const mix = Math.random();
            if (mix < 0.1) tmp.copy(accent).lerp(warm, 0.6);
            else if (mix < 0.45) tmp.copy(accent).lerp(cool, Math.random());
            else tmp.copy(accent).lerp(soft, Math.random() * 0.85);

            colors[index] = tmp.r;
            colors[index + 1] = tmp.g;
            colors[index + 2] = tmp.b;

            this.speeds[i] = 1.4 + Math.random() * 4.2;
            this.phases[i] = Math.random() * Math.PI * 2;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.points = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                size: 0.17,
                vertexColors: true,
                transparent: true,
                opacity: 0,
                sizeAttenuation: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );
        // Les positions sont modifiées chaque frame : la sphère
        // d'encadrement devient fausse et le frustum rejetait tout.
        this.points.frustumCulled = false;
        this.scene.add(this.points);

        // Deux halos en arrière-plan donnent du relief au volume
        this.glow = new THREE.Mesh(
            new THREE.SphereGeometry(3.2, 24, 24),
            new THREE.MeshBasicMaterial({
                color: 0x1e1b4b,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.glow.position.z = -26;
        this.scene.add(this.glow);
    },

    animate() {
        if (!this.running) return;

        this.raf = requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.05);
        this.elapsed += delta;

        const t = this.elapsed;
        const progress = Math.min(t / (DURATION / 1000), 1);

        // --- Avance vers le spectateur ---------------------------------
        // C'est ce mouvement continu qui donne la sensation de profondeur.
        const positions = this.points.geometry.attributes.position.array;
        const speeds = this.speeds;
        const phases = this.phases;

        for (let i = 0; i < COUNT; i++) {
            const index = i * 3;

            let z = positions[index + 2] + delta * speeds[i];

            // Réapparaissent au fond du tunnel
            if (z > 2) {
                z = -DEPTH;
                positions[index] = (Math.random() - 0.5) * 17;
                positions[index + 1] = (Math.random() - 0.5) * 17;
            }

            // Flottement latéral, propre à chaque particule
            const phase = phases[i];
            positions[index] += Math.sin(t * 0.6 + phase) * delta * 0.42;
            positions[index + 1] += Math.cos(t * 0.5 + phase * 1.3) * delta * 0.36;

            positions[index + 2] = z;
        }

        this.points.geometry.attributes.position.needsUpdate = true;

        // --- Apparition puis disparition --------------------------------
        // Apparition franche sur le premier quart, puis disparition
        const fadeIn = Math.min(progress / 0.22, 1);
        const fadeOut = progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1;
        const alpha = fadeIn * fadeOut;

        this.points.material.opacity = alpha * 0.92;
        this.glow.material.opacity = alpha * 0.22;
        this.glow.scale.setScalar(1 + Math.sin(t * 0.9) * 0.05);

        // --- Parallaxe souris ------------------------------------------
        this.pointer.x += (this.target.x - this.pointer.x) * 0.045;
        this.pointer.y += (this.target.y - this.pointer.y) * 0.045;

        this.points.rotation.z = t * 0.035;
        this.points.rotation.y = this.pointer.x * 0.16;

        this.camera.position.x = this.pointer.x * 1.6;
        this.camera.position.y = -this.pointer.y * 1.2;
        this.camera.lookAt(0, 0, -14);

        this.renderer.render(this.scene, this.camera);
    },

    resize() {
        if (!this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    pause() {
        if (!this.running) return;
        this.running = false;
        cancelAnimationFrame(this.raf);
        this.clock.stop();
    },

    resume() {
        if (this.running || !this.renderer) return;
        this.running = true;
        this.clock.start();
        this.animate();
    },

    close() {
        if (!this.overlay) return;

        clearTimeout(this.timer);
        this.overlay.classList.add('is-leaving');

        const done = () => this.teardown();
        this.overlay.addEventListener('transitionend', done, { once: true });
        // Filet si transitionend ne se déclenche pas (onglet caché, etc.)
        setTimeout(done, 900);
    },

    teardown() {
        this.pause();

        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener(
            'visibilitychange',
            this.onVisibilityChange
        );

        // Libération explicite : la scène ne doit pas survivre à la fermeture
        if (this.points) {
            this.points.geometry.dispose();
            this.points.material.dispose();
            this.scene.remove(this.points);
        }
        if (this.glow) {
            this.glow.geometry.dispose();
            this.glow.material.dispose();
            this.scene.remove(this.glow);
        }
        if (this.renderer) this.renderer.dispose();

        this.overlay?.remove();
        this.canvas?.remove();
        document.body.classList.remove('has-intro');

        this.overlay = null;
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.points = null;
        this.glow = null;
    },
    };
})();

// Export pour l'inspection et les tests ; sans effet sur le chargement
// via une balise <script type="module">.
export default intro;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => intro.init());
} else {
    intro.init();
}