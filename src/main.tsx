import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { cleanCorruptedStationeryCache } from './utils/templateStorage';
import { CalibrationStorageV2 } from './calibration/CalibrationStorageV2';
import { validateFirestoreConnection } from './firebase/config';
import { PDFTemplatePreloader } from './utils/PDFTemplatePreloader';

// Inicialización resiliente en segundo plano (no bloquea el render de la interfaz)
try {
  cleanCorruptedStationeryCache().catch(() => {});
} catch {}

try {
  CalibrationStorageV2.runCentinelaSanitization();
} catch {}

try {
  PDFTemplatePreloader.preloadAll();
} catch {}

try {
  validateFirestoreConnection().catch(() => {});
} catch {}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
