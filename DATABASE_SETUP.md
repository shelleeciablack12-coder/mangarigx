# 🗄️ Database Setup Guide

This guide will help you set up Supabase and Firebase for your MangaRigX project.

## 1. Supabase Setup (Core Database)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Fill in project details:
   - Name: `mangarigx` (or whatever you prefer)
   - Database Password: Choose a strong password
   - Region: Select closest to you

### Step 2: Get Your Project Credentials
1. Go to Project Settings → API
2. Copy your Project URL and anon public key
3. These will look like:
   - URL: `https://abcdefghijklmnop.supabase.co`
   - Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Set Up Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `database-schema.sql`
3. Click "Run" to create the tables

## 2. Firebase Setup (Cache Layer)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter project name: `mangarigx-cache` (or whatever you prefer)
4. Enable Google Analytics if you want (optional)

### Step 2: Enable Firestore
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (you can change security rules later)
4. Select a location close to your users

### Step 3: Get Your Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>)
4. Register your app with name "MangaRigX"
5. Copy the config object - it will look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

> If you don’t have Firebase credentials yet, leave `FIREBASE_CONFIG` as `null` in `db-config.js`. The app will still run using Supabase and MangaDex as a fallback.

## 3. Configure Your App

### Step 1: Update db-config.js
Open `db-config.js` and replace the placeholder values:

```javascript
// Replace these with your actual credentials
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co', // Your Supabase URL
    anonKey: 'your-supabase-anon-key' // Your Supabase anon key
};

const FIREBASE_CONFIG = {
    apiKey: "your-firebase-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### Step 2: Test the Setup
1. Open your app in the browser
2. Try searching for a manga
3. Check browser console for success messages:
   - ✅ Supabase initialized
   - ✅ Firestore initialized
   - 💾 Saved manga to library
   - ⚡ Cached search results

## 4. Security Considerations

### Supabase Security
- For production, update the Row Level Security policies
- Consider implementing user authentication
- Limit database access based on user roles

### Firebase Security
- Update Firestore security rules from "test mode"
- Consider implementing Firebase Authentication
- Set up proper read/write permissions

## 5. Troubleshooting

### Common Issues:

**"Supabase initialization failed"**
- Check your URL and anon key are correct
- Make sure the project is active

**"Firestore initialization failed"**
- Verify Firebase config values
- Ensure Firestore is enabled in your project

**Database operations failing**
- Check browser console for detailed error messages
- Verify your network connection
- Make sure CORS is properly configured

### Testing Database Connection:

You can test if everything is working by:

1. Opening browser developer tools (F12)
2. Going to Console tab
3. Running: `window.dbClient.supabase` - should show Supabase client
4. Running: `window.dbClient.firestore` - should show Firestore instance

## 6. Next Steps

Once databases are set up, your app will:
- ✅ Cache search results for faster subsequent searches
- ✅ Store manga permanently in your library
- ✅ Track recently viewed manga
- ✅ Provide faster loading times
- ✅ Work offline for previously viewed content

The system now follows the architecture:
- **Supabase** = Permanent manga library
- **Firestore** = Fast cache layer
- **MangaDex** = External API fallback