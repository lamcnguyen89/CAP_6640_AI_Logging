/**
 * Example usage of the Log Ingestion Service
 *
 * This demonstrates how to use the service to retrieve logs for embedding
 */

import { logIngestionService } from "./ingestion.service";
import logger from "../../utils/logger";

/**
 * Example 1: Fetch unprocessed logs in batches
 */
export async function exampleFetchUnprocessedLogs() {
  try {
    // Fetch the next 100 unprocessed logs
    const logs = await logIngestionService.fetchUnprocessedLogs(100);

    logger.info("Example: Fetched unprocessed logs", {
      count: logs.length,
      firstLog: logs[0]?.message,
      lastLog: logs[logs.length - 1]?.message,
    });

    return logs;
  } catch (error) {
    logger.error("Example failed: fetchUnprocessedLogs", { error });
    throw error;
  }
}

/**
 * Example 2: Fetch logs by correlation ID
 * Useful for analyzing a complete user journey
 */
export async function exampleFetchByCorrelationId(correlationId: string) {
  try {
    const logs =
      await logIngestionService.fetchLogsByCorrelationId(correlationId);

    logger.info("Example: Fetched logs by correlation ID", {
      correlationId,
      count: logs.length,
      timeRange: {
        start: logs[0]?.timestamp,
        end: logs[logs.length - 1]?.timestamp,
      },
    });

    return logs;
  } catch (error) {
    logger.error("Example failed: fetchByCorrelationId", { error });
    throw error;
  }
}

/**
 * Example 3: Process logs in batches and mark as processed
 */
export async function exampleProcessBatch() {
  try {
    // 1. Check how many logs need processing
    const unprocessedCount = await logIngestionService.getUnprocessedCount();
    logger.info("Unprocessed logs count", { count: unprocessedCount });

    // 2. Fetch a batch
    const logs = await logIngestionService.fetchUnprocessedLogs(50);

    if (logs.length === 0) {
      logger.info("No unprocessed logs found");
      return;
    }

    // 3. Process the logs (e.g., create embeddings)
    // ... your embedding logic here ...
    logger.info("Processing logs...", { count: logs.length });

    // 4. Mark logs as processed
    const logIds = logs.map((log) => log._id!);
    await logIngestionService.markAsProcessed(logIds);

    logger.info("Batch processed successfully", {
      processedCount: logs.length,
      remainingCount: await logIngestionService.getUnprocessedCount(),
    });
  } catch (error) {
    logger.error("Example failed: processBatch", { error });
    throw error;
  }
}

/**
 * Example 4: Fetch logs within a specific time range
 */
export async function exampleFetchTimeRange() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const logs = await logIngestionService.fetchLogsInTimeRange(
      oneHourAgo,
      now,
      false, // Only unprocessed logs
    );

    logger.info("Example: Fetched logs in time range", {
      timeRange: {
        start: oneHourAgo.toISOString(),
        end: now.toISOString(),
      },
      count: logs.length,
    });

    return logs;
  } catch (error) {
    logger.error("Example failed: fetchTimeRange", { error });
    throw error;
  }
}

/**
 * Example 5: Reset processing state to reprocess logs
 */
export async function exampleResetProcessing() {
  try {
    // Reset to reprocess logs from 12 hours ago
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    logIngestionService.resetLastProcessedTime(twelveHoursAgo);

    logger.info("Reset processing time", {
      resetTo: twelveHoursAgo.toISOString(),
    });
  } catch (error) {
    logger.error("Example failed: resetProcessing", { error });
    throw error;
  }
}
