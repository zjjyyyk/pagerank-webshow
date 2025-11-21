/**
 * @fileoverview Type definitions for algorithm execution and results
 * @module types/algorithm
 */

/**
 * Available algorithm types
 */
export type AlgorithmType =
  | 'power-iteration-wasm'
  | 'power-iteration-js'
  | 'random-walk-wasm'
  | 'random-walk-js';

/**
 * Algorithm parameters for Power Iteration
 */
export interface PowerIterationParams {
  /** Damping factor (default: 0.85) */
  alpha: number;
  /** Number of iterations (default: 100) */
  iterations: number;
}

/**
 * Algorithm parameters for Random Walk
 */
export interface RandomWalkParams {
  /** Damping factor (default: 0.85) */
  alpha: number;
  /** Number of walks per node (default: 1000) */
  walksPerNode: number;
}

/**
 * Union type for algorithm parameters
 */
export type AlgorithmParams = PowerIterationParams | RandomWalkParams;

/**
 * Algorithm execution result
 */
export interface AlgorithmResult {
  /** Unique identifier for this result */
  id: string;
  /** Algorithm type used */
  algorithm: AlgorithmType;
  /** Dataset name */
  dataset: string;
  /** Algorithm parameters */
  params: AlgorithmParams;
  /** PageRank vector */
  pagerank: number[];
  /** Execution time in milliseconds */
  executionTime: number;
  /** Timestamp of computation */
  timestamp: number;
  /** Whether this result is the ground truth */
  isGroundTruth: boolean;
}

/**
 * Error metrics compared to ground truth
 */
export interface ErrorMetrics {
  /** L1 error (sum of absolute differences) */
  l1: number;
  /** L2 error (Euclidean distance) */
  l2: number;
  /** Maximum relative error among qualified nodes */
  maxRelative: number;
  /** Number of nodes that met the threshold for max relative calculation */
  qualifiedNodes: number;
}

/**
 * Algorithm result with error metrics
 */
export interface AlgorithmResultWithMetrics extends AlgorithmResult {
  /** Error metrics (null if no ground truth set) */
  metrics: ErrorMetrics | null;
  /** Whether this result is collapsed (UI state) */
  isCollapsed?: boolean;
  /** Whether this result is pinned (UI state) */
  isPinned?: boolean;
}

/**
 * Top node in PageRank results
 */
export interface TopNode {
  /** Node ID */
  nodeId: number;
  /** PageRank score */
  score: number;
  /** Rank (1-indexed) */
  rank: number;
}
