require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

const CACHE_FILE = path.join(__dirname, 'cache', 'github-stats.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

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

/* Le cache est une map d'entrées par compte, clé en minuscules car GitHub
   traite les noms de compte sans distinction de casse. Un ancien fichier au
   format global { timestamp, data } ne correspond à aucun compte : il est
   ignoré et sera remplacé à la première écriture réussie. */
function cacheKey(username) {
  return username.toLowerCase();
}

function isValidCacheEntry(entry) {
  return (
    entry !== null &&
    typeof entry === 'object' &&
    typeof entry.timestamp === 'number' &&
    entry.data !== null &&
    typeof entry.data === 'object'
  );
}

async function readCacheStore() {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    // Ancien format global : inutilisable pour un compte précis.
    if (typeof parsed.timestamp === 'number' && isValidCacheEntry(parsed)) {
      return {};
    }
    return parsed;
  } catch (error) {
    return {};
  }
}

async function readCache(username) {
  const store = await readCacheStore();
  const entry = store[cacheKey(username)];
  if (!isValidCacheEntry(entry)) {
    return null;
  }
  if (Date.now() - entry.timestamp >= CACHE_DURATION) {
    return null;
  }
  return entry.data;
}

/* Verrou en mémoire par clé : deux écritures concurrentes pour le même
   compte dans ce processus sont sérialisées, ce qui évite de perdre une
   entrée lors du read-modify-write de la map. */
const cacheLocks = new Map();

async function withCacheLock(key, task) {
  const previous = cacheLocks.get(key) || Promise.resolve();
  const current = previous.then(task, task);
  const guard = current.catch(() => {});
  cacheLocks.set(key, guard);
  try {
    return await current;
  } finally {
    if (cacheLocks.get(key) === guard) {
      cacheLocks.delete(key);
    }
  }
}

async function writeCache(username, data) {
  const key = cacheKey(username);
  return withCacheLock(key, async () => {
    let tempFile = null;
    try {
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      const store = await readCacheStore();
      store[key] = {
        timestamp: Date.now(),
        data
      };
      tempFile = `${CACHE_FILE}.${process.pid}.${Date.now()}.${Math.random()
        .toString(16)
        .slice(2)}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8');
      await fs.rename(tempFile, CACHE_FILE);
      return true;
    } catch (error) {
      if (tempFile) {
        await fs.unlink(tempFile).catch(() => {});
      }
      console.error('Erreur lors de l\'écriture du cache:', error.message);
      return false;
    }
  });
}

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
