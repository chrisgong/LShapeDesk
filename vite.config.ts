import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const HISTORY_DIR = path.resolve(__dirname, 'history');
const HISTORY_FILE = path.resolve(HISTORY_DIR, 'history.json');

function ensureHistoryFile() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '[]', 'utf-8');
  }
}

function historyApiPlugin(): Plugin {
  return {
    name: 'history-file-api',
    configureServer(server) {
      ensureHistoryFile();

      server.middlewares.use('/api/history', (req, res, next) => {
        ensureHistoryFile();

        if (req.method === 'GET') {
          try {
            const content = fs.readFileSync(HISTORY_FILE, 'utf-8') || '[]';
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(content);
          } catch (err) {
            console.error('Failed to read history file', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read history' }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '[]');
              fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
              res.statusCode = 204;
              res.end();
            } catch (err) {
              console.error('Failed to write history file', err);
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid history payload' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    historyApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
