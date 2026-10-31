import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'serve-and-copy-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/assets/') || req.url.startsWith('assets/'))) {
            const cleanUrl = req.url.split('?')[0].replace(/^\//, '');
            const filePath = path.resolve(__dirname, cleanUrl);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.json': 'application/json',
              };
              if (mimeMap[ext]) {
                res.setHeader('Content-Type', mimeMap[ext]);
              }
              res.setHeader('Access-Control-Allow-Origin', '*');
              return fs.createReadStream(filePath).pipe(res);
            }
          }
          next();
        });
      },
      closeBundle() {
        const srcAudio = path.resolve(__dirname, 'assets/audio');
        const srcImages = path.resolve(__dirname, 'assets/images');
        const destAudio = path.resolve(__dirname, 'dist/assets/audio');
        const destImages = path.resolve(__dirname, 'dist/assets/images');
        if (fs.existsSync(srcAudio)) {
          fs.cpSync(srcAudio, destAudio, { recursive: true });
        }
        if (fs.existsSync(srcImages)) {
          fs.cpSync(srcImages, destImages, { recursive: true });
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0', // Permite que cualquier celular en la red Wi-Fi se conecte
    port: 3000,
    open: false,
  },
});
