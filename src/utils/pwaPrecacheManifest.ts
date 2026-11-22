export const SW_VERSION_TOKEN = '__CIRCUIT_SW_VERSION__';
export const SW_PRECACHE_LINE_PATTERN =
  /const PRECACHE_URLS = \/\* __CIRCUIT_PRECACHE_URLS__ \*\/ \[[\s\S]*?\];/;

export const PRECACHE_CACHE_PREFIX = 'circuit-sandbox-precache-';
export const FONT_CACHE_NAME = 'circuit-sandbox-fonts-v1';

const PRECACHE_ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.png',
  '.svg',
  '.webp',
  '.ico',
  '.webmanifest',
  '.json',
  '.woff2',
  '.woff',
]);

function normalizeRelativePath(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').replace(/^\.?\//, '');
}

function getFileExtension(normalizedPath: string): string {
  const lastSlash = normalizedPath.lastIndexOf('/');
  const filename = lastSlash >= 0 ? normalizedPath.slice(lastSlash + 1) : normalizedPath;
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
}

/**
 * Excludes the service worker itself, source maps, and dotfiles so updates never pin stale SW code.
 */
export function shouldPrecacheRelativePath(rawPath: string): boolean {
  const normalized = normalizeRelativePath(rawPath);
  if (!normalized) return false;

  const segments = normalized.split('/');
  if (segments.some((segment) => segment.startsWith('.'))) {
    return false;
  }

  if (normalized === 'sw.js' || normalized.endsWith('.map')) {
    return false;
  }

  const ext = getFileExtension(normalized);
  return PRECACHE_ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Produces a deterministic, deduplicated root-relative URL list for Service Worker precaching.
 */
export function buildPrecacheUrlList(relativeFilePaths: readonly string[]): string[] {
  const urls = new Set<string>();

  for (const rawPath of relativeFilePaths) {
    if (!shouldPrecacheRelativePath(rawPath)) continue;
    const normalized = normalizeRelativePath(rawPath);
    urls.add(`/${normalized}`);
  }

  if (urls.has('/index.html')) {
    urls.add('/');
  }

  return Array.from(urls).sort((a, b) => a.localeCompare(b));
}

/**
 * Replaces the version token and precache manifest array inside the built service worker template.
 */
export function injectPrecacheIntoServiceWorker(
  templateSource: string,
  version: string,
  urls: readonly string[]
): string {
  if (!templateSource.includes(SW_VERSION_TOKEN)) {
    throw new Error(`Service worker template is missing version token ${SW_VERSION_TOKEN}.`);
  }

  if (!SW_PRECACHE_LINE_PATTERN.test(templateSource)) {
    throw new Error('Service worker template is missing the PRECACHE_URLS injection marker.');
  }

  const sanitizedVersion = version.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!sanitizedVersion) {
    throw new Error('Service worker precache version must not be empty.');
  }

  const serializedUrls = JSON.stringify(urls, null, 2);
  return templateSource
    .replace(SW_VERSION_TOKEN, sanitizedVersion)
    .replace(SW_PRECACHE_LINE_PATTERN, `const PRECACHE_URLS = ${serializedUrls};`);
}
