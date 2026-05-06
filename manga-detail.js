/**
 * MangaRigX - Manga Detail Page
 * Display manga information, chapters, and related data
 */

class MangaDetailPage {
    constructor() {
        this.mangaId = uiManager.getQueryParam('id');
        this.currentManga = null;
        this.chapters = [];
        this.filteredChapters = [];
        this.init();
    }

    async init() {
        if (!this.mangaId) {
            uiManager.showNotification('Invalid manga ID', 'error');
            window.location.href = '/';
            return;
        }

        this.setupEventListeners();
        await this.loadMangaDetails();
        await this.loadChapters();
    }

    setupEventListeners() {
        // Favorite button
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        // Chapter search
        const chapterSearch = document.getElementById('chapterSearch');
        if (chapterSearch) {
            chapterSearch.addEventListener(
                'input',
                uiManager.debounce(() => this.filterChapters(), 300)
            );
        }

        // Chapter sort
        const chapterSort = document.getElementById('chapterSort');
        if (chapterSort) {
            chapterSort.addEventListener('change', () => this.sortChapters());
        }

        // Back button behavior
        const backBtn = document.getElementById('detailBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/';
                }
            });
        }
    }

    async loadMangaDetails() {
        try {
            uiManager.showLoading();
            const response = await mangaDexClient.getMangaDetails(this.mangaId);
            this.currentManga = response.data;
            this.displayMangaDetails();
            uiManager.hideLoading();
        } catch (error) {
            console.error('Failed to load manga details:', error);
            uiManager.showNotification('Failed to load manga details', 'error');
            uiManager.hideLoading();
        }
    }

    displayMangaDetails() {
        if (!this.currentManga) return;

        const attributes = this.currentManga.attributes;
        const title = uiManager.getMangaTitle(attributes);
        const description = attributes?.description?.en || 'No description available';
        const status = attributes?.status || 'unknown';
        const year = attributes?.year || 'Unknown';

        // Title
        const titleEl = document.getElementById('mangaTitle');
        if (titleEl) titleEl.textContent = title;

        // Cover
        const coverInfo = uiManager.getCoverInfoFromManga(this.currentManga);
        const coverUrl = coverInfo
            ? mangaDexClient.getCoverUrl(this.currentManga.id, coverInfo.fileName, 'large')
            : 'https://via.placeholder.com/250x350?text=No+Cover';

        const coverEl = document.getElementById('mangaCover');
        if (coverEl) {
            coverEl.src = coverUrl;
            coverEl.alt = title;
            coverEl.dataset.mangaId = this.currentManga.id;
            coverEl.dataset.fileName = coverInfo?.fileName || '';
            coverEl.dataset.size = 'large';
            coverEl.onerror = () => {
                uiManager.fallbackCoverImage(coverEl);
            };
        }

        // Status
        const statusEl = document.getElementById('mangaStatus');
        if (statusEl) {
            const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
            statusEl.textContent = statusLabel;
            statusEl.className = `status-badge status-${status}`;
        }

        // Year
        const yearEl = document.getElementById('mangaYear');
        if (yearEl) yearEl.textContent = year;

        // Author & Artist (from relationships)
        this.loadAuthorAndArtist();

        // Synopsis
        const synopsisEl = document.getElementById('mangaSynopsis');
        if (synopsisEl) synopsisEl.textContent = description;

        // Genres/Tags
        this.displayGenres();

        // Update favorite button
        this.updateFavoriteButton();
    }

    async loadAuthorAndArtist() {
        try {
            // Get author and artist from relationships
            const relationships = this.currentManga.relationships || [];

            // Find author relationship
            const authorRel = relationships.find((r) => r.type === 'author');
            const authorEl = document.getElementById('mangaAuthor');
            if (authorEl && authorRel) {
                authorEl.textContent = authorRel.attributes?.name || 'Unknown Author';
            } else if (authorEl) {
                authorEl.textContent = 'Unknown Author';
            }

            // Find artist relationship
            const artistRel = relationships.find((r) => r.type === 'artist');
            const artistEl = document.getElementById('mangaArtist');
            if (artistEl && artistRel) {
                artistEl.textContent = artistRel.attributes?.name || 'Unknown Artist';
            } else if (artistEl) {
                artistEl.textContent = 'Unknown Artist';
            }
        } catch (error) {
            console.error('Error loading author/artist:', error);
        }
    }

    displayGenres() {
        const tagsContainer = document.getElementById('genresTags');
        if (!tagsContainer || !this.currentManga.attributes?.tags) return;

        const tags = this.currentManga.attributes.tags || [];
        const tagHTML = tags
            .slice(0, 10) // Limit to 10 tags
            .map((tag) => {
                const tagName = tag.attributes?.name?.en || tag.id;
                return `<span class="genre-tag">${tagName}</span>`;
            })
            .join('');

        tagsContainer.innerHTML = tagHTML;
    }

    async loadChapters() {
        try {
            uiManager.showLoading('chaptersLoading');

            const limit = 100;
            let offset = 0;
            let allChapters = [];
            let response = null;

            do {
                response = await mangaDexClient.getChapters(this.mangaId, limit, offset);
                const batch = response.data || [];
                allChapters = allChapters.concat(batch);
                offset += batch.length;
            } while (response.data && response.data.length === limit);

            this.chapters = allChapters;
            this.filteredChapters = [...this.chapters];
            this.displayChapters();
            uiManager.hideLoading('chaptersLoading');
        } catch (error) {
            console.error('Failed to load chapters:', error);
            uiManager.showNotification('Failed to load chapters', 'error');
            uiManager.hideLoading('chaptersLoading');
        }
    }

    displayChapters() {
        const chaptersList = document.getElementById('chaptersList');
        if (!chaptersList) return;

        if (this.filteredChapters.length === 0) {
            chaptersList.innerHTML =
                '<li style="padding: 1rem; text-align: center; color: var(--text-muted);">No chapters available</li>';
            return;
        }

        const html = this.filteredChapters.map((chapter) => {
            const chapterId = chapter.id;
            const attributes = chapter.attributes;
            const chapterNum = attributes?.chapter || 'Extra';
            const title = attributes?.title || `Chapter ${chapterNum}`;
            const publishDate = uiManager.formatDate(attributes?.publishAt);
            const isExternal = Boolean(attributes?.externalUrl);
            const chapterUrl = isExternal
                ? attributes.externalUrl
                : `reader.html?chapter=${chapterId}&manga=${this.mangaId}&number=${chapterNum}`;
            const targetAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            const chapterBadge = isExternal
                ? '<span class="chapter-badge chapter-badge-external">External</span>'
                : attributes?.pages === 0
                    ? '<span class="chapter-badge chapter-badge-unavailable">No Pages</span>'
                    : '';

            return `
                <li class="chapter-item">
                    <a href="${chapterUrl}"${targetAttrs}>
                        <span class="chapter-item-title">Chapter ${chapterNum}</span>
                        <span class="chapter-item-title">${title}</span>
                    </a>
                    ${chapterBadge}
                    <span class="chapter-item-date">${publishDate}</span>
                </li>
            `;
        });

        chaptersList.innerHTML = html.join('');
    }

    filterChapters() {
        const searchQuery = document.getElementById('chapterSearch')?.value.toLowerCase() || '';

        this.filteredChapters = this.chapters.filter((chapter) => {
            const attributes = chapter.attributes;
            const chapterNum = (attributes?.chapter || 'extra').toLowerCase();
            const title = (attributes?.title || '').toLowerCase();

            return chapterNum.includes(searchQuery) || title.includes(searchQuery);
        });

        this.displayChapters();
    }

    sortChapters() {
        const sortOption = document.getElementById('chapterSort')?.value || 'latest';

        const chapterComparator = (a, b) => {
            const aNum = parseFloat(a.attributes?.chapter) || 0;
            const bNum = parseFloat(b.attributes?.chapter) || 0;

            switch (sortOption) {
                case 'oldest':
                    return aNum - bNum;
                case 'number':
                    return bNum - aNum;
                case 'latest':
                default:
                    return new Date(b.attributes?.publishAt) - new Date(a.attributes?.publishAt);
            }
        };

        this.filteredChapters.sort(chapterComparator);
        this.displayChapters();
    }

    toggleFavorite() {
        const title = uiManager.getMangaTitle(this.currentManga.attributes);
        const isFav = uiManager.isFavorite(this.mangaId);

        if (isFav) {
            uiManager.removeFromFavorites(this.mangaId, title);
        } else {
            uiManager.addToFavorites(this.mangaId, title);
        }

        this.updateFavoriteButton();
    }

    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (!favoriteBtn) return;

        const isFav = uiManager.isFavorite(this.mangaId);
        if (isFav) {
            favoriteBtn.classList.add('favorited');
            favoriteBtn.textContent = '♥ Remove from Favorites';
        } else {
            favoriteBtn.classList.remove('favorited');
            favoriteBtn.textContent = '♡ Add to Favorites';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.detailPage = new MangaDetailPage();
    });
} else {
    window.detailPage = new MangaDetailPage();
}
