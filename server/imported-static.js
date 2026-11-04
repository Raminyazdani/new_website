'use strict';

const { readFile, realpath } = require('node:fs/promises');
const { extname, isAbsolute, join, relative, sep } = require('node:path');
const { headers } = require('../vercel.json');

const publicRoot = join(__dirname, '..', 'public');
const prefix = '/imported';
const securityHeaders = Object.fromEntries(headers[0].headers.map(({ key, value }) => [key, value]));
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function staticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded !== prefix && !decoded.startsWith(`${prefix}/`)) return null;
  const route = decoded.slice(prefix.length + 1).replace(/\/$/, '');
  const segments = route ? route.split('/') : [];
  if (segments.some(segment => !segment || segment.startsWith('.') || /^cv\.json(?:\.|$)/i.test(segment)
    || /[\\:\x00-\x1f<>"|*?]/.test(segment) || /[ .]$/.test(segment))) return null;

  const extension = extname(segments.at(-1) || '');
  if (extension && !Object.hasOwn(mime, extension)) return null;
  return {
    parts: extension ? segments : [...segments, 'index.html'],
    type: mime[extension || '.html'],
  };
}

async function serveImported(req, res, pathname) {
  try {
    const route = ['GET', 'HEAD'].includes(req.method) ? staticPath(pathname) : null;
    if (route) {
      const root = join(await realpath(publicRoot), 'imported');
      const file = await realpath(join(root, ...route.parts));
      const local = relative(root, file);
      if (local && !isAbsolute(local) && local !== '..' && !local.startsWith(`..${sep}`)) {
        const data = await readFile(file);
        res.writeHead(200, { ...securityHeaders, 'Content-Type': route.type, 'Cache-Control': 'no-store' });
        return res.end(req.method === 'HEAD' ? undefined : data);
      }
    }
  } catch (error) {
    if (!['ENOENT', 'ENOTDIR', 'EISDIR', 'EINVAL'].includes(error.code) && !(error instanceof URIError)) {
      res.writeHead(500, securityHeaders);
      return res.end('Unavailable');
    }
  }
  res.writeHead(404, securityHeaders);
  return res.end('Not found');
}

module.exports = { serveImported };
