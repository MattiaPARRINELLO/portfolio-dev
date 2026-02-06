/**
 * Serveur Express principal du portfolio
 * Structure modulaire et propre avec imports organisés
 * 
 * Architecture:
 * - config/ → Configuration centralisée
 * - routes/ → Toutes les routes (API, pages, SEO)
 * - services/ → Logique métier (GitHub, Cache)
 * - middleware/ → Middlewares Express
 */

const express = require('express');
const compression = require('compression');
const path = require('path');

// Imports configuration
const config = require('./config/config');

// Imports services
const GitHubStats = require('./services/github');
const cache = require('./services/cache');

// Imports routes
const routes = require('./routes');

// ═════════════════════════════════════════════════════════════════════
// INITIALISATION
// ═════════════════════════════════════════════════════════════════════

const app = express();

// ═════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════

// Compression gzip
app.use(compression());

// Fichiers statiques avec cache navigateur
app.use(express.static(path.join(__dirname, '..', 'public'), {
    maxAge: '1d', // 1 jour
    etag: true
}));

// ═════════════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════════════

app.use(routes);

// ═════════════════════════════════════════════════════════════════════
// DÉMARRAGE DU SERVEUR
// ═════════════════════════════════════════════════════════════════════

const server = app.listen(config.port, async () => {
    // Banner
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          🚀 Portfolio de Mattia Parrinello               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`🌐 Serveur lancé sur http://localhost:${config.port}\n`);

    // Afficher config GitHub
    if (config.github.token) {
        console.log('✅ Token GitHub: configuré (5000 req/h)');
    } else {
        console.warn('⚠️  Token GitHub: non configuré (60 req/h)');
        console.warn('   → Créez un token: https://github.com/settings/tokens');
        console.warn('   → Mettez-le dans .env: GITHUB_TOKEN=your_token\n');
    }

    // Vérifier et charger les stats GitHub
    console.log('🔄 Initialisation stats GitHub...');
    try {
        // Vérifier si le cache est valide
        const cached = cache.load(config.cache.files.github);
        const isValid = cache.isValid(config.cache.files.github);

        if (cached && isValid) {
            const remainingHours = Math.round(cache.getTimeRemaining(config.cache.files.github) / 3600000);
            console.log(`✅ Cache chargé (expire dans ${remainingHours}h)`);
            console.log(`📊 ${cached.repos} repos • ${cached.estimatedLines.toLocaleString('fr-FR')} lignes\n`);
        } else {
            console.log('📊 Actualisation des stats...');
            const stats = await GitHubStats.refresh();
            console.log(`📊 ${stats.repos} repos • ${stats.estimatedLines.toLocaleString('fr-FR')} lignes\n`);
        }
    } catch (error) {
        console.warn(`⚠️  Impossible de charger stats GitHub: ${error.message}\n`);
    }

    // Rafraîchir automatiquement les stats toutes les 24h
    setInterval(async () => {
        console.log('\n🔄 Rafraîchissement automatique (24h)...');
        try {
            await GitHubStats.refresh();
        } catch (error) {
            console.error(`❌ Récupération stats échouée: ${error.message}`);
        }
    }, config.cache.ttl);

    // Routes disponibles
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Routes disponibles:');
    console.log('   GET  /                 → Page d\'accueil');
    console.log('   GET  /api/github-stats → Stats GitHub (JSON)');
    console.log('   GET  /sitemap.xml      → Sitemap SEO');
    console.log('   GET  /robots.txt       → Robots pour moteurs de recherche');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// ═════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═════════════════════════════════════════════════════════════════════

process.on('SIGTERM', () => {
    console.log('\n🛑 Signal SIGTERM reçu. Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 Interrupt reçu. Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

module.exports = server;
