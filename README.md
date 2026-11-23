<div align="center">
  <h1>👨‍💻 Portfolio-Dev</h1>
  <p><strong>Portfolio de Mattia Parrinello, développeur full-stack et photographe de concert.</strong></p>

![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript)
![Licence](https://img.shields.io/badge/licence-MIT-green)
</div>

---

## 📋 Sommaire
- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Routes](#routes)
- [Technologies](#technologies)
- [Auteur](#auteur)

---

## 🎯 Présentation
Le portfolio est construit comme une setlist de concert : cinq morceaux, un rappel. L'affiche ouvre sur un pass d'accréditation en 3D, puis la setlist mène aux projets, au parcours lu comme un `git log`, aux photographies de concert et au contact. Les études de cas détaillées vivent sur `/projets`.

---

## ✨ Fonctionnalités
- ✅ Affiche plein cadre, nom en pleine largeur
- ✅ Pass backstage en 3D : épaisseur réelle, foil iridescent, il se retourne au scroll
- ✅ Lumière de salle en canvas, teintée par morceau (bleu sur le pass, rouge sur le rappel)
- ✅ Deux cartes projets sur la home, avec capture et liens
- ✅ Étude de cas Backstage : interface de chat qui s'écrit au scroll (question, réflexion, réponse avec sa source)
- ✅ Étude de cas Gymshark-Sync : scène 3D de neuf roues dentées
- ✅ Parcours en `git log` avec branches colorées
- ✅ Photos avec artiste, salle, date et réglages, fiche plein écran au clic
- ✅ Contact : le nom de l'entreprise prépare le mail pré-rempli
- ✅ Page 404 dédiée, et 404 JSON pour `/api/*`
- ✅ Design responsive et `prefers-reduced-motion` respecté

---

## 🚀 Installation
```bash
git clone https://github.com/MattiaPARRINELLO/portfolio-dev.git
cd portfolio-dev
npm install
npm start
```

---

## 🗺️ Routes
| URL | Contenu |
|-----|---------|
| `/` | Accueil, setlist et projets |
| `/projets` | Index des études de cas |
| `/projets/backstage` | Étude de cas Backstage |
| `/projets/gymshark-sync` | Étude de cas Gymshark-Sync |
| `/cv-alternance` | CV en PDF, URL stable |
| inconnue | 404 HTML, ou 404 JSON sous `/api/*` |

---

## 🛠️ Technologies
| Technologie | Rôle |
|-------------|------|
| Express | Serveur, routes et endpoint CV |
| HTML/CSS/JS | Frontend, sans dépendance |
| Three.js | Pass et scène Gymshark, servi localement |
| Canvas 2D | Faisceaux de projecteurs |
| Polices auto-hébergées | Space Grotesk, Inter, JetBrains Mono |

---

<div align="center">
  <sub>Fait avec ❤️ par <a href="https://github.com/MattiaPARRINELLO">MattiaPARRINELLO</a></sub>
</div>
