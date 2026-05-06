const ADMIN_QUERY_PARAM = 'key';
const ADMIN_SECRET_VALUE = 'mangarigx_admin_secret';

function formatRequestDate(dateString) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function loadSavedRequests() {
    try {
        const stored = localStorage.getItem('mangarigx_requests');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Could not read saved requests:', error);
        return [];
    }
}

function renderRequests(requests) {
    const list = document.getElementById('adminRequestsList');
    if (!list) return;

    if (!requests.length) {
        list.innerHTML = `
            <div class="admin-request-item">
                <p>No saved requests yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = requests
        .map((request, index) => {
            return `
                <div class="admin-request-item">
                    <h3>Request #${requests.length - index}</h3>
                    <div class="admin-request-meta">
                        <span><strong>Name:</strong> ${request.name || 'Anonymous'}</span>
                        <span><strong>Email:</strong> ${request.email || 'Not provided'}</span>
                        <span><strong>Date:</strong> ${formatRequestDate(request.date)}</span>
                    </div>
                    <div class="admin-request-message">${request.message || 'No message provided.'}</div>
                </div>
            `;
        })
        .join('');
}

function isAdminAccessGranted() {
    const params = new URLSearchParams(window.location.search);
    return params.get(ADMIN_QUERY_PARAM) === ADMIN_SECRET_VALUE;
}

function showAccessDenied() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = `
        <section class="request-section">
            <div class="request-card">
                <div class="request-header">
                    <h2>Access Denied</h2>
                    <p>You must provide the correct secret key in the URL to view this admin page.</p>
                    <p>Example: <code>admin.html?key=${ADMIN_SECRET_VALUE}</code></p>
                </div>
            </div>
        </section>
    `;
}

function setupAdminPage() {
    if (!isAdminAccessGranted()) {
        showAccessDenied();
        return;
    }

    // Setup requests section
    const requests = loadSavedRequests();
    renderRequests(requests);

    const clearButton = document.getElementById('clearRequestsBtn');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (!confirm('Delete all saved requests from localStorage?')) return;
            localStorage.removeItem('mangarigx_requests');
            renderRequests([]);
        });
    }

    // Setup cache management section
    setupCacheManagement();
}

function setupCacheManagement() {
    const cacheSection = document.getElementById('cacheManagementSection');
    if (!cacheSection) return;

    updateCacheDisplay();

    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            uiManager.clearApiCache();
            updateCacheDisplay();
        });
    }

    const clearMangaCacheBtn = document.getElementById('clearMangaCacheBtn');
    if (clearMangaCacheBtn) {
        clearMangaCacheBtn.addEventListener('click', () => {
            uiManager.clearApiCache('mangaList');
            updateCacheDisplay();
        });
    }

    const clearChapterCacheBtn = document.getElementById('clearChapterCacheBtn');
    if (clearChapterCacheBtn) {
        clearChapterCacheBtn.addEventListener('click', () => {
            uiManager.clearApiCache('chapters');
            updateCacheDisplay();
        });
    }

    const resetStatsBtn = document.getElementById('resetStatsBtn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            uiManager.resetCacheStats();
            updateCacheDisplay();
        });
    }

    // Auto-refresh cache stats every 5 seconds
    setInterval(updateCacheDisplay, 5000);
}

function updateCacheDisplay() {
    const statsContainer = document.getElementById('cacheStatsDisplay');
    if (!statsContainer) return;

    const stats = uiManager.getCacheInfo();
    const hitRateClass = stats.hitRate !== 'N/A' && parseFloat(stats.hitRate) > 70 ? 'good' : 'normal';

    statsContainer.innerHTML = `
        <div class="cache-stats">
            <div class="stat-item">
                <span class="stat-label">Cache Hits:</span>
                <span class="stat-value">${stats.hits}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Cache Misses:</span>
                <span class="stat-value">${stats.misses}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hit Rate:</span>
                <span class="stat-value ${hitRateClass}">${stats.hitRate}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Cache Size:</span>
                <span class="stat-value">${stats.cacheSize} entries</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Stored:</span>
                <span class="stat-value">${stats.stored}</span>
            </div>
        </div>
    `;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAdminPage);
} else {
    setupAdminPage();
}
