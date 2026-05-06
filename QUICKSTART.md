# 🚀 Quick Start Guide - MangaRigX

Welcome to MangaRigX! Follow these steps to get up and running.

## ⚡ 30-Second Setup

1. **Open the project folder** in VS Code
2. **Install Live Server** extension (if not already installed)
3. **Right-click `index.html`** → "Open with Live Server"
4. **Your default browser opens** → MangaRigX loads! 🎉

## 📋 What You Just Built

A complete manga reading platform with:
- ✅ Manga discovery and search
- ✅ Detailed manga pages with chapter lists
- ✅ Full-featured chapter reader
- ✅ Favorites system
- ✅ Reading history
- ✅ Dark mode & brightness control
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Multiple reading modes
- ✅ No backend server needed!

## 🎮 Try These Features

### 1. Browse Manga
- Open the app (you should see a grid of manga)
- Scroll to see more titles
- Pagination controls at the bottom

### 2. Search
- Type in the search bar at the top
- Click on a result to view details

### 3. View Manga Details
- Click any manga card
- See full description, chapters, and metadata
- Click the heart to favorite it

### 4. Read Manga
- Click a chapter from the chapter list
- Switch reading modes (Vertical/Horizontal/Single)
- Use arrow keys or click sides to navigate
- Toggle dark mode and brightness

### 5. Manage Favorites
- Heart icon saves manga to your favorites
- Data persists in your browser
- Try the "Favorites" link in the navbar

## 📂 File Breakdown

### HTML Pages (Your entry points)
- **index.html** - Homepage with manga grid
- **manga-detail.html** - Individual manga details
- **reader.html** - Chapter reading interface

### JavaScript (The logic)
- **api-client.js** - All MangaDex API calls
- **ui-manager.js** - Shared utilities & storage
- **app.js** - Homepage functionality
- **manga-detail.js** - Detail page logic
- **reader.js** - Reader page logic

### Styling
- **styles.css** - All styling (responsive, dark mode, etc.)

### Documentation
- **README.md** - Complete feature documentation
- **DEPLOYMENT.md** - How to deploy online
- **QUICKSTART.md** - This file!

## 🔧 How to Customize

### Change Colors
Edit `styles.css` variables:
```css
:root {
    --primary-color: #1a1a2e;
    --accent-color: #e94560;
    --text-color: #eee;
}
```

### Adjust Manga Per Page
Edit `app.js`:
```javascript
this.itemsPerPage = 24; // Change this number
```

### Modify Cache Time
Edit `api-client.js`:
```javascript
this.cacheTimeout = 1000 * 60 * 30; // 30 minutes
```

## 🌐 Deploy Online (Choose One)

### GitHub Pages (Easiest)
```bash
git init
git add .
git commit -m "MangaRigX"
git push origin main
# Enable Pages in GitHub Settings
```

### Netlify (Recommended)
1. Sign up at [netlify.com](https://netlify.com)
2. Drag & drop folder
3. Deployed! ✨

### Vercel (Also Easy)
1. Sign up at [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Auto-deploys with each push!

See **DEPLOYMENT.md** for detailed instructions.

## ⌨️ Keyboard Shortcuts in Reader

| Key | Action |
|-----|--------|
| ← | Previous page |
| → | Next page |
| F | Fullscreen |
| Esc | Toggle panel |

## 🐛 Troubleshooting

**No manga showing?**
- Check internet connection
- Open DevTools (F12) > Console for errors
- Try refreshing the page

**Images not loading?**
- MangaDex API might be down
- Try a different browser
- Check your internet connection

**Favorites not saving?**
- Check if localStorage is enabled
- Try a different browser
- Private mode doesn't persist data

**Getting CORS errors?**
- MangaDex API supports CORS
- Check if MangaDex is down
- Verify your internet connection

## 📊 Data Flow

```
You Open MangaRigX
         ↓
   app.js loads
         ↓
   api-client.js fetches from MangaDex
         ↓
   ui-manager.js displays with styles.css
         ↓
   localStorage stores your favorites/preferences
```

## 🎯 Next Steps

1. ✅ **Test it locally** - Make sure everything works
2. 📝 **Customize colors** - Make it your own
3. 🌐 **Deploy** - Put it on the internet
4. 🔗 **Share** - Let others discover it!

## 💡 Pro Tips

- **Mobile Reading**: App works great on phones! Try it.
- **Dark Mode**: Perfect for night reading. Brightness slider helps.
- **Keyboard Nav**: Arrow keys are faster than mouse in reader.
- **Favorites**: You can have unlimited favorites stored locally.
- **No Login**: Everything works without accounts!

## 🆘 Getting Help

1. Check **README.md** for detailed documentation
2. Check **DEPLOYMENT.md** for deployment help
3. Open DevTools (F12) > Console to see errors
4. Check MangaDex API status if API calls fail

## 🎨 Code Structure

```
┌─────────────────────────┐
│ HTML (Structure)        │
│ - index.html            │
│ - manga-detail.html     │
│ - reader.html           │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ JavaScript (Logic)      │
│ - app.js                │
│ - manga-detail.js       │
│ - reader.js             │
│ - api-client.js         │
│ - ui-manager.js         │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ CSS (Styling)           │
│ - styles.css            │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ LocalStorage            │
│ (Favorites, History)    │
└─────────────────────────┘
```

## 🚀 Ready to Deploy?

1. Everything works offline except manga fetching (that requires internet)
2. All code is client-side, no server needed
3. MangaDex API is free and public
4. Just upload to web host and you're done!

See **DEPLOYMENT.md** for step-by-step instructions.

## 📚 Learn More

- **MangaDex API**: https://api.mangadex.org/docs
- **MDN Web Docs**: https://developer.mozilla.org/
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*

## 🎉 You're All Set!

MangaRigX is ready to use! Here's what to do next:

1. **Play with it** - Explore all features
2. **Make it yours** - Customize colors and layout
3. **Share it** - Deploy and send to friends
4. **Extend it** - Add more features if you want

Enjoy your manga reading platform! 📖✨

---

**Any questions?** All answers are in README.md and DEPLOYMENT.md!
