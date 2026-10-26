import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

export class FirebaseConfigurationError extends Error {
  constructor(nombresFaltantes: string[]) {
    super(`Firebase no recibió estas variables: ${nombresFaltantes.join(', ')}. Reinicia Expo desde la carpeta mi-cartelera-personal con la caché limpia y vuelve a abrir el proyecto.`);
  }
}
let authInstance: Auth | undefined;

// Único punto de inicialización. No requiere TMDB ni inicializa Firestore.
export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  // Solo se valida presencia. No imponer patrones sobre valores de Firebase.
  // Mantener las lecturas process.env explícitas para la transformación de Expo.
  const requeridas = [
    ['EXPO_PUBLIC_FIREBASE_API_KEY', config.apiKey],
    ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', config.authDomain],
    ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', config.projectId],
    ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', config.storageBucket],
    ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', config.messagingSenderId],
    ['EXPO_PUBLIC_FIREBASE_APP_ID', config.appId],
  ] as const;
  const faltantes = requeridas.filter(([, value]) => typeof value !== 'string' || value.trim().length === 0).map(([name]) => name);
  if (faltantes.length > 0) {
    throw new FirebaseConfigurationError(faltantes);
  }
  const app = getApps().some(candidate => candidate.name === '[DEFAULT]') ? getApp() : initializeApp(config);
  try {
    authInstance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error: unknown) {
    // Fast Refresh puede conservar el Auth previamente configurado.
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'auth/already-initialized') throw error;
    authInstance = getAuth(app);
  }
  return authInstance;
}
