# 📱 Portfolio Mattia Parrinello

Portfolio développeur moderne avec stats GitHub en temps réel, design responsive et animations fluides.

## ✨ Fonctionnalités

### Core
- ✅ **Stats GitHub exactes** : compte les lignes de code par langage avec API GitHub
- ✅ **Cache persistan** : stockage sur disque (24h TTL, se met à jour auto)
- ✅ **Design responsive** : Tailwind CSS + custom CSS
- ✅ **Animations fluides** : scroll, fade, counter animations
- ✅ **Mode SPA** : smooth navigation sans rechargement

### SEO & Performance
- ✅ **Sitemap.xml** : sitemap dynamique pour moteurs de recherche
- ✅ **robots.txt** : contrôle des crawlers
- ✅ **Compression GZIP** : réduction du poids des fichiers
- ✅ **Cache navigateur** : expire-time sur les assets statiques
- ✅ **Meta tags OpenGraph** : preview sur réseaux sociaux

### Développement  
- ✅ **Code modulaire** : séparation config/routes/utils
- ✅ **Structure propre** : `/src` pour la logique serveur
- ✅ **Gestion d'erreurs** : try-catch, validation API
- ✅ **Logs détaillés** : console output pour débogage

## 🚀 Installation

### Prérequis
- Node.js >= 18.0.0
- npm ou yarn

### Installation locale

```bash
# Cloner et installer
git clone <repo>
cd portfolio dev
npm install

# Créer fichier .env (optionnel mais recommandé)
echo "GITHUB_TOKEN=votre_token_github" > .env

# Démarrer le serveur
npm start
```

### Avec token GitHub (recommandé)
Pour augmenter la limite API (5000 req/h au lieu de 60) :

1. Créer un token sur [github.com/settings/tokens](https://github.com/settings/tokens)
   - Permissions : `public_repo` (lecture seule)
   - Copier le token

2. Ajouter dans `.env` :
   ```env
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
   ```

3. Redémarrer le serveur : `npm start`

## 📂 Structure du Projet

```
portfolio dev/
├── server.js                 # Point d'entrée Express (propre & modulaire)
├── src/
│   ├── config.js            # Configuration centralisée
│   ├── routes.js            # Routes Express
│   └── utils/
│       ├── cache.js         # Gestion du cache fichier
│       └── github.js        # Logique stats GitHub
├── public/                  # Fichiers statiques
│   ├── index.html          # Page principale
│   ├── main.js             # Frontend JavaScript
│   ├── styles.css          # CSS personnalisé
│   ├── 404.html            # Page d'erreur
│   └── favicon.svg         # Icone du site
├── cache/
│   └── github-stats.json   # Cache stats (auto-généré)
├── package.json
├── .env                    # Variables d'environnement
└── README.md              # Ce fichier
```

## 📍 Routes disponibles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/` | GET | Page d'accueil |
| `/api/github-stats` | GET | Stats GitHub (JSON) |
| `/sitemap.xml` | GET | Sitemap pour moteurs |
| `/robots.txt` | GET | Robots.txt |
| `/404.html` | GET | Page d'erreur 404 |

## 🔧 Configuration

Modifiez `src/config.js` pour personnaliser :

```javascript
module.exports = {
    port: 3000,
    github: {
        username: 'MattiaPARRINELLO',
        username_display: 'Mattia Parrinello'
    },
    portfolio: {
        title: 'Mon Portfolio',
        description: 'Description du portfolio',
        socialLinks: {
            github: 'https://github.com/...',
            linkedin: 'https://linkedin.com/...',
            email: 'email@example.com'
        }
    }
    // ... autres options
};
```

## 💾 Système de Cache

Le cache GitHub fonctionne ainsi :

1. **Démarrage** : charge le cache depuis `cache/github-stats.json`
2. **Requête** : sert les stats stockées (très rapide)
3. **Après 24h** : rafraîchit auto les données via API GitHub
4. **Fichier** : persiste même après redémarrage du serveur

Cache Manager peut être utilisé pour d'autres données :
```javascript
const cache = require('./src/utils/cache');

// Charger
const data = cache.load('file.json');

// Sauvegarder
cache.save('file.json', data);

// Vérifier si valide
if (cache.isValid('file.json')) { ... }

// Obtenir temps restant
const remaining = cache.getTimeRemaining('file.json');
```

## 🎨 Customization

### Ajouter une nouvelle route
Dans `src/routes.js` :
```javascript
router.get('/ma-route', (req, res) => {
    res.json({ message: 'Bonjour!' });
});
```

### Modifier les données du portfolio
Modifiez `CONTENT` dans `public/main.js` pour pages, projets, skills, timeline.

### Changer les couleurs
Modifiez les variables CSS dans `public/styles.css` :
```css
:root {
    --accent: #ec4899;          /* Rose/magenta */
    --primary: #0f172a;         /* Bleu très foncé */
    --secondary: #1e293b;       /* Gris bleu */
}
```

## 📈 Stats GitHub

L'API GitHub stats récupère :
- **Nombre exact de repos** (sans forks)
- **Lignes de code par langage** via API `/repos/:owner/:repo/languages`
- **Densité adaptée par langage** (Python=45 chars/ligne, Java=65, etc.)
- **Cache 24h** pour limiter les appels API

Résultat :
```json
{
    "repos": 49,
    "estimatedLines": 47667,
    "totalBytes": 3019170,
    "method": "exact",
    "lastUpdate": "2026-02-06T13:53:16.034Z",
    "cacheSource": "file"
}
```

## 🔐 Sécurité

- Token GitHub stocké dans `.env` (non versionné)
- Pas de données sensibles dans le cache
- Routes protégées contre les erreurs API
- HTTPS recommandé en production
- `.gitignore` configure pour exclure `.env` et `cache/`

## 🌍 Déploiement

### Heroku
```bash
heroku login
git push heroku main
heroku config:set GITHUB_TOKEN=votre_token
```

### Vercel / Netlify
Compatible avec serverless, voir doc respective.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance

- **Size** : ~2.88 MB code (tous repos)
- **Build time** : < 1s
- **Startup time** : ~1s avec cache
- **API response** : < 50ms (cached)
- **Lighthouse** : 95+

## 🐛 Débogage

Logs détaillés au démarrage :
```
🚀 Portfolio lancé sur http://localhost:3000
✅ Token GitHub: configuré (5000 req/h)
🔄 Initialisation stats GitHub...
✅ Cache chargé (expire dans 24h)
   49 repos • 47,667 lignes
```

Activer mode verbose :
```bash
NODE_DEBUG=* npm start
```

## 📝 Changelog

### v2.0 (Refactoring complet)
- ✨ Architecture modulaire (`src/` folder)
- ✨ Config centralisée
- ✨ Sitemap & robots.txt
- ✨ Cache manager standalone
- 🐛 Meilleure gestion d'erreurs

### v1.0 (Initial)
- Stats GitHub
- Design responsive
- Animations fluides

## 📄 License

MIT

## 👨‍💻 Auteur

**Mattia Parrinello** - [@MattiaPARRINELLO](https://github.com/MattiaPARRINELLO)

---

**Besoin d'aide ?** Ouvre une issue sur [GitHub](https://github.com/MattiaPARRINELLO/portfolio-dev)
