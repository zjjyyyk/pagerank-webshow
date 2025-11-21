/**
 * @fileoverview Random Walk algorithm implementation in JavaScript
 * @module algorithms/randomWalk
 * @author PageRank Visualizer Team
 * 
 * Implements Monte Carlo random walk simulation for computing PageRank.
 * More intuitive but less efficient than Power Iteration.
 * Complexity: O(walksPerNode * avgPathLength * nodes)
 */

import { logger } from '@/utils/logger';
import type { Graph } from '@/types/graph';
import type { RandomWalkParams } from '@/types/algorithm';

/**
 * Compute PageRank using Random Walk simulation
 * 
 * Algorithm:
 * 1. For each node as starting point:
 *    a. Perform walksPerNode random walks
 *    b. At each step:
 *       - With probability (1-alpha): stop (teleport)
 *       - With probability alpha: follow random outgoing edge
 *    c. Count visits to each node
 * 2. Normalize visit counts to get PageRank
 * 
 * @param graph - The graph to compute PageRank on
 * @param params - Algorithm parameters (alpha and walksPerNode)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns PageRank vector (normalized)
 */
export function randomWalkJS(
  graph: Graph,
  params: RandomWalkParams,
  onProgress?: (progress: number) => void
): number[] {
  const { alpha, walksPerNode } = params;
  const n = graph.nodes;

  logger.info('Algorithm', 'Starting Random Walk (JS)', {
    nodes: n,
    edges: graph.edges.length,
    alpha,
    walksPerNode,
  });

  logger.time('RandomWalk-JS-Total');

  // Build adjacency list for efficient neighbor lookup
  const adjacencyList: number[][] = Array.from({ length: n }, () => []);
  for (const edge of graph.edges) {
    adjacencyList[edge.source].push(edge.target);
  }

  // Count nodes with no outgoing edges
  const danglingCount = adjacencyList.filter((neighbors) => neighbors.length === 0).length;
  if (danglingCount > 0) {
    logger.info('Algorithm', `Found ${danglingCount} dangling nodes (no outgoing edges)`);
  }

  // Initialize visit counter
  const visitCount = new Uint32Array(n);

  // Perform random walks from each node
  for (let startNode = 0; startNode < n; startNode++) {
    for (let walk = 0; walk < walksPerNode; walk++) {
      let current = startNode;

      // Count the starting node visit
      visitCount[current]++;

      // Continue walk with probability alpha
      while (Math.random() < alpha) {
        const neighbors = adjacencyList[current];

        // If no outgoing edges (dangling node), teleport to random node
        if (neighbors.length === 0) {
          // Teleport to a random node
          current = Math.floor(Math.random() * n);
          visitCount[current]++;
          break;
        }

        // Choose random neighbor
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        current = neighbors[randomIndex];

        // Count this visit
        visitCount[current]++;
      }
    }

    // Report progress every 10% of nodes
    if (onProgress && (startNode + 1) % Math.ceil(n / 10) === 0) {
      const progress = ((startNode + 1) / n) * 100;
      onProgress(progress);
    }
  }

  // Normalize visit counts to get PageRank
  const totalVisits = visitCount.reduce((acc, val) => acc + val, 0);

  if (totalVisits === 0) {
    logger.error('Algorithm', 'No visits recorded - all nodes are dangling?');
    // Return uniform distribution as fallback
    return new Array(n).fill(1.0 / n);
  }

  const pr = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    pr[i] = visitCount[i] / totalVisits;
  }

  // Normalize to ensure sum = 1.0
  const sum = pr.reduce((acc, val) => acc + val, 0);
  if (Math.abs(sum - 1.0) > 1e-6) {
    logger.warn('Algorithm', `PageRank sum not 1.0: ${sum}, normalizing`);
    for (let i = 0; i < n; i++) {
      pr[i] /= sum;
    }
  }

  logger.timeEnd('RandomWalk-JS-Total');
  logger.info('Algorithm', 'Completed Random Walk (JS)', {
    totalVisits,
    sum: pr.reduce((acc, val) => acc + val, 0),
    max: Math.max(...pr),
    min: Math.min(...pr),
  });

  return Array.from(pr);
}
