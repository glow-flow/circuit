import { beforeEach, describe, expect, it } from 'vitest';
import {
  INTERACTIVE_TUTORIAL_MISSIONS,
  TEACHER_QUICK_CARDS,
  evaluateInteractiveMissionCompletion,
  executeMissionOneClickAssist,
  executeTeacherQuickCardAction,
  getInteractiveMissionByIndex,
  prepareCanvasForInteractiveMissionOne,
} from '../interactiveTutorialConfig';
import { useCircuitStore } from '../../store/useCircuitStore';
import { getPaletteEntry } from '../../constants/componentCatalog';

describe('Interactive Tutorial & Teacher Quick-Start Logic', () => {
  beforeEach(() => {
    useCircuitStore.getState().loadPreset('simple-lamp');
    useCircuitStore.getState().setWorldMode('lab');
  });

  it('keeps switch palette catalog entry 100% asset-free using pure-code glyph', () => {
    const switchEntry = getPaletteEntry('switch');
    expect(switchEntry).toBeDefined();
    expect(switchEntry?.glyph).toBe('switch');
    expect(switchEntry?.image).toBeUndefined();
  });

  it('retrieves interactive missions safely by index with O(1) bounds validation', () => {
    expect(getInteractiveMissionByIndex(0)?.id).toBe('mission-1-switch');
    expect(getInteractiveMissionByIndex(1)?.id).toBe('mission-2-parallel');
    expect(getInteractiveMissionByIndex(2)?.id).toBe('mission-3-nature-grid');

    // Out-of-bounds and NaN edge cases return undefined safely
    expect(getInteractiveMissionByIndex(-5)).toBeUndefined();
    expect(getInteractiveMissionByIndex(99)).toBeUndefined();
    expect(getInteractiveMissionByIndex(Number.NaN)).toBeUndefined();
  });

  it('prepares Mission 1 with an open Knife Switch in Lab mode so students can toggle it', () => {
    prepareCanvasForInteractiveMissionOne();
    const state = useCircuitStore.getState();

    expect(state.worldMode).toBe('lab');
    const switchNodes = state.nodes.filter((node) => node.data.type === 'switch');
    expect(switchNodes.length).toBeGreaterThan(0);
    expect(switchNodes.every((node) => node.data.isOpen === true)).toBe(true);

    // Should not be completed while switch is still open
    const isCompletedBeforeToggle = evaluateInteractiveMissionCompletion(
      'mission-1-switch',
      state.nodes,
      state.worldMode
    );
    expect(isCompletedBeforeToggle).toBe(false);
  });

  it('completes Mission 1 when the Knife Switch is closed and current flows through the lamp', () => {
    prepareCanvasForInteractiveMissionOne();
    executeMissionOneClickAssist('mission-1-switch');

    const state = useCircuitStore.getState();
    const isCompletedAfterAssist = evaluateInteractiveMissionCompletion(
      'mission-1-switch',
      state.nodes,
      state.worldMode
    );
    expect(isCompletedAfterAssist).toBe(true);
  });

  it('completes Mission 2 when the Parallel circuit is loaded and active', () => {
    const initialState = useCircuitStore.getState();
    expect(
      evaluateInteractiveMissionCompletion(
        'mission-2-parallel',
        initialState.nodes,
        initialState.worldMode
      )
    ).toBe(false);

    executeMissionOneClickAssist('mission-2-parallel');
    const updatedState = useCircuitStore.getState();
    expect(
      evaluateInteractiveMissionCompletion(
        'mission-2-parallel',
        updatedState.nodes,
        updatedState.worldMode
      )
    ).toBe(true);
  });

  it('completes Mission 3 when switched to Nature Mode and the 12V renewable station is spawned', () => {
    const initialState = useCircuitStore.getState();
    expect(
      evaluateInteractiveMissionCompletion(
        'mission-3-nature-grid',
        initialState.nodes,
        initialState.worldMode
      )
    ).toBe(false);

    executeMissionOneClickAssist('mission-3-nature-grid');
    const updatedState = useCircuitStore.getState();
    expect(updatedState.worldMode).toBe('outside');
    expect(
      evaluateInteractiveMissionCompletion(
        'mission-3-nature-grid',
        updatedState.nodes,
        updatedState.worldMode
      )
    ).toBe(true);
  });

  it('handles empty or invalid node arrays gracefully in evaluateInteractiveMissionCompletion', () => {
    expect(evaluateInteractiveMissionCompletion('mission-1-switch', [], 'lab')).toBe(false);
    expect(evaluateInteractiveMissionCompletion('mission-2-parallel', [], 'lab')).toBe(false);
    expect(evaluateInteractiveMissionCompletion('mission-3-nature-grid', [], 'outside')).toBe(
      false
    );
  });

  it('executes all 4 Teacher 1-Click Classroom Setup Cards without errors', () => {
    expect(INTERACTIVE_TUTORIAL_MISSIONS).toHaveLength(3);
    expect(TEACHER_QUICK_CARDS).toHaveLength(4);

    executeTeacherQuickCardAction('basic-switch');
    expect(useCircuitStore.getState().worldMode).toBe('lab');
    expect(useCircuitStore.getState().nodes.some((n) => n.data.type === 'socket')).toBe(true);

    executeTeacherQuickCardAction('series-parallel');
    expect(useCircuitStore.getState().worldMode).toBe('lab');
    expect(
      useCircuitStore.getState().nodes.filter((n) => n.data.type === 'socket').length
    ).toBeGreaterThanOrEqual(2);

    executeTeacherQuickCardAction('short-circuit');
    expect(useCircuitStore.getState().worldMode).toBe('lab');
    expect(useCircuitStore.getState().nodes.some((n) => n.data.type === 'switch')).toBe(true);

    executeTeacherQuickCardAction('nature-ebt');
    expect(useCircuitStore.getState().worldMode).toBe('outside');
    expect(
      useCircuitStore.getState().nodes.some(
        (n) => n.data.type === 'solar-panel' || n.data.type === 'solar_panel'
      )
    ).toBe(true);
  });
});
