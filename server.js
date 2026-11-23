require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const compression = require('compression');
const axios = require('axios');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || '';
/* Optionnel : permet à un opérateur de forcer un rafraîchissement via
   l'en-tête x-refresh-secret. Jamais loggé, jamais renvoyé au client. */
const REFRESH_SECRET = process.env.REFRESH_SECRET || '';
const ALLOWED_FORKS = new Set(['photography-portfolio']);

const CACHE_FILE = path.join(__dirname, 'cache', 'github-stats.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

/* Bornes sur l'amont GitHub : pagination plafonnée, délai par requête, et
   délai global sur le fan-out des langues. */
const MAX_REPO_PAGES = 10;
const MAX_REPOS = 1000;
const GITHUB_TIMEOUT_MS = 10 * 1000;
const LANGUAGE_FANOUT_TIMEOUT_MS = 15 * 1000;

/* Un rafraîchissement privilégié ne peut pas se produire plus d'une fois
   par intervalle, même avec un secret valide. */
const MIN_FORCED_REFRESH_INTERVAL_MS = 60 * 1000;
let lastForcedRefreshAt = 0;

function hasValidRefreshSecret(req) {
  if (!REFRESH_SECRET) {
    return false;
  }
  const provided = req.get('x-refresh-secret');
  if (typeof provided !== 'string' || provided.length === 0) {
    return false;
  }
  // Comparaison en temps constant sur des empreintes de taille fixe.
  const expected = crypto.createHash('sha256').update(REFRESH_SECRET).digest();
  const actual = crypto.createHash('sha256').update(provided).digest();
  return crypto.timingSafeEqual(expected, actual);
}

function claimForcedRefresh() {
  const now = Date.now();
  if (now - lastForcedRefreshAt < MIN_FORCED_REFRESH_INTERVAL_MS) {
    return false;
  }
  lastForcedRefreshAt = now;
  return true;
}

function withTimeout(promise, ms, fallback) {
  let timer = null;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, deadline]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

/* Un compte GitHub fait 1 à 39 caractères, uniquement alphanumériques et
   tirets, sans tiret en tête ni en fin, ni deux tirets consécutifs. Toute
   valeur hors de cette grammaire est refusée avant de toucher au cache ou
   à l'API amont. */
function isValidGitHubUsername(value) {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 39 &&
    /^[A-Za-z0-9-]+$/.test(value) &&
    !value.startsWith('-') &&
    !value.endsWith('-') &&
    !value.includes('--')
  );
}

// Estimation du nombre de lignes par Ko de code pour chaque langage
const LINES_PER_KB = {
  // Markup
  HTML: 20,
  XML: 15,
  SVG: 13,
  XHTML: 17,

  // Styles
  CSS: 30,
  SCSS: 27,
  Sass: 38,
  Less: 27,
  Stylus: 38,

  // Frontend scripts
  JavaScript: 35,
  TypeScript: 28,
  JSX: 23,
  TSX: 19,
  CoffeeScript: 48,

  // Backend scripts
  PHP: 30,
  Python: 45,
  Ruby: 43,
  Perl: 35,
  Lua: 43,
  Shell: 45,
  Bash: 45,

  // Compiled languages
  C: 30,
  'C++': 27,
  Rust: 27,
  Go: 35,
  Java: 23,
  Kotlin: 30,
  'C#': 27,
  Swift: 30,
  'Objective-C': 23,
  'Objective-C++': 23,

  // Data formats
  JSON: 15,
  YAML: 30,
  TOML: 35,
  INI: 38,
  CSV: 125,

  // Databases
  SQL: 18,
  PLSQL: 14,
  TSQL: 14,
  GraphQL: 23,

  // Config & DevOps
  Dockerfile: 23,
  'Docker Compose': 19,
  Nginx: 23,
  Apache: 23,
  Terraform: 19,
  Ansible: 23,

  // Scripting
  PowerShell: 30,
  Batch: 30,
  Zsh: 45,

  // Documentation
  Markdown: 60,
  AsciiDoc: 53,
  RST: 45,
  LaTeX: 30,

  // Mobile
  Dart: 27,
  'React Native': 23,

  // Misc
  WASM: 13,
  'Protocol Buffer': 30,
  Regex: 10,
  Pug: 22,
  EJS: 22,
  Batchfile: 30,

  default: 30
};

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

async function fetchGitHubStats(username) {
  const headers = {
    Accept: 'application/vnd.github.v3+json'
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  let allRepos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_REPO_PAGES && allRepos.length < MAX_REPOS) {
    const response = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos`,
      {
        headers,
        timeout: GITHUB_TIMEOUT_MS,
        params: {
          type: 'public',
          per_page: 100,
          page
        }
      }
    );

    if (response.data.length === 0) {
      hasMore = false;
    } else {
      const ownedRepos = response.data.filter(
        (repo) => !repo.fork || ALLOWED_FORKS.has(repo.name)
      );
      allRepos = allRepos.concat(ownedRepos);
      page += 1;
    }
  }

  if (allRepos.length > MAX_REPOS) {
    allRepos = allRepos.slice(0, MAX_REPOS);
  }

  const languagePromises = allRepos.map(async (repo) => {
    try {
      const langResponse = await axios.get(repo.languages_url, {
        headers,
        timeout: GITHUB_TIMEOUT_MS
      });
      return {
        name: repo.name,
        languages: langResponse.data
      };
    } catch (error) {
      return {
        name: repo.name,
        languages: {}
      };
    }
  });

  /* Si le fan-out dépasse le délai global, on dégrade proprement : les
     dépôts restent listés, seuls les langages manquent. */
  const reposWithLanguages = await withTimeout(
    Promise.all(languagePromises),
    LANGUAGE_FANOUT_TIMEOUT_MS,
    allRepos.map((repo) => ({ name: repo.name, languages: {} }))
  );

  const repoStats = reposWithLanguages.map((repo) => {
    let repoBytes = 0;
    let repoLines = 0;
    Object.entries(repo.languages).forEach(([language, bytes]) => {
      repoBytes += bytes;
      const linesPerKb = LINES_PER_KB[language] || LINES_PER_KB.default;
      repoLines += (bytes / 1024) * linesPerKb;
    });

    return {
      name: repo.name,
      bytes: repoBytes,
      estimatedLines: Math.round(repoLines)
    };
  });

  const totals = {};
  let totalBytes = 0;
  let estimatedLines = 0;

  reposWithLanguages.forEach((repo) => {
    Object.entries(repo.languages).forEach(([language, bytes]) => {
      totals[language] = (totals[language] || 0) + bytes;
      totalBytes += bytes;
      const linesPerKb = LINES_PER_KB[language] || LINES_PER_KB.default;
      estimatedLines += (bytes / 1024) * linesPerKb;
    });
  });

  const languages = Object.entries(totals)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalBytes ? ((bytes / totalBytes) * 100).toFixed(2) : '0.00'
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const topReposByLines = [...repoStats]
    .sort((a, b) => b.estimatedLines - a.estimatedLines)
    .slice(0, 5);

  console.log('Top repos par lignes estimees:');
  topReposByLines.forEach((repo, index) => {
    console.log(
      `${index + 1}. ${repo.name} - ${repo.estimatedLines.toLocaleString('fr-FR')} lignes - ${(repo.bytes / 1024).toFixed(1)} Ko`
    );
  });

  return {
    totalRepos: allRepos.length,
    totalLanguages: Object.keys(totals).length,
    estimatedLines: Math.round(estimatedLines),
    languages,
    /* Les dépôts publics, triés par étoiles — la liste est déjà en
       mémoire (récupérée pour les langages), donc ce mapping ne coûte
       aucun appel API supplémentaire. Le front s'en sert pour afficher
       une preuve vivante : étoiles réelles et dernier push daté. */
    repos: allRepos
      .map((repo) => ({
        name: repo.name,
        stars: repo.stargazers_count,
        language: repo.language,
        pushedAt: repo.pushed_at,
        description: repo.description,
        htmlUrl: repo.html_url,
        fork: repo.fork
      }))
      .sort((a, b) => b.stars - a.stars),
    lastUpdate: new Date().toISOString()
  };
}

app.get('/api/github-stats/:username?', async (req, res) => {
  try {
    const rawUsername =
      req.params.username === undefined ? GITHUB_USERNAME : req.params.username;
    if (!isValidGitHubUsername(rawUsername)) {
      return res.status(400).json({
        error: 'Nom de compte GitHub invalide'
      });
    }
    const username = rawUsername;

    /* Le front n'utilise pas ?refresh=true. Un rafraîchissement forcé exige
       désormais un secret serveur (x-refresh-secret) et reste borné par un
       intervalle minimal global. Sinon la requête est servie depuis le cache. */
    const forcedRefresh =
      req.query.refresh === 'true' &&
      hasValidRefreshSecret(req) &&
      claimForcedRefresh();

    if (!forcedRefresh) {
      const cached = await readCache(username);
      if (cached) {
        return res.json(cached);
      }
    }

    const stats = await fetchGitHubStats(username);
    await writeCache(username, stats);
    return res.json(stats);
  } catch (error) {
    console.error('Erreur API GitHub:', error.message);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des stats GitHub'
    });
  }
});

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
