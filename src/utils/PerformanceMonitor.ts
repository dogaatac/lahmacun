import { InteractionManager } from "react-native";

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  targetFPS: number;
  maxMemoryMB: number;
  maxRenderTimeMs: number;
  maxAPIResponseTimeMs: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private markers: Map<string, number> = new Map();
  private enabled: boolean = true;

  private thresholds: PerformanceThresholds = {
    targetFPS: 60,
    maxMemoryMB: 512,
    maxRenderTimeMs: 16.67, // ~60fps
    maxAPIResponseTimeMs: 3000,
  };

  private frameDrops: number = 0;
  private lastFrameTime: number = 0;

  constructor() {
    if (__DEV__) {
      this.startFPSMonitoring();
    }
  }

  startMeasure(name: string): void {
    if (!this.enabled) {
      return;
    }
    this.markers.set(name, performance.now());
  }

  endMeasure(
    name: string,
    metadata?: Record<string, any>
  ): PerformanceMetric | null {
    if (!this.enabled) {
      return null;
    }

    const startTime = this.markers.get(name);
    if (!startTime) {
      console.warn(`[Performance] No start marker found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.markers.delete(name);

    if (__DEV__) {
      this.logMetric(metric);
    }

    return metric;
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endMeasure(name, {
        ...metadata,
        success: false,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  measureRender(componentName: string, renderFn: () => void): void {
    if (!this.enabled) {
      renderFn();
      return;
    }

    this.startMeasure(`render_${componentName}`);
    renderFn();
    InteractionManager.runAfterInteractions(() => {
      this.endMeasure(`render_${componentName}`);
    });
  }

  trackMemoryUsage(label: string): void {
    if (!this.enabled || !__DEV__) {
      return;
    }

    if (global.performance && (global.performance as any).memory) {
      const memory = (global.performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      const totalMB = memory.totalJSHeapSize / 1048576;

      console.log(
        `[Memory] ${label}: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`
      );

      if (usedMB > this.thresholds.maxMemoryMB) {
        console.warn(
          `[Performance] Memory threshold exceeded: ${usedMB.toFixed(2)}MB`
        );
      }
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return null;
    }

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.markers.clear();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  generateReport(): string {
    const report: string[] = [
      "=== Performance Report ===",
      `Total Metrics: ${this.metrics.length}`,
      "",
    ];

    const groupedMetrics: Record<string, PerformanceMetric[]> = {};
    this.metrics.forEach((metric) => {
      if (!groupedMetrics[metric.name]) {
        groupedMetrics[metric.name] = [];
      }
      groupedMetrics[metric.name].push(metric);
    });

    Object.entries(groupedMetrics).forEach(([name, metrics]) => {
      const avg =
        metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const min = Math.min(...metrics.map((m) => m.duration));
      const max = Math.max(...metrics.map((m) => m.duration));

      report.push(`${name}:`);
      report.push(`  Count: ${metrics.length}`);
      report.push(`  Avg: ${avg.toFixed(2)}ms`);
      report.push(`  Min: ${min.toFixed(2)}ms`);
      report.push(`  Max: ${max.toFixed(2)}ms`);
      report.push("");
    });

    report.push(`Frame Drops: ${this.frameDrops}`);
    report.push(`Target FPS: ${this.thresholds.targetFPS}`);

    return report.join("\n");
  }

  private startFPSMonitoring(): void {
    const targetFrameTime = 1000 / this.thresholds.targetFPS;

    const checkFrameRate = () => {
      const now = performance.now();
      if (this.lastFrameTime > 0) {
        const frameDuration = now - this.lastFrameTime;
        if (frameDuration > targetFrameTime * 1.5) {
          this.frameDrops++;
        }
      }
      this.lastFrameTime = now;
      requestAnimationFrame(checkFrameRate);
    };

    requestAnimationFrame(checkFrameRate);
  }

  private logMetric(metric: PerformanceMetric): void {
    const exceededThreshold =
      (metric.name.includes("render") &&
        metric.duration > this.thresholds.maxRenderTimeMs) ||
      (metric.name.includes("api") &&
        metric.duration > this.thresholds.maxAPIResponseTimeMs);

    const icon = exceededThreshold ? "⚠️" : "✓";
    console.log(
      `${icon} [Performance] ${metric.name}: ${metric.duration.toFixed(2)}ms`
    );

    if (metric.metadata) {
      console.log("  Metadata:", metric.metadata);
    }
  }
}

export default new PerformanceMonitor();
