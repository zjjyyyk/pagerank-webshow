/**
 * @fileoverview Web Worker for PageRank computation
 * @module workers/pagerank.worker
 * @author PageRank Visualizer Team
 * 
 * Handles all PageRank computations in a separate thread to avoid blocking the UI.
 * Supports both JavaScript and WebAssembly implementations.
 */

import { logger } from '@/utils/logger';
import { loadWASM } from '@/utils/wasmLoader';
import { powerIterationJS } from '@/algorithms/powerIteration';
import { randomWalkJS } from '@/algorithms/randomWalk';
import type {
  WorkerMessage,
  WorkerResult,
  ComputeMessage,
} from '@/types/worker';
import type {
  PowerIterationParams,
  RandomWalkParams,
} from '@/types/algorithm';
import type { PageRankWASM } from '@/utils/wasmLoader';

// Store reference to WASM module
let wasmModule: PageRankWASM | null = null;

/**
 * Execute Power Iteration using WASM
 */
async function executePowerIterationWASM(
  message: ComputeMessage
): Promise<{ result: number[]; loadTime: number }> {
  logger.info('Worker', 'Executing Power Iteration (WASM)');

  const loadStart = performance.now();
  if (!wasmModule) {
    wasmModule = await loadWASM();
  }
  const loadTime = performance.now() - loadStart;

  const { graph, params } = message.payload;
  const { alpha, iterations } = params as PowerIterationParams;
  const { nodes, edges } = graph;

  // Allocate memory for edge arrays
  const edgeSourcesPtr = wasmModule._malloc(edges.length * 4); // 4 bytes per int32
  const edgeTargetsPtr = wasmModule._malloc(edges.length * 4);
  const resultPtr = wasmModule._malloc(nodes * 8); // 8 bytes per float64

  try {
    // Copy edge data to WASM memory using setValue
    for (let i = 0; i < edges.length; i++) {
      wasmModule.setValue(edgeSourcesPtr + i * 4, edges[i].source, 'i32');
      wasmModule.setValue(edgeTargetsPtr + i * 4, edges[i].target, 'i32');
    }

    // Call WASM function
    wasmModule._powerIteration(
      nodes,
      edges.length,
      edgeSourcesPtr,
      edgeTargetsPtr,
      alpha,
      iterations,
      resultPtr
    );

    // Read result using getValue
    const result: number[] = [];
    for (let i = 0; i < nodes; i++) {
      result.push(wasmModule.getValue(resultPtr + i * 8, 'double'));
    }
    return { result, loadTime };
  } finally {
    // Free allocated memory
    wasmModule._free(edgeSourcesPtr);
    wasmModule._free(edgeTargetsPtr);
    wasmModule._free(resultPtr);
  }
}

/**
 * Execute Random Walk using WASM
 */
async function executeRandomWalkWASM(
  message: ComputeMessage
): Promise<{ result: number[]; loadTime: number }> {
  logger.info('Worker', 'Executing Random Walk (WASM)');

  const loadStart = performance.now();
  if (!wasmModule) {
    wasmModule = await loadWASM();
  }
  const loadTime = performance.now() - loadStart;

  const { graph, params } = message.payload;
  const { alpha, walksPerNode } = params as RandomWalkParams;
  const { nodes, edges } = graph;

  // Allocate memory
  const edgeSourcesPtr = wasmModule._malloc(edges.length * 4);
  const edgeTargetsPtr = wasmModule._malloc(edges.length * 4);
  const resultPtr = wasmModule._malloc(nodes * 8);

  try {
    // Copy edge data to WASM memory using setValue
    for (let i = 0; i < edges.length; i++) {
      wasmModule.setValue(edgeSourcesPtr + i * 4, edges[i].source, 'i32');
      wasmModule.setValue(edgeTargetsPtr + i * 4, edges[i].target, 'i32');
    }

    // Generate random seed
    const seed = Math.floor(Math.random() * 0xFFFFFFFF);

    // Call WASM function
    wasmModule._randomWalk(
      nodes,
      edges.length,
      edgeSourcesPtr,
      edgeTargetsPtr,
      alpha,
      walksPerNode,
      resultPtr,
      seed
    );

    // Read result using getValue
    const result: number[] = [];
    for (let i = 0; i < nodes; i++) {
      result.push(wasmModule.getValue(resultPtr + i * 8, 'double'));
    }
    return { result, loadTime };
  } finally {
    // Free memory
    wasmModule._free(edgeSourcesPtr);
    wasmModule._free(edgeTargetsPtr);
    wasmModule._free(resultPtr);
  }
}

/**
 * Execute Power Iteration using JavaScript
 */
function executePowerIterationJS(message: ComputeMessage): number[] {
  logger.info('Worker', 'Executing Power Iteration (JS)');

  const { graph, params, taskId } = message.payload;

  // Progress callback
  const onProgress = (progress: number) => {
    const progressMsg: WorkerResult = {
      type: 'PROGRESS',
      payload: {
        taskId,
        progress,
        message: `Iteration ${Math.round(progress)}%`,
      },
    };
    self.postMessage(progressMsg);
  };

  return powerIterationJS(graph, params as PowerIterationParams, onProgress);
}

/**
 * Execute Random Walk using JavaScript
 */
function executeRandomWalkJS(message: ComputeMessage): number[] {
  logger.info('Worker', 'Executing Random Walk (JS)');

  const { graph, params, taskId } = message.payload;

  // Progress callback
  const onProgress = (progress: number) => {
    const progressMsg: WorkerResult = {
      type: 'PROGRESS',
      payload: {
        taskId,
        progress,
        message: `Processing ${Math.round(progress)}% of nodes`,
      },
    };
    self.postMessage(progressMsg);
  };

  return randomWalkJS(graph, params as RandomWalkParams, onProgress);
}

/**
 * Handle compute message
 */
async function handleCompute(message: ComputeMessage): Promise<void> {
  const { algorithm, taskId } = message.payload;

  logger.info('Worker', `Starting computation for task ${taskId}`, {
    algorithm,
    nodes: message.payload.graph.nodes,
    edges: message.payload.graph.edges.length,
  });

  const startTime = performance.now();

  try {
    let result: number[];
    let wasmLoadTime = 0;

    // Dispatch to appropriate algorithm implementation
    switch (algorithm) {
      case 'power-iteration-wasm': {
        const wasmResult = await executePowerIterationWASM(message);
        result = wasmResult.result;
        wasmLoadTime = wasmResult.loadTime;
        break;
      }

      case 'power-iteration-js':
        result = executePowerIterationJS(message);
        break;

      case 'random-walk-wasm': {
        const wasmResult = await executeRandomWalkWASM(message);
        result = wasmResult.result;
        wasmLoadTime = wasmResult.loadTime;
        break;
      }

      case 'random-walk-js':
        result = executeRandomWalkJS(message);
        break;

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const executionTime = totalTime - wasmLoadTime;

    logger.info('Worker', `Computation completed for task ${taskId}`, {
      executionTime,
      loadTime: wasmLoadTime,
      totalTime,
      resultLength: result.length,
    });

    // Send result back to main thread
    const resultMsg: WorkerResult = {
      type: 'RESULT',
      payload: {
        taskId,
        result,
        time: executionTime,
      },
    };

    self.postMessage(resultMsg);
  } catch (error) {
    logger.error('Worker', `Computation failed for task ${taskId}`, error);

    const errorMsg: WorkerResult = {
      type: 'ERROR',
      payload: {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      },
    };

    self.postMessage(errorMsg);
  }
}

/**
 * Message handler
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  logger.debug('Worker', 'Received message', { type: message.type });

  switch (message.type) {
    case 'COMPUTE':
      await handleCompute(message);
      break;

    case 'CANCEL':
      logger.info('Worker', 'Cancel requested', message.payload);
      // Note: Current implementation doesn't support cancellation
      // In a production system, you'd need to add cancellation logic
      break;

    default:
      logger.warn('Worker', 'Unknown message type', message);
  }
};

// Log worker initialization
logger.info('Worker', 'PageRank worker initialized');
