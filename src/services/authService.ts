import {
  createUserWithEmailAndPassword, onAuthStateChanged,
  signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth';
import { FirebaseConfigurationError, getFirebaseAuth } from '../firebase/config';
import type { Usuario } from '../types';

const mensajes: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya está registrado. Inicia sesión con tu cuenta.',
  'auth/invalid-email': 'Escribe un correo electrónico válido.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres y revisa la política de tu proyecto.',
  'auth/password-does-not-meet-requirements': 'La contraseña no cumple la política de seguridad del proyecto.',
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/invalid-login-credentials': 'El correo o la contraseña son incorrectos.',
  'auth/wrong-password': 'El correo o la contraseña son incorrectos.',
  'auth/user-not-found': 'El correo o la contraseña son incorrectos.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión a Internet e inténtalo nuevamente.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está disponible en este proyecto.',
  'auth/invalid-api-key': 'La configuración de Firebase no es válida. Revisa .env y reinicia Expo.',
  'auth/app-not-authorized': 'Esta aplicación no está autorizada para usar el proyecto de Firebase.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase.',
  'auth/requires-recent-login': 'Vuelve a iniciar sesión para continuar.',
  'auth/web-storage-unsupported': 'No se pudo guardar la sesión en este dispositivo.',
  'auth/quota-exceeded': 'Se alcanzó el límite de solicitudes. Inténtalo más tarde.',
};
export function traducirErrorAuth(error: unknown): string {
  if (error instanceof FirebaseConfigurationError) return error.message;
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return mensajes[error.code] ?? 'No se pudo completar la operación. Inténtalo nuevamente.';
  }
  return 'No se pudo completar la operación. Inténtalo nuevamente.';
}
function usuarioPublico(user: User): Usuario { return { uid: user.uid, email: user.email }; }
async function ejecutar<T>(operacion: () => Promise<T>): Promise<T> {
  try { return await operacion(); }
  catch (error: unknown) { throw new Error(traducirErrorAuth(error)); }
}

export interface AuthService {
  registrar: (correo: string, clave: string) => Promise<Usuario>;
  ingresar: (correo: string, clave: string) => Promise<Usuario>;
  salir: () => Promise<void>;
  observarSesion: (alCambiar: (usuario: Usuario | null) => void, alFallar: (mensaje: string) => void) => () => void;
}
export const authService: AuthService = {
  registrar: (correo, clave) => ejecutar(async () => usuarioPublico((await createUserWithEmailAndPassword(getFirebaseAuth(), correo.trim(), clave)).user)),
  ingresar: (correo, clave) => ejecutar(async () => usuarioPublico((await signInWithEmailAndPassword(getFirebaseAuth(), correo.trim(), clave)).user)),
  salir: () => ejecutar(() => signOut(getFirebaseAuth())),
  observarSesion: (alCambiar, alFallar) => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), user => alCambiar(user ? usuarioPublico(user) : null), error => alFallar(traducirErrorAuth(error)));
    } catch (error: unknown) {
      alFallar(traducirErrorAuth(error));
      return () => {};
    }
  },
};
