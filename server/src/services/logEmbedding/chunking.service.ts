import { ISystemLog, ILogChunk } from "../../types/systemLog";
import logger from "../../utils/logger";

/**
 * Service for chunking logs into meaningful groups
 * Implements Step 2: Chunking Strategy
 *
 * Groups logs by correlationId to capture complete user journeys
 * and create meaningful context for AI embeddings
 */
export class LogChunkingService {
  /**
   * Priority levels for determining the max log level in a chunk
   */
  private readonly LOG_LEVEL_PRIORITY: Record<string, number> = {
    error: 5,
    warn: 4,
    info: 3,
    http: 2,
    verbose: 1,
    debug: 0,
    silly: 0,
  };

  /**
   * Group logs by correlationId
   * This creates chunks that represent complete user journeys
   *
   * @param logs - Array of logs to chunk
   * @returns Array of log chunks grouped by correlationId
   */
  groupByCorrelationId(logs: ISystemLog[]): ILogChunk[] {
    try {
      logger.debug("Starting correlation-based chunking", {
        totalLogs: logs.length,
      });

      // Group logs by correlationId
      const groupedLogs = new Map<string, ISystemLog[]>();

      for (const log of logs) {
        const correlationId = log.correlationId || "uncorrelated";

        if (!groupedLogs.has(correlationId)) {
          groupedLogs.set(correlationId, []);
        }

        groupedLogs.get(correlationId)!.push(log);
      }

      // Convert groups to chunks
      const chunks: ILogChunk[] = [];

      Array.from(groupedLogs.entries()).forEach(
        ([correlationId, groupLogs]) => {
          const chunk = this.createChunkFromLogs(correlationId, groupLogs);
          chunks.push(chunk);
        },
      );

      logger.info("Completed correlation-based chunking", {
        totalLogs: logs.length,
        chunksCreated: chunks.length,
        averageLogsPerChunk: (logs.length / chunks.length).toFixed(2),
      });

      return chunks;
    } catch (error) {
      logger.error("Error in correlation-based chunking", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Group logs by time windows
   * Alternative chunking strategy for logs without correlationIds
   *
   * @param logs - Array of logs to chunk
   * @param windowMs - Time window in milliseconds (default: 5 minutes)
   * @returns Array of log chunks grouped by time windows
   */
  groupByTimeWindow(
    logs: ISystemLog[],
    windowMs: number = 5 * 60 * 1000,
  ): ILogChunk[] {
    try {
      logger.debug("Starting time-window chunking", {
        totalLogs: logs.length,
        windowMs,
      });

      // Sort logs by timestamp
      const sortedLogs = [...logs].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );

      const chunks: ILogChunk[] = [];
      let currentWindowLogs: ISystemLog[] = [];
      let windowStartTime: Date | null = null;

      for (const log of sortedLogs) {
        const logTime = log.timestamp.getTime();

        // Start a new window if needed
        if (
          windowStartTime === null ||
          logTime - windowStartTime.getTime() > windowMs
        ) {
          // Save previous window if it has logs
          if (currentWindowLogs.length > 0) {
            const chunkId = `time_${windowStartTime!.getTime()}`;
            const chunk = this.createChunkFromLogs(chunkId, currentWindowLogs);
            chunks.push(chunk);
          }

          // Start new window
          windowStartTime = log.timestamp;
          currentWindowLogs = [log];
        } else {
          // Add to current window
          currentWindowLogs.push(log);
        }
      }

      // Don't forget the last window
      if (currentWindowLogs.length > 0 && windowStartTime) {
        const chunkId = `time_${windowStartTime.getTime()}`;
        const chunk = this.createChunkFromLogs(chunkId, currentWindowLogs);
        chunks.push(chunk);
      }

      logger.info("Completed time-window chunking", {
        totalLogs: logs.length,
        chunksCreated: chunks.length,
        averageLogsPerChunk: (logs.length / chunks.length).toFixed(2),
      });

      return chunks;
    } catch (error) {
      logger.error("Error in time-window chunking", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Hybrid approach: Group by correlationId first, then by time window for uncorrelated logs
   *
   * @param logs - Array of logs to chunk
   * @param windowMs - Time window for uncorrelated logs (default: 5 minutes)
   * @returns Array of log chunks using hybrid strategy
   */
  hybridChunking(
    logs: ISystemLog[],
    windowMs: number = 5 * 60 * 1000,
  ): ILogChunk[] {
    try {
      logger.debug("Starting hybrid chunking", {
        totalLogs: logs.length,
      });

      // Separate correlated and uncorrelated logs
      const correlatedLogs = logs.filter((log) => log.correlationId);
      const uncorrelatedLogs = logs.filter((log) => !log.correlationId);

      // Chunk correlated logs by correlationId
      const correlatedChunks = this.groupByCorrelationId(correlatedLogs);

      // Chunk uncorrelated logs by time window
      const uncorrelatedChunks = this.groupByTimeWindow(
        uncorrelatedLogs,
        windowMs,
      );

      const allChunks = [...correlatedChunks, ...uncorrelatedChunks];

      logger.info("Completed hybrid chunking", {
        totalLogs: logs.length,
        correlatedChunks: correlatedChunks.length,
        uncorrelatedChunks: uncorrelatedChunks.length,
        totalChunks: allChunks.length,
      });

      return allChunks;
    } catch (error) {
      logger.error("Error in hybrid chunking", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Create a chunk object from a group of logs
   * Private helper method
   *
   * @param chunkId - Identifier for the chunk (correlationId or time-based)
   * @param logs - Array of logs to include in the chunk
   * @returns ILogChunk object
   */
  private createChunkFromLogs(chunkId: string, logs: ISystemLog[]): ILogChunk {
    // Sort logs by timestamp
    const sortedLogs = [...logs].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    // Get time range
    const timestamps = sortedLogs.map((log) => log.timestamp.getTime());
    const startTime = new Date(Math.min(...timestamps));
    const endTime = new Date(Math.max(...timestamps));

    // Determine max log level
    const maxLogLevel = this.getMaxLogLevel(sortedLogs);

    // Extract log IDs
    const logIds = sortedLogs
      .map((log) => log._id)
      .filter((id): id is string => id !== undefined);

    return {
      id: chunkId,
      correlationId: chunkId,
      timeRange: {
        start: startTime,
        end: endTime,
      },
      logCount: sortedLogs.length,
      logIds,
      logs: sortedLogs,
      maxLogLevel,
    };
  }

  /**
   * Determine the highest priority log level in a group of logs
   *
   * @param logs - Array of logs
   * @returns The highest priority log level as a string
   */
  private getMaxLogLevel(logs: ISystemLog[]): string {
    let maxLevel = "debug";
    let maxPriority = 0;

    for (const log of logs) {
      const priority = this.LOG_LEVEL_PRIORITY[log.level] || 0;
      if (priority > maxPriority) {
        maxPriority = priority;
        maxLevel = log.level;
      }
    }

    return maxLevel;
  }

  /**
   * Format a chunk for embedding
   * Creates a text representation of the chunk optimized for embeddings
   *
   * @param chunk - The chunk to format
   * @returns Formatted text string
   */
  formatChunkForEmbedding(chunk: ILogChunk): string {
    const duration =
      chunk.timeRange.end.getTime() - chunk.timeRange.start.getTime();
    const durationSeconds = (duration / 1000).toFixed(2);

    // Build the formatted text
    const parts = [
      `Request ID: ${chunk.correlationId}`,
      `Time Range: ${chunk.timeRange.start.toISOString()} to ${chunk.timeRange.end.toISOString()}`,
      `Duration: ${durationSeconds}s`,
      `Event Count: ${chunk.logCount}`,
      `Max Log Level: ${chunk.maxLogLevel}`,
      ``,
      `Events:`,
    ];

    // Add individual log entries
    for (const log of chunk.logs) {
      const metaStr = log.meta ? JSON.stringify(log.meta) : "";
      const logLine = `[${log.level.toUpperCase()}] ${log.timestamp.toISOString()} - ${log.message} ${metaStr}`;
      parts.push(logLine);
    }

    return parts.join("\n");
  }

  /**
   * Get statistics about a set of chunks
   * Useful for monitoring and debugging
   *
   * @param chunks - Array of chunks to analyze
   * @returns Statistics object
   */
  getChunkStatistics(chunks: ILogChunk[]): {
    totalChunks: number;
    totalLogs: number;
    averageLogsPerChunk: number;
    minLogsPerChunk: number;
    maxLogsPerChunk: number;
    logLevelDistribution: Record<string, number>;
  } {
    const totalLogs = chunks.reduce((sum, chunk) => sum + chunk.logCount, 0);
    const logCounts = chunks.map((chunk) => chunk.logCount);

    const logLevelDistribution: Record<string, number> = {};
    for (const chunk of chunks) {
      logLevelDistribution[chunk.maxLogLevel] =
        (logLevelDistribution[chunk.maxLogLevel] || 0) + 1;
    }

    return {
      totalChunks: chunks.length,
      totalLogs,
      averageLogsPerChunk: chunks.length > 0 ? totalLogs / chunks.length : 0,
      minLogsPerChunk: logCounts.length > 0 ? Math.min(...logCounts) : 0,
      maxLogsPerChunk: logCounts.length > 0 ? Math.max(...logCounts) : 0,
      logLevelDistribution,
    };
  }
}

// Export singleton instance
export const logChunkingService = new LogChunkingService();
export default logChunkingService;
