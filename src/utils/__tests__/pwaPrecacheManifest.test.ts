import { describe, expect, it } from 'vitest';
import {
  SW_VERSION_TOKEN,
  buildPrecacheUrlList,
  injectPrecacheIntoServiceWorker,
  shouldPrecacheRelativePath,
} from '../pwaPrecacheManifest';

describe('PWA Precache Manifest Builder', () => {
  it('filters emitted build artifacts and excludes sw.js, source maps, and dotfiles', () => {
    expect(shouldPrecacheRelativePath('index.html')).toBe(true);
    expect(shouldPrecacheRelativePath('assets/index-Abc123.js')).toBe(true);
    expect(shouldPrecacheRelativePath('assets/index-Abc123.css')).toBe(true);
    expect(shouldPrecacheRelativePath('icons/pwa-192x192.png')).toBe(true);
    expect(shouldPrecacheRelativePath('manifest.webmanifest')).toBe(true);

    expect(shouldPrecacheRelativePath('sw.js')).toBe(false);
    expect(shouldPrecacheRelativePath('assets/index-Abc123.js.map')).toBe(false);
    expect(shouldPrecacheRelativePath('.DS_Store')).toBe(false);
    expect(shouldPrecacheRelativePath('assets/.gitkeep')).toBe(false);
    expect(shouldPrecacheRelativePath('README.md')).toBe(false);
  });

  it('normalizes slashes, includes root route when index.html exists, and deduplicates deterministically', () => {
    const urls = buildPrecacheUrlList([
      'assets\\vendor-reactflow.js',
      'index.html',
      './index.html',
      'sw.js',
      'icons/pwa-512x512.png',
      'manifest.webmanifest',
      'assets/app.js.map',
    ]);

    expect(urls).toEqual([
      '/',
      '/assets/vendor-reactflow.js',
      '/icons/pwa-512x512.png',
      '/index.html',
      '/manifest.webmanifest',
    ]);
  });

  it('injects precache version and URL array into the service worker template', () => {
    const template = [
      `const PRECACHE_VERSION = '${SW_VERSION_TOKEN}';`,
      "const PRECACHE_URLS = /* __CIRCUIT_PRECACHE_URLS__ */ ['/', '/index.html'];",
    ].join('\n');

    const compiled = injectPrecacheIntoServiceWorker(template, 'v-abc123def456', [
      '/',
      '/assets/app.js',
      '/index.html',
    ]);

    expect(compiled).toContain("const PRECACHE_VERSION = 'v-abc123def456';");
    expect(compiled).not.toContain(SW_VERSION_TOKEN);
    expect(compiled).not.toContain('__CIRCUIT_PRECACHE_URLS__');
    expect(compiled).toContain('"/assets/app.js"');
  });

  it('throws an explicit build error when required markers are absent', () => {
    expect(() =>
      injectPrecacheIntoServiceWorker('const x = 1;', 'v-123', ['/index.html'])
    ).toThrow(/missing version token/i);

    expect(() =>
      injectPrecacheIntoServiceWorker(`const v = '${SW_VERSION_TOKEN}';`, 'v-123', ['/index.html'])
    ).toThrow(/missing the PRECACHE_URLS injection marker/i);
  });
});
