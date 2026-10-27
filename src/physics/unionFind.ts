/**
 * Disjoint-Set / Union-Find with Path Compression and Union by Rank.
 * 
 * Used to group connected circuit terminals (pins) and wires into
 * equipotential electrical nets.
 * 
 * Time Complexity Analysis:
 * - find(): O(α(N)) amortized nearly O(1), where α is the inverse Ackermann function.
 * - union(): O(α(N)) amortized nearly O(1).
 * - Space Complexity: O(N) where N is the total number of pins.
 */
export class UnionFind {
  private parentMap: Map<string, string> = new Map();
  private rankMap: Map<string, number> = new Map();

  /**
   * Initializes a set for the given element if it does not already exist.
   * @param elementIdentifier - Unique identifier for the pin/terminal.
   */
  public makeSet(elementIdentifier: string): void {
    if (!this.parentMap.has(elementIdentifier)) {
      this.parentMap.set(elementIdentifier, elementIdentifier);
      this.rankMap.set(elementIdentifier, 0);
    }
  }

  /**
   * Finds the representative root of the set containing the given element,
   * applying two-pass path compression to flatten the tree.
   * @param elementIdentifier - Element to locate the root representative for.
   * @returns Representative root identifier.
   */
  public find(elementIdentifier: string): string {
    if (!this.parentMap.has(elementIdentifier)) {
      this.makeSet(elementIdentifier);
      return elementIdentifier;
    }

    const currentParent = this.parentMap.get(elementIdentifier)!;
    if (currentParent !== elementIdentifier) {
      // Path compression: connect directly to root
      const rootRepresentative = this.find(currentParent);
      this.parentMap.set(elementIdentifier, rootRepresentative);
      return rootRepresentative;
    }

    return currentParent;
  }

  /**
   * Unions the sets containing elementA and elementB using rank heuristics.
   * @param elementA - First element identifier.
   * @param elementB - Second element identifier.
   * @returns Root representative of the combined set.
   */
  public union(elementA: string, elementB: string): string {
    const rootA = this.find(elementA);
    const rootB = this.find(elementB);

    if (rootA === rootB) {
      return rootA;
    }

    const rankA = this.rankMap.get(rootA) ?? 0;
    const rankB = this.rankMap.get(rootB) ?? 0;

    if (rankA < rankB) {
      this.parentMap.set(rootA, rootB);
      return rootB;
    } else if (rankA > rankB) {
      this.parentMap.set(rootB, rootA);
      return rootA;
    } else {
      this.parentMap.set(rootB, rootA);
      this.rankMap.set(rootA, rankA + 1);
      return rootA;
    }
  }

  /**
   * Returns a map grouping all elements by their root representative.
   * @returns Map where keys are root representatives and values are array of elements.
   */
  public getGroupedSets(): Map<string, string[]> {
    const groupedElementsMap = new Map<string, string[]>();

    for (const elementKey of this.parentMap.keys()) {
      const rootRepresentative = this.find(elementKey);
      const existingGroup = groupedElementsMap.get(rootRepresentative) ?? [];
      existingGroup.push(elementKey);
      groupedElementsMap.set(rootRepresentative, existingGroup);
    }

    return groupedElementsMap;
  }
}
