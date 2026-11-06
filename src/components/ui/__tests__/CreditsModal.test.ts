import { describe, it, expect } from 'vitest';
import { TEAM_CONTRIBUTORS, AI_TOOLS_AND_HARNESS_BADGES } from '../CreditsModal';

describe('CreditsModal bilingual localization & contributor roster audit', () => {
  it('ensures every contributor has distinct or properly localized Indonesian and English roles', () => {
    expect(TEAM_CONTRIBUTORS.length).toBeGreaterThanOrEqual(5);

    const syafik = TEAM_CONTRIBUTORS.find((m) => m.name.includes('SYAFIK'));
    expect(syafik).toBeDefined();
    expect(syafik?.roleId).toBe('Penguji Penjaminan Mutu (QA) & Skenario');
    expect(syafik?.roleEn).toBe('Quality Assurance & Scenario Tester');

    const sandy = TEAM_CONTRIBUTORS.find((m) => m.name.includes('SANDY'));
    expect(sandy).toBeDefined();
    expect(sandy?.isMassiveContributor).toBe(true);
    expect(sandy?.roleId).toContain('Kontributor Utama');
    expect(sandy?.roleEn).toContain('Massive Contributor');
  });

  it('localizes Google Antigravity engineering harness badge in Indonesian and English', () => {
    const harnessBadge = AI_TOOLS_AND_HARNESS_BADGES.find((b) =>
      b.labelEn.includes('Google Antigravity')
    );
    expect(harnessBadge).toBeDefined();
    expect(harnessBadge?.labelId).toBe('Google Antigravity (Harness Rekayasa)');
    expect(harnessBadge?.labelEn).toBe('Google Antigravity (Engineering Harness)');
  });

  it('includes Nano Banana 2.1 in the AI tools and harness badges', () => {
    const nanoBananaBadge = AI_TOOLS_AND_HARNESS_BADGES.find((b) =>
      b.labelEn.includes('Nano Banana 2.1')
    );
    expect(nanoBananaBadge).toBeDefined();
  });
});
