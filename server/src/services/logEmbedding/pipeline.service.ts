import { logIngestionService } from "./ingestion.service";
import { logChunkingService } from "./chunking.service";
import { embeddingService } from "./embedding.service";
import { vectorStoreService } from "./vectorStore.service";
import logger from "../../utils/logger";
import { ILogChunk } from "../../types/systemLog";

/**
 * Complete Log Embedding Pipeline Service
 * Orchestrates: MongoDB Logs → Chunk → Embed → Qdrant Vector Storage
 *
 * This is the main service that ties all steps together:
 * 1. Fetch unprocessed logs from MongoDB
 * 2. Group logs into chunks (by correlationId)
 * 3. Create embeddings with OpenAI
 * 4. Store embeddings in Qdrant
 * 5. Mark logs as processed
 */
export class LogEmbeddingPipeline {
  private isInitialized = false;

  /**
   * Initialize all services
   * Must be called before running the pipeline
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing log embedding pipeline");

      // Check if OpenAI embedding service is ready
      if (!embeddingService.isReady()) {
        throw new Error(
          "OpenAI embedding service not ready. Check OPENAI_API_KEY environment variable.",
        );
      }

      // Initialize Qdrant vector store
      await vectorStoreService.initialize();

      this.isInitialized = true;
      logger.info("Log embedding pipeline initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize log embedding pipeline", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Check if pipeline is ready to process
   */
  isReady(): boolean {
    return (
      this.isInitialized &&
      embeddingService.isReady() &&
      vectorStoreService.isReady()
    );
  }

  /**
   * Process a batch of unprocessed logs through the complete pipeline
   *
   * @param batchSize - Number of logs to fetch and process
   * @returns Statistics about the processing
   */
  async processBatch(batchSize: number = 100): Promise<{
    logsProcessed: number;
    chunksCreated: number;
    embeddingsStored: number;
    cost: number;
    duration: number;
  }> {
    if (!this.isInitialized) {
      throw new Error("Pipeline not initialized. Call initialize() first.");
    }

    const startTime = Date.now();

    try {
      logger.info("Starting batch processing", { batchSize });

      // Step 1: Fetch unprocessed logs
      logger.debug("Step 1: Fetching unprocessed logs");
      const logs = await logIngestionService.fetchUnprocessedLogs(batchSize);

      if (logs.length === 0) {
        logger.info("No unprocessed logs found");
        return {
          logsProcessed: 0,
          chunksCreated: 0,
          embeddingsStored: 0,
          cost: 0,
          duration: Date.now() - startTime,
        };
      }

      logger.info(`Fetched ${logs.length} unprocessed logs`);

      // Step 2: Chunk logs by correlationId
      logger.debug("Step 2: Chunking logs");
      const chunks = logChunkingService.groupByCorrelationId(logs);
      logger.info(`Created ${chunks.length} chunks`);

      // Log chunk statistics
      const stats = logChunkingService.getChunkStatistics(chunks);
      logger.debug("Chunk statistics", stats);

      // Step 3: Create embeddings
      logger.debug("Step 3: Creating embeddings");
      const estimatedCost = embeddingService.estimateBatchCost(chunks);
      logger.info(`Estimated cost: $${estimatedCost.toFixed(6)}`);

      const embeddings = await embeddingService.embedLogChunks(chunks);
      logger.info(`Created ${embeddings.length} embeddings`);

      // Step 4: Store embeddings in Qdrant
      logger.debug("Step 4: Storing embeddings in Qdrant");
      const pointIds = await vectorStoreService.storeBatchEmbeddings(
        chunks,
        embeddings,
      );
      logger.info(`Stored ${pointIds.length} embeddings in Qdrant`);

      // Step 5: Mark original logs as processed
      logger.debug("Step 5: Marking logs as processed");
      const allLogIds = chunks.flatMap((chunk) => chunk.logIds);
      await logIngestionService.markAsProcessed(allLogIds);
      logger.info(`Marked ${allLogIds.length} logs as processed`);

      const duration = Date.now() - startTime;

      logger.info("Batch processing completed successfully", {
        logsProcessed: logs.length,
        chunksCreated: chunks.length,
        embeddingsStored: pointIds.length,
        cost: estimatedCost,
        durationMs: duration,
      });

      return {
        logsProcessed: logs.length,
        chunksCreated: chunks.length,
        embeddingsStored: pointIds.length,
        cost: estimatedCost,
        duration,
      };
    } catch (error) {
      logger.error("Error in batch processing", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Process a specific correlationId through the pipeline
   * Useful for targeted processing or debugging
   *
   * @param correlationId - The correlation ID to process
   */
  async processCorrelationId(correlationId: string): Promise<{
    chunk: ILogChunk | null;
    embeddingId: string | null;
  }> {
    if (!this.isInitialized) {
      throw new Error("Pipeline not initialized. Call initialize() first.");
    }

    try {
      logger.info("Processing specific correlationId", { correlationId });

      // Fetch logs for this correlationId
      const logs =
        await logIngestionService.fetchLogsByCorrelationId(correlationId);

      if (logs.length === 0) {
        logger.info("No logs found for correlationId", { correlationId });
        return { chunk: null, embeddingId: null };
      }

      // Create chunk
      const chunks = logChunkingService.groupByCorrelationId(logs);
      const chunk = chunks[0];

      logger.info("Chunk created", {
        logCount: chunk.logCount,
        timeRange: chunk.timeRange,
      });

      // Create embedding
      const embedding = await embeddingService.embedLogChunk(chunk);
      logger.info("Embedding created", { dimensions: embedding.length });

      // Store in Qdrant
      const embeddingId = await vectorStoreService.storeEmbedding(
        chunk,
        embedding,
      );
      logger.info("Embedding stored", { embeddingId });

      // Mark logs as processed
      await logIngestionService.markAsProcessed(chunk.logIds);

      return { chunk, embeddingId };
    } catch (error) {
      logger.error("Error processing correlationId", {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Search for similar log chunks using a query string
   * This demonstrates the AI agent workflow
   *
   * @param query - Natural language query
   * @param limit - Maximum results to return
   */
  async searchLogs(
    query: string,
    limit: number = 10,
  ): Promise<
    Array<{
      id: string;
      score: number;
      correlationId: string;
      timestamp: string;
      logCount: number;
      sampleMessages: string[];
    }>
  > {
    if (!this.isInitialized) {
      throw new Error("Pipeline not initialized. Call initialize() first.");
    }

    try {
      logger.info("Searching for logs", { query, limit });

      // Step 1: Convert query to embedding
      logger.debug("Creating query embedding");
      const queryEmbedding = await embeddingService.embedText(query);

      // Step 2: Search in Qdrant
      logger.debug("Searching Qdrant");
      const results = await vectorStoreService.search(queryEmbedding, limit);

      logger.info("Search completed", { resultsFound: results.length });

      // Format results
      return results.map((result) => ({
        id: result.id,
        score: result.score,
        correlationId: result.payload.correlationId,
        timestamp: result.payload.timestampStart,
        logCount: result.payload.logCount,
        sampleMessages: result.payload.sampleMessages || [],
      }));
    } catch (error) {
      logger.error("Error searching logs", {
        query,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get pipeline statistics
   */
  async getStatistics(): Promise<{
    qdrantInfo: any;
    pendingLogs: number;
  }> {
    try {
      const [qdrantInfo, pendingLogs] = await Promise.all([
        vectorStoreService.getCollectionInfo(),
        logIngestionService.getUnprocessedCount(),
      ]);

      return {
        qdrantInfo,
        pendingLogs,
      };
    } catch (error) {
      logger.error("Error getting statistics", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

// Export singleton instance
export const logEmbeddingPipeline = new LogEmbeddingPipeline();
