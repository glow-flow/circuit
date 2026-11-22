import { FONT_CACHE_NAME, PRECACHE_CACHE_PREFIX } from './pwaPrecacheManifest';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type ServiceWorkerStatus =
  | 'idle'
  | 'registering'
  | 'ready'
  | 'update-available'
  | 'unsupported'
  | 'dev-disabled'
  | 'error';

export type OfflineCacheStatus =
  | 'idle'
  | 'checking'
  | 'ready'
  | 'empty'
  | 'unsupported'
  | 'error';

export type InstallPromptOutcome =
  | 'idle'
  | 'prompting'
  | 'accepted'
  | 'dismissed'
  | 'installed'
  | 'error';

export interface OfflineCacheInspection {
  status: Exclude<OfflineCacheStatus, 'idle' | 'checking'>;
  cachedAssetCount: number;
  fontAssetCount: number;
  cacheName: string | null;
  checkedAtIso: string;
  errorMessage: string | null;
}

export interface PwaStateSnapshot {
  isOnline: boolean;
  isStandalone: boolean;
  isIosSafari: boolean;
  canPromptInstall: boolean;
  installOutcome: InstallPromptOutcome;
  swStatus: ServiceWorkerStatus;
  swErrorMessage: string | null;
  cacheStatus: OfflineCacheStatus;
  cachedAssetCount: number;
  fontAssetCount: number;
  activeCacheName: string | null;
  lastCheckedAtIso: string | null;
  cacheErrorMessage: string | null;
  isUpdateBannerDismissed: boolean;
}

export function detectIosSafari(userAgent: string, maxTouchPoints = 0): boolean {
  if (!userAgent) return false;
  const isIosDevice =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  if (!isIosDevice) return false;

  const isWebKitSafari = /Safari/i.test(userAgent) && /AppleWebKit/i.test(userAgent);
  const isAlternativeIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(userAgent);
  return isWebKitSafari && !isAlternativeIosBrowser;
}

export function detectStandaloneMode(
  win: Pick<Window, 'matchMedia'> | undefined = typeof window !== 'undefined' ? window : undefined,
  nav: (Pick<Navigator, 'userAgent'> & { standalone?: boolean }) | undefined =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { standalone?: boolean })
      : undefined
): boolean {
  if (nav?.standalone === true) return true;
  if (!win || typeof win.matchMedia !== 'function') return false;

  return (
    win.matchMedia('(display-mode: standalone)').matches ||
    win.matchMedia('(display-mode: window-controls-overlay)').matches
  );
}

/**
 * Queries real browser CacheStorage to report verified precached asset counts.
 */
export async function inspectOfflineCacheReadiness(
  cacheStorage: Pick<CacheStorage, 'keys' | 'open'> | undefined =
    typeof caches !== 'undefined' ? caches : undefined
): Promise<OfflineCacheInspection> {
  const checkedAtIso = new Date().toISOString();

  if (!cacheStorage) {
    return {
      status: 'unsupported',
      cachedAssetCount: 0,
      fontAssetCount: 0,
      cacheName: null,
      checkedAtIso,
      errorMessage: null,
    };
  }

  try {
    const keys = await cacheStorage.keys();
    const precacheKeys = keys
      .filter((key) => key.startsWith(PRECACHE_CACHE_PREFIX))
      .sort((a, b) => b.localeCompare(a));

    let cachedAssetCount = 0;
    const activeCacheName = precacheKeys[0] ?? null;

    if (activeCacheName) {
      const precache = await cacheStorage.open(activeCacheName);
      const entries = await precache.keys();
      cachedAssetCount = entries.length;
    }

    let fontAssetCount = 0;
    if (keys.includes(FONT_CACHE_NAME)) {
      const fontCache = await cacheStorage.open(FONT_CACHE_NAME);
      const fontEntries = await fontCache.keys();
      fontAssetCount = fontEntries.length;
    }

    return {
      status: cachedAssetCount > 0 ? 'ready' : 'empty',
      cachedAssetCount,
      fontAssetCount,
      cacheName: activeCacheName,
      checkedAtIso,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CacheStorage unavailable';
    return {
      status: 'error',
      cachedAssetCount: 0,
      fontAssetCount: 0,
      cacheName: null,
      checkedAtIso,
      errorMessage: message,
    };
  }
}

export function extractCacheVersionLabel(cacheName: string | null): string | null {
  if (!cacheName || !cacheName.startsWith(PRECACHE_CACHE_PREFIX)) return null;
  const suffix = cacheName.slice(PRECACHE_CACHE_PREFIX.length);
  return suffix || null;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let activeRegistration: ServiceWorkerRegistration | null = null;
let isInitialized = false;
let shouldReloadOnControllerChange = false;

function createInitialSnapshot(): PwaStateSnapshot {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isStandalone = detectStandaloneMode();
  const isIosSafari =
    typeof navigator !== 'undefined'
      ? detectIosSafari(navigator.userAgent, navigator.maxTouchPoints ?? 0)
      : false;

  return {
    isOnline,
    isStandalone,
    isIosSafari,
    canPromptInstall: false,
    installOutcome: isStandalone ? 'installed' : 'idle',
    swStatus: 'idle',
    swErrorMessage: null,
    cacheStatus: 'idle',
    cachedAssetCount: 0,
    fontAssetCount: 0,
    activeCacheName: null,
    lastCheckedAtIso: null,
    cacheErrorMessage: null,
    isUpdateBannerDismissed: false,
  };
}

let snapshot: PwaStateSnapshot = createInitialSnapshot();

function updateSnapshot(patch: Partial<PwaStateSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

export function getPwaSnapshot(): PwaStateSnapshot {
  return snapshot;
}

export function subscribePwaSnapshot(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissPwaUpdateBanner(): void {
  updateSnapshot({ isUpdateBannerDismissed: true });
}

export async function refreshOfflineCacheInspection(
  cacheStorage?: Pick<CacheStorage, 'keys' | 'open'>
): Promise<OfflineCacheInspection> {
  updateSnapshot({ cacheStatus: 'checking', cacheErrorMessage: null });
  const result = await inspectOfflineCacheReadiness(cacheStorage);
  updateSnapshot({
    cacheStatus: result.status,
    cachedAssetCount: result.cachedAssetCount,
    fontAssetCount: result.fontAssetCount,
    activeCacheName: result.cacheName,
    lastCheckedAtIso: result.checkedAtIso,
    cacheErrorMessage: result.errorMessage,
  });
  return result;
}

function attachRegistrationListeners(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    updateSnapshot({
      swStatus: 'update-available',
      swErrorMessage: null,
      isUpdateBannerDismissed: false,
    });
  } else if (registration.active) {
    updateSnapshot({ swStatus: 'ready', swErrorMessage: null });
  }

  const watchInstallingWorker = (worker: ServiceWorker | null) => {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          updateSnapshot({
            swStatus: 'update-available',
            swErrorMessage: null,
            isUpdateBannerDismissed: false,
          });
        } else {
          updateSnapshot({ swStatus: 'ready', swErrorMessage: null });
          void refreshOfflineCacheInspection();
        }
      } else if (worker.state === 'activated') {
        updateSnapshot({ swStatus: 'ready', swErrorMessage: null });
        void refreshOfflineCacheInspection();
      }
    });
  };

  if (registration.installing) {
    watchInstallingWorker(registration.installing);
  }

  registration.addEventListener('updatefound', () => {
    watchInstallingWorker(registration.installing);
  });
}

export async function registerCircuitServiceWorker(swUrl = '/sw.js'): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    updateSnapshot({ swStatus: 'unsupported', swErrorMessage: null });
    return;
  }

  updateSnapshot({ swStatus: 'registering', swErrorMessage: null });

  try {
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    activeRegistration = registration;
    attachRegistrationListeners(registration);
    await refreshOfflineCacheInspection();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Service worker registration failed';
    updateSnapshot({ swStatus: 'error', swErrorMessage: message });
  }
}

export async function checkForServiceWorkerUpdate(): Promise<void> {
  if (activeRegistration) {
    try {
      await activeRegistration.update();
    } catch {
      // Offline update checks fail by design; cache inspection below still reflects local state.
    }
  }
  await refreshOfflineCacheInspection();
}

export function applyServiceWorkerUpdate(): boolean {
  const waitingWorker = activeRegistration?.waiting;
  if (!waitingWorker) return false;
  shouldReloadOnControllerChange = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  return true;
}

export async function promptPwaInstall(): Promise<InstallPromptOutcome> {
  if (!deferredInstallPrompt) {
    return snapshot.isStandalone ? 'installed' : 'idle';
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  updateSnapshot({ canPromptInstall: false, installOutcome: 'prompting' });

  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    const outcome: InstallPromptOutcome = choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    updateSnapshot({ installOutcome: outcome });
    return outcome;
  } catch {
    updateSnapshot({ installOutcome: 'error' });
    return 'error';
  }
}

export interface InitPwaOptions {
  enableServiceWorker?: boolean;
  swUrl?: string;
}

export function initPwaController(options: InitPwaOptions = {}): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  const { enableServiceWorker = true, swUrl = '/sw.js' } = options;

  window.addEventListener('online', () => {
    updateSnapshot({ isOnline: true });
  });

  window.addEventListener('offline', () => {
    updateSnapshot({ isOnline: false });
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    updateSnapshot({ canPromptInstall: true, installOutcome: 'idle' });
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateSnapshot({
      isStandalone: true,
      canPromptInstall: false,
      installOutcome: 'installed',
    });
  });

  if (typeof window.matchMedia === 'function') {
    const standaloneMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const standalone = detectStandaloneMode();
      updateSnapshot({
        isStandalone: standalone,
        installOutcome: standalone ? 'installed' : snapshot.installOutcome,
      });
    };
    if (typeof standaloneMedia.addEventListener === 'function') {
      standaloneMedia.addEventListener('change', handleDisplayModeChange);
    }
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (shouldReloadOnControllerChange) {
        shouldReloadOnControllerChange = false;
        window.location.reload();
      }
    });
  }

  if (!enableServiceWorker) {
    updateSnapshot({ swStatus: 'dev-disabled', swErrorMessage: null });
    void refreshOfflineCacheInspection();
    return;
  }

  void registerCircuitServiceWorker(swUrl);
}

/**
 * Resets internal singleton state strictly for isolated unit tests.
 */
export function __resetPwaControllerForTests(initialPatch?: Partial<PwaStateSnapshot>): void {
  listeners.clear();
  deferredInstallPrompt = null;
  activeRegistration = null;
  isInitialized = false;
  shouldReloadOnControllerChange = false;
  snapshot = { ...createInitialSnapshot(), ...initialPatch };
}
