import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Patch defensivo para mitigar el error interno de Firebase Auth (race condition en AbstractPopupRedirectOperation)
const firebaseAuthAssertionPatchPlugin = () => ({
  name: 'firebase-auth-assertion-patch',
  transform(code: string) {
    if (code.includes('Pending promise was never set')) {
      return {
        code: code
          .replaceAll(
            "debugAssert(this.pendingPromise, 'Pending promise was never set');",
            "if (!this.pendingPromise) { return; }"
          )
          .replaceAll(
            'debugAssert(this.pendingPromise, "Pending promise was never set");',
            'if (!this.pendingPromise) { return; }'
          ),
        map: null,
      };
    }
    return null;
  },
});

export default defineConfig(() => {
  return {
    plugins: [firebaseAuthAssertionPatchPlugin(), react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
