import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createObp1App } from './src/obp1App.ts';

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = createObp1App();

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OBP-1™ verification authority listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('OBP-1 failed to start', error);
  process.exitCode = 1;
});
