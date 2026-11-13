import { describe, it, expect } from 'vitest';
import { MISSION_CATALOG } from '../missionCatalog';
import { getMissionVisualMeta } from '../../components/ui/missions/MissionTopologyPreview';

describe('Mission visual metadata coverage', () => {
  it('provides concise visual metadata for every mission in MISSION_CATALOG', () => {
    expect(MISSION_CATALOG.length).toBeGreaterThanOrEqual(5);

    for (const mission of MISSION_CATALOG) {
      const meta = getMissionVisualMeta(mission.id);
      expect(meta.shortTabId.length).toBeGreaterThan(2);
      expect(meta.shortTabEn.length).toBeGreaterThan(2);
      expect(meta.summaryId.length).toBeGreaterThan(10);
      expect(meta.targetBadgeId.length).toBeGreaterThan(3);
    }
  });

  it('safely returns fallback metadata for unknown mission IDs without throwing', () => {
    const fallback = getMissionVisualMeta('non-existent-mission');
    expect(fallback.shortTabId).toBeTruthy();
    expect(fallback.summaryId).toBeTruthy();
  });
});
