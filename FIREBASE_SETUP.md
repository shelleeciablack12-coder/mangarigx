# Firebase Setup for MangaRigX

This guide helps you enable Firebase Firestore and wire it into MangaRigX.

## 1. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Enter a name like `mangarigx-cache`
4. Disable Google Analytics if you prefer
5. Click **Create project**

## 2. Enable Firestore Database

1. In the Firebase console, open your project
2. Click **Firestore Database** in the left menu
3. Click **Create database**
4. Choose **Start in test mode** for now
5. Choose a location near you
6. Click **Enable**

## 3. Add a Web App and get config

1. Click the gear icon and choose **Project settings**
2. Scroll to **Your apps**
3. Click **</> Add app** to create a Web app
4. Give it a name like `MangaRigX`
5. Click **Register app**
6. Copy the config object shown on the page

The config looks like this:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:234567890abcdef"
};
```

## 4. Wire Firebase into MangaRigX

Open `db-config.js` and replace `FIREBASE_CONFIG = null` with your Firebase config object.

Example:

```javascript
const FIREBASE_CONFIG = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:234567890abcdef"
};
```

Then save the file.

## 5. Confirm Firestore is enabled

Your app already includes the required Firebase SDK scripts in `index.html`:

- `firebase-app-compat.js`
- `firebase-firestore-compat.js`

The Firestore client will initialize automatically when `db-config.js` contains a valid config.

## 6. Test the integration in the browser

1. Open `index.html`
2. Open browser console
3. Run:
   - `window.dbClient.supabase` → should show the Supabase client
   - `window.dbClient.firestore` → should show the Firestore instance if config is valid

## 7. What happens next

- If Firestore is configured, manga search results will be cached to `search_cache`
- Recently viewed manga will be stored to `recently_viewed`
- Trending cache can use `cached_data/trending`

## 8. If you want, I can also help you

- validate your Firebase config values
- verify Firestore initialization in the browser
- add Firebase security rules for production
