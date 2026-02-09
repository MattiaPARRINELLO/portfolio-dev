-# Portfolio Mattia Parrinello

![OG Cover](public/assets/images/og-cover.svg)

Portfolio développeur moderne avec micro-interactions soignées, animations au scroll et design responsive.

## 🚀 Démarrage rapide

### Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# OU lancer en production
npm start
```

Le site sera accessible à l'adresse : **http://localhost:3000**

## 📁 Structure du projet

```
portfolio-dev/
├── public/                  # Fichiers statiques servis
│   ├── index.html          # Page principale
│   ├── styles.css          # Styles personnalisés
│   ├── main.js             # JavaScript (animations, interactions)
│   └── assets/             # Images, GIFs, fonts
│       ├── images/         # Images des projets
│       └── icons/          # Favicons et icônes
├── server.js               # Serveur Express
├── package.json            # Configuration npm
└── README.md               # Ce fichier
```

## ✨ Fonctionnalités

### Design

- 🎨 Design sombre et sobre avec touches de couleur accent (bleu)
- 📱 Responsive design (mobile-first)
- 🌟 Dégradé de texte animé sur le nom

### Micro-interactions

- 🔘 Boutons avec effet de brillance au hover
- 📦 Cartes projets avec effet de tilt 3D
- 🏷️ Badges stack avec glow coloré
- 🔗 Liens de navigation avec underline animé
- ⬇️ Overlay avec boutons qui apparaissent au hover

### Animations

- 📜 Animations d'entrée au scroll (fade + slide)
- 🌀 Glow parallax qui suit la souris
- ⏳ Stagger effect sur les éléments
- 🎯 Smooth scroll vers les ancres

### Performance

- ⚡ Compression gzip activée
- 🖼️ Structure optimisée pour lazy loading d'images
- 🔒 Headers de sécurité basiques

## 🛠️ Personnalisation

### Modifier le contenu

1. **Informations personnelles** : Éditer directement `public/index.html`
2. **Projets** : Section `#portfolio` dans le HTML
3. **Liens de contact** : Section `#contact` dans le HTML
4. **Couleurs** : Variables CSS dans `styles.css` ou config Tailwind dans le HTML

### Ajouter des images de projets

1. Placer les images dans `public/assets/images/`
2. Remplacer les placeholders SVG par des balises `<img>` :

```html
<!-- Avant (placeholder) -->
<div class="aspect-video bg-gradient-to-br from-purple-600 to-pink-500">
  <svg>...</svg>
</div>

<!-- Après (avec image) -->
<div class="aspect-video">
  <img
    src="assets/images/mon-projet.jpg"
    alt="Mon projet"
    class="w-full h-full object-cover"
  />
</div>
```

### Ajouter un GIF de preview

```html
<img
  src="assets/images/projet-preview.gif"
  alt="Preview du projet"
  class="w-full h-full object-cover"
/>
```

## 🎨 Personnalisation des couleurs

### Dans le HTML (Tailwind config)

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // Fond principal
        secondary: "#1e293b", // Fond secondaire
        accent: "#ec4899", // Couleur d'accent (rose)
      },
    },
  },
};
```

### Dans le CSS (variables)

```css
:root {
  --primary: #0f172a;
  --secondary: #1e293b;
  --accent: #ec4899;
  --accent-hover: #db2777;
}
```

## 📝 Sections du site

1. **Hero** - Présentation avec nom, titre et CTA
2. **À propos** - Bio et icônes de compétences
3. **Parcours** - Timeline chronologique du parcours
4. **Portfolio** - Cartes de projets avec liens
5. **Stack** - Grille de technologies
6. **Contact** - Liens vers réseaux et email

## 🥚 Easter Eggs

Le portfolio contient plusieurs surprises cachées :

| Easter Egg           | Comment le déclencher                        |
| -------------------- | -------------------------------------------- |
| **Mode Matrix**      | Konami Code : ↑↑↓↓←→←→BA                     |
| **Messages secrets** | Tape "hello", "dev", "cafe", "love" ou "bug" |
| **Logo secret**      | Triple-clic sur le logo "MP."                |
| **Compteur footer**  | Clique plusieurs fois sur le footer          |
| **ASCII Art**        | Ouvre la console (F12)                       |

## 🔧 Scripts disponibles

| Commande      | Description                     |
| ------------- | ------------------------------- |
| `npm start`   | Lance le serveur en production  |
| `npm run dev` | Lance avec nodemon (hot reload) |

## 📄 Licence

MIT - Libre d'utilisation et de modification.

---

Créé avec ♥ par Mattia Parrinello
