/**
 * Routes API du portfolio
 * Endpoints pour les données (JSON, stats, etc.)
 */

const express = require('express');
const GitHubStats = require('../services/github');

const router = express.Router();

/**
 * GET /api/github-stats
 * Retourne les statistiques GitHub (repos, lignes de code)
 */
router.get('/github-stats', async (req, res) => {
    try {
        const stats = await GitHubStats.getStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({
            repos: 0,
            estimatedLines: 0,
            error: 'Failed to fetch GitHub stats',
            message: error.message
        });
    }
});

module.exports = router;
