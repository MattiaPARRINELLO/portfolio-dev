/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PORTFOLIO MATTIA PARRINELLO - JAVASCRIPT PRINCIPAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier gère toutes les interactions et animations du portfolio.
 * Code structuré en modules pour faciliter la maintenance.
 * 
 * Fonctionnalités :
 * 1. Navigation (scroll, menu mobile, effet blur)
 * 2. Animations au scroll (Intersection Observer)
 * 3. Smooth scroll pour les ancres
 * 4. Effets visuels (parallax léger, cursor custom optionnel)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION GLOBALE
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Seuil de scroll pour activer le blur de la navbar (en pixels)
    navScrollThreshold: 50,

    // Options de l'Intersection Observer pour les animations au scroll
    scrollAnimationOptions: {
        threshold: 0.1,      // 10% de l'élément visible
        rootMargin: '0px 0px -50px 0px'  // Déclenche un peu avant
    },

    // Durée des animations (en ms)
    animationDuration: 800
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTENU ÉDITABLE
// Modifie ces tableaux pour ajouter/supprimer des projets, stacks, timeline
// ═══════════════════════════════════════════════════════════════════════════

const CONTENT = {
    timeline: [
        {
            date: '2026 - présent',
            title: '💻 Backstage — second cerveau IA',
            description: "Conception et développement en solo d'une PWA full-stack déployée en production : chat IA à mémoire persistante, agenda, rappels synchronisés, notifications push. Passkey (WebAuthn), OAuth Google, JWT, streaming SSE, 34 routes API. ~32 000 lignes, 46 fichiers de tests.",
            tags: [
                { label: 'Next.js', className: 'text-xs px-2 py-1 bg-accent/20 text-accent rounded' },
                { label: 'React', className: 'text-xs px-2 py-1 bg-accent/20 text-accent rounded' },
                { label: 'TypeScript', className: 'text-xs px-2 py-1 bg-accent/20 text-accent rounded' },
                { label: 'Vitest', className: 'text-xs px-2 py-1 bg-accent/20 text-accent rounded' }
            ]
        },
        {
            date: '2026',
            title: '🤖 Gymshark-Sync — assistant sur LLM local',
            description: "Projet de groupe : serveur Node.js / Express relié à un LLM local (Ollama) pour des synthèses, de la planification et un historique de conversations. Tests Jest et documentation Swagger.",
            tags: [
                { label: 'Node.js', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' },
                { label: 'Express', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' },
                { label: 'Ollama', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' },
                { label: 'Jest', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' }
            ]
        },
        {
            date: '2025 - présent',
            title: '🎓 Études en Informatique',
            description: "Bachelor Informatique. Développement web, bases de données et architecture logicielle.",
            tags: [
                { label: 'PHP', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' },
                { label: 'Python', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' },
                { label: 'Linux', className: 'text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded' }
            ]
        },
        {
            date: '2025',
            title: "Premier grand projet : Portfolio Photo",
            description: "Création d'un portfolio photo pour ma passion de la photographie de concert. Optimisation des performances et design moderne. M'a permis de me démarquer et d'obtenir mes premiers clients et accréditation.",
            tags: [
                { label: 'HTML', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' },
                { label: 'CSS', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' },
                { label: 'JavaScript', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' },
                { label: 'Node.js', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' }
            ]
        },
        {
            date: '2022 - 2023',
            title: '🏢 Stages développeur — INOVSHOP Group',
            description: "Application web d'affichage en temps réel de l'occupation des salles, puis planification des jours de télétravail sur écrans e-ink. JavaScript et serveur Node.js.",
            tags: [
                { label: 'Node.js', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' },
                { label: 'JavaScript', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' },
                { label: 'API e-ink', className: 'text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded' }
            ]
        },
        {
            date: '2021',
            title: '🚀 Premiers Projets Perso',
            description: 'Lancement de mes premiers projets, entre autres un bot Discord en Python. Apprentissage de Git, GitHub et des bases du développement web.',
            tags: [
                { label: 'HTML/CSS', className: 'text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded' },
                { label: 'JavaScript', className: 'text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded' },
                { label: 'Git', className: 'text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded' }
            ]
        },
        {
            date: '2020',
            title: '💡 Découverte du Code',
            description: 'Premier "Hello World" et déclic immédiat. Le début d\'une passion qui ne m\'a plus quitté.',
            tags: [
                { label: 'Python', className: 'text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded' },
                { label: 'Curiosité', className: 'text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded' }
            ]
        }
    ],
    projects: [
        {
            category: 'Full-Stack · IA',
            title: 'Backstage',
            description: "PWA installable déployée en production : chat IA à mémoire persistante, agenda, emploi du temps, rappels synchronisés et notifications push. Passkey (WebAuthn), OAuth Google, JWT, streaming SSE, 34 routes API. ~32 000 lignes couvertes par 46 fichiers de tests.",
            tags: ['Next.js', 'React', 'TypeScript', 'Vitest'],
            gradientClass: 'bg-gradient-to-br from-pink-600 to-violet-600',
            liveUrl: 'https://brain.mprnl.fr',
            codeUrl: 'https://github.com/MattiaPARRINELLO/backstage',
            icon: '<svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>'
        },
        {
            category: 'IA · Backend',
            title: 'Gymshark-Sync',
            description: "Assistant interne relié à un LLM local (Ollama) : synthèses, planification et historique de conversations. API Node.js / Express, tests Jest et documentation Swagger. Projet de groupe.",
            tags: ['Node.js', 'Express', 'Ollama', 'Jest'],
            gradientClass: 'bg-gradient-to-br from-amber-500 to-orange-600',
            liveUrl: '',
            codeUrl: 'https://github.com/mattia-school/gymshark-sync',
            icon: '<svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>'
        },
        {
            category: 'Photographie',
            title: 'Portfolio Photo',
            description: "Galerie photo optimisée pour les performances avec lazy loading, compression d'images et animations fluides.",
            tags: ['HTML', 'CSS', 'JavaScript'],
            gradientClass: 'bg-gradient-to-br from-purple-600 to-pink-500',
            liveUrl: 'https://photo.mprnl.fr',
            codeUrl: 'https://github.com/MattiaPARRINELLO/photography-portfolio ',
            icon: '<svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
        },
        {
            category: 'Web',
            title: 'Portfolio Dev',
            description: 'Ce site ! Design moderne avec micro-interactions soignées, animations au scroll et responsive design.',
            tags: ['Tailwind', 'JavaScript', 'Node.js'],
            gradientClass: 'bg-gradient-to-br from-blue-600 to-cyan-500',
            liveUrl: 'https://dev.mprnl.fr',
            codeUrl: 'https://github.com/MattiaPARRINELLO/portfolio-dev',
            icon: '<svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>'
        },
        {
            category: 'Gadget',
            title: 'Ecran de bord',
            description: 'Création d\'un écran de bord pour ma chambre, me permet de voir la météo, l\'heure, la musique que j\'écoute avec les paroles synchronisées. Projet en cours d\'évolution constante.',
            tags: ['Node.js', 'Express', 'Socket.io'],
            gradientClass: 'bg-gradient-to-br from-green-600 to-emerald-500',
            liveUrl: 'https://tab.mprnl.fr/screen',
            codeUrl: 'https://github.com/MattiaPARRINELLO/tab-screen',
            icon: '<svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>'
        }
    ],
    stack: [
        {
            name: 'HTML5',
            color: '#e34f26',
            icon: '<path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>'
        },
        {
            name: 'CSS3',
            color: '#1572b6',
            icon: '<path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414v-.001z"/>'
        },
        {
            name: 'JavaScript',
            color: '#f7df1e',
            icon: '<path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>'
        },
        {
            name: 'TypeScript',
            color: '#3178c6',
            icon: '<path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>'
        },
        {
            name: 'Node.js',
            color: '#339933',
            icon: '<path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z"/>'
        },
        {
            name: 'React',
            color: '#61dafb',
            icon: '<path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365 3.039-.933 5.017-2.438 5.017-4.024 0-1.591-1.99-3.098-5.043-4.031.704-3.113.39-5.588-.988-6.38-.32-.187-.69-.275-1.102-.275zm-9.773.966c.166-.095.36-.144.582-.144 1.123 0 2.606.79 4.197 2.245-1.479 1.575-2.9 3.435-3.994 5.366-2.727-.752-4.604-1.898-4.604-2.733 0-.865 1.61-1.878 3.82-2.734zm-1.288 7.107c.166-1.06.398-2.153.705-3.264.934 1.947 2.094 3.86 3.452 5.673-.657.29-1.283.522-1.853.68-1.324-.401-2.306-.972-2.304-3.089zm9.773 6.657c-.222 0-.416-.048-.582-.143-1.34-.733-2.624-2.755-3.396-5.348 1.06-.266 2.153-.398 3.264-.705 1.947-.934 3.86-2.094 5.673-3.452.29.657.522 1.283.68 1.853-.401 1.324-.972 2.306-3.089 2.304-1.06-.166-2.153-.398-3.264-.705zm3.396-5.348c-1.111-.307-2.204-.439-3.264-.705.772-2.593 2.056-4.615 3.396-5.348.166-.095.36-.143.582-.143 2.117-.002 2.688.98 3.089 2.304-.158.57-.39 1.196-.68 1.853-1.813-1.358-3.726-2.518-5.673-3.452zm3.82 2.734c2.21.856 3.82 1.869 3.82 2.734 0 .835-1.877 1.981-4.604 2.733-1.094-1.931-2.515-3.791-3.994-5.366 1.591-1.455 3.074-2.245 4.197-2.245.222 0 .416.048.582.143z"/>'
        },
        {
            name: 'Next.js',
            color: '#000000',
            icon: '<path d="M11.2148 0C4.61523 0 0 4.7619 0 11.2381c0 6.4762 4.61523 11.2381 11.2148 11.2381 1.8652 0 3.5469-.4318 5.0547-1.2195L7.8125 7.5714v9.1617H6.1875V5.1429h1.8496l8.3066 12.7627c2.4219-1.6741 4.0127-4.5207 4.0127-7.6675C20.3564 4.7619 15.8143 0 11.2148 0zm2.7246 14.8571l-1.625-2.5V5.1429h1.625v9.7142z"/>'
        },
        {
            name: 'Tailwind',
            color: '#06b6d4',
            icon: '<path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>'
        },
        {
            name: 'Git',
            color: '#f05032',
            icon: '<path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187"/>'
        },
        {
            name: 'Linux',
            color: '#fcc624',
            icon: '<path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"/>'
        },
        {
            name: 'Windows',
            color: '#0078d6',
            icon: '<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>'
        },
        {
            name: 'VS Code',
            color: '#007acc',
            icon: '<path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>'
        }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDU DU CONTENU
// ═══════════════════════════════════════════════════════════════════════════

const ContentRenderer = {
    init() {
        this.renderTimeline();
        this.renderProjects();
        this.renderStack();
    },

    renderTimeline() {
        const container = document.getElementById('timeline-items');
        if (!container) return;

        container.innerHTML = CONTENT.timeline.map((item, index) => {
            const isRight = index % 2 === 0;
            const wrapperClass = isRight
                ? 'timeline-item mb-12 relative pl-12 md:pl-0 md:w-1/2 md:pr-12 md:ml-auto'
                : 'timeline-item mb-12 relative pl-12 md:pl-0 md:w-1/2 md:pl-12';
            const dotClass = isRight
                ? 'timeline-dot'
                : 'timeline-dot md:right-auto md:left-[-5px] md:translate-x-0';
            const tagsHtml = item.tags && item.tags.length
                ? `<div class="flex flex-wrap gap-2 mt-3">${item.tags.map(tag => `<span class="${tag.className}">${tag.label}</span>`).join('')}</div>`
                : '';

            return `
                <div class="${wrapperClass}">
                    <div class="${dotClass}"></div>
                    <div class="timeline-card">
                        <span class="timeline-date">${item.date}</span>
                        <h3 class="text-xl font-bold text-white mt-2">${item.title}</h3>
                        <p class="text-gray-400 mt-2">${item.description}</p>
                        ${tagsHtml}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        container.innerHTML = CONTENT.projects.map(project => {
            const tagsHtml = project.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('');
            const liveLink = project.liveUrl ? `<a href="${project.liveUrl}" class="project-link" title="Voir le site" target="_blank" rel="noopener noreferrer"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>` : '';
            const codeLink = project.codeUrl ? `<a href="${project.codeUrl}" class="project-link" title="Code source" target="_blank" rel="noopener noreferrer"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>` : '';

            return `
                <div class="project-card group">
                    <div class="relative overflow-hidden rounded-t-xl">
                        <div class="aspect-video ${project.gradientClass} flex items-center justify-center">
                            ${project.icon}
                        </div>
                        <div class="project-overlay">
                            <div class="flex gap-4">
                                ${liveLink}
                                ${codeLink}
                            </div>
                        </div>
                    </div>
                    <div class="p-6">
                        <span class="text-xs font-semibold text-accent uppercase tracking-wider">${project.category}</span>
                        <h3 class="text-xl font-bold mt-2 mb-3 group-hover:text-accent transition-colors">${project.title}</h3>
                        <p class="text-gray-400 text-sm leading-relaxed">${project.description}</p>
                        <div class="flex flex-wrap gap-2 mt-4">${tagsHtml}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderStack() {
        const container = document.getElementById('stack-grid');
        if (!container) return;

        container.innerHTML = CONTENT.stack.map(item => `
            <div class="stack-badge group" style="--badge-color: ${item.color}">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    ${item.icon}
                </svg>
                <span class="font-medium mt-2">${item.name}</span>
            </div>
        `).join('');
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. MODULE NAVIGATION
// Gère la navbar, le menu mobile et les effets au scroll
// ═══════════════════════════════════════════════════════════════════════════

const Navigation = {
    navbar: null,
    mobileMenuBtn: null,
    mobileMenu: null,
    isMenuOpen: false,

    /**
     * Initialise le module de navigation
     */
    init() {
        this.navbar = document.getElementById('navbar');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');

        if (!this.navbar) return;

        // Écoute du scroll pour l'effet de blur
        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

        // Gestion du menu mobile
        if (this.mobileMenuBtn && this.mobileMenu) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());

            // Ferme le menu quand on clique sur un lien
            const mobileLinks = this.mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMobileMenu());
            });
        }

        // Active le lien correspondant à la section visible
        this.setupActiveLinks();
    },

    /**
     * Effet de blur sur la navbar au scroll
     */
    handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > CONFIG.navScrollThreshold) {
            this.navbar.classList.add('nav-scrolled');
        } else {
            this.navbar.classList.remove('nav-scrolled');
        }
    },

    /**
     * Toggle du menu mobile
     */
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        if (this.isMenuOpen) {
            this.mobileMenu.classList.add('active');
            this.mobileMenuBtn.classList.add('menu-open');
            document.body.style.overflow = 'hidden'; // Empêche le scroll
        } else {
            this.closeMobileMenu();
        }
    },

    /**
     * Ferme le menu mobile
     */
    closeMobileMenu() {
        this.isMenuOpen = false;
        this.mobileMenu.classList.remove('active');
        this.mobileMenuBtn.classList.remove('menu-open');
        document.body.style.overflow = ''; // Rétablit le scroll
    },

    /**
     * Met en surbrillance le lien de navigation actif
     */
    setupActiveLinks() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. MODULE ANIMATIONS AU SCROLL
// Utilise Intersection Observer pour déclencher les animations
// ═══════════════════════════════════════════════════════════════════════════

const ScrollAnimations = {
    /**
     * Initialise les animations au scroll
     */
    init() {
        const animatedElements = document.querySelectorAll('.scroll-animate');

        if (animatedElements.length === 0) return;

        // Création de l'observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Ajoute la classe visible avec un léger délai pour le stagger effect
                    const delay = entry.target.dataset.delay || 0;

                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);

                    // Optionnel : arrête d'observer après l'animation
                    // observer.unobserve(entry.target);
                }
            });
        }, CONFIG.scrollAnimationOptions);

        // Observe chaque élément
        animatedElements.forEach((el, index) => {
            // Ajoute un délai progressif pour un effet de cascade
            el.dataset.delay = index * 100;
            observer.observe(el);
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. MODULE SMOOTH SCROLL
// Scroll fluide vers les ancres
// ═══════════════════════════════════════════════════════════════════════════

const SmoothScroll = {
    /**
     * Initialise le smooth scroll pour toutes les ancres
     */
    init() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // Ignore les liens vides ou "#"
                if (href === '#' || href === '') return;

                const target = document.querySelector(href);

                if (target) {
                    e.preventDefault();

                    // Calcule la position en tenant compte de la navbar fixe
                    const navbarHeight = Navigation.navbar ? Navigation.navbar.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. MODULE EFFETS VISUELS
// Effets optionnels : parallax, cursor, tilt, etc.
// ═══════════════════════════════════════════════════════════════════════════

const VisualEffects = {
    /**
     * Initialise les effets visuels
     */
    init() {
        this.setupParallax();
        this.setupHoverEffects();
        this.setupTypingEffect();
    },

    /**
     * Effet parallax léger sur le hero glow
     */
    setupParallax() {
        const heroGlow = document.querySelector('.hero-glow');

        if (!heroGlow) return;

        // Parallax au mouvement de souris
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;

            requestAnimationFrame(() => {
                heroGlow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            });
        });
    },

    /**
     * Effets hover améliorés sur les cartes projets
     */
    setupHoverEffects() {
        const projectCards = document.querySelectorAll('.project-card');

        projectCards.forEach(card => {
            card.addEventListener('mouseenter', function (e) {
                this.style.willChange = 'transform';
            });

            card.addEventListener('mouseleave', function (e) {
                this.style.willChange = 'auto';
            });

            // Effet de tilt léger au survol
            card.addEventListener('mousemove', function (e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                this.style.transform = `perspective(1000px) translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            card.addEventListener('mouseleave', function (e) {
                this.style.transform = '';
            });
        });
    },

    /**
     * Effet de typing optionnel (pour ajout futur)
     */
    setupTypingEffect() {
        // Réservé pour un effet de machine à écrire si nécessaire
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. MODULE UTILITAIRES
// Fonctions helper réutilisables
// ═══════════════════════════════════════════════════════════════════════════

const Utils = {
    /**
     * Debounce : limite la fréquence d'exécution d'une fonction
     * @param {Function} func - Fonction à débouncer
     * @param {number} wait - Délai en ms
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle : garantit un délai minimum entre les exécutions
     * @param {Function} func - Fonction à throttler
     * @param {number} limit - Délai minimum en ms
     * @returns {Function}
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Vérifie si le navigateur supporte les animations
     * @returns {boolean}
     */
    supportsAnimations() {
        return !globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Détecte si on est sur mobile
     * @returns {boolean}
     */
    isMobile() {
        return window.innerWidth < 768;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. INITIALISATION
// Point d'entrée principal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialise tous les modules quand le DOM est prêt
 */
function initializeApp() {
    console.log('🚀 Portfolio Mattia Parrinello - Initialisation...');

    // Contenu data-driven (projets, stack, timeline)
    ContentRenderer.init();

    // Navigation
    Navigation.init();
    console.log('✅ Navigation initialisée');

    // Animations au scroll
    ScrollAnimations.init();
    console.log('✅ Animations au scroll initialisées');

    // Smooth scroll
    SmoothScroll.init();
    console.log('✅ Smooth scroll initialisé');

    // Effets visuels (seulement si animations autorisées)
    if (Utils.supportsAnimations()) {
        VisualEffects.init();
        console.log('✅ Effets visuels initialisés');
    }

    // Stats GitHub
    GitHubStats.init();

    // Easter eggs 🥚
    EasterEggs.init();

    console.log('🎉 Portfolio prêt !');
}

// Attend que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM déjà chargé
    initializeApp();
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. GESTION DES ÉVÉNEMENTS GLOBAUX
// Resize, orientation change, etc.
// ═══════════════════════════════════════════════════════════════════════════

// Gestion du resize (débounced pour les performances)
window.addEventListener('resize', Utils.debounce(() => {
    // Ferme le menu mobile si on passe en mode desktop
    if (window.innerWidth >= 768 && Navigation.isMenuOpen) {
        Navigation.closeMobileMenu();
    }
}, 250));

// Gestion du chargement complet (images, etc.)
window.addEventListener('load', () => {
    // Cache le loader si présent
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('loaded');
        setTimeout(() => loader.remove(), 500);
    }

    // Force la re-vérification des animations
    ScrollAnimations.init();
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STATS GITHUB
// Récupération et affichage des statistiques de code GitHub
// ═══════════════════════════════════════════════════════════════════════════

const GitHubStats = {
    isExpanded: false,
    data: null,
    colors: {
        JavaScript: '#f7df1e',
        TypeScript: '#3178c6',
        Python: '#3776ab',
        Java: '#007396',
        'C++': '#00599c',
        C: '#A8B9CC',
        'C#': '#239120',
        PHP: '#777bb4',
        Ruby: '#cc342d',
        Go: '#00add8',
        Rust: '#dea584',
        Swift: '#ffac45',
        Kotlin: '#7f52ff',
        HTML: '#e34c26',
        CSS: '#563d7c',
        SCSS: '#c6538c',
        Vue: '#42b883',
        Svelte: '#ff3e00',
        Dart: '#0175c2',
        Shell: '#89e051',
        default: '#ec4899'
    },

    init() {
        const container = document.getElementById('github-stats-content');
        if (!container) return;
        this.setupToggle();
        this.loadStats(container);
    },

    setupToggle() {
        const btn = document.getElementById('github-stats-toggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            this.isExpanded = !this.isExpanded;
            this.render();
        });
    },

    async loadStats(container) {
        try {
            const response = await fetch('/api/github-stats');
            if (!response.ok) {
                throw new Error('API GitHub indisponible');
            }
            this.data = await response.json();
            this.render();
        } catch (error) {
            this.renderError(container);
        }
    },

    render() {
        const container = document.getElementById('github-stats-content');
        if (!container || !this.data) return;
        const btn = document.getElementById('github-stats-toggle');
        if (btn) {
            btn.textContent = this.isExpanded ? 'Voir moins' : 'Voir plus';
        }

        container.classList.add('stats-toggling');

        container.innerHTML = this.isExpanded
            ? this.renderExpanded(this.data)
            : this.renderCompact(this.data);

        container.classList.remove('stats-reveal');
        void container.offsetWidth;
        container.classList.add('stats-reveal');

        setTimeout(() => {
            container.classList.remove('stats-toggling');
        }, 450);
    },

    renderCompact(data) {
        const formattedLines = data.estimatedLines.toLocaleString('fr-FR');
        const topLanguages = data.languages.slice(0, 3);

        return `
            <div class="flex flex-wrap items-center gap-2 mb-4">
                ${topLanguages.map((lang, index) => {
            const color = this.colors[lang.language] || this.colors.default;
            return `
                        <div class="stats-chip flex items-center gap-1.5 px-2.5 py-1 bg-primary/50 rounded text-xs" style="animation-delay: ${index * 70}ms;">
                            <div class="w-2 h-2 rounded-full" style="background-color: ${color};"></div>
                            <span class="text-gray-300">${lang.language}</span>
                            <span class="text-gray-500 font-medium">${lang.percentage}%</span>
                        </div>
                    `;
        }).join('')}
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="stats-tile text-center p-2 bg-primary/50 rounded" style="animation-delay: 210ms;">
                    <div class="text-xl font-bold text-accent">${formattedLines}</div>
                    <div class="text-xs text-gray-400">Lignes</div>
                </div>
                <div class="stats-tile text-center p-2 bg-primary/50 rounded" style="animation-delay: 280ms;">
                    <div class="text-xl font-bold text-accent">${data.totalLanguages}</div>
                    <div class="text-xs text-gray-400">Langages</div>
                </div>
            </div>
        `;
    },

    renderExpanded(data) {
        const formattedLines = data.estimatedLines.toLocaleString('fr-FR');
        const filteredLanguages = data.languages.filter(lang => lang.percentage > 1);

        return `
            <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-2">
                    ${filteredLanguages.map((lang, index) => {
            const color = this.colors[lang.language] || this.colors.default;
            return `
                            <div class="stats-chip flex items-center gap-1.5 px-2.5 py-1 bg-primary/50 rounded text-xs" style="animation-delay: ${index * 60}ms;">
                                <div class="w-2 h-2 rounded-full" style="background-color: ${color};"></div>
                                <span class="text-gray-300">${lang.language}</span>
                                <span class="text-gray-500 font-medium">${lang.percentage}%</span>
                            </div>
                        `;
        }).join('')}
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="stats-tile text-center p-3 bg-primary/50 rounded-lg" style="animation-delay: 220ms;">
                        <div class="text-2xl font-bold text-accent">${formattedLines}</div>
                        <div class="text-xs text-gray-400 mt-1">Lignes de code</div>
                    </div>
                    <div class="stats-tile text-center p-3 bg-primary/50 rounded-lg" style="animation-delay: 290ms;">
                        <div class="text-2xl font-bold text-accent">${data.totalLanguages}</div>
                        <div class="text-xs text-gray-400 mt-1">Langages utilisés</div>
                    </div>
                </div>

                <div class="space-y-2">
                    ${filteredLanguages.map((lang, index) => {
            const color = this.colors[lang.language] || this.colors.default;
            return `
                            <div class="stats-row flex items-center justify-between text-sm" style="animation-delay: ${index * 50}ms;">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full" style="background-color: ${color};"></div>
                                    <span class="text-gray-300">${lang.language}</span>
                                </div>
                                <span class="text-gray-400">${lang.percentage}%</span>
                            </div>
                        `;
        }).join('')}
                </div>

                <div class="text-xs text-gray-500 pt-2 border-t border-gray-800 text-center">
                    Basé sur ${data.totalRepos} repos publics
                </div>
            </div>
        `;
    },

    renderError(container) {
        container.innerHTML = `
            <div class="text-center py-4 text-gray-400">
                <p class="text-sm">Impossible de charger les stats GitHub</p>
            </div>
        `;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. EASTER EGGS 🥚
// Parce qu'un bon dev cache toujours des surprises
// ═══════════════════════════════════════════════════════════════════════════

const EasterEggs = {
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    konamiIndex: 0,
    secretWord: '',
    clickCount: 0,
    matrixActive: false,

    /**
     * Initialise tous les easter eggs
     */
    init() {
        this.showConsoleArt();
        this.setupKonamiCode();
        this.setupSecretWord();
        this.setupLogoSecret();
        this.setupFooterSecret();
        console.log('🥚 Easter eggs chargés... Sauras-tu les trouver ?');
    },

    /**
     * Affiche un ASCII art stylé dans la console
     */
    showConsoleArt() {
        const styles = [
            'color: #ec4899',
            'font-size: 14px',
            'font-weight: bold',
            'text-shadow: 0 0 10px #ec4899'
        ].join(';');

        const art = `
%c
███╗   ███╗ █████╗ ████████╗████████╗██╗ █████╗ 
████╗ ████║██╔══██╗╚══██╔══╝╚══██╔══╝██║██╔══██╗
██╔████╔██║███████║   ██║      ██║   ██║███████║
██║╚██╔╝██║██╔══██║   ██║      ██║   ██║██╔══██║
██║ ╚═╝ ██║██║  ██║   ██║      ██║   ██║██║  ██║
╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═╝
                                                 
        `;

        console.log(art, styles);
        console.log('%c👋 Hey, tu regardes le code source ? Tu me plais déjà !', 'color: #ec4899; font-size: 12px;');
        console.log('%c💡 Astuce : Essaie le Konami Code...', 'color: #f59e0b; font-size: 11px;');
        console.log('%c📧 contact.mprnl@gmail.com', 'color: #94a3b8; font-size: 10px;');
    },

    /**
     * Détecte le Konami Code (↑↑↓↓←→←→BA)
     * Active le "Mode Matrix" 🕶️
     */
    setupKonamiCode() {
        document.addEventListener('keydown', (e) => {
            const key = e.key;

            if (key === this.konamiCode[this.konamiIndex]) {
                this.konamiIndex++;

                if (this.konamiIndex === this.konamiCode.length) {
                    this.activateMatrixMode();
                    this.konamiIndex = 0;
                }
            } else {
                this.konamiIndex = 0;
            }
        });
    },

    /**
     * Active le mode Matrix 🕶️
     */
    activateMatrixMode() {
        if (this.matrixActive) {
            this.deactivateMatrixMode();
            return;
        }

        this.matrixActive = true;
        console.log('%c🕶️ WAKE UP, NEO...', 'color: #00ff00; font-size: 20px; font-family: monospace;');

        // Créer le canvas Matrix
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            pointer-events: none;
            opacity: 0.15;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'MATTIAPARRINELLO01アイウエオカキクケコサシスセソタチツテト';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = new Array(Math.floor(columns)).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff00';
            ctx.font = `${fontSize}px monospace`;

            drops.forEach((y, i) => {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                ctx.fillText(char, x, y * fontSize);

                if (y * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            });
        };

        this.matrixInterval = setInterval(draw, 33);

        // Effet sur le body
        document.body.style.transition = 'filter 1s';
        document.body.style.filter = 'hue-rotate(80deg) saturate(1.5)';

        // Affiche un message
        this.showToast('🕶️ Mode Matrix activé ! Refais le code pour désactiver.');
    },

    /**
     * Désactive le mode Matrix
     */
    deactivateMatrixMode() {
        this.matrixActive = false;

        const canvas = document.getElementById('matrix-canvas');
        if (canvas) canvas.remove();

        if (this.matrixInterval) clearInterval(this.matrixInterval);

        document.body.style.filter = '';

        this.showToast('🔴 Mode Matrix désactivé. À bientôt, Neo.');
    },

    /**
     * Détecte des mots secrets tapés au clavier
     */
    setupSecretWord() {
        const secrets = {
            'dev': () => this.showToast('👨‍💻 Mode développeur : Ctrl+Shift+I pour la console !'),
            'cafe': () => this.showToast('☕ +1 café consommé. Total : ∞'),
            'hello': () => this.showToast('👋 Salut toi ! Tu as trouvé un secret !'),
            'matrix': () => this.activateMatrixMode(),
            'love': () => this.showToast('❤️ Moi aussi je t\'aime, merci de visiter mon portfolio !'),
            'bug': () => this.showToast('🐛 C\'est pas un bug, c\'est une feature non documentée.')
        };

        document.addEventListener('keydown', (e) => {
            // Ignore si on tape dans un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            this.secretWord += e.key.toLowerCase();

            // Limite la longueur
            if (this.secretWord.length > 10) {
                this.secretWord = this.secretWord.slice(-10);
            }

            // Vérifie les secrets
            for (const [word, action] of Object.entries(secrets)) {
                if (this.secretWord.includes(word)) {
                    action();
                    this.secretWord = '';
                    break;
                }
            }
        });
    },

    /**
     * Triple-clic sur le logo → message secret
     */
    setupLogoSecret() {
        const logo = document.querySelector('nav a[href="#hero"]');
        if (!logo) return;

        let clicks = 0;
        let timer;

        logo.addEventListener('click', (e) => {
            clicks++;

            clearTimeout(timer);
            timer = setTimeout(() => clicks = 0, 500);

            if (clicks === 3) {
                e.preventDefault();
                clicks = 0;
                this.showToast('🎯 Tu as trouvé le secret du logo ! Tu es curieux, j\'aime ça.');
                logo.style.animation = 'spin 0.5s ease';
                setTimeout(() => logo.style.animation = '', 500);
            }
        });
    },

    /**
     * Clics multiples sur le footer → compteur caché
     */
    setupFooterSecret() {
        const footer = document.querySelector('footer');
        if (!footer) return;

        let footerClicks = 0;

        footer.addEventListener('click', () => {
            footerClicks++;

            const messages = {
                5: '🤔 Tu cliques beaucoup sur le footer...',
                10: '🧐 Tu cherches quelque chose ?',
                15: '😅 Ok, tu es persistant(e) !',
                20: '🎉 Tu as gagné ! Voici mon secret : je code mieux avec de la musique lo-fi.',
                25: '🎮 Bonus : Essaie le Konami Code (↑↑↓↓←→←→BA)',
                50: '🏆 50 clics ?! Tu es officiellement mon/ma visiteur(se) préféré(e) !'
            };

            if (messages[footerClicks]) {
                this.showToast(messages[footerClicks]);
            }
        });
    },

    /**
     * Affiche un toast de notification
     * @param {string} message - Le message à afficher
     */
    showToast(message) {
        // Supprime l'ancien toast s'il existe
        const existingToast = document.querySelector('.easter-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'easter-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            padding: 16px 28px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            max-width: 90vw;
            text-align: center;
        `;

        document.body.appendChild(toast);

        // Animation d'entrée
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Disparition
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 10. EXPORTS (pour utilisation en modules ES6 si nécessaire)
// ═══════════════════════════════════════════════════════════════════════════

// Expose les modules globalement pour le debugging (optionnel)
if (typeof globalThis !== 'undefined') {
    globalThis.PortfolioApp = {
        Navigation,
        ScrollAnimations,
        SmoothScroll,
        VisualEffects,
        Utils,
        GitHubStats,
        EasterEggs,
        CONFIG
    };
}
