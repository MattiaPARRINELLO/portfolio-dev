/**
 * Service GitHub Stats
 * Récupère et calcule les statistiques du profil GitHub
 */

const https = require('https');
const config = require('../config/config');
const cache = require('./cache');

class GitHubStats {
    /**
     * Calcule les lignes de code en fonction de la densité par langage
     * @param {Object} languagesData - Données des langages avec bytes
     * @returns {number} Nombre approximatif de lignes
     */
    static calculateLines(languagesData) {
        let totalLines = 0;
        const density = config.languages.density;

        for (const [language, bytes] of Object.entries(languagesData)) {
            const charsPerLine = density[language] || density.default;
            const lines = Math.round(bytes / charsPerLine);
            totalLines += lines;
        }

        return totalLines;
    }

    /**
     * Récupère les langages utilisés dans un repository
     * @param {string} fullName - Nom complet du repo (owner/repo)
     * @returns {Promise<Object|null>}
     */
    static fetchRepoLanguages(fullName) {
        return new Promise((resolve) => {
            const headers = {
                'User-Agent': 'Portfolio-GithubStats'
            };
            
            if (config.github.token) {
                headers['Authorization'] = `Bearer ${config.github.token}`;
            }

            const options = {
                hostname: 'api.github.com',
                path: `/repos/${fullName}/languages`,
                method: 'GET',
                headers: headers,
                timeout: 5000
            };

            const request = https.request(options, (res) => {
                let data = '';

                if (res.statusCode !== 200) {
                    console.warn(`⚠️  GitHub ${res.statusCode} pour ${fullName}`);
                    resolve(null);
                    return;
                }

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(null);
                    }
                });
            });

            request.on('timeout', () => {
                request.destroy();
                console.warn(`⏱️  Timeout pour ${fullName}`);
                resolve(null);
            });

            request.on('error', (error) => {
                console.warn(`🔗 Erreur pour ${fullName}:`, error.message);
                resolve(null);
            });

            request.end();
        });
    }

    /**
     * Récupère tous les repositories de l'utilisateur
     * @returns {Promise<Array>}
     */
    static fetchUserRepos() {
        return new Promise((resolve, reject) => {
            const headers = {
                'User-Agent': 'Portfolio-GithubStats'
            };
            
            if (config.github.token) {
                headers['Authorization'] = `Bearer ${config.github.token}`;
            }

            const options = {
                hostname: 'api.github.com',
                path: `/users/${config.github.username}/repos?per_page=100&sort=updated`,
                method: 'GET',
                headers: headers,
                timeout: 10000
            };

            const request = https.request(options, (res) => {
                let data = '';

                if (res.statusCode !== 200) {
                    reject(new Error(`GitHub API ${res.statusCode}`));
                    return;
                }

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const repos = JSON.parse(data);
                        if (!Array.isArray(repos)) {
                            throw new Error('Invalid GitHub response format');
                        }
                        resolve(repos);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            request.on('timeout', () => {
                request.destroy();
                reject(new Error('GitHub API timeout'));
            });

            request.on('error', reject);
            request.end();
        });
    }

    /**
     * Calcule les stats complètes (repos, lignes, bytes)
     * @param {Array} repos - Tableau des repositories
     * @returns {Promise<Object>}
     */
    static async calculateStats(repos) {
        const ownRepos = repos.filter(repo => !repo.fork);
        console.log(`📦 Calcul de ${ownRepos.length} repos...`);

        const languagePromises = ownRepos.map(repo =>
            this.fetchRepoLanguages(repo.full_name)
        );

        const languagesResults = await Promise.all(languagePromises);

        let estimatedLines = 0;
        let totalBytes = 0;

        languagesResults.forEach(langs => {
            if (!langs) return;
            const repoBytes = Object.values(langs).reduce((s, b) => s + b, 0);
            totalBytes += repoBytes;
            estimatedLines += this.calculateLines(langs);
        });

        return {
            repos: ownRepos.length,
            estimatedLines,
            totalBytes,
            totalMB: (totalBytes / 1024 / 1024).toFixed(2)
        };
    }

    /**
     * Récupère et met à jour les stats dans le cache
     * @returns {Promise<Object>}
     */
    static async refresh() {
        try {
            console.log('📊 Récupération stats GitHub...');
            const repos = await this.fetchUserRepos();
            const stats = await this.calculateStats(repos);

            const result = {
                ...stats,
                method: 'exact',
                lastUpdate: new Date().toISOString(),
                cacheSource: 'file'
            };

            cache.save(config.cache.files.github, result);
            console.log(`✅ GitHub stats: ${stats.repos} repos, ${stats.estimatedLines.toLocaleString()} lignes (${stats.totalMB} MB)`);
            
            return result;
        } catch (error) {
            console.error('❌ Erreur GitHub stats:', error.message);
            throw error;
        }
    }

    /**
     * Obtient les stats (cache ou API si expiré)
     * @returns {Promise<Object>}
     */
    static async getStats() {
        const cached = cache.load(config.cache.files.github);

        // Vérifier si le cache est toujours valide
        if (cached && cache.isValid(config.cache.files.github)) {
            const remainingHours = Math.round(cache.getTimeRemaining(config.cache.files.github) / 3600000);
            console.log(`📊 GitHub stats (cache - expire dans ${remainingHours}h)`);
            return cached;
        }

        // Sinon, actualiser
        return await this.refresh();
    }
}

module.exports = GitHubStats;
