/**
 * Configuration centralisée du portfolio
 * Tous les paramètres de l'application en un seul endroit
 */

require('dotenv').config();

module.exports = {
    // ═════════════════════════════════════════════════════════════════════
    // SERVEUR
    // ═════════════════════════════════════════════════════════════════════
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',

    // ═════════════════════════════════════════════════════════════════════
    // GITHUB API
    // ═════════════════════════════════════════════════════════════════════
    github: {
        token: process.env.GITHUB_TOKEN,
        username: 'MattiaPARRINELLO',
        username_display: 'Mattia Parrinello',
        api_url: 'https://api.github.com'
    },

    // ═════════════════════════════════════════════════════════════════════
    // CACHE SYSTÈME
    // ═════════════════════════════════════════════════════════════════════
    cache: {
        dir: 'cache',
        ttl: 86400000, // 24 heures en millisecondes
        files: {
            github: 'github-stats.json'
        }
    },

    // ═════════════════════════════════════════════════════════════════════
    // INFORMATIONS PORTFOLIO
    // ═════════════════════════════════════════════════════════════════════
    portfolio: {
        title: 'Mattia Parrinello - Portfolio Développeur',
        description: 'Portfolio de développeur avec stats GitHub en temps réel',
        url: 'http://localhost:3000',
        author: 'Mattia Parrinello',
        socialLinks: {
            github: 'https://github.com/MattiaPARRINELLO',
            linkedin: 'https://linkedin.com',
            email: 'mattia@example.com'
        }
    },

    // ═════════════════════════════════════════════════════════════════════
    // LANGAGES & DENSITÉ (chars par ligne)
    // ═════════════════════════════════════════════════════════════════════
    languages: {
        description: 'Densité moyenne en caractères par ligne par langage',
        density: {
            'Python': 45,
            'JavaScript': 50,
            'TypeScript': 52,
            'Java': 65,
            'C++': 70,
            'C': 65,
            'C#': 60,
            'Go': 55,
            'Rust': 60,
            'PHP': 55,
            'Ruby': 48,
            'Swift': 58,
            'Kotlin': 62,
            'SQL': 75,
            'HTML': 85,
            'CSS': 80,
            'SCSS': 75,
            'JSON': 100,
            'YAML': 90,
            'Markdown': 80,
            'Shell': 50,
            'Dockerfile': 70,
            'default': 60
        }
    }
};
