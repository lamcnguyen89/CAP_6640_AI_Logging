import OpenAI from "openai";
import { ILogChunk } from "../../types/systemLog";
import logger from "../../utils/logger";
import { logChunkingService } from "./chunking.service";

/**
 * Service for creating embeddings from log chunks using OpenAI
 * Implements Step 3: Embedding with OpenAI
 *
 * Uses text-embedding-3-small model (1536 dimensions)
 * Cost: ~$0.02 per 1M tokens
 */
export class EmbeddingService {
  private openai: OpenAI | null = null;
  private readonly MODEL = "text-embedding-3-small";
  private readonly EMBEDDING_DIMENSIONS = 1536;
  private readonly MAX_BATCH_SIZE = 100; // OpenAI allows batching

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize the OpenAI client
   * Checks for API key availability
   */
  private initializeClient(): void {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      logger.warn(
        "OPENAI_API_KEY not found in environment variables. Embedding service will not function.",
      );
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });

      logger.info("OpenAI embedding service initialized successfully", {
        model: this.MODEL,
        dimensions: this.EMBEDDING_DIMENSIONS,
      });
    } catch (error) {
      logger.error("Failed to initialize OpenAI client", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if the embedding service is ready to use
   */
  isReady(): boolean {
    return this.openai !== null;
  }

  /**
   * Embed a single log chunk
   * Converts the chunk to text and generates an embedding vector
   *
   * @param chunk - The log chunk to embed
   * @returns Embedding vector (array of numbers)
   */
  async embedLogChunk(chunk: ILogChunk): Promise<number[]> {
    if (!this.isReady()) {
      throw new Error(
        "OpenAI embedding service not initialized. Check OPENAI_API_KEY environment variable.",
      );
    }

    try {
      logger.debug("Embedding log chunk", {
        chunkId: chunk.id,
        correlationId: chunk.correlationId,
        logCount: chunk.logCount,
      });

      // Format chunk to text using the chunking service
      const text = logChunkingService.formatChunkForEmbedding(chunk);

      // Create embedding
      const startTime = Date.now();
      const response = await this.openai!.embeddings.create({
        model: this.MODEL,
        input: text,
        encoding_format: "float",
      });

      const duration = Date.now() - startTime;
      const embedding = response.data[0].embedding;

      logger.debug("Successfully created embedding", {
        chunkId: chunk.id,
        dimensions: embedding.length,
        durationMs: duration,
        tokenUsage: response.usage?.total_tokens,
      });

      return embedding;
    } catch (error) {
      logger.error("Error creating embedding for chunk", {
        chunkId: chunk.id,
        correlationId: chunk.correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Embed multiple log chunks in batch
   * More efficient than calling embedLogChunk multiple times
   *
   * @param chunks - Array of log chunks to embed
   * @returns Array of embedding vectors
   */
  async embedLogChunks(chunks: ILogChunk[]): Promise<number[][]> {
    if (!this.isReady()) {
      throw new Error(
        "OpenAI embedding service not initialized. Check OPENAI_API_KEY environment variable.",
      );
    }

    if (chunks.length === 0) {
      return [];
    }

    try {
      logger.info("Embedding multiple log chunks", {
        chunkCount: chunks.length,
      });

      // Process in batches to respect API limits
      const batches = this.createBatches(chunks, this.MAX_BATCH_SIZE);
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.debug(`Processing batch ${i + 1}/${batches.length}`, {
          batchSize: batch.length,
        });

        const batchEmbeddings = await this.embedBatch(batch);
        allEmbeddings.push(...batchEmbeddings);
      }

      logger.info("Successfully embedded all chunks", {
        totalChunks: chunks.length,
        totalEmbeddings: allEmbeddings.length,
      });

      return allEmbeddings;
    } catch (error) {
      logger.error("Error embedding multiple chunks", {
        chunkCount: chunks.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Embed a batch of chunks
   * Private helper method
   */
  private async embedBatch(chunks: ILogChunk[]): Promise<number[][]> {
    try {
      // Convert chunks to text
      const texts = chunks.map((chunk) =>
        logChunkingService.formatChunkForEmbedding(chunk),
      );

      const startTime = Date.now();
      const response = await this.openai!.embeddings.create({
        model: this.MODEL,
        input: texts,
        encoding_format: "float",
      });

      const duration = Date.now() - startTime;

      logger.debug("Batch embedding completed", {
        batchSize: chunks.length,
        durationMs: duration,
        tokenUsage: response.usage?.total_tokens,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      logger.error("Error in batch embedding", {
        batchSize: chunks.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Embed a raw text string
   * Useful for embedding user queries for similarity search
   *
   * @param text - The text to embed
   * @returns Embedding vector
   */
  async embedText(text: string): Promise<number[]> {
    if (!this.isReady()) {
      throw new Error(
        "OpenAI embedding service not initialized. Check OPENAI_API_KEY environment variable.",
      );
    }

    try {
      logger.debug("Embedding raw text", {
        textLength: text.length,
      });

      const startTime = Date.now();
      const response = await this.openai!.embeddings.create({
        model: this.MODEL,
        input: text,
        encoding_format: "float",
      });

      const duration = Date.now() - startTime;
      const embedding = response.data[0].embedding;

      logger.debug("Successfully embedded text", {
        dimensions: embedding.length,
        durationMs: duration,
        tokenUsage: response.usage?.total_tokens,
      });

      return embedding;
    } catch (error) {
      logger.error("Error embedding text", {
        textLength: text.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get estimated token count for a text
   * Rough estimate: ~4 characters per token
   *
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get estimated cost for embedding a chunk
   * Based on text-embedding-3-small pricing: $0.02 per 1M tokens
   *
   * @param chunk - Chunk to estimate cost for
   * @returns Estimated cost in USD
   */
  estimateChunkCost(chunk: ILogChunk): number {
    const text = logChunkingService.formatChunkForEmbedding(chunk);
    const tokens = this.estimateTokenCount(text);
    return (tokens / 1_000_000) * 0.02;
  }

  /**
   * Get estimated cost for embedding multiple chunks
   *
   * @param chunks - Array of chunks
   * @returns Estimated total cost in USD
   */
  estimateBatchCost(chunks: ILogChunk[]): number {
    return chunks.reduce((total, chunk) => {
      return total + this.estimateChunkCost(chunk);
    }, 0);
  }

  /**
   * Get the embedding model being used
   */
  getModel(): string {
    return this.MODEL;
  }

  /**
   * Get the embedding dimensions
   */
  getDimensions(): number {
    return this.EMBEDDING_DIMENSIONS;
  }

  /**
   * Split an array into batches
   * Private helper method
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Validate embedding dimensions
   * Ensures the embedding has the expected number of dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    return embedding.length === this.EMBEDDING_DIMENSIONS;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;
