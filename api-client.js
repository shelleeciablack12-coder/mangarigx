/**
 * MangaDex API Client
 * Handles all API calls to MangaDex for manga data, chapters, and images
 */

const API_BASE = 'https://api.mangadex.org';
const MANGADEX_COVERS_BASE = 'https://uploads.mangadex.org/covers';
const USE_CORS_PROXY = true; // Re-enabled for localhost CORS issues
const CORS_PROXY = 'https://corsproxy.io/?';
// Detect if running on GitHub Pages and use the browser-safe Codetabs image proxy
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');
const USE_IMAGE_PROXY = IS_GITHUB_PAGES;
const IMAGE_PROXY = IS_GITHUB_PAGES ? 'https://api.codetabs.com/v1/proxy/?quest=' : 'http://localhost:3001/images';

class MangaDexClient {
    constructor() {
        this.cache = new Map();
        this.cacheStats = { hits: 0, misses: 0, stored: 0 };
        this.dbClient = null;
        
        // Different cache timeouts for different data types
        this.cacheTtl = {
            mangaList: 1000 * 60 * 60,      // 60 minutes - less frequently updated
            mangaDetails: 1000 * 60 * 60,   // 60 minutes
            chapters: 1000 * 60 * 30,       // 30 minutes - chapters update more often
            chapterPages: 1000 * 60 * 60 * 24, // 24 hours - page data doesn't change
            chapterData: 1000 * 60 * 30,    // 30 minutes
            search: 1000 * 60 * 15,         // 15 minutes - search results are less important
            tags: 1000 * 60 * 60 * 24,      // 24 hours - tags don't change often
            default: 1000 * 60 * 30,        // 30 minutes default
        };

        // Initialize database client when available
        this.initDatabase();
    }

    async initDatabase() {
        if (this.dbClient) return;
        if (window.dbClient) {
            this.dbClient = window.dbClient;
            await this.dbClient.init();
        }
    }

    buildUrl(endpoint) {
        const target = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        return USE_CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(target)}` : target;
    }

    /**
     * Generate cache key from endpoint and options
     */
    generateCacheKey(endpoint, options = {}, cacheType = 'default') {
        return `${cacheType}:${endpoint}:${JSON.stringify(options || {})}`;
    }

    /**
     * Get appropriate cache TTL for data type
     */
    getCacheTtl(cacheType = 'default') {
        return this.cacheTtl[cacheType] || this.cacheTtl.default;
    }

    /**
     * Check cache and return data if valid
     */
    getFromCache(cacheKey, ttl) {
        if (!this.cache.has(cacheKey)) {
            this.cacheStats.misses++;
            return null;
        }

        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.time < ttl) {
            this.cacheStats.hits++;
            return cached.data;
        }

        // Cache expired, remove it
        this.cache.delete(cacheKey);
        this.cacheStats.misses++;
        return null;
    }

    /**
     * Store data in cache
     */
    setInCache(cacheKey, data) {
        this.cache.set(cacheKey, {
            data,
            time: Date.now(),
        });
        this.cacheStats.stored++;
    }

    /**
     * Generic fetch method with intelligent caching
     */
    async fetch(endpoint, options = {}, cacheType = 'default') {
        const cacheKey = this.generateCacheKey(endpoint, options, cacheType);
        const ttl = this.getCacheTtl(cacheType);

        // Check cache
        const cached = this.getFromCache(cacheKey, ttl);
        if (cached !== null) {
            return cached;
        }

        try {
            const url = this.buildUrl(endpoint);
            const headers = { ...options.headers };
            if (options.body != null) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(url, {
                ...options,
                headers: Object.keys(headers).length ? headers : undefined,
            });

            const responseText = await response.text();
            const contentType = response.headers.get('content-type') || '';

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${responseText.slice(0, 250)}`);
            }

            let data;
            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch (parseError) {
                throw new Error(`Invalid JSON response for ${url}: ${parseError.message}\nResponse text: ${responseText.slice(0, 250)}`);
            }

            // Cache the result
            this.setInCache(cacheKey, data);

            return data;
        } catch (error) {
            console.error(`Fetch error for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Get manga list with filters
     */
    async getMangaList(page = 0, limit = 24, filters = {}) {
        const params = new URLSearchParams();
        params.append('limit', Math.min(limit, 100));
        params.append('offset', page * limit);
        params.append('order[latestUploadedChapter]', 'desc');
        params.append('includes[]', 'cover_art');
        params.append('contentRating[]', 'safe');
        params.append('contentRating[]', 'suggestive');
        params.append('contentRating[]', 'erotica');
        
        // Handle special filters
        const { genre, ...otherFilters } = filters;
        
        // Handle genre filter
        if (genre) {
            params.append('includedTags[]', genre);
        }
        
        // Add any other additional filters
        for (const [key, value] of Object.entries(otherFilters)) {
            if (value) params.append(key, value);
        }

        return this.fetch(`/manga?${params}`, {}, 'mangaList');
    }

    /**
     * Search manga by title
     */
    async searchManga(title, limit = 12) {
        await this.initDatabase();

        // First, try to get from database cache
        if (this.dbClient) {
            const cachedResults = await this.dbClient.getCachedSearchResults(title);
            if (cachedResults) {
                console.log('🔍 Using cached search results for:', title);
                return cachedResults;
            }

            // Check if we have matching manga in permanent library
            const libraryResults = await this.dbClient.searchMangaInLibrary(title);
            if (libraryResults.length > 0) {
                console.log('📚 Found manga in library for:', title);
                // Convert library format to MangaDex format for compatibility
                const formattedResults = libraryResults.map(manga => ({
                    id: manga.mangadex_id,
                    type: 'manga',
                    attributes: {
                        title: { en: manga.title },
                        description: { en: manga.description },
                        status: manga.status,
                        tags: manga.tags || []
                    },
                    relationships: [],
                    coverUrl: manga.cover_url
                }));
                return { data: formattedResults };
            }
        }

        // Fallback to MangaDex API
        const params = new URLSearchParams();
        params.append('title', title);
        params.append('limit', limit);
        params.append('offset', 0);
        params.append('order[relevance]', 'desc');
        params.append('includes[]', 'cover_art');
        params.append('contentRating[]', 'safe');
        params.append('contentRating[]', 'suggestive');
        params.append('contentRating[]', 'erotica');

        const result = await this.fetch(`/manga?${params}`, {}, 'search');

        // Save to databases if available
        if (this.dbClient && result?.data) {
            // Cache search results in Firestore
            await this.dbClient.cacheSearchResults(title, result);

            // Save individual manga to Supabase library
            for (const manga of result.data) {
                const mangaData = this.formatMangaForDB(manga);
                await this.dbClient.saveMangaToLibrary(mangaData);
            }
        }

        return result;
    }

    /**
     * Format MangaDex manga data for database storage
     */
    formatMangaForDB(manga) {
        const attributes = manga.attributes || {};
        const relationships = manga.relationships || [];

        // Get cover URL
        let coverUrl = null;
        const coverRel = relationships.find(rel => rel.type === 'cover_art');
        if (coverRel && coverRel.attributes?.fileName) {
            coverUrl = `${MANGADEX_COVERS_BASE}/${manga.id}/${coverRel.attributes.fileName}`;
        }

        return {
            id: manga.id,
            title: attributes.title?.en || attributes.title?.ja || 'Unknown Title',
            description: attributes.description?.en || attributes.description?.ja || '',
            tags: attributes.tags?.map(tag => tag.attributes?.name?.en).filter(Boolean) || [],
            status: attributes.status || 'unknown',
            coverUrl
        };
    }

    /**
     * Get detailed manga information
     */
    async getMangaDetails(mangaId) {
        await this.initDatabase();

        // First, try to get from database
        if (this.dbClient) {
            const libraryManga = await this.dbClient.getMangaFromLibrary(mangaId);
            if (libraryManga) {
                console.log('📚 Using manga from library:', libraryManga.title);
                // Convert back to MangaDex format for compatibility
                return {
                    data: {
                        id: libraryManga.mangadex_id,
                        type: 'manga',
                        attributes: {
                            title: { en: libraryManga.title },
                            description: { en: libraryManga.description },
                            status: libraryManga.status,
                            tags: libraryManga.tags?.map(tag => ({ attributes: { name: { en: tag } } })) || []
                        },
                        relationships: [],
                        coverUrl: libraryManga.cover_url
                    }
                };
            }
        }

        // Fallback to MangaDex API
        const params = new URLSearchParams();
        params.append('includes[]', 'author');
        params.append('includes[]', 'artist');
        params.append('includes[]', 'cover_art');
        const result = await this.fetch(`/manga/${mangaId}?${params}`, {}, 'mangaDetails');

        // Save to database if available
        if (this.dbClient && result?.data) {
            const mangaData = this.formatMangaForDB(result.data);
            await this.dbClient.saveMangaToLibrary(mangaData);
        }

        return result;
    }

    /**
     * Get chapters for a manga
     */
    async getChapters(mangaId, limit = 100, offset = 0, translatedLanguage = 'en') {
        const params = new URLSearchParams();
        params.append('manga', mangaId);
        params.append('limit', Math.min(limit, 100));
        params.append('offset', offset);
        params.append('translatedLanguage[]', translatedLanguage);
        params.append('order[chapter]', 'desc');
        params.append('order[publishAt]', 'desc');
        params.append('includes[]', 'scanlation_group');
        params.append('includes[]', 'user');

        return this.fetch(`/chapter?${params}`, {}, 'chapters');
    }

    /**
     * Get a single chapter with pages
     */
    async getChapter(chapterId) {
        const params = new URLSearchParams();
        params.append('includes[]', 'manga');
        params.append('includes[]', 'scanlation_group');
        return this.fetch(`/chapter/${chapterId}?${params}`, {}, 'chapterData');
    }

    /**
     * Get chapter pages (at-home server)
     */
    async getChapterPages(chapterId) {
        return this.fetch(`/at-home/server/${chapterId}`, {}, 'chapterPages');
    }

    /**
     * Extract cover metadata from manga relationships
     */
    getCoverInfo(manga) {
        if (!manga || !manga.relationships) {
            console.debug('getCoverInfo: missing manga or relationships', { mangaId: manga?.id, manga });
            return null;
        }

        const coverRel = manga.relationships.find((relationship) => relationship.type === 'cover_art');
        if (!coverRel) {
            console.debug('getCoverInfo: cover_art relationship not found', {
                mangaId: manga.id,
                relationshipTypes: manga.relationships.map((relationship) => relationship.type),
            });
        }

        const fileName = coverRel?.attributes?.fileName || coverRel?.fileName;
        const mangaId = manga.id || this.getMangaIdFromRelationships(manga.relationships);

        if (!fileName || !mangaId) {
            console.warn('getCoverInfo: missing cover data', { mangaId, fileName, coverRel });
            return null;
        }

        return {
            mangaId,
            fileName,
        };
    }

    /**
     * Build image URL for a manga cover
     * @param {string} mangaId - The manga ID
     * @param {string} fileName - The cover file name
     * @param {string} size - Size variant: 'small', 'medium', 'large'
     * @param {boolean} useProxy - Whether to use image proxy
     * @returns {string} The cover image URL
     */
    getCoverUrl(mangaId, fileName, size = 'medium', useProxy = USE_IMAGE_PROXY) {
        // Validate inputs
        if (!mangaId || !fileName) {
            console.warn('getCoverUrl: Missing mangaId or fileName');
            return '';
        }

        // Clean and validate fileName
        const cleanFileName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        if (!cleanFileName) {
            console.warn('getCoverUrl: Invalid fileName after cleaning');
            return '';
        }

        // Use the cover image filename directly. MangaDex uploads do not reliably support custom size suffixes.
        const finalFileName = fileName;

        // Build the URL
        const imageUrl = `${MANGADEX_COVERS_BASE}/${encodeURIComponent(mangaId)}/${encodeURIComponent(finalFileName)}`;

        // Apply proxy if requested
        if (useProxy) {
            return `${IMAGE_PROXY}${encodeURIComponent(imageUrl)}`;
        }

        return imageUrl;
    }

    /**
     * Build image URL for a chapter page
     */
    getPageUrl(serverUrl, hash, fileName, useProxy = USE_IMAGE_PROXY) {
        if (!serverUrl || !hash || !fileName) return '';

        const cleanFileName = encodeURIComponent(fileName);
        const rawUrl = `${serverUrl.replace(/\/$/, '')}/data/${hash}/${cleanFileName}`;

        return useProxy ? `${IMAGE_PROXY}${encodeURIComponent(rawUrl)}` : rawUrl;
    }

    /**
     * Get author/artist information
     */
    async getAuthorInfo(authorId) {
        return this.fetch(`/author/${authorId}`, {}, 'default');
    }

    /**
     * Get manga statistics (ratings, views, etc)
     */
    async getMangaStatistics(mangaIds) {
        if (Array.isArray(mangaIds)) {
            mangaIds = mangaIds.join(',');
        }
        return this.fetch(`/statistics/manga?manga[]=${mangaIds}`, {}, 'default');
    }

    /**
     * Get manga by tag
     */
    async getMangaByTag(tagId, limit = 24, offset = 0) {
        const params = new URLSearchParams();
        params.append('includedTags[]', tagId);
        params.append('limit', limit);
        params.append('offset', offset);
        params.append('order[latestUploadedChapter]', 'desc');
        params.append('includes[]', 'cover_art');
        params.append('contentRating[]', 'safe');
        params.append('contentRating[]', 'suggestive');
        params.append('contentRating[]', 'erotica');

        return this.fetch(`/manga?${params}`, {}, 'mangaList');
    }

    /**
     * Get all available tags
     */
    async getTags() {
        return this.fetch('/manga/tag', {}, 'tags');
    }

    /**
     * Clear cache entirely or by type
     */
    clearCache(cacheType = null) {
        if (cacheType === null) {
            this.cache.clear();
            this.cacheStats = { hits: 0, misses: 0, stored: 0 };
        } else {
            // Remove entries matching cache type
            for (const [key] of this.cache.entries()) {
                if (key.startsWith(`${cacheType}:`)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Get cache statistics for debugging/monitoring
     */
    getCacheStats() {
        const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
            ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
            : 'N/A';
        return {
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            hitRate: `${hitRate}%`,
            stored: this.cacheStats.stored,
            cacheSize: this.cache.size,
        };
    }

    /**
     * Reset cache statistics
     */
    resetCacheStats() {
        this.cacheStats = { hits: 0, misses: 0, stored: 0 };
    }

    /**
     * Extract manga ID from relationships
     */
    getMangaIdFromRelationships(relationships) {
        const mangaRel = relationships?.find((r) => r.type === 'manga');
        return mangaRel?.id;
    }

    /**
     * Extract cover art from relationships
     */
    getCoverIdFromRelationships(relationships) {
        const coverRel = relationships?.find((r) => r.type === 'cover_art');
        return coverRel?.id;
    }

    /**
     * Extract author from attributes
     */
    getAuthorFromAttributes(attributes) {
        return attributes?.author || 'Unknown';
    }

    /**
     * Extract artist from attributes
     */
    getArtistFromAttributes(attributes) {
        return attributes?.artist || 'Unknown';
    }
}

// Create singleton instance
const mangaDexClient = new MangaDexClient();

// Expose for browser and Node compatibility
if (typeof window !== 'undefined') {
    window.mangaDexClient = mangaDexClient;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MangaDexClient,
        mangaDexClient,
    };
}
