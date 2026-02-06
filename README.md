<div align="center">

# Portfolio Mattia Parrinello

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Code style](https://img.shields.io/badge/Code%20style-Modular-blue?style=flat-square)](src/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Portfolio développeur avec stats GitHub en temps réel, design responsive et animations fluides**

[Quick Start](#-démarrage-rapide) • [Docs](#-documentation) • [Liens](#-liens)

</div>

</div>

---

## Fonctionnalités

- **Stats GitHub exactes** - Compte les lignes de code par langage via l'API GitHub
- **Cache persistant** - Stockage disque avec auto-refresh 24h pour performance
- **Design responsive** - Tailwind CSS + CSS personnalisé, mobile-first
- **Animations fluides** - Scroll, fade-in, counter animations performantes
- **SPA Navigation** - Smooth navigation sans rechargement de page
- **SEO optimisé** - Sitemap.xml, robots.txt, meta tags OpenGraph
- **Performance** - Compression GZIP, cache navigateur, optimisation assets
- **Code modulaire** - Architecture scalable avec séparation config/routes/services

## Démarrage rapide

### Installation (3 étapes)

```bash
# 1. Cloner le repo
git clone https://github.com/MattiaPARRINELLO/portfolio.git
cd portfolio

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm start
```

Accéder au site sur **http://localhost:3000**

### Avec token GitHub (optionnel mais recommandé)

Pour augmenter la limite API (5000 req/h au lieu de 60) :

```bash
# 1. Créer un token sur https://github.com/settings/tokens
#    Permissions: public_repo (lecture seule)

# 2. Créer fichier .env à la racine :
cat > .env << EOF
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
EOF

# 3. Redémarrer le serveur
npm start
```

## Documentation

### Structure du projet

```
portfolio/
├── server.js                      # Point d'entrée Express
├── src/
│   ├── server.js                 # Configuration middleware/routes
│   ├── config/
│   │   └── config.js            # Configuration centralisée
│   ├── routes/
│   │   ├── index.js             # Routes pages (/, sitemap, robots)
│   │   └── api.js               # Routes API
│   └── services/
│       ├── cache.js             # Gestion cache fichier
│       └── github.js            # Logique stats GitHub
├── public/
│   ├── index.html              # Page principale
│   ├── 404.html                # Page erreur 404
│   ├── favicon.svg
│   └── assets/
│       ├── css/styles.css      # CSS personnalisé
│       ├── js/main.js          # Frontend JavaScript
│       ├── icons/              # SVG icons
│       └── images/             # Ressources images
├── cache/
│   └── github-stats.json       # Cache (auto-généré)
├── .env                        # Vars d'env (gitignored)
├── package.json
└── README.md
```

### Routes disponibles

| Route               | Method | Response | Description             |
| ------------------- | ------ | -------- | ----------------------- |
| `/`                 | GET    | HTML     | Page d'accueil          |
| `/api/github-stats` | GET    | JSON     | Stats GitHub avec cache |
| `/sitemap.xml`      | GET    | XML      | Sitemap pour SEO        |
| `/robots.txt`       | GET    | TXT      | Configuration robots    |

## Cache Management

Le cache GitHub **auto-refresh** chaque 24 heures :

```javascript
const cache = require("./src/services/cache");

// Charger données
const data = cache.load("data.json");

// Sauvegarder données
cache.save("data.json", { key: "value" });

// Vérifier validité
if (cache.isValid("data.json", 86400000)) {
  // Cache encore frais
}

// Temps restant
const ms = cache.getTimeRemaining("data.json");
```

## Customization

### Changer les couleurs

Modifiez `public/assets/css/styles.css` :

```css
:root {
  --accent: #ec4899; /* Rose principal */
  --primary: #0f172a; /* Bleu très foncé */
  --secondary: #1e293b; /* Gris bleu */
  --success: #10b981;
  --danger: #ef4444;
}
```

### Ajouter une route

Dans `src/routes/api.js` :

```javascript
app.get("/api/nouvelle-route", (req, res) => {
  res.json({ message: "Hello World!" });
});
```

## API Response

**GET** `/api/github-stats` → JSON

```json
{
  "repos": 49,
  "estimatedLines": 47667,
  "totalBytes": 3019170,
  "totalMB": "2.88",
  "method": "exact",
  "lastUpdate": "2026-02-06T14:03:00.313Z",
  "cacheSource": "file"
}
```

**Calcul** :

- Récupère le nombre exact de repos (sans forks)
- Utilise l'API GitHub pour compter les lignes par langage
- Densité adaptée par langage (Python=45 chars/ligne, Java=65, etc)
- Cache 24h pour limiter les appels API

## Sécurité

- Token GitHub dans `.env` (non versionné)
- `.gitignore` exclut `.env` et `cache/`
- Pas de données sensibles dans le cache
- Routes protégées contre les erreurs API
- HTTPS recommandé en production

## Performance

- **Build time** : < 1s
- **Startup** : ~1s (avec cache)
- **API latency** : < 50ms (cached)
- **Code size** : ~2.88 MB (tous repos)

## Débogage

Logs au démarrage :

```
Portfolio lancé sur http://localhost:3000
Token GitHub: configuré (5000 req/h)
Initialisation stats GitHub...
Cache chargé (expire dans 24h)
   xxxx • xxxx lignes
```

## Liens

- **GitHub** : [@MattiaPARRINELLO](https://github.com/MattiaPARRINELLO)
- **Email** : contact.mprnl@gmail.com

## License

MIT © 2026 Mattia Parrinello

---

<div align="center">

**[Back to top](#portfolio-mattia-parrinello)** • **[Report a bug](https://github.com/MattiaPARRINELLO/portfolio-dev/issues)** • **[Suggest a feature](https://github.com/MattiaPARRINELLO/portfolio-dev/discussions)**

</div>
