/**
 * Layer: Infrastructure
 * File: FirebaseConfig.js
 * Responsibility:
 * Initializes Firebase Admin SDK as a singleton and exports Firestore and Auth service clients.
 */

import admin from 'firebase-admin';

let firebaseInitialized = false;
let dbInstance = null;
let authInstance = null;

export function initializeFirebase() {
  // Protección 1: Flag booleano local
  if (firebaseInitialized) {
    console.log('⚠️ Firebase ya inicializado, omitiendo...');
    return;
  }

  // Protección 2: Verificar si Firebase Admin ya tiene apps inicializadas
  if (admin.apps.length > 0) {
    console.log('⚠️ Firebase Admin ya tiene apps activas, omitiendo...');
    firebaseInitialized = true;
    dbInstance = admin.firestore();
    authInstance = admin.auth();
    return;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY no está definida');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    dbInstance = admin.firestore();
    authInstance = admin.auth();
    firebaseInitialized = true;

    console.log('✅ Firebase Admin SDK inicializado correctamente');
    console.log(`📊 Proyecto Firebase: ${process.env.FIREBASE_PROJECT_ID}`);
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    process.exit(1);
  }
}

/**
 * Getter para Firestore con verificación de inicialización.
 * Lanza error si se intenta usar antes de inicializar.
 */
function getDb() {
  if (!dbInstance) {
    throw new Error('Firebase no está inicializado. Llama a initializeFirebase() primero.');
  }
  return dbInstance;
}

/**
 * Getter para Auth con verificación de inicialización.
 */
function getAuth() {
  if (!authInstance) {
    throw new Error('Firebase no está inicializado. Llama a initializeFirebase() primero.');
  }
  return authInstance;
}

// Crear proxy para exportar db y auth con lazy evaluation
export const db = new Proxy({}, {
  get(target, prop) {
    return getDb()[prop];
  }
});

export const auth = new Proxy({}, {
  get(target, prop) {
    return getAuth()[prop];
  }
});

export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

export default admin;
