/**
 * Database Client
 * Handles Supabase (permanent storage) and Firebase Firestore (cache layer)
 * Integrates with existing MangaDex API client
 */

class DatabaseClient {
    constructor() {
        this.supabase = null;
        this.firestore = null;
        this.initialized = false;
    }

    /**
     * Initialize database connections
     */
    async init() {
        if (this.initialized) return;

        try {
            // Initialize Supabase (Core Database)
            if (window.DB_CONFIG?.SUPABASE) {
                const { createClient } = supabase;
                this.supabase = createClient(
                    window.DB_CONFIG.SUPABASE.url,
                    window.DB_CONFIG.SUPABASE.anonKey
                );
                console.log('✅ Supabase initialized');
            }

            // Initialize Firebase Firestore (Cache Layer)
            if (window.DB_CONFIG?.FIREBASE && this.isFirebaseConfigValid(window.DB_CONFIG.FIREBASE)) {
                firebase.initializeApp(window.DB_CONFIG.FIREBASE);
                this.firestore = firebase.firestore();
                console.log('✅ Firestore initialized');
            } else if (window.DB_CONFIG?.FIREBASE) {
                console.warn('⚠️ Firestore config is not valid. Skipping Firestore initialization.');
            }

            this.initialized = true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            // Continue without databases - app should still work with MangaDex API
        }
    }

    isFirebaseConfigValid(config) {
        if (!config || typeof config !== 'object') return false;
        const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        return required.every((key) => {
            const value = config[key];
            return typeof value === 'string' && value.trim() !== '' && !value.includes('YOUR_');
        });
    }

    // ========== SUPABASE METHODS (Permanent Storage) ==========

    /**
     * Save manga to permanent library
     */
    async saveMangaToLibrary(mangaData) {
        if (!this.supabase) return null;

        try {
            const { data, error } = await this.supabase
                .from('manga_library')
                .upsert({
                    id: mangaData.id,
                    title: mangaData.title,
                    description: mangaData.description,
                    tags: mangaData.tags,
                    status: mangaData.status,
                    cover_url: mangaData.coverUrl,
                    mangadex_id: mangaData.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            console.log('💾 Saved manga to library:', mangaData.title);
            return data;
        } catch (error) {
            console.error('Error saving manga to library:', error);
            return null;
        }
    }

    /**
     * Get manga from permanent library
     */
    async getMangaFromLibrary(mangaId) {
        if (!this.supabase) return null;

        try {
            const { data, error } = await this.supabase
                .from('manga_library')
                .select('*')
                .eq('mangadex_id', mangaId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return data;
        } catch (error) {
            console.error('Error getting manga from library:', error);
            return null;
        }
    }

    /**
     * Search manga in permanent library
     */
    async searchMangaInLibrary(query, filters = {}) {
        if (!this.supabase) return [];

        try {
            let queryBuilder = this.supabase
                .from('manga_library')
                .select('*')
                .ilike('title', `%${query}%`);

            // Apply filters
            if (filters.status) {
                queryBuilder = queryBuilder.eq('status', filters.status);
            }

            if (filters.tags && filters.tags.length > 0) {
                queryBuilder = queryBuilder.overlaps('tags', filters.tags);
            }

            const { data, error } = await queryBuilder.limit(50);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching manga in library:', error);
            return [];
        }
    }

    /**
     * Save user bookmark
     */
    async saveBookmark(userId, mangaId, chapterId = null) {
        if (!this.supabase) return null;

        try {
            const { data, error } = await this.supabase
                .from('user_bookmarks')
                .upsert({
                    user_id: userId,
                    manga_id: mangaId,
                    chapter_id: chapterId,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving bookmark:', error);
            return null;
        }
    }

    // ========== FIRESTORE METHODS (Cache Layer) ==========

    /**
     * Save search results to cache
     */
    async cacheSearchResults(query, results, ttlMinutes = 15) {
        if (!this.firestore) return;

        try {
            const cacheDoc = this.firestore.collection('search_cache').doc(query);
            await cacheDoc.set({
                query,
                results,
                timestamp: Date.now(),
                ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
            });

            console.log('⚡ Cached search results for:', query);
        } catch (error) {
            console.error('Error caching search results:', error);
        }
    }

    /**
     * Get cached search results
     */
    async getCachedSearchResults(query) {
        if (!this.firestore) return null;

        try {
            const cacheDoc = await this.firestore.collection('search_cache').doc(query).get();
            if (!cacheDoc.exists) return null;

            const data = cacheDoc.data();
            const now = Date.now();

            // Check if cache is still valid
            if (now - data.timestamp > data.ttl) {
                await this.firestore.collection('search_cache').doc(query).delete();
                return null;
            }

            console.log('⚡ Using cached search results for:', query);
            return data.results;
        } catch (error) {
            console.error('Error getting cached search results:', error);
            return null;
        }
    }

    /**
     * Save recently viewed manga
     */
    async saveRecentlyViewed(mangaData) {
        if (!this.firestore) return;

        try {
            const recentDoc = this.firestore.collection('recently_viewed').doc(mangaData.id);
            await recentDoc.set({
                ...mangaData,
                viewed_at: Date.now()
            });

            console.log('⚡ Saved recently viewed:', mangaData.title);
        } catch (error) {
            console.error('Error saving recently viewed:', error);
        }
    }

    /**
     * Get recently viewed manga
     */
    async getRecentlyViewed(limit = 10) {
        if (!this.firestore) return [];

        try {
            const snapshot = await this.firestore
                .collection('recently_viewed')
                .orderBy('viewed_at', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc) => doc.data());
        } catch (error) {
            console.error('Error getting recently viewed:', error);
            return [];
        }
    }

    /**
     * Cache trending/popular manga
     */
    async cacheTrendingManga(mangaList) {
        if (!this.firestore) return;

        try {
            const trendingDoc = this.firestore.collection('cached_data').doc('trending');
            await trendingDoc.set({
                data: mangaList,
                timestamp: Date.now(),
                ttl: 60 * 60 * 1000 // 1 hour
            });

            console.log('⚡ Cached trending manga');
        } catch (error) {
            console.error('Error caching trending manga:', error);
        }
    }

    /**
     * Get cached trending manga
     */
    async getCachedTrendingManga() {
        if (!this.firestore) return null;

        try {
            const trendingDoc = await this.firestore.collection('cached_data').doc('trending').get();
            if (!trendingDoc.exists) return null;

            const data = trendingDoc.data();
            const now = Date.now();

            if (now - data.timestamp > data.ttl) return null;

            return data.data;
        } catch (error) {
            console.error('Error getting cached trending:', error);
            return null;
        }
    }
}

// Create global instance
window.dbClient = new DatabaseClient();