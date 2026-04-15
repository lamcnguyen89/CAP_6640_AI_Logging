# Log Embedding Services

This module implements the complete log embedding pipeline for AI-powered log analysis.

## Architecture

**MongoDB Logs → Ingestion → Chunking → Embedding → Qdrant Vector Storage → AI Agent**

## Services Overview

### 1. **Ingestion Service** (`ingestion.service.ts`) - Step 1

Retrieves logs from MongoDB's `system_logs` collection.

**Key Features:**

- Fetch unprocessed logs in batches
- Track processed logs with `embedded` flag
- Query by correlationId, time range, or criteria
- Mark logs as processed after embedding

**Example:**

```typescript
import { logIngestionService } from "./services/logEmbedding";

const logs = await logIngestionService.fetchUnprocessedLogs(100);
```

---

### 2. **Chunking Service** (`chunking.service.ts`) - Step 2

Groups logs into meaningful chunks for embedding.

**Strategies:**

- **Correlation-based**: Groups by correlationId (recommended)
- **Time-window**: Groups by time periods (5-min windows)
- **Hybrid**: Combines both approaches

**Example:**

```typescript
import { logChunkingService } from "./services/logEmbedding";

const chunks = logChunkingService.groupByCorrelationId(logs);
const text = logChunkingService.formatChunkForEmbedding(chunks[0]);
```

---

### 3. **Embedding Service** (`embedding.service.ts`) - Step 3

Creates vector embeddings using OpenAI's API.

**Model:** `text-embedding-3-small` (1536 dimensions)  
**Cost:** ~$0.02 per 1M tokens

**Example:**

```typescript
import { embeddingService } from "./services/logEmbedding";

// Embed a chunk
const embedding = await embeddingService.embedLogChunk(chunk);

// Embed multiple chunks efficiently
const embeddings = await embeddingService.embedLogChunks(chunks);

// Embed a user query
const queryEmbedding = await embeddingService.embedText(
  "Why did the login fail?",
);
```

---

### 4. **Vector Store Service** (`vectorStore.service.ts`) - Step 4

Stores embeddings in Qdrant vector database for similarity search.

**Features:**

- Local Qdrant running in Docker (full data privacy)
- Cosine similarity for text embeddings
- Metadata storage for filtering
- Batch operations for efficiency
- Similarity search with filters

**Example:**

```typescript
import { vectorStoreService } from "./services/logEmbedding";

// Initialize (creates collection if needed)
await vectorStoreService.initialize();

// Store a single embedding
await vectorStoreService.storeEmbedding(chunk, embedding);

// Store multiple embeddings (more efficient)
await vectorStoreService.storeBatchEmbeddings(chunks, embeddings);

// Search for similar logs
const results = await vectorStoreService.search(queryEmbedding, 10);
```

---

### 5. **Pipeline Service** (`pipeline.service.ts`) - Complete Workflow

Orchestrates all steps in the embedding pipeline.

**Features:**

- One-command batch processing
- Automatic initialization
- Error handling and logging
- Cost tracking
- Statistics and monitoring

**Example:**

```typescript
import { logEmbeddingPipeline } from "./services/logEmbedding";

// Initialize once
await logEmbeddingPipeline.initialize();

// Process logs in one command
const result = await logEmbeddingPipeline.processBatch(100);
console.log(`Processed ${result.logsProcessed} logs, cost: $${result.cost}`);

// Search for similar logs
const results = await logEmbeddingPipeline.searchLogs("database error", 10);
```

---

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-api-key-here
QDRANT_URL=http://qdrant:6333  # Default for Docker
```

### 2. Start Qdrant with Docker

Qdrant is already configured in `docker-compose.dev.yml`:

```bash
docker compose -f docker-compose.dev.yml up -d qdrant
```

### 3. Install Dependencies

```bash
npm install openai @qdrant/js-client-rest --legacy-peer-deps
```

---

## Complete Pipeline Example

```typescript
import { logEmbeddingPipeline } from "./services/logEmbedding";

async function processLogs() {
  // 1. Initialize pipeline (one time)
  await logEmbeddingPipeline.initialize();

  // 2. Process a batch of logs (all steps automated)
  const result = await logEmbeddingPipeline.processBatch(100);

  console.log(`✅ Processed ${result.logsProcessed} logs`);
  console.log(`✅ Created ${result.embeddingsStored} embeddings`);
  console.log(`💰 Cost: $${result.cost.toFixed(6)}`);
  console.log(`⏱  Duration: ${result.duration}ms`);

  // 3. Search for similar logs
  const searchResults = await logEmbeddingPipeline.searchLogs(
    "authentication error",
    5,
  );

  searchResults.forEach((result) => {
    console.log(`Score: ${result.score.toFixed(4)}`);
    console.log(`Correlation ID: ${result.correlationId}`);
    console.log(`Messages: ${result.sampleMessages.join(", ")}`);
  });
}
```

---

## Example Files

- **`qdrant-examples.ts`** - Complete pipeline examples with Qdrant
- **`pipeline.examples.ts`** - Advanced pipeline patterns
- **`usage-examples.ts`** - Basic service usage
- **`quickstart.ts`** - Quick start guide

---

## Qdrant Features

### Collection Information

```typescript
const info = await vectorStoreService.getCollectionInfo();
console.log(`Vectors stored: ${info.pointsCount}`);
```

### Advanced Search with Filters

```typescript
const results = await vectorStoreService.search(queryEmbedding, 10, {
  correlationId: "abc-123",
  logLevel: "error",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
});
```

### Retrieve Specific Points

```typescript
const point = await vectorStoreService.getPoint("chunk-id-123");
console.log(point.payload); // Access metadata
```

---

## Monitoring & Statistics

```typescript
const stats = await logEmbeddingPipeline.getStatistics();
console.log(`Pending logs: ${stats.pendingLogs}`);
console.log(`Vectors in Qdrant: ${stats.qdrantInfo.pointsCount}`);
```

---

## Next Steps

1. ✅ **Vector Database Setup** - Qdrant running in Docker
2. ✅ **Store embeddings with metadata** - Implemented
3. ✅ **Implement similarity search** - Ready to use
4. 🔜 **Build AI agent for log analysis** - Coming next

See `qdrant-examples.ts` for complete usage examples.

## Quick Start

```typescript
import { logIngestionService } from "./services/logEmbedding";

// Fetch next 100 unprocessed logs
const logs = await logIngestionService.fetchUnprocessedLogs(100);

// Process logs (e.g., create embeddings)
// ... your logic here ...

// Mark as processed
const logIds = logs.map((log) => log._id!);
await logIngestionService.markAsProcessed(logIds);
```

### Fetch Logs by Correlation ID

```typescript
// Get all logs from a single user request
const logs = await logIngestionService.fetchLogsByCorrelationId("abc-123-def");
```

### Fetch Logs in Time Range

```typescript
const startTime = new Date("2026-04-10T00:00:00Z");
const endTime = new Date("2026-04-10T23:59:59Z");

const logs = await logIngestionService.fetchLogsInTimeRange(
  startTime,
  endTime,
  false, // Only unprocessed logs
);
```

### Monitor Backlog

```typescript
const count = await logIngestionService.getUnprocessedCount();
console.log(`${count} logs waiting to be processed`);
```

### Reset Processing State

```typescript
// Reprocess logs from 12 hours ago
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
logIngestionService.resetLastProcessedTime(twelveHoursAgo);
```

## Database Schema

### System Logs Collection (`system_logs`)

Logs are automatically written by Winston with the following structure:

```typescript
{
  _id: ObjectId,
  timestamp: Date,           // ISO 8601 timestamp
  level: string,             // 'error' | 'warn' | 'info' | 'debug' | etc.
  message: string,           // Log message
  correlationId?: string,    // Request correlation ID (from middleware)
  meta?: object,             // Additional metadata
  hostname?: string,         // Server hostname
  label?: string,            // Environment label ('development' | 'production')

  // Processing flags (added by ingestion service)
  embedded?: boolean,        // true if log has been embedded
  embeddedAt?: Date         // Timestamp when embedded
}
```

## Environment Variables

Required environment variables (same as Winston logger):

```env
MONGO_LOGS_USER=your_logs_user
MONGO_LOGS_PASS=your_logs_password
MONGO_LOGS_HOST=mongo
MONGO_LOGS_PORT=27017
MONGO_LOGS_DB=sherlock_logs
```

## Integration Example

Here's a complete example of processing logs in a scheduled job:

```typescript
import { logIngestionService } from "./services/logEmbedding";
import logger from "./utils/logger";

async function processLogsPipeline() {
  try {
    // 1. Check backlog
    const backlog = await logIngestionService.getUnprocessedCount();
    logger.info("Starting log processing", { backlog });

    // 2. Process in batches of 100
    let processedTotal = 0;
    while (true) {
      const logs = await logIngestionService.fetchUnprocessedLogs(100);

      if (logs.length === 0) {
        break; // No more logs to process
      }

      // 3. Create embeddings (Step 2 - to be implemented)
      // const embeddings = await createEmbeddings(logs);

      // 4. Store embeddings (Step 3 - to be implemented)
      // await storeEmbeddings(embeddings);

      // 5. Mark as processed
      const logIds = logs.map((log) => log._id!);
      await logIngestionService.markAsProcessed(logIds);

      processedTotal += logs.length;
      logger.info("Batch processed", {
        batchSize: logs.length,
        processedTotal,
      });
    }

    logger.info("Log processing complete", { processedTotal });
  } catch (error) {
    logger.error("Log processing failed", { error });
    throw error;
  }
}

// Run every 10 minutes
setInterval(processLogsPipeline, 10 * 60 * 1000);
```

## Next Steps

This is **Step 1** of the embedding pipeline. The next steps are:

- **Step 2:** Chunking Service - Group logs by correlation ID or time windows
- **Step 3:** Embedding Service - Convert log chunks to vectors using OpenAI
- **Step 4:** Vector Storage - Store embeddings in Qdrant
- **Step 5:** AI Agent Integration - Query and analyze logs with LLM

## Testing

To test the service:

1. Ensure your Docker environment is running:

   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

2. Generate some logs by using the application

3. Run the example functions:
   ```typescript
   import { exampleFetchUnprocessedLogs } from "./services/logEmbedding/usage-examples";
   await exampleFetchUnprocessedLogs();
   ```

## API Reference

### `LogIngestionService`

#### Methods

##### `fetchUnprocessedLogs(batchSize?: number, since?: Date): Promise<ISystemLog[]>`

Fetch unprocessed logs from MongoDB.

**Parameters:**

- `batchSize` (optional): Number of logs to fetch (default: 500)
- `since` (optional): Fetch logs from this timestamp (defaults to lastProcessedTime)

**Returns:** Array of unprocessed system logs

---

##### `fetchLogsByCorrelationId(correlationId: string): Promise<ISystemLog[]>`

Fetch all logs with a specific correlation ID.

**Parameters:**

- `correlationId`: The correlation ID to filter by

**Returns:** Array of logs with matching correlation ID

---

##### `markAsProcessed(logIds: string[]): Promise<void>`

Mark logs as processed (embedded).

**Parameters:**

- `logIds`: Array of log IDs to mark as processed

---

##### `getUnprocessedCount(): Promise<number>`

Get count of unprocessed logs.

**Returns:** Number of unprocessed logs

---

##### `fetchLogsInTimeRange(startTime: Date, endTime: Date, includeProcessed?: boolean): Promise<ISystemLog[]>`

Fetch logs within a time range.

**Parameters:**

- `startTime`: Start of time range
- `endTime`: End of time range
- `includeProcessed` (optional): Include already processed logs (default: false)

**Returns:** Array of logs within the time range

---

##### `resetLastProcessedTime(time?: Date): void`

Reset the last processed time checkpoint.

**Parameters:**

- `time` (optional): New last processed time (defaults to 24 hours ago)

## Notes

- The service uses a singleton pattern for easy importing
- Database connection is automatically managed and reused
- All operations are logged for debugging and monitoring
- The service is designed to be fault-tolerant with comprehensive error handling
