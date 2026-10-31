import { Edge } from 'reactflow';

/**
 * Result structure describing the type and target of an immediate short circuit.
 */
export interface DirectShortCheckResult {
  /** True if the positive and negative terminals are directly bridged without load */
  isShorted: boolean;
  /**
   * Classification of the short circuit:
   * - 'same-pin': Both (+) and (-) connect to the exact same terminal on another component
   * - 'loopback': (+) is wired directly back to (-) on the same component
   * - 'none': No direct bridge found between (+) and (-) terminals
   */
  shortType: 'same-pin' | 'loopback' | 'none';
  /** Human-readable identifier of the common junction pin, if applicable */
  commonPinId?: string;
}

/**
 * Checks whether the positive (+) and negative (-) terminals of a power distribution panel
 * (or battery/generator) are connected directly to the same component terminal (as in a dead short)
 * or looped directly into each other.
 *
 * Algorithm & Complexity:
 * - Collects all opposite pins connected to `pos` and `neg` using a single-pass edge traversal.
 * - Uses a hash Set for O(1) set membership and intersection testing.
 * - Time Complexity: O(E) where E is the total number of edges in the circuit.
 * - Space Complexity: O(E) for pin identifier storage.
 *
 * @param panelId - Unique node ID of the power distribution panel
 * @param edges - Array of React Flow wire edges currently present in the circuit
 * @returns DirectShortCheckResult detailing the short circuit status
 */
export function checkPanelDirectShort(
  panelId: string,
  edges: readonly Edge[] | Edge[]
): DirectShortCheckResult {
  if (!panelId || !edges || edges.length === 0) {
    return { isShorted: false, shortType: 'none' };
  }

  const posOppositePins = new Set<string>();
  const negOppositePins = new Set<string>();

  for (let index = 0; index < edges.length; index++) {
    const edge = edges[index];
    if (!edge) continue;

    const sourceNode = edge.source;
    const targetNode = edge.target;
    const sourcePin = edge.sourceHandle ?? 'default';
    const targetPin = edge.targetHandle ?? 'default';

    // Direct loopback between pos and neg on the same panel
    if (sourceNode === panelId && targetNode === panelId) {
      if (
        (sourcePin === 'pos' && targetPin === 'neg') ||
        (sourcePin === 'neg' && targetPin === 'pos')
      ) {
        return { isShorted: true, shortType: 'loopback' };
      }
    }

    // Check if edge touches panelId:pos
    if (sourceNode === panelId && sourcePin === 'pos') {
      const oppositeIdentifier = `${targetNode}:${targetPin}`;
      if (oppositeIdentifier === `${panelId}:neg`) {
        return { isShorted: true, shortType: 'loopback' };
      }
      posOppositePins.add(oppositeIdentifier);
    } else if (targetNode === panelId && targetPin === 'pos') {
      const oppositeIdentifier = `${sourceNode}:${sourcePin}`;
      if (oppositeIdentifier === `${panelId}:neg`) {
        return { isShorted: true, shortType: 'loopback' };
      }
      posOppositePins.add(oppositeIdentifier);
    }

    // Check if edge touches panelId:neg
    if (sourceNode === panelId && sourcePin === 'neg') {
      const oppositeIdentifier = `${targetNode}:${targetPin}`;
      if (oppositeIdentifier === `${panelId}:pos`) {
        return { isShorted: true, shortType: 'loopback' };
      }
      negOppositePins.add(oppositeIdentifier);
    } else if (targetNode === panelId && targetPin === 'neg') {
      const oppositeIdentifier = `${sourceNode}:${sourcePin}`;
      if (oppositeIdentifier === `${panelId}:pos`) {
        return { isShorted: true, shortType: 'loopback' };
      }
      negOppositePins.add(oppositeIdentifier);
    }
  }

  // Check for intersection: both (+) and (-) lead to the exact same component pin
  for (const posPin of posOppositePins) {
    if (negOppositePins.has(posPin)) {
      return {
        isShorted: true,
        shortType: 'same-pin',
        commonPinId: posPin,
      };
    }
  }

  return { isShorted: false, shortType: 'none' };
}

/**
 * Returns a concise, user-friendly educational explanation of why the panel's
 * MCB tripped and how to fix it.
 *
 * @param checkResult - Result from `checkPanelDirectShort`
 * @param isIndonesian - True for Indonesian, false for English
 */
export function getShortCircuitGuidance(
  checkResult: DirectShortCheckResult,
  isIndonesian: boolean
): string {
  if (checkResult.shortType === 'same-pin') {
    return isIndonesian
      ? 'Kabel (+) & (-) tercolok ke titik yang sama!'
      : '(+) & (-) wires connected to the same pin!';
  }

  if (checkResult.shortType === 'loopback') {
    return isIndonesian
      ? 'Kabel (+) & (-) saling terhubung langsung!'
      : '(+) & (-) wires directly looped together!';
  }

  return isIndonesian
    ? 'Korsleting beban terdeteksi pada kabel output!'
    : 'Short circuit detected on output lines!';
}
