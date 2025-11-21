/**
 * @fileoverview Parameter configuration panel component
 * @module components/ParameterPanel
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Play, Loader2, StopCircle } from 'lucide-react';
import { logger } from '@/utils/logger';
import { loadDataset, loadFromFile, getAvailableDatasets } from '@/utils/dataLoader';
import { calculateErrorMetrics } from '@/utils/errorMetrics';
import type { ParsedGraph } from '@/types/graph';
import type { AlgorithmType, AlgorithmResultWithMetrics, PowerIterationParams, RandomWalkParams } from '@/types/algorithm';

interface ParameterPanelProps {
  currentGraph: ParsedGraph | null;
  setCurrentGraph: (graph: ParsedGraph | null) => void;
  isComputing: boolean;
  setIsComputing: (computing: boolean) => void;
  results: AlgorithmResultWithMetrics[];
  setResults: (results: AlgorithmResultWithMetrics[]) => void;
  groundTruthId: string | null;
  compute: (
    algorithm: AlgorithmType,
    graph: ParsedGraph,
    params: PowerIterationParams | RandomWalkParams,
    callbacks: {
      onResult: (result: number[], time: number) => void;
      onError: (error: string) => void;
      onProgress?: (progress: number, message?: string) => void;
    }
  ) => string;
  cancel: (taskId: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ParameterPanel({
  currentGraph,
  setCurrentGraph,
  isComputing,
  setIsComputing,
  results,
  setResults,
  groundTruthId,
  compute,
  cancel,
  showToast,
}: ParameterPanelProps) {
  const [selectedDataset, setSelectedDataset] = useState<string>('dblp');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('power-iteration-js');
  const [alpha, setAlpha] = useState<number>(0.85);
  const [iterations, setIterations] = useState<number>(100);
  const [walksPerNode, setWalksPerNode] = useState<number>(1000);
  const [progress, setProgress] = useState<number>(0);
  const [isDirectedUpload, setIsDirectedUpload] = useState<boolean>(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const datasets = getAvailableDatasets();

  // Timer for elapsed time display
  useEffect(() => {
    if (isComputing) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isComputing]);

  // Auto-load DBLP dataset on mount
  useEffect(() => {
    // Only load if no graph is currently loaded
    if (currentGraph !== null) {
      return;
    }

    const loadDefaultDataset = async () => {
      try {
        const graph = await loadDataset('dblp');
        setCurrentGraph(graph);
        showToast('success', `Auto-loaded dataset: dblp (${graph.nodes} nodes, ${graph.edges.length} edges)`);
      } catch (error) {
        logger.error('UI', 'Failed to auto-load default dataset', error);
        // Don't show error toast, just fail silently
      }
    };
    
    loadDefaultDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount

  const handleDatasetChange = async (datasetName: string) => {
    setSelectedDataset(datasetName);
    try {
      const graph = await loadDataset(datasetName);
      setCurrentGraph(graph);
      
      // Auto-switch to WASM if graph is large and current algorithm is JS
      if (graph.nodes > 10000 && algorithm.includes('-js')) {
        const wasmAlgorithm = algorithm.replace('-js', '-wasm') as AlgorithmType;
        setAlgorithm(wasmAlgorithm);
        showToast('info', 'Switched to WASM algorithm for large dataset');
      }
      
      showToast('success', `Loaded dataset: ${datasetName} (${graph.nodes} nodes, ${graph.edges.length} edges)`);
    } catch (error) {
      logger.error('UI', 'Failed to load dataset', error);
      showToast('error', `Failed to load dataset: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const graph = await loadFromFile(file, isDirectedUpload);
      setCurrentGraph(graph);
      // Use filename as dataset name for custom files
      setSelectedDataset(file.name);
      
      // Auto-switch to WASM if graph is large and current algorithm is JS
      if (graph.nodes > 10000 && algorithm.includes('-js')) {
        const wasmAlgorithm = algorithm.replace('-js', '-wasm') as AlgorithmType;
        setAlgorithm(wasmAlgorithm);
        showToast('info', 'Switched to WASM algorithm for large dataset');
      }
      
      showToast('success', `Loaded file: ${file.name} (${graph.nodes} nodes, ${graph.edges.length} edges)`);
    } catch (error) {
      logger.error('UI', 'Failed to load file', error);
      showToast('error', `Failed to load file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCompute = () => {
    if (!currentGraph) {
      showToast('warning', 'Please load a dataset first');
      return;
    }

    setIsComputing(true);
    setProgress(0);

    const params = algorithm.includes('power-iteration')
      ? { alpha, iterations }
      : { alpha, walksPerNode };

    const taskId = compute(algorithm, currentGraph, params, {
      onResult: (result, time) => {
        // Find ground truth for error calculation
        const groundTruth = results.find((r) => r.id === groundTruthId);
        const metrics = groundTruth ? calculateErrorMetrics(result, groundTruth.pagerank) : null;

        const newResult: AlgorithmResultWithMetrics = {
          id: `result-${Date.now()}`,
          algorithm,
          dataset: selectedDataset,
          params,
          pagerank: result,
          executionTime: time,
          timestamp: Date.now(),
          isGroundTruth: false,
          metrics,
          isCollapsed: false,  // New result is expanded
          isPinned: false,
        };

        // Collapse all existing unpinned results
        const updatedResults = results.map(r => ({
          ...r,
          isCollapsed: r.isPinned ? r.isCollapsed : true,
        }));

        setResults([...updatedResults, newResult]);
        setIsComputing(false);
        setProgress(0);
        setCurrentTaskId(null);
        showToast('success', `Computation completed in ${time.toFixed(2)}ms`);
      },
      onError: (error) => {
        setIsComputing(false);
        setProgress(0);
        setCurrentTaskId(null);
        showToast('error', `Computation failed: ${error}`);
      },
      onProgress: (prog) => {
        setProgress(prog);
      },
    });
    
    setCurrentTaskId(taskId);
  };

  const handleStop = () => {
    if (currentTaskId) {
      cancel(currentTaskId);
      setIsComputing(false);
      setProgress(0);
      setCurrentTaskId(null);
      // Timer will be cleaned up by useEffect when isComputing becomes false
      showToast('info', 'Computation stopped');
    }
  };

  const handleClearResults = () => {
    // Keep only ground truth result (based on groundTruthId)
    const groundTruthResults = results.filter(r => r.id === groundTruthId);
    setResults(groundTruthResults);
    
    const clearedCount = results.length - groundTruthResults.length;
    if (clearedCount > 0) {
      showToast('info', `Cleared ${clearedCount} result(s)${groundTruthResults.length > 0 ? ', kept ground truth' : ''}`);
    } else {
      showToast('info', 'No results to clear');
    }
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-bold text-primary-400">Parameters</h2>

      {/* Dataset Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Choose a dataset to start: </label>
        <div className="space-y-2">
          {datasets.map((dataset) => (
            <label key={dataset.name} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="dataset"
                value={dataset.name}
                checked={selectedDataset === dataset.name}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="w-4 h-4 text-primary-600"
                disabled={isComputing}
              />
              <span className="text-sm">{dataset.displayName}</span>
            </label>
          ))}
        </div>

        {/* Graph Type Selection for Custom Upload */}
        <div className="mt-3 space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Custom File Graph Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDirectedUpload(false)}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                !isDirectedUpload
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={isComputing}
            >
              Undirected
            </button>
            <button
              onClick={() => setIsDirectedUpload(true)}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isDirectedUpload
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={isComputing}
            >
              Directed
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Select graph type before uploading. All preset datasets are undirected.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isComputing}
          className="btn-secondary w-full flex items-center justify-center gap-2 mt-3"
        >
          <Upload className="w-4 h-4" />
          Upload Custom File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.edgelist"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Current Graph Info */}
      {currentGraph && (
        <div className="bg-gray-700 p-3 rounded text-sm space-y-1">
          <p className="text-gray-300">
            <span className="font-medium">Dataset:</span> {selectedDataset}
          </p>
          <p className="text-gray-300">
            <span className="font-medium">Nodes:</span> {currentGraph.nodes.toLocaleString()}
          </p>
          <p className="text-gray-300">
            <span className="font-medium">Edges:</span> {currentGraph.edges.length.toLocaleString()}
          </p>
          <p className="text-gray-300">
            <span className="font-medium">Type:</span> {currentGraph.isDirected ? 'Directed' : 'Undirected'}
          </p>
        </div>
      )}

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Algorithm</label>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
          className="input-field"
          disabled={isComputing}
        >
          <option 
            value="power-iteration-js" 
            disabled={currentGraph !== null && currentGraph.nodes > 10000}
          >
            Power Iteration (JavaScript) {currentGraph && currentGraph.nodes > 10000 ? '(Disabled for large graphs)' : ''}
          </option>
          <option value="power-iteration-wasm">Power Iteration (WebAssembly)</option>
          <option 
            value="random-walk-js"
            disabled={currentGraph !== null && currentGraph.nodes > 10000}
          >
            Random Walk (JavaScript) {currentGraph && currentGraph.nodes > 10000 ? '(Disabled for large graphs)' : ''}
          </option>
          <option value="random-walk-wasm">Random Walk (WebAssembly)</option>
        </select>
        {currentGraph && currentGraph.nodes > 10000 && (
          <p className="text-xs text-yellow-500 mt-1">
            ⚠️ Large dataset detected ({currentGraph.nodes.toLocaleString()} nodes). JavaScript algorithms are disabled. Please use WebAssembly algorithms for better performance.
          </p>
        )}
      </div>

      {/* Alpha Parameter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Alpha (Damping Factor): {alpha.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.01"
          max="0.99"
          step="0.01"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          className="w-full"
          disabled={isComputing}
        />
        <input
          type="number"
          min="0.01"
          max="0.99"
          step="0.01"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          className="input-field"
          disabled={isComputing}
        />
      </div>

      {/* Algorithm-specific Parameters */}
      {algorithm.includes('power-iteration') ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Iterations: {iterations}
          </label>
          <input
            type="range"
            min="1"
            max="1000"
            step="1"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="w-full"
            disabled={isComputing}
          />
          <input
            type="number"
            min="1"
            max="1000"
            step="1"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="input-field"
            disabled={isComputing}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Walks Per Node: {walksPerNode.toLocaleString()}
          </label>
          <input
            type="range"
            min="100"
            max="10000000"
            step="1000"
            value={walksPerNode}
            onChange={(e) => setWalksPerNode(parseInt(e.target.value))}
            className="w-full"
            disabled={isComputing}
          />
          <input
            type="number"
            min="100"
            max="10000000"
            step="1000"
            value={walksPerNode}
            onChange={(e) => setWalksPerNode(parseInt(e.target.value))}
            className="input-field"
            disabled={isComputing}
          />
        </div>
      )}

      {/* Progress Bar */}
      {isComputing && progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleCompute}
          disabled={!currentGraph || isComputing}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isComputing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Computing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Compute PageRank
            </>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!isComputing}
          className="btn-secondary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700"
        >
          <StopCircle className="w-4 h-4" />
          Stop {isComputing && `(${elapsedSeconds} sec)`}
        </button>

        <button
          onClick={handleClearResults}
          disabled={results.length === 0 || isComputing}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Results (except Ground Truth)
        </button>
      </div>
    </div>
  );
}
