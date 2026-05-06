# 🛠️ Development Guide - MangaRigX

This guide covers architecture, code patterns, and how to extend MangaRigX.

## Architecture Overview

MangaRigX follows a modular, layered architecture:

```
┌──────────────────────────────────────┐
│       Presentation Layer             │
│  (HTML pages + CSS styling)          │
├──────────────────────────────────────┤
│       Application Layer              │
│  (app.js, manga-detail.js, reader.js)│
├──────────────────────────────────────┤
│       Utility Layer                  │
│  (ui-manager.js)                     │
├──────────────────────────────────────┤
│       API Layer                      │
│  (api-client.js)                     │
├──────────────────────────────────────┤
│       Data Layer                     │
│  (localStorage, IndexedDB if needed) │
├──────────────────────────────────────┤
│       External APIs                  │
│  (MangaDex API)                      │
└──────────────────────────────────────┘
```

## Code Organization Principles

### 1. Separation of Concerns
Each file has a specific responsibility:
- **HTML**: Structure only
- **CSS**: Styling only
- **JS Modules**: Single responsibility

### 2. DRY (Don't Repeat Yourself)
- Common functions in `ui-manager.js`
- Reusable API methods in `api-client.js`
- Shared CSS variables in `styles.css`

### 3. Data Flow
```
User Interaction → Event Listener → Function Call → API Call → Display Update
```

## Module Reference

### api-client.js

**Purpose**: All external API communication

**Key Classes**:
```javascript
class MangaDexClient {
    // Constructor: Initialize cache
    
    // Methods:
    fetch()                    // Generic HTTP method with caching
    getMangaList()            // Get paginated manga
    searchManga()             // Search by title
    getMangaDetails()         // Get single manga info
    getChapters()             // Get manga's chapters
    getChapter()              // Get single chapter
    getChapterPages()         // Get chapter pages
    getCoverUrl()             // Build cover image URL
    getPageUrl()              // Build page image URL
    getMangaStatistics()      // Get manga stats
    getTags()                 // Get available tags
}
```

**Usage Example**:
```javascript
// Fetch manga list
const response = await mangaDexClient.getMangaList(page, limit, filters);

// Search for manga
const results = await mangaDexClient.searchManga('Berserk', 12);

// Get chapter pages
const pages = await mangaDexClient.getChapterPages(chapterId);
```

### ui-manager.js

**Purpose**: Shared UI utilities and data persistence

**Key Methods**:
```javascript
class UIManager {
    // Navigation
    navigateToManga(mangaId)
    navigateToReader(chapterId, mangaId, chapterNumber)
    
    // Loading States
    showLoading(containerId)
    hideLoading(containerId)
    
    // Notifications
    showNotification(message, type, duration)
    
    // Favorites
    addToFavorites(mangaId, title)
    removeFromFavorites(mangaId, title)
    isFavorite(mangaId)
    getFavorites()
    
    // Reading History
    getReadingHistory()
    addToHistory(chapterId, mangaId, title, number)
    
    // Utilities
    formatDate(dateString)
    truncateText(text, maxLength)
    capitalizeFirst(str)
    debounce(func, wait)
    isMobile()
    isTablet()
    isDesktop()
    
    // Storage
    getPreference(key, defaultValue)
    setPreference(key, value)
}
```

**Usage Example**:
```javascript
// Show loading
uiManager.showLoading();

// Add to favorites
uiManager.addToFavorites(mangaId, title);

// Show notification
uiManager.showNotification('Success!', 'success', 3000);

// Check device type
if (uiManager.isMobile()) {
    // Do mobile-specific stuff
}
```

### app.js (Homepage)

**Purpose**: Homepage logic (grid display, search, filters)

**Key Class**:
```javascript
class MangaApp {
    constructor()           // Initialize app
    
    async loadManga()       // Fetch manga from API
    displayMangaGrid()      // Render manga cards
    handleSearch()          // Search functionality
    displaySearchResults()  // Show search dropdown
    updateFilters()         // Apply filters
    updatePaginationButtons() // Handle pagination
}
```

**Event Flow**:
1. Page loads → `app.js` initializes
2. `MangaApp` constructor calls `setupEventListeners()`
3. `loadManga()` fetches from API
4. `displayMangaGrid()` renders results
5. User clicks card → `navigateToManga()`

### manga-detail.js

**Purpose**: Manga detail page (info, chapters, favorites)

**Key Class**:
```javascript
class MangaDetailPage {
    constructor()              // Load query params
    
    async loadMangaDetails()   // Fetch manga info
    displayMangaDetails()      // Render details
    async loadChapters()       // Fetch chapters
    displayChapters()          // Render chapter list
    filterChapters()           // Search chapters
    sortChapters()             // Sort chapters
    toggleFavorite()           // Add/remove favorite
}
```

**Event Flow**:
1. Page loads with `?id=mangaId` param
2. `loadMangaDetails()` fetches manga info
3. `loadChapters()` fetches chapter list
4. Both display in the page
5. User clicks chapter → `navigateToReader()`

### reader.js

**Purpose**: Chapter reading interface

**Key Class**:
```javascript
class ChapterReader {
    constructor()              // Load chapter & manga IDs
    
    async loadChapter()        // Fetch chapter pages
    displayPages()             // Render pages (vertical/horizontal/single)
    
    nextPage()                 // Navigate forward
    previousPage()             // Navigate backward
    
    applyDarkMode()            // Apply dark theme
    applyBrightness()          // Apply brightness filter
    toggleFullscreen()         // Enter fullscreen
    toggleReaderPanel()        // Show/hide side panel
}
```

**Reading Modes**:
- **Vertical**: All pages in one column (scroll)
- **Horizontal**: 2 pages side-by-side
- **Single**: One page at a time

## Data Persistence

### localStorage Keys

```javascript
localStorage.mangarigx_favorites        // Favorite manga list
localStorage.mangarigx_history          // Reading history
localStorage.mangarigx_pref_readingMode // User preferences
localStorage.mangarigx_pref_darkMode
localStorage.mangarigx_pref_brightness
```

**Example Storage Format**:
```javascript
// Favorites
{
    "mangaId": {
        id: "mangaId",
        title: "Manga Title",
        addedDate: "2024-01-01T12:00:00Z"
    }
}

// History
[
    {
        chapterId: "id",
        mangaId: "id",
        mangaTitle: "Title",
        chapterNumber: "42",
        timestamp: "2024-01-01T12:00:00Z"
    }
]
```

## Adding New Features

### Example: Add Reading List Feature

**Step 1**: Extend `UIManager`
```javascript
// In ui-manager.js
getReadingList() {
    const stored = localStorage.getItem('mangarigx_reading_list');
    return stored ? JSON.parse(stored) : [];
}

addToReadingList(mangaId, title) {
    let list = this.getReadingList();
    if (!list.find(m => m.id === mangaId)) {
        list.push({ id: mangaId, title, addedDate: new Date().toISOString() });
        localStorage.setItem('mangarigx_reading_list', JSON.stringify(list));
    }
}
```

**Step 2**: Add button to UI
```html
<!-- In manga-detail.html -->
<button id="readingListBtn" class="action-btn">+ Add to Reading List</button>
```

**Step 3**: Add event listener
```javascript
// In manga-detail.js
const readingListBtn = document.getElementById('readingListBtn');
readingListBtn.addEventListener('click', () => {
    uiManager.addToReadingList(this.mangaId, this.currentManga.attributes.title.en);
    uiManager.showNotification('Added to reading list!', 'success');
});
```

**Step 4**: Style it
```css
/* In styles.css */
.action-btn {
    padding: 0.75rem 1rem;
    background-color: var(--bg-card);
    border: 2px solid var(--accent-color);
    color: var(--accent-color);
    border-radius: 6px;
    cursor: pointer;
    transition: var(--transition);
}

.action-btn:hover {
    background-color: var(--accent-color);
    color: white;
}
```

### Example: Add Genre Filtering

**Step 1**: Get available tags from API
```javascript
// In api-client.js - already implemented!
async getTags() {
    return this.fetch('/manga/tag');
}

async getMangaByTag(tagId, limit, offset) {
    const params = new URLSearchParams({
        'includedTags[]': tagId,
        limit,
        offset,
        // ... more params
    });
    return this.fetch(`/manga?${params}`);
}
```

**Step 2**: Add UI for genre selection
```html
<select id="genreFilter">
    <option value="">All Genres</option>
    <!-- Populated by JS -->
</select>
```

**Step 3**: Load and display genres
```javascript
async loadGenres() {
    const response = await mangaDexClient.getTags();
    const select = document.getElementById('genreFilter');
    
    response.data.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag.id;
        option.textContent = tag.attributes.name.en;
        select.appendChild(option);
    });
}
```

## Testing

### Manual Testing Checklist

**Homepage**:
- [ ] Grid loads with manga
- [ ] Pagination works
- [ ] Search finds results
- [ ] Filters apply correctly
- [ ] Click card navigates to detail

**Manga Detail**:
- [ ] All info displays correctly
- [ ] Chapter list loads
- [ ] Can search chapters
- [ ] Can sort chapters
- [ ] Favorite button works

**Reader**:
- [ ] Pages load
- [ ] Navigation works (arrow keys, clicks)
- [ ] Dark mode toggles
- [ ] Brightness slider works
- [ ] Reading modes switch correctly
- [ ] Fullscreen works
- [ ] Back button returns to detail

**Mobile**:
- [ ] Layout responsive at 375px
- [ ] Touch navigation works
- [ ] No horizontal scroll issues
- [ ] Images scale correctly

### Browser DevTools

**Network Tab**:
- Check API response times
- Monitor image loading
- Watch for failed requests

**Console Tab**:
- Should be error-free
- Check for warnings
- Monitor API calls

**Storage Tab**:
- Verify localStorage saves
- Check favorite data
- Inspect history

## Performance Optimization Tips

### Image Loading
```javascript
// Use lazy loading (already implemented)
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(/* ... */);
}
```

### API Caching
```javascript
// Cache prevents duplicate requests
this.cache.set(cacheKey, { data, time: Date.now() });
```

### CSS Performance
```css
/* Use CSS variables for theme switching (faster than JS manipulation) */
:root { --primary-color: #1a1a2e; }
```

### JavaScript Performance
```javascript
// Debounce expensive operations
searchInput.addEventListener('input', 
    uiManager.debounce((e) => this.handleSearch(e), 300)
);
```

## Error Handling

### API Errors
```javascript
try {
    const response = await mangaDexClient.getMangaList();
} catch (error) {
    console.error('API Error:', error);
    uiManager.showNotification('Failed to load', 'error');
}
```

### Validation
```javascript
// Check for required query params
if (!this.mangaId) {
    uiManager.showNotification('Invalid ID', 'error');
    window.location.href = '/';
    return;
}
```

## Browser Compatibility

### Supported Features
- Modern JavaScript (ES6+)
- Fetch API
- localStorage
- CSS Grid/Flexbox
- IntersectionObserver

### Unsupported
- Internet Explorer
- Very old Safari versions
- Older Android browsers

## Common Patterns

### Debouncing
```javascript
const debouncedSearch = uiManager.debounce((query) => {
    // This only runs after 300ms of no typing
}, 300);

searchInput.addEventListener('input', debouncedSearch);
```

### Show/Hide
```javascript
// Show element
element.style.display = 'flex';
// Hide element
element.style.display = 'none';
```

### Query Parameters
```javascript
// Get param
const mangaId = uiManager.getQueryParam('id');

// Navigate with params
uiManager.navigateToManga(mangaId);
// Internally builds: manga-detail.html?id=...
```

## Debugging Tips

### 1. Use DevTools
```javascript
// Press F12 to open
// Console tab shows errors
// Network tab shows API calls
// Storage tab shows localStorage
```

### 2. Add Console Logs
```javascript
console.log('Data:', response);
console.error('Error:', error);
console.warn('Warning:', message);
```

### 3. Check API Responses
```javascript
// In Network tab, click API call
// View Response tab to see JSON
// Check if data structure matches expectations
```

### 4. Test Slowly
```javascript
// DevTools > Network > Throttle > Slow 3G
// Tests how app behaves on slow connections
```

## Extending the API Client

### Adding New Endpoint
```javascript
// In api-client.js
async getRecommendations(mangaId, limit = 10) {
    const params = new URLSearchParams({ manga: mangaId, limit });
    return this.fetch(`/manga?${params}`);
}
```

### Custom Error Handling
```javascript
async fetch(endpoint, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        // Custom error handling
        console.error(`Fetch failed for ${endpoint}:`, error);
        throw error;
    }
}
```

## Future Enhancement Ideas

1. **User Accounts**: Add Firebase Auth for cloud sync
2. **Reading List**: Manga you plan to read
3. **Reviews**: User ratings and comments
4. **Recommendations**: ML-based suggestions
5. **Offline Mode**: Download chapters for offline reading
6. **Social Features**: Share with friends
7. **Custom Themes**: More color schemes
8. **API Proxy**: Handle CORS if needed
9. **Analytics**: Track user behavior
10. **Multi-language**: Translations

## Dependencies Philosophy

**Current: Zero dependencies!** 

- No npm packages
- No build tools
- No webpack/rollup
- Pure vanilla JavaScript

**If adding in future**:
- Keep it minimal
- Prefer lightweight libraries
- Document all additions

## Version Control Best Practices

```bash
# Good commit messages
git commit -m "feat: add genre filtering"
git commit -m "fix: chapter loading timeout"
git commit -m "docs: update deployment guide"

# Keep commits atomic (one feature per commit)
# Use meaningful branch names: feature/*, fix/*, docs/*
```

## Resources for Learning

- **JavaScript**: [MDN Web Docs](https://developer.mozilla.org/)
- **API Design**: [REST API Best Practices](https://restfulapi.net/)
- **CSS**: [CSS-Tricks](https://css-tricks.com/)
- **MangaDex API**: [Official Docs](https://api.mangadex.org/docs)
- **Web Performance**: [Web.dev](https://web.dev/)

---

**Happy coding!** Feel free to extend and customize MangaRigX! 🚀
