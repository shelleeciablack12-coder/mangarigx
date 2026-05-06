# MangaRigX Deployment Guide

This guide covers how to deploy MangaRigX to various platforms.

## Local Development

### Quick Start
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npm install -g http-server
http-server
```

Visit `http://localhost:8000` in your browser.

## Deployment Options

### 1. GitHub Pages (Free)

**Easiest option for static hosting!**

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: MangaRigX"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/MangaRigX.git
git branch -M main
git push -u origin main

# Enable GitHub Pages in repository settings
# Settings > Pages > Source: main branch > Save
```

Access at: `https://YOUR_USERNAME.github.io/MangaRigX/`

### 2. Netlify (Free & Easy)

**Recommended! Automatic deployments from Git.**

1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Settings:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
4. Deploy!

### 3. Vercel (Free & Fast)

1. Sign up at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Project settings:
   - Framework: Other
   - Build command: (leave empty)
   - Output directory: (leave empty)
4. Deploy!

### 4. Firebase Hosting (Free tier available)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy
```

### 5. Traditional Web Host

**Using cPanel or similar:**

1. Upload files via FTP to public_html/
2. Make sure index.html is in the root
3. Access via your domain

**Using SSH:**
```bash
# Copy files to server
scp -r ./* user@server:/path/to/public_html/
```

### 6. Docker Deployment

**For containerized hosting:**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g http-server
EXPOSE 8080
CMD ["http-server", "-p", "8080"]
```

Build and run:
```bash
docker build -t mangarigx .
docker run -p 8080:8080 mangarigx
```

## Performance Optimization

### Before Deployment

1. **Minify CSS** (optional)
   ```bash
   npm install -g csso-cli
   csso styles.css -o styles.min.css
   ```

2. **Test on slow connections**
   - Open DevTools > Network > Throttle to "Slow 3G"
   - Ensure smooth loading

3. **Test on different devices**
   - Mobile (iOS Safari, Chrome Android)
   - Tablet
   - Desktop

4. **Check API response times**
   - Use DevTools > Network tab
   - Monitor API latency from MangaDex

### Caching Headers

If using a web server that supports it, add caching headers:

```nginx
# For Nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

## CORS Configuration

**Important**: MangaDex API supports CORS, so no proxy needed!

If you encounter CORS issues:
1. Verify you're using the correct API endpoint
2. Check if MangaDex API is experiencing issues
3. Use browser DevTools to inspect network requests

## Monitoring & Analytics

### Adding Google Analytics (Optional)

Add to `index.html`, `manga-detail.html`, and `reader.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Replace `GA_MEASUREMENT_ID` with your Google Analytics ID.

## SSL/HTTPS

**Required for modern browsers.**

- GitHub Pages: Automatic HTTPS ✅
- Netlify: Automatic HTTPS ✅
- Vercel: Automatic HTTPS ✅
- Firebase: Automatic HTTPS ✅
- Traditional hosts: Use Let's Encrypt or your host's SSL

## Troubleshooting Deployment

### "Cannot GET /manga-detail.html"
- Make sure all HTML files are in the root directory
- Check file naming (case-sensitive on Linux servers)

### API calls failing
- Check browser console for errors (F12)
- Verify MangaDex API is accessible
- Check if your host blocks external API calls (unlikely)

### Images not loading
- Verify internet connection
- Check MangaDex CDN status
- Inspect network tab in DevTools

### localStorage not working
- Some hosts require HTTPS for localStorage
- Private/incognito mode may disable it
- Try another browser

## Environment Variables

For future backend integration, add `.env` support:

Create `config.js`:
```javascript
const config = {
    API_BASE: process.env.API_BASE || 'https://api.mangadex.org',
    ENVIRONMENT: process.env.NODE_ENV || 'production'
};
```

## Bandwidth Optimization

The app is already lightweight, but consider:

1. **Image optimization**: MangaDex provides optimized covers
2. **Caching**: Browser caches API responses
3. **CDN**: Your host may use CDN automatically
4. **Lazy loading**: Images load as needed

## Rollback Strategy

If deployment goes wrong:

**GitHub Pages**: Push a previous commit
```bash
git revert <commit-hash>
git push
```

**Netlify/Vercel**: Use their rollback features in dashboard

**FTP**: Keep backup of previous version

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: ./
```

## Custom Domain

### GitHub Pages + Custom Domain
1. Buy domain from registrar (Namecheap, GoDaddy, etc.)
2. Add CNAME file to repository root:
   ```
   yourdomain.com
   ```
3. Configure DNS records pointing to GitHub
4. Set custom domain in GitHub Pages settings

### Netlify + Custom Domain
1. Buy domain
2. In Netlify: Domain settings > Add custom domain
3. Update DNS records in your registrar

## Security Considerations

✅ **What's already secure:**
- No backend = no database to compromise
- All API calls to official MangaDex API
- No user authentication needed
- HTTPS recommended (provided by hosts)

⚠️ **Keep in mind:**
- localStorage is not encrypted (client-side only)
- API keys visible in code (not needed for MangaDex)
- No sensitive data stored

## Backup Strategy

```bash
# Automated daily backup
tar -czf backup-$(date +%Y%m%d).tar.gz .

# Store in cloud
# - Google Drive
# - Dropbox
# - AWS S3
# - GitHub (as archive)
```

## Performance Benchmarks

Target metrics:
- **Page Load**: < 3 seconds
- **First Paint**: < 1 second
- **Time to Interactive**: < 5 seconds
- **Lighthouse Score**: > 90

Check at: [PageSpeed Insights](https://pagespeed.web.dev/)

## Support for Different Regions

MangaDex API is available globally, but:
- Some regions may have restrictions
- Consider using a proxy if needed
- Test from different locations

---

**Questions?** Check the main README.md or create an issue on GitHub.

Happy deploying! 🚀
