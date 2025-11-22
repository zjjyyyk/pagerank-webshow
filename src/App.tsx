/**
 * @fileoverview Main application component
 * @module App
 */

import { useState } from 'react';
import { logger } from './utils/logger';
import { useToast } from './hooks/useToast';
import { usePageRankWorker } from './hooks/usePageRankWorker';
import { ToastContainer } from './components/Toast';
import { ParameterPanel } from './components/ParameterPanel';
import { ResultsPanel } from './components/ResultsPanel';
import type { ParsedGraph } from './types/graph';
import type { AlgorithmResultWithMetrics } from './types/algorithm';

function App() {
  const [currentGraph, setCurrentGraph] = useState<ParsedGraph | null>(null);
  const [results, setResults] = useState<AlgorithmResultWithMetrics[]>([]);
  const [groundTruthId, setGroundTruthId] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const { toasts, showToast, removeToast } = useToast();
  const { compute, cancel } = usePageRankWorker();

  logger.info('App', 'Application initialized');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-400">
              PageRank Algorithm Visualizer
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Compare WebAssembly (C++) and JavaScript Pagerank Algorithms with implementations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://zjjyyyk.github.io/resistance-sp-webshow/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
              title="Resistance-sp Webshow"
            >
              Resistance-sp Webshow
            </a>
            <a
              href="https://github.com/zjjyyyk/pagerank-webshow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="View on GitHub"
            >
              <img 
                src={`${import.meta.env.BASE_URL}github-icon.svg`} 
                alt="GitHub" 
                className="w-6 h-6"
              />
              <span className="text-sm font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Parameters (40%) */}
          <div className="lg:col-span-2">
            <ParameterPanel
              currentGraph={currentGraph}
              setCurrentGraph={setCurrentGraph}
              isComputing={isComputing}
              setIsComputing={setIsComputing}
              results={results}
              setResults={setResults}
              groundTruthId={groundTruthId}
              compute={compute}
              cancel={cancel}
              showToast={showToast}
            />
          </div>

          {/* Right Panel - Results (60%) */}
          <div className="lg:col-span-3">
            <ResultsPanel
              results={results}
              setResults={setResults}
              groundTruthId={groundTruthId}
              setGroundTruthId={setGroundTruthId}
              showToast={showToast}
            />
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
