import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';

function AppContent() {
  const { status, user } = useAuth();

  // Si el usuario está autenticado y autorizado por el Directorio Institucional
  if (status === 'AUTHENTICATED' && user) {
    return (
      <div id="socs-app-container" className="min-h-screen transition-colors duration-200 selection:bg-blue-600 selection:text-white">
        <Dashboard />
      </div>
    );
  }

  // De lo contrario, mostrar la pantalla de inicio de sesión con Google y validación de permisos
  return <LoginScreen />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

