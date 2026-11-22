import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetPwaControllerForTests,
  detectIosSafari,
  detectStandaloneMode,
  dismissPwaUpdateBanner,
  extractCacheVersionLabel,
  getPwaSnapshot,
  inspectOfflineCacheReadiness,
  refreshOfflineCacheInspection,
} from '../pwaManager';
import { FONT_CACHE_NAME, PRECACHE_CACHE_PREFIX } from '../pwaPrecacheManifest';
import { OFFLINE_CAPABILITIES } from '../../components/ui/pwa/PwaOfflineModal';

function createMockCacheStorage(entriesByCache: Record<string, string[]>) {
  return {
    keys: vi.fn(async () => Object.keys(entriesByCache)),
    open: vi.fn(async (name: string) => ({
      keys: vi.fn(async () => (entriesByCache[name] ?? []).map((url) => ({ url }) as Request)),
    })),
  } as unknown as Pick<CacheStorage, 'keys' | 'open'>;
}

describe('PWA Offline Manager & Diagnostics', () => {
  beforeEach(() => {
    __resetPwaControllerForTests();
  });

  it('detects iOS and iPadOS Safari accurately while excluding alternative iOS browsers', () => {
    const iphoneSafari =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    const ipadDesktopModeSafari =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    const iphoneChrome =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1';
    const androidChrome =
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

    expect(detectIosSafari(iphoneSafari, 5)).toBe(true);
    expect(detectIosSafari(ipadDesktopModeSafari, 5)).toBe(true);
    expect(detectIosSafari(ipadDesktopModeSafari, 0)).toBe(false);
    expect(detectIosSafari(iphoneChrome, 5)).toBe(false);
    expect(detectIosSafari(androidChrome, 5)).toBe(false);
  });

  it('detects standalone display mode across standard PWA and iOS WebClip environments', () => {
    const standaloneWindow = {
      matchMedia: (query: string) =>
        ({ matches: query === '(display-mode: standalone)' }) as MediaQueryList,
    };
    const browserWindow = {
      matchMedia: () => ({ matches: false }) as MediaQueryList,
    };

    expect(detectStandaloneMode(standaloneWindow, { userAgent: '' })).toBe(true);
    expect(detectStandaloneMode(browserWindow, { userAgent: '', standalone: true })).toBe(true);
    expect(detectStandaloneMode(browserWindow, { userAgent: '', standalone: false })).toBe(false);
  });

  it('reports real CacheStorage readiness counts for empty, ready, unsupported, and error states', async () => {
    const unsupported = await inspectOfflineCacheReadiness(undefined);
    expect(unsupported.status).toBe('unsupported');
    expect(unsupported.cachedAssetCount).toBe(0);

    const emptyStorage = createMockCacheStorage({});
    const emptyResult = await inspectOfflineCacheReadiness(emptyStorage);
    expect(emptyResult.status).toBe('empty');
    expect(emptyResult.cachedAssetCount).toBe(0);
    expect(emptyResult.cacheName).toBeNull();

    const populatedStorage = createMockCacheStorage({
      [`${PRECACHE_CACHE_PREFIX}v-20261121aaaa`]: ['/', '/index.html', '/assets/app.js'],
      [FONT_CACHE_NAME]: ['https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans'],
    });
    const readyResult = await inspectOfflineCacheReadiness(populatedStorage);
    expect(readyResult.status).toBe('ready');
    expect(readyResult.cachedAssetCount).toBe(3);
    expect(readyResult.fontAssetCount).toBe(1);
    expect(readyResult.cacheName).toBe(`${PRECACHE_CACHE_PREFIX}v-20261121aaaa`);
    expect(extractCacheVersionLabel(readyResult.cacheName)).toBe('v-20261121aaaa');

    const brokenStorage = {
      keys: vi.fn(async () => {
        throw new Error('Quota denied');
      }),
      open: vi.fn(),
    } as unknown as Pick<CacheStorage, 'keys' | 'open'>;
    const errorResult = await inspectOfflineCacheReadiness(brokenStorage);
    expect(errorResult.status).toBe('error');
    expect(errorResult.errorMessage).toBe('Quota denied');
  });

  it('updates reactive PWA state snapshot cleanly on cache refresh and banner dismiss', async () => {
    const populatedStorage = createMockCacheStorage({
      [`${PRECACHE_CACHE_PREFIX}v-test12345678`]: ['/', '/index.html'],
    });

    await refreshOfflineCacheInspection(populatedStorage);
    const snapshot = getPwaSnapshot();
    expect(snapshot.cacheStatus).toBe('ready');
    expect(snapshot.cachedAssetCount).toBe(2);
    expect(snapshot.activeCacheName).toBe(`${PRECACHE_CACHE_PREFIX}v-test12345678`);

    dismissPwaUpdateBanner();
    expect(getPwaSnapshot().isUpdateBannerDismissed).toBe(true);
  });

  it('maintains complete bilingual offline capability copy without em dashes', () => {
    expect(OFFLINE_CAPABILITIES.length).toBeGreaterThanOrEqual(4);
    for (const item of OFFLINE_CAPABILITIES) {
      expect(item.labelId.trim().length).toBeGreaterThan(10);
      expect(item.labelEn.trim().length).toBeGreaterThan(10);
      expect(item.labelId).not.toContain('—');
      expect(item.labelEn).not.toContain('—');
    }
  });
});
