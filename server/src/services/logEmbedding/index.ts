/**
 * Log Embedding Services
 * Complete pipeline: Ingestion → Chunking → Embedding → Vector Storage
 *
 * Step 1: Log Ingestion - Retrieve logs from MongoDB
 * Step 2: Chunking - Group logs into meaningful chunks
 * Step 3: Embedding - Create vector embeddings with OpenAI
 */

export { LogIngestionService, logIngestionService } from "./ingestion.service";
export { LogChunkingService, logChunkingService } from "./chunking.service";
export { EmbeddingService, embeddingService } from "./embedding.service";
export type { ISystemLog, ILogChunk } from "../../types/systemLog";
