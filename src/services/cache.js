/**
 * Service de gestion du cache fichier
 * Stockage persistant pour les stats GitHub
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class CacheManager {
    constructor() {
        this.cacheDir = path.join(__dirname, '..', '..', config.cache.dir);
        this.ensureCacheDir();
    }

    /**
     * Crée le dossier cache s'il n'existe pas
     */
    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Obtient le chemin complet d'un fichier de cache
     */
    getPath(filename) {
        return path.join(this.cacheDir, filename);
    }

    /**
     * Charge les données du cache depuis le fichier
     */
    load(filename) {
        try {
            const filePath = this.getPath(filename);
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn(`⚠️  Erreur lecture cache ${filename}:`, error.message);
        }
        return null;
    }

    /**
     * Sauvegarde les données dans le cache
     */
    save(filename, data) {
        try {
            const filePath = this.getPath(filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`💾 Cache ${filename} sauvegardé`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur écriture cache ${filename}:`, error.message);
            return false;
        }
    }

    /**
     * Vérifie si le cache est valide (non expiré)
     * @param {string} filename - Nom du fichier de cache
     * @param {number} ttl - Time To Live en millisecondes (défaut: 24h)
     */
    isValid(filename, ttl = config.cache.ttl) {
        try {
            const filePath = this.getPath(filename);
            if (!fs.existsSync(filePath)) return false;

            const stats = fs.statSync(filePath);
            const age = Date.now() - stats.mtimeMs;
            return age < ttl;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtient le temps restant avant expiration en millisecondes
     */
    getTimeRemaining(filename, ttl = config.cache.ttl) {
        try {
            const filePath = this.getPath(filename);
            if (!fs.existsSync(filePath)) return 0;

            const stats = fs.statSync(filePath);
            const age = Date.now() - stats.mtimeMs;
            const remaining = ttl - age;
            return remaining > 0 ? remaining : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Supprime un fichier de cache spécifique
     */
    clear(filename) {
        try {
            const filePath = this.getPath(filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Cache ${filename} supprimé`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Erreur suppression cache ${filename}:`, error.message);
        }
        return false;
    }

    /**
     * Supprime tous les fichiers de cache
     */
    clearAll() {
        try {
            if (fs.existsSync(this.cacheDir)) {
                const files = fs.readdirSync(this.cacheDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.cacheDir, file));
                });
                console.log(`🗑️  Tous les caches supprimés`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Erreur suppression caches:`, error.message);
        }
        return false;
    }
}

module.exports = new CacheManager();
