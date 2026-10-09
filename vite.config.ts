import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Firebase authorizes localhost for development; use it for browser documents.
const localAuthHost = (): Plugin => ({
  name: 'statai-local-auth-host',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const localAddress = request.headers.host?.match(/^127\.0\.0\.1(?::(\d+))?$/);
      if (!localAddress || !request.headers.accept?.includes('text/html')) return next();
      const port = localAddress[1] ? ':' + localAddress[1] : '';
      const resource = request.url?.startsWith('/') ? request.url : '/';
      response.statusCode = 302;
      response.setHeader('Location', 'http://localhost' + port + resource);
      response.end();
    });
  },
});

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/remote-storage': {
            target: 'https://firebasestorage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/remote-storage/, ''),
          },
        },
      },
      plugins: [react(), localAuthHost()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
