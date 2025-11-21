/**
 * @fileoverview Unit tests for error metrics calculation
 * @module utils/__tests__/errorMetrics.test
 */

import { describe, test, expect } from 'vitest';
import {
  calculateL1,
  calculateL2,
  calculateMaxRelative,
  calculateErrorMetrics,
  VectorLengthMismatchError,
} from '../errorMetrics';

describe('ErrorMetrics', () => {
  describe('calculateL1', () => {
    test('calculates L1 error correctly', () => {
      const pr = [0.3, 0.3, 0.4];
      const gt = [0.35, 0.25, 0.4];
      const l1 = calculateL1(pr, gt);
      
      expect(l1).toBeCloseTo(0.1, 5);
    });

    test('returns 0 for identical vectors', () => {
      const pr = [0.2, 0.3, 0.5];
      const gt = [0.2, 0.3, 0.5];
      
      expect(calculateL1(pr, gt)).toBe(0);
    });

    test('throws on length mismatch', () => {
      const pr = [0.5, 0.5];
      const gt = [0.33, 0.33, 0.34];
      
      expect(() => calculateL1(pr, gt)).toThrow(VectorLengthMismatchError);
    });
  });

  describe('calculateL2', () => {
    test('calculates L2 error correctly', () => {
      const pr = [0.3, 0.4];
      const gt = [0.6, 0.4];
      const l2 = calculateL2(pr, gt);
      
      expect(l2).toBeCloseTo(0.3, 5);
    });

    test('returns 0 for identical vectors', () => {
      const pr = [0.25, 0.75];
      const gt = [0.25, 0.75];
      
      expect(calculateL2(pr, gt)).toBe(0);
    });

    test('throws on length mismatch', () => {
      const pr = [0.5, 0.5];
      const gt = [0.33, 0.33, 0.34];
      
      expect(() => calculateL2(pr, gt)).toThrow(VectorLengthMismatchError);
    });
  });

  describe('calculateMaxRelative', () => {
    test('calculates max relative error correctly', () => {
      const n = 4;
      const pr = [0.3, 0.2, 0.2, 0.3];
      const gt = [0.4, 0.2, 0.15, 0.25];
      
      // threshold = 0.25, qualified: indices 0, 1, 3
      // errors: |0.3-0.4|/0.4 = 0.25, |0.2-0.2|/0.2 = 0, |0.3-0.25|/0.25 = 0.2
      const result = calculateMaxRelative(pr, gt, n);
      
      expect(result.maxRelative).toBeCloseTo(0.25, 5);
      expect(result.qualifiedNodes).toBe(3);
    });

    test('returns 0 when no nodes qualify', () => {
      const n = 4;
      const pr = [0.1, 0.2, 0.3, 0.4];
      const gt = [0.1, 0.2, 0.3, 0.4];
      
      // threshold = 0.25, but all values < threshold
      const result = calculateMaxRelative(pr, gt, n);
      
      expect(result.maxRelative).toBe(0);
      expect(result.qualifiedNodes).toBe(3); // 0.3, 0.4, 0.4 > 0.25
    });

    test('throws on length mismatch', () => {
      const pr = [0.5, 0.5];
      const gt = [0.33, 0.33, 0.34];
      
      expect(() => calculateMaxRelative(pr, gt, 3)).toThrow(VectorLengthMismatchError);
    });
  });

  describe('calculateErrorMetrics', () => {
    test('calculates all metrics correctly', () => {
      const pr = [0.3, 0.3, 0.4];
      const gt = [0.35, 0.25, 0.4];
      const metrics = calculateErrorMetrics(pr, gt);
      
      expect(metrics.l1).toBeCloseTo(0.1, 5);
      expect(metrics.l2).toBeCloseTo(0.07071, 4);
      expect(metrics.maxRelative).toBeGreaterThan(0);
      expect(metrics.qualifiedNodes).toBeGreaterThan(0);
    });
  });
});
