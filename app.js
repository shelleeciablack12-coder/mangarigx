/**
 * MangaRigX - Main App
 * Homepage with manga grid, search, and filtering
 */

class MangaApp {
    constructor() {
        this.currentPage = 0;
        this.itemsPerPage = 24;
        this.currentFilter = {};
        this.totalResults = 0;
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupRequestForm();
        this.setupStorageButtons();
        await this.loadManga();
    }

    setupEventListeners() {
        // Manga grid item clicks
        document.addEventListener('click', (e) => {
            const mangaCard = e.target.closest('.manga-card');
            if (mangaCard && !this.isLoading) {
                const mangaId = mangaCard.dataset.mangaId;
                uiManager.navigateToManga(mangaId);
            }
        });

        // Search input with debounce and visual feedback
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (!query) {
                    const searchResults = document.getElementById('searchResults');
                    if (searchResults) {
                        searchResults.style.display = 'none';
                    }
                    return;
                }
                
                // Add visual feedback while searching
                const searchResults = document.getElementById('searchResults');
                if (searchResults) {
                    searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-color);"><p>Searching...</p></div>';
                    searchResults.style.display = 'block';
                }
                
                // Debounce search
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e);
                }, 300);
            });
            
            // Close search results on blur
            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    const searchResults = document.getElementById('searchResults');
                    if (searchResults) {
                        searchResults.style.display = 'none';
                    }
                }, 200);
            });
        }

        // Filter changes
        const statusFilter = document.getElementById('statusFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentPage = 0;
                this.updateFilters();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.currentPage = 0;
                this.updateFilters();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.loadManga();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const maxPages = Math.ceil(this.totalResults / this.itemsPerPage);
                if (this.currentPage < maxPages - 1) {
                    this.currentPage++;
                    this.loadManga();
                }
            });
        }

        // Genre link
        const genreLink = document.getElementById('genreLink');
        if (genreLink) {
            genreLink.addEventListener('click', (e) => {
                e.preventDefault();
                uiManager.showNotification('Genre filtering coming soon!', 'info');
            });
        }

        // Favorites link
        const favoritesLink = document.getElementById('favoritesLink');
        if (favoritesLink) {
            favoritesLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showFavorites();
            });
        }
    }

    setupRequestForm() {
        const requestForm = document.getElementById('requestForm');
        if (!requestForm) return;

        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('requestName')?.value.trim() || 'Anonymous';
            const email = document.getElementById('requestEmail')?.value.trim() || 'Not provided';
            const message = document.getElementById('requestMessage')?.value.trim();

            if (!message) {
                uiManager.showNotification('Please describe your request before sending.', 'warning');
                return;
            }

            const request = {
                name,
                email,
                message,
                date: new Date().toISOString(),
            };

            this.saveRequest(request);
            uiManager.showNotification('Request saved locally and draft email opened.', 'success');

            const mailto = `mailto:contact@mangarigx.com?subject=${encodeURIComponent('MangaRigX Request')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nRequest:\n${message}`)}`;
            window.location.href = mailto;
            requestForm.reset();
        });
    }

    saveRequest(request) {
        try {
            const stored = JSON.parse(localStorage.getItem('mangarigx_requests') || '[]');
            stored.unshift(request);
            localStorage.setItem('mangarigx_requests', JSON.stringify(stored));
        } catch (error) {
            console.error('Failed to save request:', error);
        }
    }

    setupStorageButtons() {
        this.updateStorageButtons();

        const continueBtn = document.getElementById('continueReadingBtn');
        const bookmarksBtn = document.getElementById('bookmarksBtn');
        const recentlyViewedBtn = document.getElementById('recentlyViewedBtn');

        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.showStoragePopup('continue'));
        }
        if (bookmarksBtn) {
            bookmarksBtn.addEventListener('click', () => this.showStoragePopup('bookmarks'));
        }
        if (recentlyViewedBtn) {
            recentlyViewedBtn.addEventListener('click', () => this.showStoragePopup('recentlyViewed'));
        }

        const popup = document.getElementById('storagePopup');
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target.id === 'storagePopup' || e.target.id === 'closeStoragePopup') {
                    this.closeStoragePopup();
                }
            });
        }
    }

    updateStorageButtons() {
        const continueReading = uiManager.getContinueReading();
        const bookmarks = uiManager.getBookmarks();
        const recentlyViewed = uiManager.getRecentHistory(5);

        const continueBtn = document.getElementById('continueReadingBtn');
        const bookmarksBtn = document.getElementById('bookmarksBtn');
        const recentlyViewedBtn = document.getElementById('recentlyViewedBtn');

        if (continueBtn) {
            continueBtn.textContent = `Continue reading (${continueReading.length})`;
        }
        if (bookmarksBtn) {
            bookmarksBtn.textContent = `Bookmarks (${bookmarks.length})`;
        }
        if (recentlyViewedBtn) {
            recentlyViewedBtn.textContent = `Recently viewed (${recentlyViewed.length})`;
        }
    }

    showStoragePopup(type) {
        const popup = document.getElementById('storagePopup');
        if (!popup) return;

        let title = '';
        let items = [];

        if (type === 'continue') {
            title = 'Continue reading';
            items = uiManager.getContinueReading();
        } else if (type === 'bookmarks') {
            title = 'Bookmarks';
            items = uiManager.getBookmarks();
        } else if (type === 'recentlyViewed') {
            title = 'Recently viewed';
            items = uiManager.getRecentHistory(10);
        }

        popup.innerHTML = `
            <div class="storage-popup-header">
                <h4>${title}</h4>
                <button id="closeStoragePopup" class="storage-popup-close">✕</button>
            </div>
            ${this.buildStorageList(type, items)}
        `;

        popup.classList.add('visible');
    }

    closeStoragePopup() {
        const popup = document.getElementById('storagePopup');
        if (popup) {
            popup.classList.remove('visible');
        }
    }

    buildStorageList(type, items) {
        if (!items || !items.length) {
            return `<p class="storage-popup-empty">No items available yet.</p>`;
        }

        if (type === 'bookmarks') {
            return `
                <ul class="storage-popup-list">
                    ${items
                        .map(
                            (item) => `
                                <li class="storage-popup-item">
                                    <a href="manga-detail.html?id=${item.id}">${item.title}</a>
                                </li>
                            `
                        )
                        .join('')}
                </ul>
            `;
        }

        return `
            <ul class="storage-popup-list">
                ${items
                    .map((item) => {
                        const mangaTitle = item.mangaTitle || 'Unknown Manga';
                        const chapterNumber = item.chapterNumber || 'Unknown';
                        return `
                            <li class="storage-popup-item">
                                <a href="reader.html?chapter=${item.chapterId}&manga=${item.mangaId}&number=${chapterNumber}">
                                    ${mangaTitle} — Chapter ${chapterNumber}
                                </a>
                            </li>
                        `;
                    })
                    .join('')}
            </ul>
        `;
    }

    updateFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const sortFilter = document.getElementById('sortFilter');

        this.currentFilter = {};

        // Handle status filter
        if (statusFilter && statusFilter.value && statusFilter.value !== 'all') {
            this.currentFilter.status = statusFilter.value;
        }

        // Handle sort options
        if (sortFilter && sortFilter.value && sortFilter.value !== 'default') {
            const sortMap = {
                latestChapter: { 'order[latestUploadedChapter]': 'desc' },
                rating: { 'order[rating]': 'desc' },
                name: { 'order[title]': 'asc' },
            };
            Object.assign(this.currentFilter, sortMap[sortFilter.value] || {});
        }

        this.loadManga();
    }

    async handleSearch(event) {
        const query = event.target.value.trim();
        const searchResults = document.getElementById('searchResults');

        if (!query) {
            if (searchResults) searchResults.style.display = 'none';
            return;
        }

        try {
            const response = await mangaDexClient.searchManga(query, 12);
            this.displaySearchResults(response.data, searchResults);
        } catch (error) {
            console.error('Search error:', error);
            if (searchResults) {
                searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--danger);">Search failed. Please try again.</div>';
                searchResults.style.display = 'block';
            }
        }
    }

    displaySearchResults(results, container) {
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No manga found for your search</div>';
            container.style.display = 'block';
            return;
        }

        const html = results
            .map((manga, idx) => {
                const title = uiManager.getMangaTitle(manga.attributes);
                const coverInfo = uiManager.getCoverInfoFromManga(manga);
                const coverUrl = coverInfo
                    ? mangaDexClient.getCoverUrl(coverInfo.mangaId, coverInfo.fileName, 'small')
                    : 'https://via.placeholder.com/40x60?text=No+Cover';

                return `
                    <div class="search-result-item" data-manga-id="${manga.id}">
                        <img
                            src="${coverUrl}"
                            alt="${title}"
                            class="search-result-thumb"
                            loading="lazy"
                            data-manga-id="${coverInfo?.mangaId || ''}"
                            data-file-name="${coverInfo?.fileName || ''}"
                            data-size="small"
                            onerror="uiManager.fallbackCoverImage(this)"
                        >
                        <span class="search-result-name">${this.truncateText(title, 30)}</span>
                    </div>
                `;
            })
            .join('');

        container.innerHTML = html;
        container.style.display = 'block';

        // Add click handlers
        container.querySelectorAll('.search-result-item').forEach((item) => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const mangaId = item.dataset.mangaId;
                uiManager.navigateToManga(mangaId);
            });
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async loadManga() {
        if (this.isLoading) return;

        this.isLoading = true;
        
        const grid = document.getElementById('mangaGrid');
        if (grid) {
            grid.classList.add('loading');
        }
        
        uiManager.showLoading();

        try {
            const response = await mangaDexClient.getMangaList(
                this.currentPage,
                this.itemsPerPage,
                this.currentFilter
            );

            this.totalResults = response.total || 0;
            this.displayMangaGrid(response.data);
            this.updatePaginationButtons();
            
            // Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Load error:', error);
            uiManager.showNotification('Failed to load manga. Please try again.', 'error');
        } finally {
            this.isLoading = false;
            if (grid) {
                grid.classList.remove('loading');
            }
            uiManager.hideLoading();
        }
    }

    displayMangaGrid(mangaList) {
        const grid = document.getElementById('mangaGrid');
        if (!grid) return;

        if (mangaList.length === 0) {
            grid.innerHTML =
                '<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--text-muted);">No manga found. Try different filters or search.</div>';
            return;
        }

        const html = mangaList.map((manga) => uiManager.createMangaCard(manga)).join('');
        grid.innerHTML = html;

        // Lazy load images
        this.setupLazyLoading();
        
        // Force reflow to trigger animations
        void grid.offsetWidth;
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach((img) => {
                imageObserver.observe(img);
            });
        }
    }

    updatePaginationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');

        const maxPages = Math.ceil(this.totalResults / this.itemsPerPage);
        const currentPageNum = this.currentPage + 1;

        // Update display
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPageNum} of ${maxPages}`;
        }

        // Update button visibility and state
        if (prevBtn) {
            prevBtn.style.display = this.currentPage > 0 ? 'block' : 'none';
            prevBtn.disabled = this.currentPage === 0;
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentPage < maxPages - 1 ? 'block' : 'none';
            nextBtn.disabled = this.currentPage >= maxPages - 1;
        }
    }

    showFavorites() {
        const favorites = uiManager.getFavorites();

        if (favorites.length === 0) {
            uiManager.showNotification('No favorites yet. Add some manga to get started!', 'info');
            return;
        }

        // For now, show simple list
        const titles = favorites.map((f) => f.title).join(', ');
        console.log('Favorites:', favorites);
        uiManager.showNotification(`You have ${favorites.length} favorites`, 'info');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new MangaApp();
    });
} else {
    window.app = new MangaApp();
}
