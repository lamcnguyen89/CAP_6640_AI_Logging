/**
 * Example usage of Log Ingestion and Chunking services
 * This demonstrates how to retrieve logs and chunk them for embedding
 */

import { logIngestionService } from "./ingestion.service";
import { logChunkingService } from "./chunking.service";
import logger from "../../utils/logger";

/**
 * Example: Basic pipeline for retrieving and chunking logs
 */
export async function basicPipelineExample() {
  logger.info("Starting basic log chunking pipeline");

  try {
    // Step 1: Fetch unprocessed logs from MongoDB
    const logs = await logIngestionService.fetchUnprocessedLogs(100);

    if (logs.length === 0) {
      logger.info("No unprocessed logs found");
      return;
    }

    logger.info(`Fetched ${logs.length} unprocessed logs`);

    // Step 2: Chunk logs by correlationId
    const chunks = logChunkingService.groupByCorrelationId(logs);

    logger.info(`Created ${chunks.length} chunks from logs`);

    // Step 3: Display chunk statistics
    const stats = logChunkingService.getChunkStatistics(chunks);
    logger.info("Chunk statistics:", stats);

    // Step 4: Format chunks for embedding (example for first chunk)
    if (chunks.length > 0) {
      const formattedText = logChunkingService.formatChunkForEmbedding(
        chunks[0],
      );
      logger.debug("Example formatted chunk:", {
        correlationId: chunks[0].correlationId,
        logCount: chunks[0].logCount,
        text: formattedText.substring(0, 200) + "...",
      });
    }

    return chunks;
  } catch (error) {
    logger.error("Error in basic pipeline", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example: Using hybrid chunking strategy
 */
export async function hybridChunkingExample() {
  logger.info("Starting hybrid chunking pipeline");

  try {
    // Fetch logs
    const logs = await logIngestionService.fetchUnprocessedLogs(500);

    if (logs.length === 0) {
      logger.info("No unprocessed logs found");
      return;
    }

    // Use hybrid chunking (correlationId + time windows)
    const chunks = logChunkingService.hybridChunking(logs, 5 * 60 * 1000);

    logger.info(`Created ${chunks.length} chunks using hybrid strategy`);

    return chunks;
  } catch (error) {
    logger.error("Error in hybrid chunking pipeline", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example: Process logs by time range
 */
export async function processTimeRangeExample() {
  logger.info("Processing logs by time range");

  try {
    // Define time range (last 24 hours)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    // Fetch logs in time range
    const logs = await logIngestionService.fetchLogsInTimeRange(
      startTime,
      endTime,
      false, // Only unprocessed logs
    );

    logger.info(`Fetched ${logs.length} logs from the last 24 hours`);

    // Chunk by correlationId
    const chunks = logChunkingService.groupByCorrelationId(logs);

    logger.info(`Created ${chunks.length} chunks`);

    // Get statistics
    const stats = logChunkingService.getChunkStatistics(chunks);
    logger.info("Statistics:", stats);

    return chunks;
  } catch (error) {
    logger.error("Error processing time range", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example: Process specific correlationId
 */
export async function processCorrelationIdExample(correlationId: string) {
  logger.info("Processing specific correlationId", { correlationId });

  try {
    // Fetch all logs for this correlationId
    const logs =
      await logIngestionService.fetchLogsByCorrelationId(correlationId);

    if (logs.length === 0) {
      logger.info("No logs found for correlationId", { correlationId });
      return null;
    }

    logger.info(`Fetched ${logs.length} logs for correlationId`);

    // Create a single chunk for this correlationId
    const chunks = logChunkingService.groupByCorrelationId(logs);

    if (chunks.length > 0) {
      const chunk = chunks[0];
      const formattedText = logChunkingService.formatChunkForEmbedding(chunk);

      logger.info("Chunk details:", {
        correlationId: chunk.correlationId,
        logCount: chunk.logCount,
        timeRange: chunk.timeRange,
        maxLogLevel: chunk.maxLogLevel,
      });

      return { chunk, formattedText };
    }

    return null;
  } catch (error) {
    logger.error("Error processing correlationId", {
      correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example: Monitor unprocessed log backlog
 */
export async function monitorBacklogExample() {
  try {
    const count = await logIngestionService.getUnprocessedCount();

    logger.info("Unprocessed log backlog", {
      count,
      status: count > 1000 ? "HIGH" : count > 100 ? "MEDIUM" : "LOW",
    });

    return count;
  } catch (error) {
    logger.error("Error monitoring backlog", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// Export all examples
export default {
  basicPipelineExample,
  hybridChunkingExample,
  processTimeRangeExample,
  processCorrelationIdExample,
  monitorBacklogExample,
};
