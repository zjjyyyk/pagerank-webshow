/**
 * @fileoverview Unit tests for graph parser
 * @module utils/__tests__/graphParser.test
 */

import { describe, test, expect } from 'vitest';
import { parseEdgeList, computeOutDegree, buildAdjacencyList, GraphParseError } from '../graphParser';

describe('GraphParser', () => {
  describe('parseEdgeList', () => {
    test('parses standard edge list', () => {
      const input = '1 2\n2 3\n3 1';
      const graph = parseEdgeList(input);
      
      expect(graph.nodes).toBe(3);
      expect(graph.edges.length).toBe(3);
      expect(graph.edges[0]).toEqual({ source: 0, target: 1 });
      expect(graph.wasOneBased).toBe(true);
    });

    test('parses 0-based edge list', () => {
      const input = '0 1\n1 2\n2 0';
      const graph = parseEdgeList(input);
      
      expect(graph.nodes).toBe(3);
      expect(graph.edges.length).toBe(3);
      expect(graph.edges[0]).toEqual({ source: 0, target: 1 });
      expect(graph.wasOneBased).toBe(false);
    });

    test('ignores comment lines', () => {
      const input = '# comment\n1 2\n# another\n2 3';
      const graph = parseEdgeList(input);
      
      expect(graph.edges.length).toBe(2);
    });

    test('handles first line as metadata', () => {
      const input = '3 2\n1 2\n2 3';
      const graph = parseEdgeList(input);
      
      expect(graph.nodes).toBe(3);
      expect(graph.edges.length).toBe(2);
    });

    test('ignores empty lines', () => {
      const input = '1 2\n\n2 3\n\n3 1';
      const graph = parseEdgeList(input);
      
      expect(graph.edges.length).toBe(3);
    });

    test('throws on invalid format', () => {
      const input = '1 2 3';
      expect(() => parseEdgeList(input)).toThrow(GraphParseError);
    });

    test('throws on non-numeric nodes', () => {
      const input = 'a b';
      expect(() => parseEdgeList(input)).toThrow(GraphParseError);
    });

    test('throws on negative node IDs', () => {
      const input = '-1 2';
      expect(() => parseEdgeList(input)).toThrow(GraphParseError);
    });

    test('throws on empty file', () => {
      const input = '';
      expect(() => parseEdgeList(input)).toThrow(GraphParseError);
    });
  });

  describe('computeOutDegree', () => {
    test('computes correct out-degrees', () => {
      const graph = parseEdgeList('0 1\n0 2\n1 2');
      const outDegree = computeOutDegree(graph);
      
      expect(outDegree[0]).toBe(2);
      expect(outDegree[1]).toBe(1);
      expect(outDegree[2]).toBe(0);
    });

    test('handles dangling nodes', () => {
      const graph = parseEdgeList('0 1\n0 2');
      const outDegree = computeOutDegree(graph);
      
      expect(outDegree[1]).toBe(0);
      expect(outDegree[2]).toBe(0);
    });
  });

  describe('buildAdjacencyList', () => {
    test('builds correct adjacency list', () => {
      const graph = parseEdgeList('0 1\n0 2\n1 2');
      const adjList = buildAdjacencyList(graph);
      
      expect(adjList[0]).toEqual([1, 2]);
      expect(adjList[1]).toEqual([2]);
      expect(adjList[2]).toEqual([]);
    });
  });
});
