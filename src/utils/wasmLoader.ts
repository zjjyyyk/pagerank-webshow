/**
 * @fileoverview WASM module loader and interface
 * @module utils/wasmLoader
 * @author PageRank Visualizer Team
 * 
 * Handles loading and initializing the WebAssembly module
 */

import { logger } from './logger';

// Type definition for the WASM module
export interface PageRankWASM {
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  _powerIteration: (
    nodes: number,
    edgeCount: number,
    edgeSourcesPtr: number,
    edgeTargetsPtr: number,
    alpha: number,
    iterations: number,
    resultPtr: number
  ) => void;
  _randomWalk: (
    nodes: number,
    edgeCount: number,
    edgeSourcesPtr: number,
    edgeTargetsPtr: number,
    alpha: number,
    walksPerNode: number,
    resultPtr: number,
    seed: number
  ) => void;
  HEAP32?: Int32Array;
  HEAPF64?: Float64Array;
  // Emscripten provides getValue/setValue for memory access
  getValue: (ptr: number, type: string) => number;
  setValue: (ptr: number, value: number, type: string) => void;
  // Memory buffer access
  memory?: WebAssembly.Memory;
}

let wasmModule: PageRankWASM | null = null;
let loadingPromise: Promise<PageRankWASM> | null = null;

/**
 * Load the WebAssembly module
 * Returns cached module if already loaded
 * 
 * @returns Promise that resolves to the WASM module
 */
export async function loadWASM(): Promise<PageRankWASM> {
  if (wasmModule) {
    logger.info('WASM', 'Using cached WASM module');
    return wasmModule;
  }

  if (loadingPromise) {
    logger.info('WASM', 'WASM module already loading, waiting...');
    return loadingPromise;
  }

  logger.info('WASM', 'Loading WASM module...');
  logger.time('WASM-Load');

  loadingPromise = (async () => {
    try {
      // Load Emscripten module (works in both main thread and Web Worker)
      const createModule = await new Promise<any>(async (resolve, reject) => {
        // Check if already loaded in global scope
        if ((globalThis as any).createPageRankModule) {
          resolve((globalThis as any).createPageRankModule);
          return;
        }

        // Fetch and eval the Emscripten loader script
        // This works in both main thread and ES module Workers
        try {
          // Use absolute path with base URL for correct routing
          const basePath = import.meta.env.BASE_URL || '/';
          const response = await fetch(`${basePath}pagerank.js`);
          if (!response.ok) {
            throw new Error(`Failed to fetch pagerank.js: ${response.status}`);
          }
          
          const scriptText = await response.text();
          
          // Use indirect eval to execute in global scope
          (0, eval)(scriptText);
          
          const factory = (globalThis as any).createPageRankModule;
          if (typeof factory === 'function') {
            resolve(factory);
          } else {
            reject(new Error('WASM module loader is not a function'));
          }
        } catch (error) {
          reject(error);
        }
      });

      // Initialize module with locateFile to find the WASM binary
      const basePath = import.meta.env.BASE_URL || '/';
      const module = await createModule({
        locateFile: (path: string) => {
          // Use absolute path with base URL for correct routing
          if (path.endsWith('.wasm')) {
            return `${basePath}${path}`;
          }
          return path;
        },
      });
      
      // Wait a bit for runtime initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Copy HEAP arrays from internal scope to module object
      // The HEAP arrays exist in the closure but aren't directly exposed
      // We can access them through getValue/setValue or create our own views
      wasmModule = module as PageRankWASM;

      logger.timeEnd('WASM-Load');
      logger.info('WASM', 'WASM module loaded successfully');
      
      // Debug: Log available properties
      logger.info('WASM', 'Available properties:', Object.keys(module).filter(k => !k.startsWith('_')).join(', '));

      return wasmModule;
    } catch (error) {
      logger.error('WASM', 'Failed to load WASM module', error);
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Check if WASM is supported in the current environment
 */
export function isWASMSupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function') {
      // Test with a minimal WASM module
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (module instanceof WebAssembly.Module) {
        return true;
      }
    }
  } catch (e) {
    logger.warn('WASM', 'WebAssembly not supported', e);
  }
  return false;
}

/**
 * Get the loaded WASM module (without loading it)
 * Returns null if not loaded
 */
export function getWASMModule(): PageRankWASM | null {
  return wasmModule;
}

/**
 * Unload the WASM module and free resources
 */
export function unloadWASM(): void {
  if (wasmModule) {
    logger.info('WASM', 'Unloading WASM module');
    wasmModule = null;
    loadingPromise = null;
  }
}
