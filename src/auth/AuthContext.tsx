import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthContextType, AuthStatus, SynapsisUser } from './types';
import { resolveSynapsisUser } from './userDirectory';
import { checkDeviceAuthCapabilities, promptDeviceBiometrics } from './deviceAuthenticator';
import { markUserOffline, getOrCreateClientSessionId } from '../firebase/presenceService';
import { requestPersistentStorage } from '../security/storagePersistence';

// Interceptor defensivo para capturar condiciones de carrera de popup
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event.reason?.message || String(event.reason || '');
    if (reasonStr.includes('Pending promise was never set')) {
      event.preventDefault();
      console.warn('[SYNAPSIS IAM] Interceptada race condition interna de Firebase Auth.');
    }
  });

  window.addEventListener('error', (event) => {
    const errorStr = event.message || String(event.error || '');
    if (errorStr.includes('Pending promise was never set')) {
      event.preventDefault();
      console.warn('[SYNAPSIS IAM] Interceptada race condition interna de Firebase Auth.');
    }
  });
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('AUTHENTICATING');
  const [user, setUser] = useState<SynapsisUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeviceAuthAvailable, setIsDeviceAuthAvailable] = useState<boolean>(false);
  const [isDeviceAuthenticated, setIsDeviceAuthenticated] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const isSigningInRef = useRef<boolean>(false);

  // 1. Inicializar capacidades del dispositivo
  useEffect(() => {
    checkDeviceAuthCapabilities().then((cap) => {
      setIsDeviceAuthAvailable(cap.platformAuthenticatorAvailable);
    });
  }, []);

  // 2. Procesar el resultado de redirección (móviles y navegadores estándar)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log('[SYNAPSIS IAM] Autenticación completada vía redirección:', result.user.email);
          const resolved = resolveSynapsisUser(result.user);
          if (resolved) {
            setUser(resolved);
            setIsDeviceAuthenticated(true);
            setStatus('AUTHENTICATED');
            setErrorMessage(null);
          }
        }
      })
      .catch((err: any) => {
        console.error('[SYNAPSIS IAM] Error en getRedirectResult:', err);
        if (err?.code === 'auth/unauthorized-domain') {
          const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
          setStatus('UNAUTHENTICATED');
          setErrorMessage(`Dominio no autorizado en Firebase (${currentHost}). Agregue este dominio en Firebase Console -> Authentication -> Settings -> Dominios autorizados.`);
        } else if (err?.code) {
          setStatus('UNAUTHENTICATED');
          setErrorMessage(`Error de verificación (${err.code}): ${err.message || 'Inténtelo nuevamente'}`);
        }
      });
  }, []);

  // 3. Observador central onAuthStateChanged de Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentFirebaseUser) => {
        setFirebaseUser(currentFirebaseUser);

        if (!currentFirebaseUser) {
          setUser(null);
          setStatus('UNAUTHENTICATED');
          setIsDeviceAuthenticated(false);
          return;
        }

        // Sesión anónima no concede acceso clínico
        if (currentFirebaseUser.isAnonymous) {
          setUser(null);
          setStatus('UNAUTHENTICATED');
          setIsDeviceAuthenticated(false);
          return;
        }

        // Resolver la identidad y rol según el Directorio Institucional
        const resolved = resolveSynapsisUser(currentFirebaseUser);

        if (!resolved) {
          // Usuario autenticado con Google pero no registrado en CORTEX AXIS
          setUser(null);
          setStatus('UNAUTHORIZED');
          setIsDeviceAuthenticated(false);
          return;
        }

        setUser(resolved);
        setIsDeviceAuthenticated(true);
        setStatus('AUTHENTICATED');
        setErrorMessage(null);

        // Blindar almacenamiento local de la terminal (Secured Local Draft Sanctuary)
        requestPersistentStorage().catch(() => {});
      },
      (error) => {
        console.error('[SYNAPSIS IAM] Error en observador de autenticación:', error);
        setStatus('AUTH_ERROR');
        setErrorMessage('Error al verificar la sesión institucional.');
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Inicio de sesión con Google
  const signInWithGoogle = useCallback(async () => {
    if (isSigningInRef.current) {
      return;
    }
    isSigningInRef.current = true;
    setIsSigningIn(true);
    setErrorMessage(null);

    // Si ya existe un usuario autenticado en Firebase
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      const resolved = resolveSynapsisUser(auth.currentUser);
      if (resolved) {
        setUser(resolved);
        setIsDeviceAuthenticated(true);
        setStatus('AUTHENTICATED');
        setIsSigningIn(false);
        isSigningInRef.current = false;
        return;
      }
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        const resolved = resolveSynapsisUser(result.user);
        if (resolved) {
          setUser(resolved);
          setIsDeviceAuthenticated(true);
          setStatus('AUTHENTICATED');
          setErrorMessage(null);
          return;
        } else {
          setUser(null);
          setStatus('UNAUTHORIZED');
          setIsDeviceAuthenticated(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('[SYNAPSIS IAM] Resultado de login de Google:', err?.code || err?.message);

      // Si la sesión ya fue resuelta por Firebase
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        const resolved = resolveSynapsisUser(auth.currentUser);
        if (resolved) {
          setUser(resolved);
          setIsDeviceAuthenticated(true);
          setStatus('AUTHENTICATED');
          setErrorMessage(null);
          return;
        }
      }

      // Dominio no autorizado en Firebase Auth
      if (err?.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
        setStatus('UNAUTHENTICATED');
        setErrorMessage(`Dominio no autorizado en Firebase (${currentHost}). Este dominio debe registrarse en Firebase Console -> Authentication -> Settings -> Dominios autorizados.`);
        return;
      }

      // Si el navegador bloqueó la ventana emergente y está fuera de iframe en móvil, intentar redirección
      if (
        (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') &&
        !isInIframe
      ) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          console.error('[SYNAPSIS IAM] Error en redirección:', redirectErr);
          if (redirectErr?.code === 'auth/unauthorized-domain') {
            const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
            setStatus('UNAUTHENTICATED');
            setErrorMessage(`Dominio no autorizado en Firebase (${currentHost}). Agregue este dominio en Firebase Console.`);
            return;
          }
        }
      }

      setStatus('UNAUTHENTICATED');

      if (err?.code === 'auth/popup-closed-by-user') {
        if (isInIframe && isMobile) {
          setErrorMessage('La ventana de Google fue restringida por el visor móvil. Abre la aplicación en una pestaña nueva del navegador para continuar.');
        } else {
          setErrorMessage('La ventana de autenticación fue cerrada antes de completar el inicio de sesión.');
        }
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Operación en curso. Toque el botón nuevamente.');
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMessage('Error de conexión con el servicio de Google. Verifique su acceso a internet.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMessage('El proveedor Google no está habilitado en la consola del proyecto Firebase.');
      } else if (err?.code) {
        setErrorMessage(`Error de autenticación [${err.code}]: ${err.message || 'Inténtelo nuevamente.'}`);
      } else {
        setErrorMessage(err?.message || 'No se pudo completar la verificación. Inténtelo nuevamente.');
      }
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  }, []);

  // 5. Verificación de presencia en el dispositivo (WebAuthn)
  const verifyDeviceBiometrics = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const result = await promptDeviceBiometrics(user.displayName);
    if (result.success) {
      setIsDeviceAuthenticated(true);
      setUser((prev) => (prev ? { ...prev, deviceAuthenticated: true } : null));
      return true;
    } else {
      if (!result.cancelled) {
        setErrorMessage(result.error || 'No se pudo verificar el autenticador del dispositivo');
      }
      return false;
    }
  }, [user]);

  // 6. Cierre de sesión seguro y destructivo (signOut)
  const logout = useCallback(async () => {
    try {
      if (user) {
        // Marcado offline desacoplado en segundo plano (no bloqueante)
        markUserOffline(user, getOrCreateClientSessionId()).catch((err) => {
          console.warn('[SYNAPSIS IAM] Error no bloqueante al marcar offline:', err);
        });
      }
      // Limpieza de almacenamiento de sesión transitoria
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          window.sessionStorage.clear();
        } catch {}
      }
      // Invalidación oficial de tokens en Firebase Auth
      await signOut(auth);
    } catch (err) {
      console.error('[SYNAPSIS IAM] Error cerrando sesión:', err);
    } finally {
      // Transición reactiva inmediata a LoginScreen sin recarga de página (evita race conditions en IndexedDB)
      setUser(null);
      setFirebaseUser(null);
      setIsDeviceAuthenticated(false);
      setStatus('UNAUTHENTICATED');
      setErrorMessage(null);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const bypassLocalDoctor = useCallback(() => {
    setUser({
      uid: 'dr-samir-local',
      email: 'moucharrafiepc@gmail.com',
      displayName: 'Dr. Samir Moucharrafie Naime',
      role: 'MEDICO',
      tenantId: 'CCMI-DR-SAMIR',
      isVerified: true,
      deviceAuthenticated: true,
    });
    setStatus('AUTHENTICATED');
    setErrorMessage(null);
  }, []);

  const neuralState = (() => {
    if (isSigningIn) return 'NEURAL_CONNECTING';
    if (status === 'AUTHENTICATING') return 'NEURAL_CONNECTING';
    if (status === 'AUTH_ERROR' || errorMessage || status === 'UNAUTHORIZED') return 'NEURAL_ERROR';
    if (status === 'AUTHENTICATED') return 'NEURAL_AUTHORIZED';
    return 'NEURAL_IDLE';
  })();

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        firebaseUser,
        errorMessage,
        isDeviceAuthAvailable,
        isDeviceAuthenticated,
        signInWithGoogle,
        loginWithGoogle: signInWithGoogle,
        bypassLocalDoctor,
        neuralState,
        verifyDeviceBiometrics,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
