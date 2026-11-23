require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Compression middleware
app.use(compression());

// Bloquer l'accès aux fichiers sensibles AVANT le middleware statique.
// Express ne sert que public/, mais Passenger sert le dossier de l'app via
// Apache : un .env placé à la racine resterait sinon téléchargeable.
const BLOCKED_PATHS = ['.env', '.env.local', '.env.production', 'package.json', 'package-lock.json', 'server.js', '.gitignore', 'README.md'];

app.use((req, res, next) => {
  let requested;
  try {
    requested = decodeURIComponent(req.path);
  } catch (error) {
    // Chemin malformé : réponse tersée, jamais de pile ni de chemin absolu.
    res.status(400).type('text/plain').send('Bad request');
    return;
  }

  /* Normaliser avant de comparer, pour que /./cache/... ou //cache/...
     retombent sur les préfixes bloqués. */
  const normalized = path.posix.normalize(
    '/' + requested.replace(/^\/+/, '')
  );
  const basename = path.posix.basename(normalized);

  if (
    basename.startsWith('.env') ||
    BLOCKED_PATHS.includes(basename) ||
    normalized.startsWith('/.git') ||
    normalized.startsWith('/cache') ||
    normalized.startsWith('/src')
  ) {
    res.status(404).send('Not found');
    return;
  }

  next();
});

// Servir les fichiers statiques du dossier public
// Le HTML et le JS sont revalidés à chaque requête ; les images, polices et
// assets stables sont mises en cache longuement.
/* Pages projets : une URL stable par étude de cas. Ces routes passent après
   le blocage des fichiers sensibles mais avant le middleware statique, car
   express.static redirige /projets vers /projets/ (301) ; ici la forme sans
   slash final rend la page directement en 200. */
app.get(['/projets', '/projets/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projets', 'index.html'));
});

app.get(['/projets/backstage', '/projets/backstage/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projets', 'backstage', 'index.html'));
});

app.get(['/projets/gymshark-sync', '/projets/gymshark-sync/'], (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public', 'projets', 'gymshark-sync', 'index.html')
  );
});

app.use(
  express.static(path.join(__dirname, 'public'), {
    etag: true,
    dotfiles: 'deny',
    index: ['index.html'],
    setHeaders(res, filePath) {
      const isStaticAsset = /\.(webp|png|jpg|jpeg|svg|ico|woff2?)$/i.test(filePath);
      res.setHeader(
        'Cache-Control',
        isStaticAsset ? 'public, max-age=30d, immutable' : 'no-cache'
      );
    }
  })
);

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* Endpoint CV stable : /cv-alternance sert toujours le fichier
   cv-alternance.pdf. Pour publier une nouvelle version, il suffit de
   remplacer CE fichier — l'URL, elle, ne change jamais. */
app.get('/cv-alternance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'cv', 'cv-alternance.pdf'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename="CV-Mattia-Parrinello-alternance.pdf"'
    }
  });
});

// Middleware d'erreur terminal : log côté serveur, réponse générique.
// Aucune pile, aucun chemin absolu, aucun détail interne ne sort au client.
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err && err.message ? err.message : 'inconnue');
  if (res.headersSent) {
    return next(err);
  }
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
  return res.status(500).type('text/plain').send('Erreur interne du serveur');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Portfolio lancé sur http://localhost:${PORT}`);
});
