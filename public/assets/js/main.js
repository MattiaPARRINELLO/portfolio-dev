/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PORTFOLIO MATTIA PARRINELLO - JAVASCRIPT PRINCIPAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier gère toutes les interactions et animations du portfolio.
 * Code structuré en modules pour faciliter la maintenance.
 * 
 * Fonctionnalités :
 * 1. Navigation (scroll, menu mobile, effet blur)
 * 2. Animations au scroll (Intersection Observer)
 * 3. Smooth scroll pour les ancres
 * 4. Effets visuels (parallax léger, cursor custom optionnel)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// GITHUB STATS
// Récupère et affiche les stats depuis l'API GitHub
// ═══════════════════════════════════════════════════════════════════════════

const GitHubStats = {
    init() {
        this.fetchStats();
    },

    async fetchStats() {
        try {
            const response = await fetch('/api/github-stats');
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 GitHub stats:', data);

            if (data.error) {
                console.warn('GitHub API error:', data.error);
                this.setDefaultValues();
                return;
            }

            if (data.estimatedLines > 0) {
                this.animateValue('github-lines', data.estimatedLines, '+');
            } else {
                document.getElementById('github-lines').textContent = '-';
            }

            if (data.repos > 0) {
                this.animateValue('github-repos', data.repos);
            } else {
                document.getElementById('github-repos').textContent = '-';
            }
        } catch (error) {
            console.error('❌ Erreur GitHub stats:', error);
            this.setDefaultValues();
        }
    },

    setDefaultValues() {
        const linesEl = document.getElementById('github-lines');
        const reposEl = document.getElementById('github-repos');
        if (linesEl) linesEl.textContent = '-';
        if (reposEl) reposEl.textContent = '-';
    },

    animateValue(elementId, target, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element #${elementId} not found`);
            return;
        }

        const duration = 2000;
        const startTime = performance.now();

        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(easeOut * target);

            // Formater le nombre avec des séparateurs
            const formatted = new Intl.NumberFormat('fr-FR').format(current);
            element.textContent = formatted + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateValue);
            } else {
                const finalFormatted = new Intl.NumberFormat('fr-FR').format(target);
                element.textContent = finalFormatted + suffix;
            }
        };

        requestAnimationFrame(updateValue);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION
// Gère la navbar, le menu mobile et les effets au scroll
// ═══════════════════════════════════════════════════════════════════════════

const Navigation = {
    navbar: null,
    mobileMenuBtn: null,
    mobileMenu: null,
    isMenuOpen: false,

    init() {
        this.navbar = document.getElementById('navbar');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');

        if (!this.navbar) return;

        // Scroll effect
        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

        // Mobile menu
        if (this.mobileMenuBtn && this.mobileMenu) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());

            const mobileLinks = this.mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMobileMenu());
            });
        }

        // Active links
        this.setupActiveLinks();
    },

    handleScroll() {
        const scrollY = window.scrollY;
        const threshold = 50;

        if (scrollY > threshold) {
            this.navbar.classList.add('nav-scrolled');
        } else {
            this.navbar.classList.remove('nav-scrolled');
        }
    },

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        if (this.isMenuOpen) {
            this.mobileMenu.classList.add('active');
            this.mobileMenuBtn.classList.add('menu-open');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMobileMenu();
        }
    },

    closeMobileMenu() {
        this.isMenuOpen = false;
        this.mobileMenu.classList.remove('active');
        this.mobileMenuBtn.classList.remove('menu-open');
        document.body.style.overflow = '';
    },

    setupActiveLinks() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS
// Utilise Intersection Observer pour les animations
// ═══════════════════════════════════════════════════════════════════════════

const ScrollAnimations = {
    init() {
        const animatedElements = document.querySelectorAll('.scroll-animate');

        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;

                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach((el, index) => {
            el.dataset.delay = index * 100;
            observer.observe(el);
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SMOOTH SCROLL
// Scroll fluide vers les ancres
// ═══════════════════════════════════════════════════════════════════════════

const SmoothScroll = {
    init() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                if (href === '#' || href === '') return;

                const target = document.querySelector(href);

                if (target) {
                    e.preventDefault();

                    const navbarHeight = Navigation.navbar ? Navigation.navbar.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// INITILIZATION
// Point d'entrée principal
// ═══════════════════════════════════════════════════════════════════════════

function initializeApp() {
    console.log('🚀 Portfolio Mattia Parrinello - Initialisation...');

    // Navigation
    Navigation.init();
    console.log('✅ Navigation initialisée');

    // Animations au scroll
    ScrollAnimations.init();
    console.log('✅ Animations au scroll initialisées');

    // Smooth scroll
    SmoothScroll.init();
    console.log('✅ Smooth scroll initialisé');

    // GitHub stats
    GitHubStats.init();
    console.log('✅ Stats GitHub chargées');

    console.log('🎉 Portfolio prêt !');
}

// DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Resize handling
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && Navigation.isMenuOpen) {
        Navigation.closeMobileMenu();
    }
}, { passive: true });
