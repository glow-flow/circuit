import { useSyncExternalStore } from 'react';
import {
  PwaStateSnapshot,
  applyServiceWorkerUpdate,
  checkForServiceWorkerUpdate,
  dismissPwaUpdateBanner,
  getPwaSnapshot,
  promptPwaInstall,
  refreshOfflineCacheInspection,
  registerCircuitServiceWorker,
  subscribePwaSnapshot,
} from '../utils/pwaManager';

export interface UsePwaStatusResult extends PwaStateSnapshot {
  promptInstall: typeof promptPwaInstall;
  refreshCache: typeof refreshOfflineCacheInspection;
  checkForUpdate: typeof checkForServiceWorkerUpdate;
  applyUpdate: typeof applyServiceWorkerUpdate;
  retryRegistration: typeof registerCircuitServiceWorker;
  dismissUpdateBanner: typeof dismissPwaUpdateBanner;
}

export function usePwaStatus(): UsePwaStatusResult {
  const state = useSyncExternalStore(subscribePwaSnapshot, getPwaSnapshot, getPwaSnapshot);

  return {
    ...state,
    promptInstall: promptPwaInstall,
    refreshCache: refreshOfflineCacheInspection,
    checkForUpdate: checkForServiceWorkerUpdate,
    applyUpdate: applyServiceWorkerUpdate,
    retryRegistration: registerCircuitServiceWorker,
    dismissUpdateBanner: dismissPwaUpdateBanner,
  };
}
