/**
 * @fileoverview Power Iteration algorithm implementation in JavaScript
 * @module algorithms/powerIteration
 * @author PageRank Visualizer Team
 * 
 * Implements the standard Power Iteration method for computing PageRank.
 * Complexity: O(iterations * edges)
 */

import { logger } from '@/utils/logger';
import type { Graph } from '@/types/graph';
import type { PowerIterationParams } from '@/types/algorithm';

/**
 * Compute PageRank using Power Iteration method
 * 
 * Algorithm:
 * 1. Initialize: pr[i] = 1/n for all nodes
 * 2. For each iteration:
 *    a. new_pr[i] = (1-alpha)/n  (teleportation)
 *    b. For each edge (j -> i): new_pr[i] += alpha * pr[j] / out_degree[j]
 *    c. pr = new_pr
 * 3. Return final pr vector
 * 
 * @param graph - The graph to compute PageRank on
 * @param params - Algorithm parameters (alpha and iterations)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns PageRank vector (normalized)
 */
export function powerIterationJS(
  graph: Graph,
  params: PowerIterationParams,
  onProgress?: (progress: number) => void
): number[] {
  const { alpha, iterations } = params;
  const n = graph.nodes;

  logger.info('Algorithm', 'Starting Power Iteration (JS)', {
    nodes: n,
    edges: graph.edges.length,
    alpha,
    iterations,
  });

  logger.time('PowerIteration-JS-Total');

  // Compute out-degree for each node
  const outDegree = new Float64Array(n);
  for (const edge of graph.edges) {
    outDegree[edge.source]++;
  }

  // Handle dangling nodes (nodes with no outgoing edges)
  // They distribute their PageRank equally to all nodes
  const danglingNodes: number[] = [];
  for (let i = 0; i < n; i++) {
    if (outDegree[i] === 0) {
      danglingNodes.push(i);
    }
  }

  if (danglingNodes.length > 0) {
    logger.info('Algorithm', `Found ${danglingNodes.length} dangling nodes`);
  }

  // Initialize PageRank vector
  let pr = new Float64Array(n);
  let newPr = new Float64Array(n);
  const initialValue = 1.0 / n;
  pr.fill(initialValue);

  const teleportation = (1.0 - alpha) / n;

  // Power iteration
  for (let iter = 0; iter < iterations; iter++) {
    // Initialize with teleportation component
    newPr.fill(teleportation);

    // Add contribution from dangling nodes (distribute equally)
    let danglingSum = 0;
    for (const node of danglingNodes) {
      danglingSum += pr[node];
    }
    const danglingContribution = (alpha * danglingSum) / n;
    for (let i = 0; i < n; i++) {
      newPr[i] += danglingContribution;
    }

    // Add contributions from edges
    for (const edge of graph.edges) {
      const contribution = (alpha * pr[edge.source]) / outDegree[edge.source];
      newPr[edge.target] += contribution;
    }

    // Swap arrays (reuse memory)
    [pr, newPr] = [newPr, pr];

    // Report progress every 10 iterations
    if (onProgress && (iter + 1) % 10 === 0) {
      const progress = ((iter + 1) / iterations) * 100;
      onProgress(progress);
    }
  }

  // Normalize (should already be normalized, but ensure it)
  const sum = pr.reduce((acc, val) => acc + val, 0);
  if (Math.abs(sum - 1.0) > 1e-6) {
    logger.warn('Algorithm', `PageRank sum not 1.0: ${sum}, normalizing`);
    for (let i = 0; i < n; i++) {
      pr[i] /= sum;
    }
  }

  logger.timeEnd('PowerIteration-JS-Total');
  logger.info('Algorithm', 'Completed Power Iteration (JS)', {
    sum: pr.reduce((acc, val) => acc + val, 0),
    max: Math.max(...pr),
    min: Math.min(...pr),
  });

  return Array.from(pr);
}
