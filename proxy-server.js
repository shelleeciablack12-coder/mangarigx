const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Middleware to proxy API requests
app.use('/api', (req, res) => {
    const apiUrl = 'https://api.mangadex.org' + req.url;

    console.log('Proxying API request to:', apiUrl);

    const options = {
        headers: {
            'User-Agent': 'MangaRigX-Dev/1.0'
        }
    };

    https.get(apiUrl, options, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.status(apiRes.statusCode).send(data);
        });
    }).on('error', (err) => {
        console.error('API Proxy error:', err);
        res.status(500).json({ error: 'API Proxy error', message: err.message });
    });
});

// Middleware to proxy image requests
app.use('/images', (req, res) => {
    const imageUrl = 'https://uploads.mangadex.org' + req.url;

    console.log('Proxying image request to:', imageUrl);

    const options = {
        headers: {
            'User-Agent': 'MangaRigX-Dev/1.0'
        }
    };

    https.get(imageUrl, options, (apiRes) => {
        res.setHeader('Content-Type', apiRes.headers['content-type'] || 'image/jpeg');
        apiRes.pipe(res);
    }).on('error', (err) => {
        console.error('Image proxy error:', err);
        res.status(500).send('Image proxy error');
    });
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});