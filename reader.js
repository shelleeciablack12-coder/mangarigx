/**
 * MangaRigX - Chapter Reader
 * Display chapter pages with various reading modes
 */

class ChapterReader {
    constructor() {
        this.chapterId = uiManager.getQueryParam('chapter');
        this.mangaId = uiManager.getQueryParam('manga');
        this.chapterNumber = uiManager.getQueryParam('number');
        this.currentChapter = null;
        this.pages = [];
        this.chapterList = [];
        this.currentChapterIndex = -1;
        this.currentPageIndex = 0;
        this.readingMode = uiManager.getPreference('readingMode', 'vertical');
        this.darkMode = uiManager.getPreference('darkMode', false);
        this.brightness = uiManager.getPreference('brightness', 100);
        this.autoNextChapter = uiManager.getPreference('autoNextChapter', true);
        this.preloadPages = uiManager.getPreference('preloadPages', true);
        this.init();
    }

    async init() {
        if (!this.chapterId || !this.mangaId) {
            uiManager.showNotification('Invalid chapter or manga ID', 'error');
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.applyPreferences();
        this.currentPageIndex = this.getSavedPageIndex();
        await this.loadChapter();
    }

    setupEventListeners() {
        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = `manga-detail.html?id=${this.mangaId}`;
            });
        }

        // Navigation buttons
        const prevChapterBtn = document.getElementById('prevChapterBtn');
        const nextChapterBtn = document.getElementById('nextChapterBtn');

        if (prevChapterBtn) {
            prevChapterBtn.addEventListener('click', () => this.loadPreviousChapter());
        }

        if (nextChapterBtn) {
            nextChapterBtn.addEventListener('click', () => this.loadNextChapter());
        }

        // Reading mode
        const readingModeSelect = document.getElementById('readingModeSelect');
        if (readingModeSelect) {
            readingModeSelect.value = this.readingMode;
            readingModeSelect.addEventListener('change', (e) => {
                this.readingMode = e.target.value;
                uiManager.setPreference('readingMode', this.readingMode);
                this.displayPages();
            });
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.darkMode;
            darkModeToggle.addEventListener('change', () => {
                this.darkMode = !this.darkMode;
                uiManager.setPreference('darkMode', this.darkMode);
                this.applyDarkMode();
            });
        }

        // Auto next chapter toggle
        const autoNextToggle = document.getElementById('autoNextToggle');
        if (autoNextToggle) {
            autoNextToggle.checked = this.autoNextChapter;
            autoNextToggle.addEventListener('change', () => {
                this.autoNextChapter = !this.autoNextChapter;
                uiManager.setPreference('autoNextChapter', this.autoNextChapter);
            });
        }

        // Brightness slider
        const brightnessSlider = document.getElementById('brightnessSlider');
        if (brightnessSlider) {
            brightnessSlider.value = this.brightness;
            brightnessSlider.addEventListener('change', (e) => {
                this.brightness = e.target.value;
                uiManager.setPreference('brightness', this.brightness);
                this.applyBrightness();
            });
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Toggle reader panel
        const togglePanel = document.getElementById('togglePanel');
        if (togglePanel) {
            togglePanel.addEventListener('click', () => this.toggleReaderPanel());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Page click navigation
        const readerContent = document.getElementById('readerContent');
        if (readerContent) {
            readerContent.addEventListener('click', (e) => {
                const rect = readerContent.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const midpoint = rect.width / 2;

                if (clickX < midpoint) {
                    this.previousPage();
                } else {
                    this.nextPage();
                }
            });
        }
    }

    async loadChapter() {
        try {
            uiManager.showLoading('readerLoading');

            // Load chapter info
            const chapterResponse = await mangaDexClient.getChapter(this.chapterId);
            this.currentChapter = chapterResponse.data;

            const chapterAttributes = this.currentChapter.attributes || {};
            const externalUrl = chapterAttributes.externalUrl;
            const availablePages = Number(chapterAttributes.pages || 0);

            if (externalUrl || availablePages === 0) {
                this.pages = [];
                this.updateReaderTitle();
                this.updatePagesList();
                await this.loadChapterList();
                this.updateChapterButtons();

                if (externalUrl) {
                    this.showUnavailableChapter(
                        'This chapter is hosted externally and cannot be displayed in the built-in reader.',
                        externalUrl
                    );
                } else {
                    this.showUnavailableChapter('No page images are available for this chapter.');
                }

                uiManager.addToHistory(
                    this.chapterId,
                    this.mangaId,
                    this.currentChapter.relationships[0]?.attributes?.title || 'Unknown',
                    this.chapterNumber
                );

                uiManager.hideLoading('readerLoading');
                return;
            }

            // Load pages from at-home server
            const pagesResponse = await mangaDexClient.getChapterPages(this.chapterId);
            const baseUrl = pagesResponse.baseUrl;
            const chapterHash = pagesResponse.chapter.hash;
            let pageData = pagesResponse.chapter.data || [];

            if (!pageData.length && Array.isArray(pagesResponse.chapter.dataSaver) && pagesResponse.chapter.dataSaver.length) {
                pageData = pagesResponse.chapter.dataSaver;
            }

            if (!pageData.length) {
                this.pages = [];
                this.updateReaderTitle();
                this.updatePagesList();
                await this.loadChapterList();
                this.updateChapterButtons();
                this.showUnavailableChapter('No page data was returned for this chapter.');
                uiManager.hideLoading('readerLoading');
                return;
            }

            // Build page URLs
            this.pages = pageData.map((filename) => ({
                url: mangaDexClient.getPageUrl(baseUrl, chapterHash, filename),
                filename,
            }));

            this.updateReaderTitle();
            this.displayPages();
            this.updatePagesList();
            await this.loadChapterList();
            this.updateChapterButtons();

            uiManager.addToHistory(
                this.chapterId,
                this.mangaId,
                this.currentChapter.relationships[0]?.attributes?.title || 'Unknown',
                this.chapterNumber
            );

            // Save initial page index
            this.savePageIndex();

            uiManager.hideLoading('readerLoading');
        } catch (error) {
            console.error('Failed to load chapter:', error);
            uiManager.showNotification('Failed to load chapter pages', 'error');
            uiManager.hideLoading('readerLoading');
        }
    }

    async loadChapterList() {
        try {
            const chapters = [];
            let offset = 0;
            const limit = 100;
            let response;

            do {
                response = await mangaDexClient.getChapters(this.mangaId, limit, offset, 'en');
                if (!response?.data?.length) break;
                chapters.push(...response.data);
                offset += limit;
            } while (response.data.length === limit);

            if (!chapters.length) {
                this.chapterList = [];
                this.currentChapterIndex = -1;
                return;
            }

            chapters.sort((a, b) => {
                const aNum = parseFloat(a.attributes?.chapter);
                const bNum = parseFloat(b.attributes?.chapter);
                const aHas = !Number.isNaN(aNum);
                const bHas = !Number.isNaN(bNum);

                if (aHas && bHas) {
                    return aNum - bNum;
                }
                if (a.attributes?.chapter && b.attributes?.chapter) {
                    return a.attributes.chapter.localeCompare(b.attributes.chapter, undefined, { numeric: true, sensitivity: 'base' });
                }
                return a.id.localeCompare(b.id);
            });

            this.chapterList = chapters;
            this.currentChapterIndex = chapters.findIndex((chapter) => chapter.id === this.chapterId);
        } catch (error) {
            console.error('Failed to load chapter list:', error);
            this.chapterList = [];
            this.currentChapterIndex = -1;
        }
    }

    showUnavailableChapter(message, externalUrl) {
        const content = document.getElementById('readerContent');
        const chapterInfo = document.getElementById('chapterInfo');

        if (content) {
            content.innerHTML = 
                `<div class="reader-unavailable-message">
                    <p>${message}</p>
                    ${externalUrl ? `<a href="${externalUrl}" target="_blank" rel="noopener noreferrer">Open external reader</a>` : ''}
                </div>`;
        }

        if (chapterInfo) {
            chapterInfo.textContent = externalUrl ? 'External chapter. Open in a new tab.' : 'No readable pages available for this chapter.';
        }
    }

    getChapterLabel(chapter) {
        if (!chapter) return '';
        const num = chapter.attributes?.chapter || 'Extra';
        const title = chapter.attributes?.title ? ` - ${chapter.attributes.title}` : '';
        return `Chapter ${num}${title}`;
    }

    updateChapterButtons() {
        const prevBtn = document.getElementById('prevChapterBtn');
        const nextBtn = document.getElementById('nextChapterBtn');

        const prevChapter = this.chapterList[this.currentChapterIndex - 1];
        const nextChapter = this.chapterList[this.currentChapterIndex + 1];

        if (prevBtn) {
            if (prevChapter) {
                prevBtn.disabled = false;
                prevBtn.textContent = `← ${this.getChapterLabel(prevChapter)}`;
            } else {
                prevBtn.disabled = true;
                prevBtn.textContent = '← Previous';
            }
        }

        if (nextBtn) {
            if (nextChapter) {
                nextBtn.disabled = false;
                nextBtn.textContent = `${this.getChapterLabel(nextChapter)} →`;
            } else {
                nextBtn.disabled = true;
                nextBtn.textContent = 'Next →';
            }
        }
    }

    displayPages() {
        const content = document.getElementById('readerContent');
        if (!content) return;

        content.innerHTML = '';

        if (!this.pages.length) {
            content.innerHTML = '<div class="reader-empty">No pages available for this chapter.</div>';
            this.applyBrightness();
            return;
        }

        if (this.readingMode === 'single') {
            // Single page mode
            if (this.pages[this.currentPageIndex]) {
                const img = document.createElement('img');
                img.src = this.pages[this.currentPageIndex].url;
                img.alt = `Page ${this.currentPageIndex + 1}`;
                img.dataset.pageUrl = this.pages[this.currentPageIndex].url;
                img.onerror = function () {
                    uiManager.fallbackImage(this);
                };
                content.appendChild(img);
                // Preload next page
                this.preloadPage(this.currentPageIndex + 1);
            }
        } else if (this.readingMode === 'horizontal') {
            // Horizontal scroll mode (show 2 pages side by side)
            const startIdx = this.currentPageIndex;
            const endIdx = Math.min(startIdx + 2, this.pages.length);

            for (let i = startIdx; i < endIdx; i++) {
                const img = document.createElement('img');
                img.src = this.pages[i].url;
                img.alt = `Page ${i + 1}`;
                img.style.flex = '1';
                img.dataset.pageUrl = this.pages[i].url;
                img.onerror = function () {
                    uiManager.fallbackImage(this);
                };
                content.appendChild(img);
            }
            // Preload next pages
            this.preloadPage(endIdx);
        } else {
            // Vertical scroll mode (show all pages)
            this.pages.forEach((page, index) => {
                const img = document.createElement('img');
                img.src = page.url;
                img.alt = `Page ${index + 1}`;
                img.dataset.pageUrl = page.url;
                img.dataset.pageIndex = index;
                img.onerror = function () {
                    uiManager.fallbackImage(this);
                };
                content.appendChild(img);
            });
            // In vertical mode, preloading all might not be needed, but preload next few
            for (let i = 0; i < 3; i++) {
                this.preloadPage(this.currentPageIndex + i + 1);
            }
        }

        this.applyBrightness();
    }

    updateReaderTitle() {
        const readerTitle = document.getElementById('readerTitle');
        if (readerTitle && this.currentChapter) {
            const chapterNum = this.currentChapter.attributes?.chapter || 'Extra';
            const chapterTitle = this.currentChapter.attributes?.title || '';
            const titlePart = chapterTitle ? ` - ${chapterTitle}` : '';
            readerTitle.textContent = `Chapter ${chapterNum}${titlePart}`;
        }
    }

    updatePagesList() {
        const pagesList = document.getElementById('pagesList');
        const pageCount = document.getElementById('pageCount');

        if (pageCount) {
            pageCount.textContent = `(${this.pages.length})`;
        }

        if (!pagesList) return;

        const html = this.pages
            .map(
                (page, index) =>
                    `<li class="page-item ${index === this.currentPageIndex ? 'active' : ''}" data-page-index="${index}">Page ${index + 1}</li>`
            )
            .join('');

        pagesList.innerHTML = html;

        // Add click handlers
        pagesList.querySelectorAll('.page-item').forEach((item) => {
            item.addEventListener('click', () => {
                this.currentPageIndex = parseInt(item.dataset.pageIndex);
                this.displayPages();
                this.updatePagesList();
            });
        });
    }

    loadPreviousChapter() {
        const prevChapter = this.chapterList[this.currentChapterIndex - 1];
        if (prevChapter) {
            uiManager.showNotification(`Loading ${this.getChapterLabel(prevChapter)}...`, 'info');
            window.location.href = `reader.html?manga=${encodeURIComponent(this.mangaId)}&chapter=${encodeURIComponent(prevChapter.id)}&number=${encodeURIComponent(prevChapter.attributes?.chapter || '')}`;
        } else {
            uiManager.showNotification('No previous chapter available.', 'warning');
        }
    }

    applyPreferences() {
        this.applyDarkMode();
        this.applyBrightness();
    }

    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    applyBrightness() {
        const content = document.getElementById('readerContent');
        if (content) {
            const brightnessValue = this.brightness / 100;
            content.style.filter = `brightness(${brightnessValue})`;
        }
    }

    toggleFullscreen() {
        const readerContainer = document.querySelector('.reader-container');
        if (!readerContainer) return;

        if (!document.fullscreenElement) {
            if (readerContainer.requestFullscreen) {
                readerContainer.requestFullscreen();
            } else if (readerContainer.webkitRequestFullscreen) {
                readerContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    toggleReaderPanel() {
        const panel = document.getElementById('readerPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                this.nextPage();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousPage();
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'Escape':
                this.toggleReaderPanel();
                break;
        }
    }

    // Remember last page
    getSavedPageIndex() {
        const key = `mangarigx_reader_${this.chapterId}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved, 10) : 0;
    }

    savePageIndex() {
        const key = `mangarigx_reader_${this.chapterId}`;
        localStorage.setItem(key, this.currentPageIndex.toString());
    }

    // Page preloading
    preloadPage(index) {
        if (!this.preloadPages || index >= this.pages.length) return;
        const img = new Image();
        img.src = this.pages[index].url;
    }

    // Auto next chapter
    async loadNextChapter() {
        const nextChapter = this.chapterList[this.currentChapterIndex + 1];
        if (nextChapter) {
            uiManager.showNotification(`Auto-loading ${this.getChapterLabel(nextChapter)}...`, 'info');
            window.location.href = `reader.html?manga=${encodeURIComponent(this.mangaId)}&chapter=${encodeURIComponent(nextChapter.id)}&number=${encodeURIComponent(nextChapter.attributes?.chapter || '')}`;
        } else {
            uiManager.showNotification('No next chapter available.', 'warning');
        }
    }

    nextPage() {
        if (this.readingMode === 'vertical') {
            // In vertical mode, scroll down
            const content = document.getElementById('readerContent');
            if (content) {
                const scrollAmount = window.innerHeight * 0.8;
                content.scrollBy(0, scrollAmount);
            }
        } else {
            // In other modes, advance page index
            if (this.currentPageIndex < this.pages.length - 1) {
                this.currentPageIndex++;
                this.displayPages();
                this.savePageIndex();
                if (this.preloadPages) {
                    this.preloadPage(this.currentPageIndex + 1);
                }
            } else if (this.autoNextChapter) {
                // Auto load next chapter
                this.loadNextChapter();
            }
        }
    }

    previousPage() {
        if (this.readingMode === 'vertical') {
            // In vertical mode, scroll up
            const content = document.getElementById('readerContent');
            if (content) {
                const scrollAmount = window.innerHeight * 0.8;
                content.scrollBy(0, -scrollAmount);
            }
        } else {
            // In other modes, decrease page index
            if (this.currentPageIndex > 0) {
                this.currentPageIndex--;
                this.displayPages();
                this.savePageIndex();
            }
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.reader = new ChapterReader();
    });
} else {
    window.reader = new ChapterReader();
}
