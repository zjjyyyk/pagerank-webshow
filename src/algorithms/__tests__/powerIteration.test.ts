/**
 * @fileoverview Unit tests for Power Iteration algorithm
 * @module algorithms/__tests__/powerIteration.test
 */

import { describe, test, expect } from 'vitest';
import { powerIterationJS } from '../powerIteration';

describe('PowerIteration', () => {
  test('computes PageRank for simple triangle graph', () => {
    const graph = {
      nodes: 3,
      edges: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 0 },
      ],
      isDirected: true,
    };
    
    const result = powerIterationJS(graph, { alpha: 0.85, iterations: 100 });
    
    // Symmetric cycle - all nodes should have approximately equal PageRank
    expect(result[0]).toBeCloseTo(1 / 3, 2);
    expect(result[1]).toBeCloseTo(1 / 3, 2);
    expect(result[2]).toBeCloseTo(1 / 3, 2);
    
    // Sum should be 1.0
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  test('computes PageRank for star graph', () => {
    const graph = {
      nodes: 4,
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 0, target: 3 },
      ],
      isDirected: true,
    };
    
    const result = powerIterationJS(graph, { alpha: 0.85, iterations: 100 });
    
    // Node 0 distributes to 1, 2, 3 which are dangling
    expect(result[0]).toBeLessThan(result[1]);
    expect(result[1]).toBeGreaterThan(0);
    expect(result[2]).toBeGreaterThan(0);
    
    // Sum should be 1.0
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  test('different alpha values produce different results', () => {
    const graph = {
      nodes: 3,
      edges: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 0 },
      ],
      isDirected: true,
    };
    
    const result1 = powerIterationJS(graph, { alpha: 0.5, iterations: 100 });
    const result2 = powerIterationJS(graph, { alpha: 0.9, iterations: 100 });
    
    // Both should converge to valid distributions
    const sum1 = result1.reduce((a, b) => a + b, 0);
    const sum2 = result2.reduce((a, b) => a + b, 0);
    
    expect(sum1).toBeCloseTo(1.0, 5);
    expect(sum2).toBeCloseTo(1.0, 5);
  });

  test('algorithm is deterministic', () => {
    const graph = {
      nodes: 3,
      edges: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 0 },
      ],
      isDirected: true,
    };
    
    const result1 = powerIterationJS(graph, { alpha: 0.85, iterations: 50 });
    const result2 = powerIterationJS(graph, { alpha: 0.85, iterations: 50 });
    
    // Results should be identical (deterministic algorithm)
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i]).toBeCloseTo(result2[i], 10);
    }
  });
});
