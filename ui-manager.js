/**
 * UI Manager
 * Handles common UI operations and utilities
 */

class UIManager {
    constructor() {
        this.favorites = this.loadFavorites();
    }

    /**
     * Show loading spinner
     */
    showLoading(containerId = 'loadingSpinner') {
        const spinner = document.getElementById(containerId);
        if (spinner) spinner.style.display = 'flex';
    }

    /**
     * Hide loading spinner
     */
    hideLoading(containerId = 'loadingSpinner') {
        const spinner = document.getElementById(containerId);
        if (spinner) spinner.style.display = 'none';
    }

    /**
     * Navigate to manga detail page
     */
    async navigateToManga(mangaId) {
        // Save to recently viewed if database is available (don't wait for it)
        if (window.dbClient && window.mangaDexClient) {
            try {
                // Don't await - let it happen in background
                window.mangaDexClient.getMangaDetails(mangaId).then(details => {
                    if (details?.data) {
                        const mangaData = window.mangaDexClient.formatMangaForDB(details.data);
                        return window.dbClient.saveRecentlyViewed(mangaData);
                    }
                }).catch(error => {
                    console.error('Error saving recently viewed:', error);
                });
            } catch (error) {
                console.error('Error saving recently viewed:', error);
            }
        }

        // Navigate immediately
        window.location.href = `manga-detail.html?id=${mangaId}`;
    }

    /**
     * Navigate to reader
     */
    navigateToReader(chapterId, mangaId, chapterNumber) {
        window.location.href = `reader.html?chapter=${chapterId}&manga=${mangaId}&number=${chapterNumber}`;
    }

    /**
     * Get query parameter from URL
     */
    getQueryParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Get notification color by type
     */
    getNotificationColor(type) {
        const colors = {
            success: '#51cf66',
            error: '#ff6b6b',
            warning: '#ffd93d',
            info: '#4c6ef5',
        };
        return colors[type] || colors.info;
    }

    /**
     * Format date to readable format
     */
    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    /**
     * Truncate text
     */
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Capitalize first letter of a string
     */
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Fallback cover image handler
     */
    fallbackCoverImage(img) {
        if (!img.dataset.fallbacked && img.dataset.mangaId && img.dataset.fileName) {
            img.dataset.fallbacked = 'true';
            img.onerror = null;
            const retryUseProxy = IS_GITHUB_PAGES;
            img.src = mangaDexClient.getCoverUrl(img.dataset.mangaId, img.dataset.fileName, img.dataset.size || 'medium', retryUseProxy);
            img.onerror = () => {
                img.onerror = null;
                img.src = 'https://via.placeholder.com/180x250?text=No+Cover';
            };
            return;
        }

        console.debug('fallbackCoverImage: unable to retry cover image, falling back to placeholder', {
            fallbacked: img.dataset.fallbacked,
            mangaId: img.dataset.mangaId,
            fileName: img.dataset.fileName,
            size: img.dataset.size,
        });

        img.onerror = null;
        img.src = 'https://via.placeholder.com/180x250?text=No+Cover';
    }

    fallbackImage(img) {
        if (!img.dataset.fallbacked && img.dataset.pageUrl) {
            img.dataset.fallbacked = 'true';
            img.src = `${IMAGE_PROXY}${encodeURIComponent(img.dataset.pageUrl)}`;
            return;
        }

        this.fallbackCoverImage(img);
    }

    /**
     * Format chapter title
     */
    formatChapterTitle(chapter, mangaTitle) {
        const chapterNum = chapter.attributes?.chapter || 'Extra';
        const title = chapter.attributes?.title;
        const titlePart = title ? ` - ${title}` : '';
        return `Chapter ${chapterNum}${titlePart}`;
    }

    /**
     * Create manga card HTML
     */
    createMangaCard(manga) {
        const id = manga.id;
        const attributes = manga.attributes;
        const title = this.getMangaTitle(attributes);
        const description = attributes?.description?.en || 'No description available';
        const status = attributes?.status || 'unknown';
        const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
        const rating = attributes?.contentRating || 'safe';

        // Get cover image
        const coverInfo = this.getCoverInfoFromManga(manga);
        const coverUrl = coverInfo
            ? mangaDexClient.getCoverUrl(coverInfo.mangaId, coverInfo.fileName, 'medium')
            : this.getPlaceholderCover();

        return `
            <div class="manga-card" data-manga-id="${id}">
                <img
                    src="${coverUrl}"
                    alt="${title}"
                    class="manga-card-cover"
                    loading="lazy"
                    data-manga-id="${coverInfo?.mangaId || ''}"
                    data-file-name="${coverInfo?.fileName || ''}"
                    data-size="medium"
                    onerror="uiManager.fallbackCoverImage(this)"
                >
                <div class="manga-card-info">
                    <h3 class="manga-card-title">${title}</h3>
                    <span class="manga-card-status">${statusLabel}</span>
                    <p class="manga-card-description">${this.truncateText(description, 80)}</p>
                    <div class="manga-card-rating">⭐ Rating pending</div>
                </div>
            </div>
        `;
    }

    /**
     * Get cover metadata from the manga object
     */
    getCoverInfoFromManga(manga) {
        return mangaDexClient.getCoverInfo(manga);
    }

    /**
     * Return a safe placeholder URL when no cover is available
     */
    getPlaceholderCover() {
        return 'https://via.placeholder.com/180x250?text=No+Cover';
    }

    /**
     * Extract manga title from attributes, checking multiple languages
     */
    getMangaTitle(attributes) {
        return (
            attributes?.title?.en ||
            attributes?.title?.['ja-ro'] ||
            attributes?.title?.ja ||
            attributes?.title?.['en_us'] ||
            Object.values(attributes?.title || {})[0] ||
            'Unknown Title'
        );
    }

    /**
     * Create chapter item HTML
     */
    createChapterItem(chapter) {
        const chapterId = chapter.id;
        const attributes = chapter.attributes;
        const chapterNum = attributes?.chapter || 'Extra';
        const title = attributes?.title || `Chapter ${chapterNum}`;
        const publishDate = this.formatDate(attributes?.publishAt);

        return `
            <li class="chapter-item">
                <a href="reader.html?chapter=${chapterId}">
                    <span class="chapter-item-title">Chapter ${chapterNum}: ${title}</span>
                    <span class="chapter-item-date">${publishDate}</span>
                </a>
            </li>
        `;
    }

    /**
     * Add to favorites
     */
    addToFavorites(mangaId, mangaTitle) {
        if (!this.favorites[mangaId]) {
            this.favorites[mangaId] = {
                id: mangaId,
                title: mangaTitle,
                addedDate: new Date().toISOString(),
            };
            this.saveFavorites();
            this.showNotification(`Added "${mangaTitle}" to favorites`, 'success');
            return true;
        }
        return false;
    }

    /**
     * Remove from favorites
     */
    removeFromFavorites(mangaId, mangaTitle) {
        if (this.favorites[mangaId]) {
            delete this.favorites[mangaId];
            this.saveFavorites();
            this.showNotification(`Removed "${mangaTitle}" from favorites`, 'info');
            return true;
        }
        return false;
    }

    /**
     * Check if manga is favorite
     */
    isFavorite(mangaId) {
        return !!this.favorites[mangaId];
    }

    /**
     * Get all favorites
     */
    getFavorites() {
        return Object.values(this.favorites);
    }

    getBookmarks() {
        return this.getFavorites();
    }

    getRecentHistory(limit = 5) {
        return this.getReadingHistory().slice(0, limit);
    }

    getContinueReading() {
        return this.getReadingHistory().slice(0, 3);
    }

    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        localStorage.setItem('mangarigx_favorites', JSON.stringify(this.favorites));
    }

    /**
     * Load favorites from localStorage
     */
    loadFavorites() {
        const stored = localStorage.getItem('mangarigx_favorites');
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Add style element for animations
     */
    addGlobalStyles() {
        if (document.getElementById('mangarigx-animations')) return;

        const style = document.createElement('style');
        style.id = 'mangarigx-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Build query string
     */
    buildQueryString(params) {
        return new URLSearchParams(params).toString();
    }

    /**
     * Get user preference from localStorage
     */
    getPreference(key, defaultValue) {
        const stored = localStorage.getItem(`mangarigx_pref_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    }

    /**
     * Set user preference to localStorage
     */
    setPreference(key, value) {
        localStorage.setItem(`mangarigx_pref_${key}`, JSON.stringify(value));
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Check if device is tablet
     */
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    /**
     * Check if device is desktop
     */
    isDesktop() {
        return window.innerWidth > 1024;
    }

    /**
     * Get reading history
     */
    getReadingHistory() {
        const stored = localStorage.getItem('mangarigx_history');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Add to reading history
     */
    addToHistory(chapterId, mangaId, mangaTitle, chapterNumber, timestamp = null) {
        let history = this.getReadingHistory();

        // Remove if already exists
        history = history.filter((h) => h.chapterId !== chapterId);

        // Add new entry
        history.unshift({
            chapterId,
            mangaId,
            mangaTitle,
            chapterNumber,
            timestamp: timestamp || new Date().toISOString(),
        });

        // Keep only last 50
        history = history.slice(0, 50);

        localStorage.setItem('mangarigx_history', JSON.stringify(history));
    }

    /**
     * Get API cache statistics
     */
    getCacheInfo() {
        return mangaDexClient.getCacheStats();
    }

    /**
     * Display cache statistics as notification
     */
    showCacheStats() {
        const stats = this.getCacheInfo();
        const message = `Cache: ${stats.hits} hits, ${stats.misses} misses (${stats.hitRate} hit rate) | Size: ${stats.cacheSize} entries`;
        this.showNotification(message, 'info', 5000);
    }

    /**
     * Clear API cache
     */
    clearApiCache(cacheType = null) {
        mangaDexClient.clearCache(cacheType);
        const typeInfo = cacheType ? ` (${cacheType})` : '';
        this.showNotification(`Cache cleared${typeInfo}`, 'success');
    }

    /**
     * Reset cache statistics
     */
    resetCacheStats() {
        mangaDexClient.resetCacheStats();
        this.showNotification('Cache statistics reset', 'info');
    }
}

// Create singleton instance
window.uiManager = new UIManager();
window.uiManager.addGlobalStyles();
