import { QdrantClient } from "@qdrant/js-client-rest";
import { ILogChunk } from "../../types/systemLog";
import logger from "../../utils/logger";

/**
 * Service for storing and retrieving log embeddings using Qdrant
 * Implements Step 4: Vector Database Storage
 *
 * Qdrant is a high-performance vector database optimized for similarity search
 * Running locally in Docker for full data privacy and zero cost
 */
export class VectorStoreService {
  private client: QdrantClient;
  private readonly COLLECTION_NAME = "log_embeddings";
  private readonly VECTOR_SIZE = 1536; // text-embedding-3-small dimensions
  private isInitialized = false;

  constructor() {
    // Connect to Qdrant running in Docker
    const qdrantUrl = process.env.QDRANT_URL || "http://qdrant:6333";

    this.client = new QdrantClient({
      url: qdrantUrl,
    });

    logger.info("Qdrant client created", { url: qdrantUrl });
  }

  /**
   * Initialize the vector store by ensuring the collection exists
   * Creates the collection if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        (col) => col.name === this.COLLECTION_NAME,
      );

      if (!collectionExists) {
        logger.info("Creating Qdrant collection", {
          name: this.COLLECTION_NAME,
          vectorSize: this.VECTOR_SIZE,
        });

        await this.client.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: this.VECTOR_SIZE,
            distance: "Cosine", // Cosine similarity is ideal for text embeddings
          },
          // Enable payload indexing for fast filtering
          optimizers_config: {
            indexing_threshold: 10000,
          },
        });

        logger.info("Successfully created Qdrant collection", {
          name: this.COLLECTION_NAME,
        });
      } else {
        logger.info("Qdrant collection already exists", {
          name: this.COLLECTION_NAME,
        });
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize Qdrant collection", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Check if the service is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Store a single log chunk embedding in Qdrant
   *
   * @param chunk - The log chunk containing metadata
   * @param embedding - The embedding vector (1536 dimensions)
   * @returns The ID of the stored point
   */
  async storeEmbedding(chunk: ILogChunk, embedding: number[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error(
        "VectorStoreService not initialized. Call initialize() first.",
      );
    }

    try {
      // Generate a unique ID for this embedding
      const pointId = chunk.id;

      logger.debug("Storing embedding in Qdrant", {
        chunkId: chunk.id,
        correlationId: chunk.correlationId,
        logCount: chunk.logCount,
      });

      // Store the embedding with metadata
      await this.client.upsert(this.COLLECTION_NAME, {
        wait: true,
        points: [
          {
            id: pointId,
            vector: embedding,
            payload: {
              // Core metadata
              correlationId: chunk.correlationId,
              timestampStart: chunk.timeRange.start.toISOString(),
              timestampEnd: chunk.timeRange.end.toISOString(),
              logCount: chunk.logCount,
              maxLogLevel: chunk.maxLogLevel,

              // Original log IDs for reference
              originalLogIds: chunk.logIds,

              // Store the first few log messages for quick reference
              sampleMessages: chunk.logs.slice(0, 5).map((log) => log.message),

              // Indexing timestamp
              indexedAt: new Date().toISOString(),
            },
          },
        ],
      });

      logger.info("Successfully stored embedding", {
        pointId,
        correlationId: chunk.correlationId,
      });

      return pointId;
    } catch (error) {
      logger.error("Failed to store embedding in Qdrant", {
        chunkId: chunk.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Store multiple embeddings in batch
   * More efficient than storing one at a time
   *
   * @param chunks - Array of log chunks
   * @param embeddings - Array of corresponding embeddings
   * @returns Array of point IDs
   */
  async storeBatchEmbeddings(
    chunks: ILogChunk[],
    embeddings: number[][],
  ): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error(
        "VectorStoreService not initialized. Call initialize() first.",
      );
    }

    if (chunks.length !== embeddings.length) {
      throw new Error("Number of chunks must match number of embeddings");
    }

    try {
      logger.debug("Storing batch of embeddings", {
        count: chunks.length,
      });

      const points = chunks.map((chunk, index) => ({
        id: chunk.id,
        vector: embeddings[index],
        payload: {
          correlationId: chunk.correlationId,
          timestampStart: chunk.timeRange.start.toISOString(),
          timestampEnd: chunk.timeRange.end.toISOString(),
          logCount: chunk.logCount,
          maxLogLevel: chunk.maxLogLevel,
          originalLogIds: chunk.logIds,
          sampleMessages: chunk.logs.slice(0, 5).map((log) => log.message),
          indexedAt: new Date().toISOString(),
        },
      }));

      await this.client.upsert(this.COLLECTION_NAME, {
        wait: true,
        points,
      });

      logger.info("Successfully stored batch of embeddings", {
        count: chunks.length,
      });

      return chunks.map((chunk) => chunk.id);
    } catch (error) {
      logger.error("Failed to store batch embeddings", {
        count: chunks.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Search for similar log chunks using vector similarity
   *
   * @param queryVector - The embedding vector to search for
   * @param limit - Maximum number of results to return
   * @param filter - Optional filter conditions
   * @returns Array of search results with scores and metadata
   */
  async search(
    queryVector: number[],
    limit: number = 10,
    filter?: {
      correlationId?: string;
      logLevel?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<
    Array<{
      id: string;
      score: number;
      payload: any;
    }>
  > {
    if (!this.isInitialized) {
      throw new Error(
        "VectorStoreService not initialized. Call initialize() first.",
      );
    }

    try {
      logger.debug("Searching for similar embeddings", {
        limit,
        hasFilter: !!filter,
      });

      // Build filter conditions
      const filterConditions: any = {};

      if (filter) {
        const mustConditions: any[] = [];

        if (filter.correlationId) {
          mustConditions.push({
            key: "correlationId",
            match: { value: filter.correlationId },
          });
        }

        if (filter.logLevel) {
          mustConditions.push({
            key: "maxLogLevel",
            match: { value: filter.logLevel },
          });
        }

        if (filter.startDate) {
          mustConditions.push({
            key: "timestampStart",
            range: { gte: filter.startDate.toISOString() },
          });
        }

        if (filter.endDate) {
          mustConditions.push({
            key: "timestampEnd",
            range: { lte: filter.endDate.toISOString() },
          });
        }

        if (mustConditions.length > 0) {
          filterConditions.must = mustConditions;
        }
      }

      const searchResult = await this.client.search(this.COLLECTION_NAME, {
        vector: queryVector,
        limit,
        filter:
          Object.keys(filterConditions).length > 0
            ? filterConditions
            : undefined,
        with_payload: true,
      });

      logger.info("Search completed", {
        resultsFound: searchResult.length,
        topScore: searchResult[0]?.score,
      });

      return searchResult.map((result) => ({
        id: String(result.id),
        score: result.score,
        payload: result.payload,
      }));
    } catch (error) {
      logger.error("Failed to search embeddings", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Delete a specific embedding by ID
   *
   * @param pointId - The ID of the point to delete
   */
  async deleteEmbedding(pointId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(
        "VectorStoreService not initialized. Call initialize() first.",
      );
    }

    try {
      await this.client.delete(this.COLLECTION_NAME, {
        wait: true,
        points: [pointId],
      });

      logger.info("Successfully deleted embedding", { pointId });
    } catch (error) {
      logger.error("Failed to delete embedding", {
        pointId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get statistics about the collection
   */
  async getCollectionInfo(): Promise<{
    vectorCount: number;
    indexedVectorsCount: number;
    pointsCount: number;
  }> {
    if (!this.isInitialized) {
      throw new Error(
        "VectorStoreService not initialized. Call initialize() first.",
      );
    }

    try {
      const info = await this.client.getCollection(this.COLLECTION_NAME);

      return {
        vectorCount: info.points_count || 0,
        indexedVectorsCount: info.indexed_vectors_count || 0,
        pointsCount: info.points_count || 0,
      };
    } catch (error) {
      logger.error("Failed to get collection info", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Retrieve a specific point by ID
   */
  async getPoint(pointId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error(
        "VectorStoreService not initialized. Call initialize() first.",
      );
    }

    try {
      const points = await this.client.retrieve(this.COLLECTION_NAME, {
        ids: [pointId],
        with_payload: true,
        with_vector: false,
      });

      return points.length > 0 ? points[0] : null;
    } catch (error) {
      logger.error("Failed to retrieve point", {
        pointId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

// Export singleton instance
export const vectorStoreService = new VectorStoreService();
