# PageRank Visualizer

WebAssembly-powered PageRank algorithm visualizer that compares C++/WASM and JavaScript implementations with interactive parameter configuration and real-time performance metrics.

![PageRank Visualizer](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## ✨ Features

- 🚀 **Dual Implementation**: Compare WebAssembly (C++) and JavaScript PageRank algorithms
- 🔄 **Two Algorithms**: Power Iteration and Random Walk (Monte Carlo) methods
- 📊 **Interactive Visualization**: Real-time parameter adjustment and result comparison
- 📈 **Error Analysis**: L1, L2, and max relative error metrics against ground truth
- 🎯 **Built-in Datasets**: DBLP, Enron Email, and Astrophysics citation networks
- 📤 **Custom Upload**: Support for user-provided edge list files (up to 50MB)
- ⚡ **Web Workers**: Non-blocking computation in background threads
- 🎨 **Modern UI**: Responsive design with Tailwind CSS

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **WebAssembly**: Emscripten-compiled C++
- **State Management**: React Hooks
- **Testing**: Vitest
- **Performance**: Web Workers for async computation

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Emscripten SDK** (optional, for compiling WASM): v3.1.0+

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
cd pagerank-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🔧 Compiling WebAssembly

The project includes pre-compiled WASM files. To recompile from source:

### Install Emscripten

```bash
# Download Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh  # On Windows: emsdk_env.bat
```

### Compile

```bash
# From project root
npm run compile:wasm

# Or manually
cd src/wasm
bash compile.sh
```

Output files will be generated in `public/`:
- `pagerank.js` - JavaScript loader
- `pagerank.wasm` - WebAssembly binary

## 📁 Project Structure

```
pagerank-web/
├── src/
│   ├── algorithms/          # JS algorithm implementations
│   │   ├── powerIteration.ts
│   │   ├── randomWalk.ts
│   │   └── __tests__/
│   ├── components/          # React components
│   │   ├── ParameterPanel.tsx
│   │   ├── ResultsPanel.tsx
│   │   └── Toast.tsx
│   ├── datasets/           # Built-in graph datasets
│   │   ├── dblp.txt
│   │   ├── email-enron.txt
│   │   ├── astro.txt
│   │   └── metadata.json
│   ├── hooks/              # Custom React hooks
│   │   ├── useToast.ts
│   │   └── usePageRankWorker.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── algorithm.ts
│   │   ├── graph.ts
│   │   └── worker.ts
│   ├── utils/              # Utility functions
│   │   ├── logger.ts
│   │   ├── graphParser.ts
│   │   ├── errorMetrics.ts
│   │   ├── dataLoader.ts
│   │   ├── wasmLoader.ts
│   │   └── __tests__/
│   ├── wasm/               # C++ source and compilation
│   │   ├── pagerank.cpp
│   │   ├── compile.sh
│   │   └── README.md
│   ├── workers/            # Web Worker implementation
│   │   └── pagerank.worker.ts
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
│   ├── pagerank.js
│   └── pagerank.wasm
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎯 Usage Guide

### Loading Data

1. **Built-in Datasets**: Select from DBLP, Enron Email, or Astrophysics networks
2. **Custom Upload**: Click "Upload Custom File" and select an edge list file

### Edge List Format

```text
# Comments start with #
# Optional first line: node_count edge_count
5 6
# Edge format: source target
0 1
0 2
1 2
2 3
3 4
4 2
```

Supports both 0-based and 1-based node indexing (auto-detected).

### Running Algorithms

1. **Select Algorithm**:
   - Power Iteration (JS/WASM)
   - Random Walk (JS/WASM)

2. **Configure Parameters**:
   - **Alpha**: Damping factor (0.01-0.99, default: 0.85)
   - **Iterations**: For Power Iteration (1-1000, default: 100)
   - **Walks Per Node**: For Random Walk (100-100000, default: 1000)

3. **Compute**: Click "Compute PageRank" button

### Comparing Results

1. Run multiple algorithms with different parameters
2. Set one result as "Ground Truth" using the star button
3. View error metrics (L1, L2, Max Relative) for other results
4. Compare execution times and top-ranked nodes

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The project includes comprehensive unit tests:
- Graph parser validation
- Error metrics calculation
- Algorithm correctness
- Edge case handling

Target coverage: >80%

## 📊 Algorithms Explained

### Power Iteration

Standard iterative method for computing PageRank:

```
pr[i] = (1-α)/n + α * Σ(pr[j] / out_degree[j])
```

- **Pros**: Fast convergence, deterministic
- **Cons**: Requires iterative matrix multiplication
- **Best for**: Moderate-sized graphs, precise results

### Random Walk (Monte Carlo)

Simulates random walks to estimate PageRank:

```
For each node:
  Perform N random walks
  At each step:
    - Stop with probability (1-α)
    - Continue to random neighbor with probability α
  Count node visits
```

- **Pros**: Intuitive, parallelizable
- **Cons**: Stochastic, requires many samples
- **Best for**: Approximate results, understanding PageRank behavior

## 📏 Error Metrics

### L1 Error (Manhattan Distance)
```
L1 = Σ|pr[i] - gt[i]|
```

### L2 Error (Euclidean Distance)
```
L2 = √(Σ(pr[i] - gt[i])²)
```

### Max Relative Error
```
Max_Rel = max(|pr[i] - gt[i]| / gt[i]) for gt[i] > 1/n
```
Only considers nodes above threshold to avoid division by small numbers.

## 🔍 Debugging

All operations are logged to the console with timestamps and module tags:

```
[2025-11-21T10:30:45.123Z] [DataLoader] Loading dataset: dblp
[2025-11-21T10:30:45.234Z] [GraphParser] Starting to parse edge list
[2025-11-21T10:30:45.456Z] [Worker] Starting computation for task task-123
```

Enable debug logging in development mode to see detailed execution flow.

## ⚡ Performance Tips

1. **For large graphs (>10k nodes)**:
   - Use WASM implementations for better performance
   - Reduce iterations/walks for faster results
   - Use Power Iteration instead of Random Walk

2. **Memory optimization**:
   - WASM uses `ALLOW_MEMORY_GROWTH` for dynamic allocation
   - Maximum memory limit: 2GB
   - Clear old results to free memory

3. **Browser compatibility**:
   - Modern browsers with WebAssembly support required
   - Fallback to JS-only if WASM unavailable

## 🐛 Troubleshooting

### WASM Loading Fails

```
Error: Failed to load WASM module
```

**Solution**: Ensure `public/pagerank.wasm` exists and server headers allow WASM loading.

### File Upload Error

```
Error: File too large: 75MB (max 50MB)
```

**Solution**: Reduce file size or split graph into smaller components.

### Worker Not Responding

**Solution**: Check browser console for errors. Refresh page to restart worker.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Add JSDoc comments for functions
- Write tests for new features
- Format code with Prettier

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Datasets**: Stanford Network Analysis Project (SNAP)
- **Algorithm**: Page, Brin, Motwani, Winograd (1999)
- **Icons**: Lucide React
- **Build Tool**: Vite Team

## 📚 References

1. Page, L., Brin, S., Motwani, R., & Winograd, T. (1999). *The PageRank Citation Ranking: Bringing Order to the Web*. Stanford InfoLab.

2. Stanford SNAP Datasets: https://snap.stanford.edu/data/

3. WebAssembly Specification: https://webassembly.org/

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ❤️ and WebAssembly
