/* =========================================================
   Portfolio — interactions
   Rendu du contenu + navigation + révélations au scroll
   ========================================================= */

const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;

/* =========================================================
   CONTENU
   ========================================================= */

const CONTENT = {
    projects: [
        {
            title: 'Backstage',
            subtitle: 'Second cerveau IA personnel',
            description:
                "Une PWA installable qui réunit tout ce qui est épars : chat IA à mémoire persistante, agenda synchronisé, rappels, notifications push et lecture d'e-mails. Authentification par passkey (WebAuthn), OAuth Google, sessions JWT courtes et streaming SSE des réponses. Développée seule et déployée en production.",
            tags: ['Next.js', 'React', 'TypeScript', 'Vitest', 'Playwright'],
            facts: [
                { value: '32k', label: 'lignes' },
                { value: '46', label: 'fichiers de tests' },
                { value: '34', label: 'routes API' },
            ],
            image: '/assets/projects/backstage-console.webp',
            imageAlt:
                'Console de Backstage : accueil IA avec le prochain événement affiché',
            url: 'https://brain.mprnl.fr',
            repo: 'https://github.com/MattiaPARRINELLO/backstage',
        },
        {
            title: 'Gymshark-Sync',
            subtitle: 'Assistant interne sur LLM local',
            description:
                "Projet de groupe : un serveur Node.js / Express relié à un modèle local via Ollama, pour produire synthèses, planifications et historiques. Réponses en streaming SSE, persistance JSON, neuf workflows métier prêts à l'emploi. API documentée avec Swagger, tests Jest.",
            tags: ['Node.js', 'Express', 'Ollama', 'Jest', 'Swagger'],
            facts: [
                { value: '9', label: 'workflows métier' },
                { value: '100%', label: 'local' },
                { value: 'REST', label: 'documentée' },
            ],
            image: '/assets/projects/gymshark-workflows.webp',
            imageAlt:
                'Interface de Gymshark-Sync : les neuf workflows de l’assistant',
            url: '',
            repo: 'https://github.com/mattia-school/gymshark-sync',
            reverse: true,
        },
    ],

    journey: [
        {
            date: '2026',
            title: 'Backstage — de l’idée à la production',
            description:
                "Conception, développement et mise en ligne d'une PWA full-stack utilisée au quotidien. Authentification passkey, streaming SSE, persistance, tests de bout en bout.",
            tags: ['Next.js', 'React', 'TypeScript', 'Postgres', 'Docker'],
            current: true,
        },
        {
            date: '2026',
            title: 'Gymshark-Sync — assistant d’entreprise',
            description:
                "Projet de groupe : API Node.js branchée sur un LLM local, avec neuf workflows métier, streaming SSE et documentation Swagger.",
            tags: ['Node.js', 'Express', 'Ollama'],
        },
        {
            date: '2025 — aujourd’hui',
            title: 'Sup de Vinci — Bachelor Informatique',
            description:
                "Licence en informatique : développement web, bases de données, réseaux et architecture logicielle.",
            tags: ['Web', 'BDD', 'Réseaux'],
            current: true,
        },
        {
            date: '2022 — 2023',
            title: 'INOVSHOP Group — stages développeur',
            description:
                "Application web d’affichage en temps réel de l’occupation des salles, puis mise en place du planning des jours de télétravail sur écrans e-ink via une API Node.js.",
            tags: ['JavaScript', 'Node.js', 'API'],
        },
        {
            date: '2025',
            title: 'Portfolio photo — premiers clients',
            description:
                "Conception d’un portfolio de photographie de concert. Optimisation du chargement, gestion des images, design responsive. Première accréditation et premiers clients.",
            tags: ['HTML', 'CSS', 'JavaScript'],
        },
        {
            date: '2020',
            title: 'Premiers pas',
            description:
                "Premier programme, puis un bot Discord en Python. Compréhension progressive de Git et des fondamentaux du développement web.",
            tags: ['Python', 'Git'],
        },
    ],

    stack: [
        {
            name: 'TypeScript',
            color: '#3178c6',
            icon: '<path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.122-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38.142-.359.214-.776.214-1.253 0-.657-.125-1.21-.373-1.656a3.033 3.033 0 0 0-1.012-1.085 4.38 4.38 0 0 0-1.487-.596c-.566-.122-1.163-.18-1.79-.18a9.916 9.916 0 0 0-1.84.164 5.544 5.544 0 0 0-1.512.493v2.63a5.033 5.033 0 0 0 3.237-1.2c.333 0 .624.03.872.09.249.06.456.144.623.25zm-9.446 0c-1.683 0-3.056-1.056-3.056-2.36 0-1.303 1.373-2.36 3.056-2.36h4.268v1.86H12.93c.79 0 1.374.217 1.374.5 0 .33-.584.5-1.654.5-1.563 0-2.847-.232-3.594-.605-.4-.2-.62-.5-.62-.95V9.7H5.54v.45c0 .72.62 1.05 2.126 1.297.44.07.9.13 1.36.13 2.283 0 4.15-1.1 4.15-3.01 0-1.2-.43-2.03-1.19-2.67-.66-.55-1.55-.8-2.86-.8-.33 0-.61.02-.86.06-1.05.16-1.9.6-2.56 1.32-.44.48-.77 1.02-.98 1.72H2.4c.14-.77.5-1.53 1.05-2.16.55-.63 1.25-1.09 2.1-1.38.85-.29 1.75-.42 2.7-.42 1.8 0 3.15.42 4.05 1.26.9.84 1.35 2.03 1.35 3.57 0 2.37-1.36 3.5-3.7 3.5z"/>',
        },
        {
            name: 'JavaScript',
            color: '#f7df1e',
            icon: '<path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>',
        },
        {
            name: 'React',
            color: '#61dafb',
            icon: '<path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365 3.039-.933 5.017-2.438 5.017-4.024 0-1.591-1.99-3.098-5.043-4.031.704-3.113.39-5.588-.988-6.38-.32-.187-.69-.275-1.102-.275zm-9.773.966c.166-.095.36-.144.582-.144 1.123 0 2.606.79 4.197 2.245-1.479 1.575-2.9 3.435-3.994 5.366-2.727-.752-4.604-1.898-4.604-2.733 0-.865 1.61-1.878 3.82-2.734zm-1.288 7.107c.166-1.06.398-2.153.705-3.264.934 1.947 2.094 3.86 3.452 5.673-.657.29-1.283.522-1.853.68-1.324-.401-2.306-.972-2.304-3.089zm9.773 6.657c-.222 0-.416-.048-.582-.143-1.34-.733-2.624-2.755-3.396-5.348 1.06-.266 2.153-.398 3.264-.705 1.947-.934 3.86-2.094 5.673-3.452.29.657.522 1.283.68 1.853-.401 1.324-.972 2.306-3.089 2.304-1.06-.166-2.153-.398-3.264-.705zm3.396-5.348c-1.111-.307-2.204-.439-3.264-.705.772-2.593 2.056-4.615 3.396-5.348.166-.095.36-.143.582-.143 2.117-.002 2.688.98 3.089 2.304-.158.57-.39 1.196-.68 1.853-1.813-1.358-3.726-2.518-5.673-3.452zm3.82 2.734c2.21.856 3.82 1.869 3.82 2.734 0 .835-1.877 1.981-4.604 2.733-1.094-1.931-2.515-3.791-3.994-5.366 1.591-1.455 3.074-2.245 4.197-2.245.222 0 .416.048.582.143z"/>',
        },
        {
            name: 'Next.js',
            color: '#8b8b94',
            icon: '<path d="M11.2148 0C4.61523 0 0 4.7619 0 11.2381c0 6.4762 4.61523 11.2381 11.2148 11.2381 1.8652 0 3.5469-.4318 5.0547-1.2195L7.8125 7.5714v9.1617H6.1875V5.1429h1.8496l8.3066 12.7627c2.4219-1.6741 4.0127-4.5207 4.0127-7.6675C20.3564 4.7619 15.8143 0 11.2148 0zm2.7246 14.8571l-1.625-2.5V5.1429h1.625v9.7142z"/>',
        },
        {
            name: 'Node.js',
            color: '#5fa04e',
            icon: '<path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339c.082.045.197.045.272 0l8.795-5.076c.082-.047.134-.141.134-.238V6.921c0-.099-.053-.192-.137-.242l-8.791-5.072c-.081-.047-.189-.047-.271 0L3.075 6.68C2.99 6.729 2.936 6.825 2.936 6.921v10.15c0 .097.054.189.139.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675c-.57-.329-.922-.945-.922-1.604V6.921c0-.659.353-1.275.922-1.603l8.795-5.082c.557-.315 1.296-.315 1.848 0l8.794 5.082c.57.329.924.944.924 1.603v10.15c0 .659-.354 1.273-.924 1.604l-8.794 5.078C12.643 23.916 12.324 24 11.998 24z"/>',
        },
        {
            name: 'PostgreSQL',
            color: '#7aa2f7',
            icon: '<path d="M17.5 10.1c-.9 0-1.6.7-1.6 1.5v3.3c0 .9.7 1.5 1.6 1.5s1.6-.7 1.6-1.5v-3.3c0-.8-.7-1.5-1.6-1.5zM12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22.5c-2 0-3.9-.6-5.4-1.7.4-.3.8-.7 1-1.2.4-1 .5-2.1.3-3.2-.1-.5-.3-1-.6-1.5h.9c3.9 0 7.2-1.2 9.5-3.2-.7-.9-1.4-1.7-1.9-2.6-.3.1-.7.1-1 .1-3.8 0-6.9-3.1-6.9-6.9 0-.4 0-.7.1-1.1-.9-.6-1.9-1.2-2.9-1.7-1 2.5-1.5 5.2-1.5 8 0 1.7.3 3.3.7 4.8C3.2 13.3 2 12 2 10c0-1.4.4-2.7 1-3.9.2.9.6 1.8 1.1 2.6 0-4.3 2.7-8.1 6.7-9.6-.3.8-.4 1.6-.4 2.5 0 1.1.3 2.2.7 3.1.2.2.4.4.7.6.4.3.8.5 1.2.8 1.2-.5 2.5-.8 3.8-.8h.1c.7 0 1.4.1 2 .3.2-.5.3-1.1.3-1.7C19.7 3.3 16.1 1.2 12 1.2 8.3 1.2 5 3 3 5.8c-.1.1-.1.2-.1.3 0 .2-.1.3-.1.5-.4 1.1-.6 2.3-.6 3.4 0 2 .7 3.9 1.9 5.5.3.1.7 0 .9-.2.2-.3.2-.7.1-1 .3 1 .9 1.9 1.6 2.7.1-1 .3-2 .5-2.9.1-.5.4-.9.8-1.2.3-.3.5-.5.5-.9 0-.3-.1-.6-.3-.8-.3-.4-.5-.9-.5-1.4 0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 .3-.1.3-.3.3h-.2c-.3 0-.6-.3-.7-.6l-.4-.1c-.6 0-1 .4-1 1 0 .4.1.7.5 1.1.5.6.8 1.1.8 1.8s-.3 1.2-.8 1.8c-.4.4-.5.7-.5 1.1 0 .6.2 1.1.7 1.5.4.3.6.7.6 1.2 0 .8-.6 1.5-1.5 1.5-.8 0-1.4-.6-1.5-1.4-.1-.5-.1-1-.1-1.5 0-.6-.3-1.1-.7-1.5-.4-.4-.6-.9-.6-1.5 0-1.2 1-2.1 2.1-2.1h.1c-1.6-.1-3.1-.4-4.5-.9-1.1 1.9-3.5 3.2-6.2 3.2-2.6 0-5-.9-6.6-2.5-.6 2-1 4.1-1 6.2 0 3.6 1.7 6.9 4.4 8.9 1.7 1.2 3.8 1.9 6 1.9 2.7 0 5.2-.9 7.2-2.5 2.1-1.7 3.4-4.2 3.6-7-.2.1-.5.1-.7.1-1.3 0-2.4-1.1-2.4-2.4s1.1-2.4 2.4-2.4z"/>',
        },
        {
            name: 'Docker',
            color: '#7aa2f7',
            icon: '<path d="M13.98 11.08c2.33-.46 3.82 1.2 3.26 3.2-.56 2-2.24 3.55-4.32 3.55-2.2 0-3.8-1.4-3.2-3.7.16-.62.7-1.32 1.3-1.66.36 1.66.5 3.3 1.2 3.86.68.56 2.02.36 3.16.36.34 0 .7-.03 1.06-.09.28-.05.54-.1.78-.16-.86.5-2.02.8-3.16.8-1.3 0-2.6-.4-3.3-1.4-.5-.8-.5-2.3 0-3.2l.22.24zm-5.9.34c-.4-1.1-.3-2.3.4-3.2.9-1.2 2.4-1.7 4-1.7h.3l-.1.16c-.9 1.3-1.4 3.1-1.4 4.9v.3h-2.2c-.4 0-.7-.2-1-.3zm-2.9-.4c-.4-.2-.7-.4-1-.7-.5-.5-.8-1.1-1-1.8-.5 0-1.1 0-1.6.1-.7.3-1.2.8-1.4 1.5-.2.7 0 1.5.4 2 .5.6 1.2 1 2 1.1.8.2 1.7.3 2.5.4h.1c.7-.2 1.4-.4 2-.7l.3-.16c-.2 1.4-.6 2.7-1.3 3.7-.6.8-1.3 1.3-2 1.7-.9.4-1.8.6-2.7.6-.9 0-1.8-.2-2.6-.5-1-.4-1.7-1-2.3-1.9-.7-1-1-2.3-1.2-3.6l.1-.2c.4 1.2 1.1 2.3 2.1 3.2 1.4 1.2 3.2 1.8 5.2 1.8 1.9 0 3.6-.7 4.9-1.8l.3.4-.2.5c-.5.8-1.1 1.5-1.8 2-1 .7-2.2 1-3.4 1-1.2 0-2.3-.3-3.2-.9.5-.7.9-1.6 1.1-2.5.4-1.4.4-2.9 0-4.3-.06-.5-.2-1-.3-1.5zM4.7 7.4c-1.5-.3-2.6-1-3-2-.4-1.2 0-2.5.8-3.4.8-1 2-1.6 3.3-1.7 1.4 0 2.6.4 3.5 1.3l.1.1c-.9.6-1.5 1.4-1.9 2.4-.4 1-.5 2-.5 3.1 0 .1 0 .2-.3.2zm9.9 1.2c-.1-1.2-.1-2.4-.1-3.6v-.2c1-.6 2.1-1 3.4-1 1.2 0 2.4.2 3.5.7.8.3 1.4.8 2 1.4l.1.2c-.9-.3-1.9-.5-2.9-.5-1.5 0-2.9.3-4.2.9l.2.1z"/>',
        },
        {
            name: 'Vitest',
            color: '#f4c95d',
            icon: '<path d="M12 1.5 3 5.6v12.8l9 4.1 9-4.1V5.6l-9-4.1zm0 2.2 7 3.2-7 3.2-7-3.2 7-3.2zM4.8 8.3l6.3 2.9v8.4l-6.3-2.9V8.3zm8.1 11.3V11.2l6.3-2.9v7.4l-6.3 2.9z"/>',
        },
        {
            name: 'Tailwind',
            color: '#7aa2f7',
            icon: '<path d="M12 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12 4.8zM6.001 12c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.667 17.818 9.028 19.2 12.002 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>',
        },
        {
            name: 'Git',
            color: '#f05032',
            icon: '<path d="M23.546 10.93 13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187z"/>',
        },
        {
            name: 'Linux',
            color: '#fcc624',
            icon: '<path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-.533-1.465-.6-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"/>',
        },
    ],
};

/* =========================================================
   ÉCHAPPEMENT HTML
   Le contenu vient d'un objet littéral : on l'échappe avant
   injection pour qu'un caractère spécial ne casse pas le DOM.
   ========================================================= */

function escapeHtml(value) {
    return String(value).replace(
        /[&<>"']/g,
        (char) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[char]
    );
}

/* =========================================================
   RENDU
   ========================================================= */

function renderProjects() {
    const container = document.getElementById('projects');
    if (!container) return;

    container.innerHTML = CONTENT.projects
        .map((project, index) => {
            const number = String(index + 1).padStart(2, '0');

            const facts = project.facts
                .map(
                    (fact) => `
                    <div class="fact">
                        <div class="fact__value">${escapeHtml(fact.value)}</div>
                        <div class="fact__label">${escapeHtml(fact.label)}</div>
                    </div>`
                )
                .join('');

            const tags = project.tags
                .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
                .join('');

            const shot = `
                <figure class="project__media">
                    <div class="shot">
                        <div class="shot__bar">
                            <span></span><span></span><span></span>
                            <span class="shot__url">${
                                project.url
                                    ? escapeHtml(
                                          new URL(project.url).host
                                      )
                                    : 'gymshark-sync'
                            }</span>
                        </div>
                        <img
                            class="shot__img"
                            src="${escapeHtml(project.image)}"
                            alt="${escapeHtml(project.imageAlt)}"
                            loading="lazy"
                            decoding="async"
                            width="1400"
                            height="1067"
                        />
                        <div class="shot__glow" aria-hidden="true"></div>
                    </div>
                </figure>`;

            const links = [
                project.url
                    ? `<a href="${escapeHtml(project.url)}" class="btn btn--primary" target="_blank" rel="noopener noreferrer">
                           Ouvrir le projet
                           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                       </a>`
                    : '',
                `<a href="${escapeHtml(project.repo)}" class="btn btn--secondary" target="_blank" rel="noopener noreferrer">
                    Code source
                </a>`,
            ]
                .filter(Boolean)
                .join('');

            return `
                <article class="project${project.reverse ? ' project--reverse' : ''} reveal">
                    <div class="project__body">
                        <span class="project__index">${number} / ${escapeHtml(project.subtitle)}</span>
                        <h3 class="project__title">${escapeHtml(project.title)}</h3>
                        <p class="project__desc">${escapeHtml(project.description)}</p>
                        <div class="project__facts">${facts}</div>
                        <div class="project__tags">${tags}</div>
                        <div class="project__links">${links}</div>
                    </div>
                    ${shot}
                </article>`;
        })
        .join('');
}

function renderJourney() {
    const container = document.getElementById('timeline');
    if (!container) return;

    container.innerHTML = CONTENT.journey
        .map(
            (item) => `
            <article class="tl-item${item.current ? ' tl-item--current' : ''} reveal">
                <span class="tl-item__dot" aria-hidden="true"></span>
                <div class="tl-item__card">
                    <span class="tl-item__date">${escapeHtml(item.date)}</span>
                    <h3 class="tl-item__title">${escapeHtml(item.title)}</h3>
                    <p class="tl-item__desc">${escapeHtml(item.description)}</p>
                    ${
                        item.tags && item.tags.length
                            ? `<div class="tl-item__meta">${item.tags
                                  .map(
                                      (tag) =>
                                          `<span class="chip">${escapeHtml(tag)}</span>`
                                  )
                                  .join('')}</div>`
                            : ''
                    }
                </div>
            </article>`
        )
        .join('');
}

function renderStack() {
    const container = document.getElementById('stack-grid');
    if (!container) return;

    container.innerHTML = CONTENT.stack
        .map(
            (item) => `
            <div class="stack-card reveal">
                <svg
                    class="stack-card__icon"
                    viewBox="0 0 24 24"
                    fill="${escapeHtml(item.color)}"
                    aria-hidden="true"
                >
                    ${item.icon}
                </svg>
                <span class="stack-card__name">${escapeHtml(item.name)}</span>
            </div>`
        )
        .join('');
}

/* =========================================================
   NAVIGATION
   ========================================================= */

const Navigation = {
    init() {
        this.navbar = document.getElementById('navbar');
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.menu = document.getElementById('mobile-menu');

        this.onScroll = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScroll, { passive: true });
        this.onScroll();

        if (this.menuBtn && this.menu) {
            this.menuBtn.addEventListener('click', () => this.toggleMenu());

            // Referme le menu mobile après un clic sur un lien
            this.menu.addEventListener('click', (event) => {
                if (event.target.closest('a')) this.closeMenu();
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') this.closeMenu();
            });
        }

        // Met en évidence la section visible
        this.initActiveLink();
    },

    onScroll() {
        if (!this.navbar) return;
        this.navbar.classList.toggle('navbar--scrolled', window.scrollY > 24);
    },

    toggleMenu() {
        const isOpen = this.menu.classList.toggle('is-open');
        this.menuBtn.setAttribute('aria-expanded', String(isOpen));
        this.menuBtn.setAttribute(
            'aria-label',
            isOpen ? 'Fermer le menu' : 'Ouvrir le menu'
        );
    },

    closeMenu() {
        this.menu.classList.remove('is-open');
        this.menuBtn.setAttribute('aria-expanded', 'false');
        this.menuBtn.setAttribute('aria-label', 'Ouvrir le menu');
    },

    initActiveLink() {
        const links = [...document.querySelectorAll('.nav-link')];
        if (!links.length || !('IntersectionObserver' in window)) return;

        const sections = links
            .map((link) => document.querySelector(link.getAttribute('href')))
            .filter(Boolean);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    links.forEach((link) => {
                        const active =
                            link.getAttribute('href') ===
                            `#${entry.target.id}`;
                        link.style.color = active ? 'var(--text-1)' : '';
                    });
                });
            },
            { rootMargin: '-45% 0px -50% 0px' }
        );

        sections.forEach((section) => observer.observe(section));
    },
};

/* =========================================================
   REVELATIONS AU SCROLL
   ========================================================= */

const ScrollReveal = {
    init() {
        this.items = [...document.querySelectorAll('.reveal')];
        if (!this.items.length) return;

        // Sans IntersectionObserver ou mouvement réduit : tout visible d'emblée
        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            this.items.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    this.observer.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );

        this.items.forEach((item, index) => {
            item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
            this.observer.observe(item);
        });
    },
};

/* =========================================================
   DÉMARRAGE
   ========================================================= */

function init() {
    renderProjects();
    renderJourney();
    renderStack();
    Navigation.init();
    ScrollReveal.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}