/**
 * Database Configuration
 * Contains Supabase and Firebase configuration for MangaRigX
 */

// Supabase Configuration (Core/Permanent Storage)
const SUPABASE_CONFIG = {
    url: 'https://bxajceidijdwrbjgrvzj.supabase.co',
    anonKey: 'sb_publishable_UOh8d2n94dk2NMbuyDryDQ_6YGTTOxB'
};

// Firebase Configuration (Cache/Speed Layer)
// Replace with your actual Firebase config once Firestore is ready.
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyByrV6uyHuU2OCgT3I4n9Rc7JWi8U6Xau8",
    authDomain: "mangarigx.firebaseapp.com",
    projectId: "mangarigx",
    storageBucket: "mangarigx.firebasestorage.app",
    messagingSenderId: "754641328155",
    appId: "1:754641328155:web:d705e9fc6b36f049c7c0be",
    measurementId: "G-N4BJ8EDERK"
};

// Example Firebase config format:
// const FIREBASE_CONFIG = {
//     apiKey: "YOUR_FIREBASE_API_KEY",
//     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//     projectId: "YOUR_PROJECT_ID",
//     storageBucket: "YOUR_PROJECT_ID.appspot.com",
//     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//     appId: "YOUR_APP_ID"
// };

// Database clients will be initialized in db-client.js
window.DB_CONFIG = {
    SUPABASE: SUPABASE_CONFIG,
    FIREBASE: FIREBASE_CONFIG
};