/**
 * @file pagerank.cpp
 * @brief WebAssembly PageRank implementation in C++
 * @author PageRank Visualizer Team
 * @date 2025-11-21
 * 
 * Implements both Power Iteration and Random Walk algorithms for PageRank computation.
 * Compiled to WebAssembly using Emscripten for high-performance execution in browsers.
 * 
 * Compilation:
 *   ./compile.sh
 * 
 * Exported functions:
 *   - powerIteration: Power Iteration algorithm
 *   - randomWalk: Random Walk algorithm
 */

#include <vector>
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <ctime>
#include <emscripten/emscripten.h>

// Progress callback (can be called from C++ to report progress to JavaScript)
extern "C" {
    void EMSCRIPTEN_KEEPALIVE reportProgress(int progress);
}

/**
 * Graph structure
 */
struct Graph {
    int nodes;
    int edges;
    std::vector<int> edgeSources;
    std::vector<int> edgeTargets;
    std::vector<int> outDegree;
    std::vector<std::vector<int>> adjacencyList;

    Graph(int n, int m) : nodes(n), edges(m) {
        edgeSources.reserve(m);
        edgeTargets.reserve(m);
        outDegree.resize(n, 0);
        adjacencyList.resize(n);
    }

    void addEdge(int source, int target) {
        edgeSources.push_back(source);
        edgeTargets.push_back(target);
        outDegree[source]++;
        adjacencyList[source].push_back(target);
    }
};

/**
 * Power Iteration algorithm for PageRank
 * 
 * @param nodes Number of nodes
 * @param edgeCount Number of edges
 * @param edgeSources Array of source node IDs
 * @param edgeTargets Array of target node IDs
 * @param alpha Damping factor
 * @param iterations Number of iterations
 * @param resultPtr Output array for PageRank values (must be pre-allocated)
 */
extern "C" {
EMSCRIPTEN_KEEPALIVE
void powerIteration(
    int nodes,
    int edgeCount,
    int* edgeSources,
    int* edgeTargets,
    double alpha,
    int iterations,
    double* resultPtr
) {
    // Build graph
    Graph graph(nodes, edgeCount);
    for (int i = 0; i < edgeCount; i++) {
        graph.addEdge(edgeSources[i], edgeTargets[i]);
    }

    // Find dangling nodes
    std::vector<int> danglingNodes;
    for (int i = 0; i < nodes; i++) {
        if (graph.outDegree[i] == 0) {
            danglingNodes.push_back(i);
        }
    }

    // Initialize PageRank
    std::vector<double> pr(nodes, 1.0 / nodes);
    std::vector<double> newPr(nodes);

    double teleportation = (1.0 - alpha) / nodes;

    // Iterate
    for (int iter = 0; iter < iterations; iter++) {
        // Initialize with teleportation
        std::fill(newPr.begin(), newPr.end(), teleportation);

        // Add dangling node contribution
        double danglingSum = 0.0;
        for (int node : danglingNodes) {
            danglingSum += pr[node];
        }
        double danglingContribution = (alpha * danglingSum) / nodes;
        for (int i = 0; i < nodes; i++) {
            newPr[i] += danglingContribution;
        }

        // Add edge contributions
        for (int i = 0; i < edgeCount; i++) {
            int source = graph.edgeSources[i];
            int target = graph.edgeTargets[i];
            double contribution = (alpha * pr[source]) / graph.outDegree[source];
            newPr[target] += contribution;
        }

        // Swap
        std::swap(pr, newPr);

        // Report progress every 10 iterations
        if ((iter + 1) % 10 == 0) {
            // Can call reportProgress() here if implemented in JavaScript
            // EM_ASM can be used for this
        }
    }

    // Normalize
    double sum = 0.0;
    for (double val : pr) {
        sum += val;
    }
    if (std::abs(sum - 1.0) > 1e-6) {
        for (int i = 0; i < nodes; i++) {
            pr[i] /= sum;
        }
    }

    // Copy result
    for (int i = 0; i < nodes; i++) {
        resultPtr[i] = pr[i];
    }
}
}

/**
 * Random Walk algorithm for PageRank
 * 
 * @param nodes Number of nodes
 * @param edgeCount Number of edges
 * @param edgeSources Array of source node IDs
 * @param edgeTargets Array of target node IDs
 * @param alpha Damping factor
 * @param walksPerNode Number of walks per node
 * @param resultPtr Output array for PageRank values (must be pre-allocated)
 * @param seed Random seed
 */
extern "C" {
EMSCRIPTEN_KEEPALIVE
void randomWalk(
    int nodes,
    int edgeCount,
    int* edgeSources,
    int* edgeTargets,
    double alpha,
    int walksPerNode,
    double* resultPtr,
    unsigned int seed
) {
    // Initialize random seed
    std::srand(seed);

    // Build graph
    Graph graph(nodes, edgeCount);
    for (int i = 0; i < edgeCount; i++) {
        graph.addEdge(edgeSources[i], edgeTargets[i]);
    }

    // Initialize visit counter
    std::vector<unsigned long long> visitCount(nodes, 0);

    // Perform random walks
    for (int startNode = 0; startNode < nodes; startNode++) {
        for (int walk = 0; walk < walksPerNode; walk++) {
            int current = startNode;

            // Count the starting node visit
            visitCount[current]++;

            // Continue walk with probability alpha
            while (((double)std::rand() / RAND_MAX) < alpha) {
                const auto& neighbors = graph.adjacencyList[current];

                // If no outgoing edges, teleport to random node
                if (neighbors.empty()) {
                    current = std::rand() % nodes;
                    visitCount[current]++;
                    break;
                }

                // Choose random neighbor
                int randomIndex = std::rand() % neighbors.size();
                current = neighbors[randomIndex];

                // Count visit
                visitCount[current]++;
            }
        }

        // Report progress every 10% of nodes
        if ((startNode + 1) % (nodes / 10 + 1) == 0) {
            // Can call reportProgress() here
        }
    }

    // Normalize visit counts
    unsigned long long totalVisits = 0;
    for (unsigned long long count : visitCount) {
        totalVisits += count;
    }

    if (totalVisits == 0) {
        // Fallback to uniform distribution
        for (int i = 0; i < nodes; i++) {
            resultPtr[i] = 1.0 / nodes;
        }
        return;
    }

    for (int i = 0; i < nodes; i++) {
        resultPtr[i] = (double)visitCount[i] / totalVisits;
    }

    // Normalize to ensure sum = 1.0
    double sum = 0.0;
    for (int i = 0; i < nodes; i++) {
        sum += resultPtr[i];
    }
    if (std::abs(sum - 1.0) > 1e-6) {
        for (int i = 0; i < nodes; i++) {
            resultPtr[i] /= sum;
        }
    }
}
}
