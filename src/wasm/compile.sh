#!/bin/bash

###############################################################################
# PageRank WebAssembly Compilation Script
# 
# This script compiles the C++ PageRank implementation to WebAssembly using
# Emscripten. Make sure you have Emscripten SDK installed and activated.
# 
# Installation instructions: https://emscripten.org/docs/getting_started/downloads.html
# 
# Usage:
#   cd src/wasm
#   bash compile.sh
# 
# Output:
#   ../../public/pagerank.js
#   ../../public/pagerank.wasm
###############################################################################

set -e  # Exit on error

echo "======================================"
echo "  PageRank WASM Compilation Script"
echo "======================================"
echo ""

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "ERROR: emcc not found!"
    echo "Please install Emscripten SDK:"
    echo "  https://emscripten.org/docs/getting_started/downloads.html"
    echo ""
    echo "After installation, activate it:"
    echo "  source /path/to/emsdk/emsdk_env.sh"
    exit 1
fi

echo "Found Emscripten:"
emcc --version | head -n 1
echo ""

# Create output directory if it doesn't exist
mkdir -p ../../public

# Compile
echo "Compiling pagerank.cpp to WebAssembly..."
echo ""

emcc pagerank.cpp \
  -o ../../public/pagerank.js \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_powerIteration","_randomWalk","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","setValue"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MAXIMUM_MEMORY=2GB \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createPageRankModule" \
  -s ENVIRONMENT='web,worker' \
  -O3 \
  --no-entry

echo ""
echo "======================================"
echo "  Compilation Successful!"
echo "======================================"
echo ""
echo "Output files:"
echo "  - ../../public/pagerank.js"
echo "  - ../../public/pagerank.wasm"
echo ""
echo "File sizes:"
ls -lh ../../public/pagerank.* | awk '{print "  - " $9 ": " $5}'
echo ""
echo "You can now run the application with 'npm run dev'"
echo ""
