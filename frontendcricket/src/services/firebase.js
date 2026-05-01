import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, off } from 'firebase/database'

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stumpostats.firebaseapp.com",
  databaseURL:       import.meta.env.VITE_FIREBASE_DB_URL || "https://stumpostats-default-rtdb.firebaseio.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "stumpostats",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stumpostats.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
}

let app, database

try {
  app = initializeApp(firebaseConfig)
  database = getDatabase(app)
} catch (e) {
  console.warn('Firebase init failed — live scores will use polling fallback')
}

export { database, ref, onValue, off }
export default app
