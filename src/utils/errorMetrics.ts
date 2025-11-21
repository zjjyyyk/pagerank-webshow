/**
 * @fileoverview Error metrics calculation for PageRank results
 * @module utils/errorMetrics
 * @author PageRank Visualizer Team
 * 
 * Calculates L1, L2, and maximum relative errors comparing
 * PageRank results against a ground truth reference.
 */

import { logger } from './logger';
import type { ErrorMetrics } from '@/types/algorithm';

/**
 * Error thrown when vectors have mismatched lengths
 */
export class VectorLengthMismatchError extends Error {
  constructor(len1: number, len2: number) {
    super(`Vector length mismatch: ${len1} vs ${len2}`);
    this.name = 'VectorLengthMismatchError';
  }
}

/**
 * Calculate L1 error (sum of absolute differences)
 * 
 * L1 = Σ|pr[i] - gt[i]| for all i
 * 
 * @param pr - Computed PageRank vector
 * @param gt - Ground truth PageRank vector
 * @returns L1 error value
 * @throws VectorLengthMismatchError if vectors have different lengths
 */
export function calculateL1(pr: number[], gt: number[]): number {
  if (pr.length !== gt.length) {
    throw new VectorLengthMismatchError(pr.length, gt.length);
  }

  let sum = 0;
  for (let i = 0; i < pr.length; i++) {
    sum += Math.abs(pr[i] - gt[i]);
  }

  return sum;
}

/**
 * Calculate L2 error (Euclidean distance)
 * 
 * L2 = √(Σ(pr[i] - gt[i])²) for all i
 * 
 * @param pr - Computed PageRank vector
 * @param gt - Ground truth PageRank vector
 * @returns L2 error value
 * @throws VectorLengthMismatchError if vectors have different lengths
 */
export function calculateL2(pr: number[], gt: number[]): number {
  if (pr.length !== gt.length) {
    throw new VectorLengthMismatchError(pr.length, gt.length);
  }

  let sumSquares = 0;
  for (let i = 0; i < pr.length; i++) {
    const diff = pr[i] - gt[i];
    sumSquares += diff * diff;
  }

  return Math.sqrt(sumSquares);
}

/**
 * Calculate maximum relative error among qualified nodes
 * 
 * Only considers nodes where ground truth value > 1/n (threshold)
 * Max Relative = max(|pr[i] - gt[i]| / gt[i]) for qualified i
 * 
 * @param pr - Computed PageRank vector
 * @param gt - Ground truth PageRank vector
 * @param n - Number of nodes (used to calculate threshold)
 * @returns Object with max relative error and count of qualified nodes
 * @throws VectorLengthMismatchError if vectors have different lengths
 */
export function calculateMaxRelative(
  pr: number[],
  gt: number[],
  n: number
): { maxRelative: number; qualifiedNodes: number } {
  if (pr.length !== gt.length) {
    throw new VectorLengthMismatchError(pr.length, gt.length);
  }

  const threshold = 1.0 / n;
  let maxRelative = 0;
  let qualifiedNodes = 0;

  for (let i = 0; i < pr.length; i++) {
    if (gt[i] > threshold) {
      qualifiedNodes++;
      const relativeError = Math.abs(pr[i] - gt[i]) / gt[i];
      maxRelative = Math.max(maxRelative, relativeError);
    }
  }

  // If no nodes qualify, return 0
  if (qualifiedNodes === 0) {
    logger.warn('ErrorMetrics', 'No nodes met threshold for max relative error calculation', {
      threshold,
      nodeCount: n,
    });
  }

  return { maxRelative, qualifiedNodes };
}

/**
 * Calculate all error metrics at once
 * 
 * @param pr - Computed PageRank vector
 * @param gt - Ground truth PageRank vector
 * @returns Error metrics object
 * @throws VectorLengthMismatchError if vectors have different lengths
 */
export function calculateErrorMetrics(pr: number[], gt: number[]): ErrorMetrics {
  logger.time('ErrorMetrics-Calculate');

  const l1 = calculateL1(pr, gt);
  const l2 = calculateL2(pr, gt);
  const { maxRelative, qualifiedNodes } = calculateMaxRelative(pr, gt, pr.length);

  const metrics: ErrorMetrics = {
    l1,
    l2,
    maxRelative,
    qualifiedNodes,
  };

  logger.info('ErrorMetrics', 'Calculated error metrics', metrics);
  logger.timeEnd('ErrorMetrics-Calculate');

  return metrics;
}

/**
 * Format error metrics for display
 * 
 * @param metrics - Error metrics to format
 * @returns Formatted string representation
 */
export function formatErrorMetrics(metrics: ErrorMetrics): string {
  return `L1: ${metrics.l1.toExponential(3)}, L2: ${metrics.l2.toExponential(3)}, Max Relative: ${(metrics.maxRelative * 100).toFixed(2)}% (${metrics.qualifiedNodes} nodes)`;
}
