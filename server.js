require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const axios = require('axios');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || '';
const ALLOWED_FORKS = new Set(['photography-portfolio']);

const CACHE_FILE = path.join(__dirname, 'cache', 'github-stats.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

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

// Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

async function readCache() {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf8');
    const cached = JSON.parse(content);
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function writeCache(data) {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    const payload = {
      timestamp: Date.now(),
      data
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'écriture du cache:', error);
    return false;
  }
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

  while (hasMore) {
    const response = await axios.get(
      `https://api.github.com/users/${username}/repos`,
      {
        headers,
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

  const languagePromises = allRepos.map(async (repo) => {
    try {
      const langResponse = await axios.get(repo.languages_url, { headers });
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

  const reposWithLanguages = await Promise.all(languagePromises);

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
    lastUpdate: new Date().toISOString()
  };
}

app.get('/api/github-stats/:username?', async (req, res) => {
  try {
    const username = req.params.username || GITHUB_USERNAME;
    if (!username) {
      return res.status(400).json({
        error: 'GITHUB_USERNAME manquant'
      });
    }

    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh) {
      const cached = await readCache();
      if (cached) {
        return res.json(cached);
      }
    }

    const stats = await fetchGitHubStats(username);
    await writeCache(stats);
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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Portfolio lancé sur http://localhost:${PORT}`);
});
