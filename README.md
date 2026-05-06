# MangaRigX 📖

A modern, lightweight manga reading web application built with vanilla JavaScript and powered by the MangaDex API. Browse, search, and read manga in a smooth, organized way without relying on multiple messy systems or a backend.

## Features

### ✨ Core Features
- **Homepage Grid**: Browse thousands of manga titles from MangaDex with beautiful cover art
- **Search**: Real-time search functionality to find manga by title
- **Manga Details**: View comprehensive manga information including synopsis, chapters, status, author, and artist
- **Chapter Viewer**: Beautiful, responsive chapter reader with multiple reading modes
- **Favorites**: Save your favorite manga locally for quick access
- **Reading History**: Automatically tracks your reading progress

### 🎯 Reading Modes
- **Vertical Scroll** (Default): Single-column, scroll-through-all pages
- **Horizontal Scroll**: Side-by-side page view
- **Single Page**: One page at a time with navigation controls

### 🎨 Advanced Features
- **Dark Mode**: Easy on the eyes for reading at night
- **Brightness Control**: Adjust image brightness for better readability
- **Filters & Sorting**: Filter by manga status and sort by rating, title, or latest chapter
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Page Navigation**: Click left/right side to navigate pages in non-vertical mode
- **Keyboard Shortcuts**:
  - `Arrow Left/Right`: Navigate pages
  - `F`: Toggle fullscreen
  - `Esc`: Toggle reader panel

## Project Structure

```
MangaRigX/
├── index.html              # Homepage with manga grid
├── manga-detail.html       # Manga details and chapters
├── reader.html             # Chapter reader interface
├── styles.css              # Complete styling (responsive)
├── api-client.js           # MangaDex API integration
├── ui-manager.js           # Shared UI utilities and storage
├── app.js                  # Homepage functionality
├── manga-detail.js         # Detail page logic
├── reader.js               # Reader page logic
└── README.md              # Documentation
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No backend server required!
- No dependencies or build tools needed

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start browsing manga!

### Using Locally
```bash
# Option 1: Use Python's built-in server (Python 3)
python -m http.server 8000

# Option 2: Use Node.js http-server
npx http-server

# Option 3: Use Live Server in VS Code
# Install Live Server extension and right-click index.html > Open with Live Server
```

Then visit `http://localhost:8000` or whatever your server displays.

## How It Works

### Architecture
```
┌─────────────────────┐
│   MangaRigX App     │
├─────────────────────┤
│  UI Layer           │
│  (HTML/CSS/JS)      │
├─────────────────────┤
│  API Client Layer   │
│  (api-client.js)    │
├─────────────────────┤
│  UI Manager Layer   │
│  (ui-manager.js)    │
├─────────────────────┤
│  MangaDex API       │
│  (https://...)      │
└─────────────────────┘
```

### Data Flow
1. **Homepage (index.html)**: Fetches manga list from MangaDex API, displays in grid
2. **Manga Details**: Loads full manga info and chapter list
3. **Reader**: Fetches chapter pages from MangaDex's at-home server and displays them
4. **LocalStorage**: All favorites and preferences stored in browser

## API Usage

The app uses the free [MangaDex API](https://api.mangadex.org/) which requires no authentication.

### Key API Endpoints Used:
- `/manga` - Get manga list and search
- `/manga/{id}` - Get manga details
- `/chapter` - Get chapters for manga
- `/chapter/{id}` - Get chapter information
- `/at-home/server/{chapterId}` - Get chapter pages

## Features Explained

### Search
- Real-time search as you type
- Shows thumbnail previews
- Click to jump to manga detail page

### Filters & Sorting
- **Status Filter**: Ongoing, Completed, Hiatus
- **Sort Options**: Latest Chapter, Rating, Title (A-Z)

### Favorites
- Click heart icon to add/remove from favorites
- Stored in browser's localStorage
- Survives browser restarts

### Reading Preferences
- **Reading Mode**: Save your preferred layout
- **Dark Mode**: Toggle for comfortable reading
- **Brightness**: Adjust from 50% to 150%
- **All settings auto-save** to localStorage

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full |
| Firefox | ✅ Full |
| Safari  | ✅ Full |
| Edge    | ✅ Full |
| Opera   | ✅ Full |
| IE 11   | ❌ Not supported |

## Performance Tips

1. **Lazy Loading**: Images load as you scroll
2. **API Caching**: Manga data cached for 30 minutes
3. **Responsive Images**: Different sizes for different devices
4. **Optimized CSS**: Single stylesheet with no external dependencies

## Planned Features

- [ ] Genre filtering with advanced tag selection
- [ ] User reading statistics and analytics
- [ ] Manga update notifications
- [ ] Chapter download for offline reading
- [ ] Reading list/want-to-read feature
- [ ] Manga recommendations
- [ ] Multi-language support for UI
- [ ] Customizable themes

## Data Storage

All data is stored locally in the browser using localStorage:

```javascript
// Favorites
localStorage.mangarigx_favorites

// Reading History
localStorage.mangarigx_history

// User Preferences
localStorage.mangarigx_pref_*
```

**Note**: Data is not synced across devices. Each browser has its own copy.

## Customization

### Colors
Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #1a1a2e;
    --accent-color: #e94560;
    --text-color: #eee;
    /* ... more variables */
}
```

### Items Per Page
Edit in `app.js`:

```javascript
this.itemsPerPage = 24; // Change this number
```

### API Limits
Edit in `api-client.js`:

```javascript
this.cacheTimeout = 1000 * 60 * 30; // Cache timeout in milliseconds
```

## Troubleshooting

### No manga showing up?
- Check internet connection
- Clear browser cache and reload
- Try opening DevTools (F12) to check for errors
- MangaDex API might be down (check their status)

### Images not loading?
- MangaDex servers might be experiencing issues
- Try refreshing the page
- Check browser console for CORS errors

### Favorites not persisting?
- Check if localStorage is enabled in browser settings
- Private/Incognito mode may not persist data
- Try a different browser

## API Rate Limits

MangaDex API has reasonable rate limits:
- No authentication required
- Generally allows 5 requests per second per IP
- The app caches requests to minimize API calls

## Credits

- **Data Source**: [MangaDex](https://mangadex.org/)
- **API**: [MangaDex API](https://api.mangadex.org/)
- **Built With**: Vanilla JavaScript, HTML5, CSS3

## License

This project is open source and available for personal use. MangaDex content is provided by the MangaDex project and follows their [terms of service](https://mangadex.org/about).

## Contributing

Found a bug or have a feature request?
1. Check if it's already reported in issues
2. Create a new issue with details
3. Include steps to reproduce if it's a bug

## Support

For issues with MangaDex API or manga content, visit [MangaDex Discord](https://discord.gg/pRBMFqr). For issues with this application, create an issue on the repository.

---

Made with ❤️ for manga lovers everywhere. Happy reading! 📚
