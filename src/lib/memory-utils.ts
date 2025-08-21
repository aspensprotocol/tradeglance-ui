import { useState, useEffect, useCallback } from "react";
import { formatBytes } from "./number-utils";

/**
 * Memory management utilities for performance optimization
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

interface MemoryThresholds {
  warningThreshold: number; // 80% of heap limit
  criticalThreshold: number; // 95% of heap limit
  cleanupThreshold: number; // 70% of heap limit
}

class MemoryManager {
  private memoryHistory: MemoryInfo[] = [];
  private maxHistorySize = 100;
  private thresholds: MemoryThresholds = {
    warningThreshold: 0.8,
    criticalThreshold: 0.95,
    cleanupThreshold: 0.7,
  };
  private isMonitoring = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get current memory usage
   */
  getMemoryInfo(): MemoryInfo | null {
    if ("memory" in performance) {
      const memory = (performance as { memory: MemoryInfo }).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    console.log("🧠 Memory monitoring started");
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("🧠 Memory monitoring stopped");
  }

  /**
   * Check current memory usage and take action if needed
   */
  private checkMemoryUsage(): void {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return;

    // Add to history
    this.memoryHistory.push(memoryInfo);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;

    // Log memory usage
    console.log(
      `🧠 Memory usage: ${(usageRatio * 100).toFixed(1)}% (${formatBytes(memoryInfo.usedJSHeapSize)} / ${formatBytes(memoryInfo.jsHeapSizeLimit)})`,
    );

    // Take action based on thresholds
    if (usageRatio >= this.thresholds.criticalThreshold) {
      console.warn("🚨 CRITICAL: Memory usage is very high!");
      this.emergencyCleanup();
    } else if (usageRatio >= this.thresholds.warningThreshold) {
      console.warn("⚠️ WARNING: Memory usage is high");
      this.cleanup();
    } else if (usageRatio >= this.thresholds.cleanupThreshold) {
      console.info("🧹 Memory usage is moderate, performing light cleanup");
      this.lightCleanup();
    }
  }

  /**
   * Perform light cleanup
   */
  private lightCleanup(): void {
    // Clear old memory history
    if (this.memoryHistory.length > this.maxHistorySize / 2) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize / 2);
    }

    // Suggest garbage collection if available
    if ("gc" in window) {
      try {
        (window as { gc: () => void }).gc();
        console.log("🧹 Light cleanup completed");
      } catch {
        console.log("🧹 Light cleanup completed (GC not available)");
      }
    }
  }

  /**
   * Perform regular cleanup
   */
  private cleanup(): void {
    // Clear memory history
    this.memoryHistory = [];

    // Clear console logs in production
    if (import.meta.env.PROD) {
      console.clear();
    }

    // Force garbage collection if available
    if ("gc" in window) {
      try {
        (window as { gc: () => void }).gc();
        console.log("🧹 Cleanup completed with GC");
      } catch {
        console.log("🧹 Cleanup completed (GC not available)");
      }
    }

    // Dispatch custom event for components to clean up
    window.dispatchEvent(new CustomEvent("memory-cleanup"));
  }

  /**
   * Perform emergency cleanup
   */
  private emergencyCleanup(): void {
    // Aggressive cleanup
    this.cleanup();

    // Clear all timeouts and intervals
    const highestTimeoutId = setTimeout(() => {
      // Empty function
    }, 0);
    for (let i = 0; i < Number(highestTimeoutId); i++) {
      clearTimeout(i);
      clearInterval(i);
    }

    // Clear requestAnimationFrame
    const highestAnimationFrameId = requestAnimationFrame(() => {
      // Empty function
    });
    for (let i = 0; i < highestAnimationFrameId; i++) {
      cancelAnimationFrame(i);
    }

    // Force garbage collection multiple times
    if ("gc" in window) {
      for (let i = 0; i < 3; i++) {
        try {
          (window as { gc: () => void }).gc();
        } catch {
          // Ignore errors
        }
      }
    }

    console.log("🚨 Emergency cleanup completed");
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: MemoryInfo | null;
    average: number;
    peak: number;
    trend: "increasing" | "decreasing" | "stable";
  } {
    const current = this.getMemoryInfo();
    if (!current || this.memoryHistory.length === 0) {
      return { current, average: 0, peak: 0, trend: "stable" };
    }

    const usageRatios = this.memoryHistory.map(
      (info) => info.usedJSHeapSize / info.jsHeapSizeLimit,
    );
    const average =
      usageRatios.reduce((sum, ratio) => sum + ratio, 0) / usageRatios.length;
    const peak = Math.max(...usageRatios);

    // Determine trend based on recent history
    const recent = usageRatios.slice(-10);
    const trend =
      recent.length >= 2
        ? recent[recent.length - 1] > recent[0] + 0.05
          ? "increasing"
          : recent[recent.length - 1] < recent[0] - 0.05
            ? "decreasing"
            : "stable"
        : "stable";

    return { current, average, peak, trend };
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): MemoryThresholds {
    return { ...this.thresholds };
  }
}

// Create a singleton instance
export const memoryManager = new MemoryManager();

/**
 * Hook for memory monitoring in React components
 */
export function useMemoryMonitoring(
  enabled = true,
  intervalMs = 5000,
): {
  memoryInfo: MemoryInfo | null;
  memoryStats: ReturnType<typeof memoryManager.getMemoryStats>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
} {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [memoryStats, setMemoryStats] = useState(
    memoryManager.getMemoryStats(),
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const updateMemoryInfo = () => {
      const info = memoryManager.getMemoryInfo();
      const stats = memoryManager.getMemoryStats();
      setMemoryInfo(info);
      setMemoryStats(stats);
    };

    // Initial update
    updateMemoryInfo();

    // Set up interval
    const interval = setInterval(updateMemoryInfo, intervalMs);

    // Set up memory cleanup event listener
    const handleMemoryCleanup = () => {
      updateMemoryInfo();
    };
    window.addEventListener("memory-cleanup", handleMemoryCleanup);

    return () => {
      clearInterval(interval);
      window.removeEventListener("memory-cleanup", handleMemoryCleanup);
    };
  }, [enabled, intervalMs]);

  const startMonitoring = useCallback(() => {
    memoryManager.startMonitoring(intervalMs);
  }, [intervalMs]);

  const stopMonitoring = useCallback(() => {
    memoryManager.stopMonitoring();
  }, []);

  return {
    memoryInfo,
    memoryStats,
    startMonitoring,
    stopMonitoring,
  };
}

/**
 * Hook for automatic memory cleanup in components
 */
export function useMemoryCleanup(threshold = 0.8): void {
  useEffect(() => {
    const handleMemoryCleanup = () => {
      // Component-specific cleanup logic
      console.log("🧹 Component memory cleanup triggered");
    };

    window.addEventListener("memory-cleanup", handleMemoryCleanup);
    return () => {
      window.removeEventListener("memory-cleanup", handleMemoryCleanup);
    };
  }, [threshold]);
}

export default memoryManager;
