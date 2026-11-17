import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    return {
      // Los archivos generados por el build (JS, CSS, imágenes importadas)
      // se copian al static de Django, que los sirve bajo /django_static/.
      base: isProduction ? '/django_static/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Cada vez que una petición empiece por /api, la mandamos a Django
          '/api': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
            // Opcional: si en Django NO pusiste el prefijo /api/ en urls.py,
            // podrías quitarlo aquí, pero como acordamos ponerlo, déjalo así.
            // rewrite: (path) => path.replace(/^\/api/, '') 
          },
          // Acceso por la plataforma (login, logout): lo atiende Django
          '/accounts': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
          },
          // También añade el admin para poder entrar desde el puerto 3000
          '/admin': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
          },
          // Y los estáticos de Django para que el admin se vea bien
          '/django_static': {
            target: 'http://127.0.0.1:8080',
            changeOrigin: true,
          },
          // auth_service no permite por CORS el origen de Vite: suite-shell.js pide aquí el catálogo de apps
          // de la barra lateral (authUrl de components/suite/SuiteLayout.tsx, solo en desarrollo).
          '/plataforma-auth': {
            target: 'https://gtsst.uapa.edu.do',
            changeOrigin: true,
            secure: true,
            rewrite: (p) => p.replace(/^\/plataforma-auth/, '/serviceserver/auth'),
          },
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // El build va directo a Django: frontend/index.html (lo entrega render_app tal cual) y frontend/assets/
        // (estáticos bajo /django_static/). Se vacía en cada build: ahí solo hay archivos generados.
        outDir: path.resolve(__dirname, '../../Backend/frontend'),
        emptyOutDir: true,
        rollupOptions: {
          output: {
            // Con hash: index.html (sin caché) apunta siempre a los archivos nuevos, sin ?v= a mano.
            entryFileNames: `assets/[name]-[hash].js`,
            chunkFileNames: `assets/[name]-[hash].js`,
            assetFileNames: `assets/[name]-[hash].[ext]`
          }
        }
      }
    };
});
