import { spawn } from 'child_process';
import { createServer } from 'http';
import { createReadStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { request } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_PORT = process.env.PORT || 3000;
const API_PORT = 3001;

process.env.PORT = String(API_PORT);
spawn('node', ['--enable-source-maps', './dist/index.mjs'], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: 'inherit'
});

await new Promise(r => setTimeout(r, 3000));

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.mp4': 'video/mp4',
};

createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    const proxy = request({ hostname: 'localhost', port: API_PORT,
      path: req.url, method: req.method, headers: req.headers },
      (pr) => { res.writeHead(pr.statusCode, pr.headers); pr.pipe(res); });
    req.pipe(proxy);
    return;
  }
  let fp = join(__dirname, 'public', pathname);
  if (!existsSync(fp) || !extname(fp)) fp = join(__dirname, 'public', 'index.html');
  const ct = mimeTypes[extname(fp)] || 'text/html';
  res.writeHead(200, { 'Content-Type': ct });
  createReadStream(fp).pipe(res);
}).listen(STATIC_PORT, () => console.log(`Running on port ${STATIC_PORT}`));
