import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import {
  buildPrecacheUrlList,
  injectPrecacheIntoServiceWorker,
} from '../src/utils/pwaPrecacheManifest.ts';

function collectFilesRecursively(rootDir: string, currentDir = rootDir): string[] {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursively(rootDir, fullPath));
    } else if (entry.isFile()) {
      results.push(path.relative(rootDir, fullPath));
    }
  }

  return results;
}

/**
 * Injects the exact emitted dist asset list and content hash into dist/sw.js after Vite bundles.
 */
export function circuitPwaPrecachePlugin(): Plugin {
  let outDirAbsolute = '';

  return {
    name: 'circuit-sandbox-pwa-precache',
    apply: 'build',
    configResolved(config: ResolvedConfig) {
      outDirAbsolute = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const swOutputPath = path.join(outDirAbsolute, 'sw.js');
      if (!fs.existsSync(swOutputPath)) {
        throw new Error(`Expected built service worker at ${swOutputPath}, but none was found.`);
      }

      const allRelativeFiles = collectFilesRecursively(outDirAbsolute);
      const precacheUrls = buildPrecacheUrlList(allRelativeFiles);

      const digest = createHash('sha256');
      for (const url of precacheUrls) {
        digest.update(url);
        if (url === '/') continue;
        const diskPath = path.join(outDirAbsolute, url.slice(1));
        if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
          digest.update(fs.readFileSync(diskPath));
        }
      }

      const versionHash = `v-${digest.digest('hex').slice(0, 12)}`;
      const templateSource = fs.readFileSync(swOutputPath, 'utf-8');
      const compiledSw = injectPrecacheIntoServiceWorker(templateSource, versionHash, precacheUrls);
      fs.writeFileSync(swOutputPath, compiledSw, 'utf-8');
    },
  };
}
