/**
 * @fileoverview Type definitions for graph data structures
 * @module types/graph
 */

/**
 * Represents an edge in the graph
 */
export interface Edge {
  source: number;
  target: number;
}

/**
 * Graph data structure
 */
export interface Graph {
  /** Number of nodes in the graph */
  nodes: number;
  /** Array of edges as [source, target] pairs */
  edges: Edge[];
  /** Whether the graph is directed or undirected */
  isDirected: boolean;
  /** Out-degree for each node (optional, computed on demand) */
  outDegree?: number[];
  /** Adjacency list representation (optional, computed on demand) */
  adjacencyList?: number[][];
}

/**
 * Parsed graph with metadata
 */
export interface ParsedGraph extends Graph {
  /** Whether node IDs were 1-based in the input (converted to 0-based) */
  wasOneBased: boolean;
  /** Original max node ID from the input */
  originalMaxNodeId: number;
}

/**
 * Dataset metadata
 */
export interface DatasetMetadata {
  name: string;
  description: string;
  nodes: number;
  edges: number;
  source: string;
}
