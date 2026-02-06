/**
 * Routes pages du portfolio
 * Endpoints pour les fichiers HTML, sitemap, robots, etc.
 */

const express = require('express');
const path = require('path');
const config = require('../config/config');

const router = express.Router();

/**
 * GET /
 * Page d'accueil du portfolio
 */
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

/**
 * GET /sitemap.xml
 * Sitemap XML pour le SEO
 */
router.get('/sitemap.xml', (req, res) => {
    const baseUrl = config.portfolio.url;
    const pages = [
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/#about', priority: '0.8', changefreq: 'monthly' },
        { url: '/#projects', priority: '0.8', changefreq: 'monthly' },
        { url: '/#skills', priority: '0.7', changefreq: 'monthly' },
        { url: '/404.html', priority: '0.1', changefreq: 'yearly' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    pages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.type('application/xml');
    res.send(xml);
});

/**
 * GET /robots.txt
 * Robots.txt pour les crawlers
 */
router.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /
Sitemap: ${config.portfolio.url}/sitemap.xml

User-agent: *
Disallow: /cache/
Disallow: /node_modules/
Disallow: /.env`;

    res.type('text/plain');
    res.send(robots);
});

/**
 * GET 404 (Wildcard)
 * Page d'erreur 404
 */
router.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', '..', 'public', '404.html'));
});

module.exports = router;
