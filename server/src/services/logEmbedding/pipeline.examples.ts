/**
 * Example usage of Log Ingestion, Chunking, and Embedding services
 * Demonstrates the complete pipeline from log retrieval to embedding generation
 */

import { logIngestionService } from "./ingestion.service";
import { logChunkingService } from "./chunking.service";
import { embeddingService } from "./embedding.service";
import logger from "../../utils/logger";

/**
 * Example 1: Complete pipeline - Fetch, Chunk, and Embed
 * This is the basic workflow for processing logs
 */
export async function completePipelineExample() {
  logger.info("Starting complete log embedding pipeline");

  try {
    // Step 1: Fetch unprocessed logs
    logger.info("Step 1: Fetching unprocessed logs");
    const logs = await logIngestionService.fetchUnprocessedLogs(100);

    if (logs.length === 0) {
      logger.info("No unprocessed logs found");
      return { chunks: [], embeddings: [] };
    }

    logger.info(`Fetched ${logs.length} unprocessed logs`);

    // Step 2: Chunk logs by correlationId
    logger.info("Step 2: Chunking logs by correlationId");
    const chunks = logChunkingService.groupByCorrelationId(logs);
    logger.info(`Created ${chunks.length} chunks`);

    // Display statistics
    const stats = logChunkingService.getChunkStatistics(chunks);
    logger.info("Chunk statistics:", stats);

    // Estimate cost before embedding
    const estimatedCost = embeddingService.estimateBatchCost(chunks);
    logger.info(`Estimated embedding cost: $${estimatedCost.toFixed(6)}`);

    // Step 3: Create embeddings for all chunks
    logger.info("Step 3: Creating embeddings");
    const embeddings = await embeddingService.embedLogChunks(chunks);
    logger.info(`Created ${embeddings.length} embeddings`);

    // Validate embeddings
    const validEmbeddings = embeddings.every((emb) =>
      embeddingService.validateEmbedding(emb),
    );
    logger.info(`All embeddings valid: ${validEmbeddings}`);

    return { chunks, embeddings };
  } catch (error) {
    logger.error("Error in complete pipeline", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example 2: Embed a single chunk
 * Useful for testing or processing individual correlation IDs
 */
export async function embedSingleChunkExample(correlationId: string) {
  logger.info("Embedding single chunk", { correlationId });

  try {
    // Fetch logs for specific correlationId
    const logs =
      await logIngestionService.fetchLogsByCorrelationId(correlationId);

    if (logs.length === 0) {
      logger.info("No logs found for correlationId", { correlationId });
      return null;
    }

    // Create chunk
    const chunks = logChunkingService.groupByCorrelationId(logs);
    const chunk = chunks[0];

    logger.info("Chunk details:", {
      correlationId: chunk.correlationId,
      logCount: chunk.logCount,
      timeRange: chunk.timeRange,
    });

    // Estimate cost
    const cost = embeddingService.estimateChunkCost(chunk);
    logger.info(`Estimated cost: $${cost.toFixed(6)}`);

    // Create embedding
    const embedding = await embeddingService.embedLogChunk(chunk);

    logger.info("Embedding created successfully", {
      dimensions: embedding.length,
      valid: embeddingService.validateEmbedding(embedding),
    });

    return { chunk, embedding };
  } catch (error) {
    logger.error("Error embedding single chunk", {
      correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example 3: Batch processing with cost tracking
 * Process multiple batches while tracking costs
 */
export async function batchProcessingWithCostTracking() {
  logger.info("Starting batch processing with cost tracking");

  const batchSize = 50;
  let totalProcessed = 0;
  let totalCost = 0;
  let totalEmbeddings = 0;

  try {
    // Check backlog
    const backlog = await logIngestionService.getUnprocessedCount();
    logger.info(`Total unprocessed logs: ${backlog}`);

    let hasMore = true;
    let iteration = 0;

    while (hasMore && iteration < 10) {
      // Safety limit
      iteration++;

      logger.info(`Processing batch ${iteration}`);

      // Fetch logs
      const logs = await logIngestionService.fetchUnprocessedLogs(batchSize);

      if (logs.length === 0) {
        hasMore = false;
        break;
      }

      // Chunk logs
      const chunks = logChunkingService.groupByCorrelationId(logs);

      // Estimate cost
      const batchCost = embeddingService.estimateBatchCost(chunks);
      logger.info(
        `Batch ${iteration} estimated cost: $${batchCost.toFixed(6)}`,
      );

      // Create embeddings
      const embeddings = await embeddingService.embedLogChunks(chunks);

      // Update totals
      totalProcessed += logs.length;
      totalCost += batchCost;
      totalEmbeddings += embeddings.length;

      logger.info(`Batch ${iteration} completed`, {
        logsProcessed: logs.length,
        chunksCreated: chunks.length,
        embeddingsCreated: embeddings.length,
      });

      // Mark logs as processed (would be done after storing in vector DB)
      // await logIngestionService.markAsProcessed(logs.map(log => log._id).filter(Boolean));
    }

    logger.info("Batch processing complete", {
      totalIterations: iteration,
      totalLogsProcessed: totalProcessed,
      totalEmbeddings,
      totalEstimatedCost: `$${totalCost.toFixed(6)}`,
    });

    return {
      iterations: iteration,
      logsProcessed: totalProcessed,
      embeddingsCreated: totalEmbeddings,
      estimatedCost: totalCost,
    };
  } catch (error) {
    logger.error("Error in batch processing", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example 4: Embed user query for similarity search
 * Shows how to embed a user question to search against log embeddings
 */
export async function embedUserQueryExample(query: string) {
  logger.info("Embedding user query", { query });

  try {
    const embedding = await embeddingService.embedText(query);

    logger.info("Query embedding created", {
      queryLength: query.length,
      embeddingDimensions: embedding.length,
      estimatedTokens: embeddingService.estimateTokenCount(query),
    });

    return embedding;
  } catch (error) {
    logger.error("Error embedding user query", {
      query,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example 5: Process time range with hybrid chunking
 * Use hybrid chunking for logs from a specific time period
 */
export async function processTimeRangeWithEmbeddings() {
  logger.info("Processing time range with embeddings");

  try {
    // Define time range (last 24 hours)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    // Fetch logs
    const logs = await logIngestionService.fetchLogsInTimeRange(
      startTime,
      endTime,
      false,
    );

    logger.info(`Fetched ${logs.length} logs from the last 24 hours`);

    if (logs.length === 0) {
      return { chunks: [], embeddings: [] };
    }

    // Use hybrid chunking (correlationId + time windows)
    const chunks = logChunkingService.hybridChunking(logs, 5 * 60 * 1000);

    logger.info("Hybrid chunking complete", {
      totalChunks: chunks.length,
    });

    // Estimate and create embeddings
    const cost = embeddingService.estimateBatchCost(chunks);
    logger.info(`Estimated cost: $${cost.toFixed(6)}`);

    const embeddings = await embeddingService.embedLogChunks(chunks);

    logger.info("Embeddings created", {
      count: embeddings.length,
    });

    return { chunks, embeddings, cost };
  } catch (error) {
    logger.error("Error processing time range", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Example 6: Check service readiness
 * Verify all services are properly configured
 */
export async function checkServiceReadiness() {
  logger.info("Checking service readiness");

  const status = {
    openaiConfigured: embeddingService.isReady(),
    embeddingModel: embeddingService.getModel(),
    embeddingDimensions: embeddingService.getDimensions(),
    unprocessedLogsCount: 0,
  };

  try {
    status.unprocessedLogsCount =
      await logIngestionService.getUnprocessedCount();

    logger.info("Service status", status);

    return status;
  } catch (error) {
    logger.error("Error checking service readiness", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// Export all examples
export default {
  completePipelineExample,
  embedSingleChunkExample,
  batchProcessingWithCostTracking,
  embedUserQueryExample,
  processTimeRangeWithEmbeddings,
  checkServiceReadiness,
};
