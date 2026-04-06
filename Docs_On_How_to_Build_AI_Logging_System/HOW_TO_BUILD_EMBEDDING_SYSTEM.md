# How to Build the Log Embedding System

Based on your current setup, here's a comprehensive overview of how to build the log ingestion and embedding system.

## System Architecture Overview

Your logs are already flowing into MongoDB's `system_logs` collection in JSON format with correlation IDs. Now you need to transform them into AI-readable vectors. Here's the pipeline:

**MongoDB Logs → Retrieve & Process → Chunk → Embed → Vector DB → AI Agent**

---

## 1. Log Retrieval & Processing

**Current State:** Your Winston logger is storing structured JSON logs in MongoDB at logger.ts:100-120.

**What You Need:** A service that periodically fetches new logs from the `system_logs` collection.

```typescript
// Example: services/logIngestion.ts
class LogIngestionService {
  async fetchUnprocessedLogs() {
    // Query MongoDB for logs not yet embedded
    const logs = await db
      .collection("system_logs")
      .find({
        embedded: { $ne: true }, // Not yet processed
        timestamp: { $gte: lastProcessedTime },
      })
      .toArray();

    return logs;
  }
}
```

**Key Considerations:**

- Track which logs have been processed (add an `embedded: boolean` flag)
- Handle logs in batches (e.g., 100-1000 at a time)
- Use the `correlationId` from your middleware to group related logs

---

## 2. Chunking Strategy

**Purpose:** AI models have token limits, and individual logs are often too granular. Chunking creates meaningful context.

**Recommended Approaches:**

### A. Correlation-Based Chunking (Best for your use case)

```typescript
// Group logs by correlationId to capture entire user journeys
const chunks = groupBy(logs, "correlationId");
```

This preserves the full story of a user's request across multiple API calls.

### B. Time-Window Chunking

```typescript
// Group logs within 5-minute windows
const chunks = groupByTimeWindow(logs, 5 * 60 * 1000);
```

### C. Hybrid Approach

```typescript
// Combine related logs by correlationId + time window
function createContextChunk(logs) {
  return {
    correlationId: logs[0].correlationId,
    timeRange: { start: minTime, end: maxTime },
    logCount: logs.length,
    events: logs.map(formatLog),
    summary: generateSummary(logs),
  };
}
```

---

## 3. Embedding with OpenAI

**Setup:** Install the OpenAI SDK

```bash
npm install openai
```

**Implementation:**

```typescript
import OpenAI from "openai";

class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async embedLogChunk(chunk: LogChunk): Promise<number[]> {
    // Convert chunk to text
    const text = this.formatChunkForEmbedding(chunk);

    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small", // 1536 dimensions
      input: text,
    });

    return response.data[0].embedding;
  }

  private formatChunkForEmbedding(chunk: LogChunk): string {
    // Structure the text for better embeddings
    return `
      Request ID: ${chunk.correlationId}
      Time: ${chunk.timeRange.start} - ${chunk.timeRange.end}
      Event Count: ${chunk.logCount}

      Events:
      ${chunk.events
        .map((e) => `[${e.level}] ${e.message} ${JSON.stringify(e.metadata)}`)
        .join("\n")}
    `.trim();
  }
}
```

**Cost Estimate:** text-embedding-3-small costs ~$0.02/1M tokens, which is very affordable.

---

---

## 4. Vector Database Storage

**Options:**

### A. Pinecone (Managed, Easiest)

```typescript
import { PineconeClient } from "@pinecone-database/pinecone";

const pinecone = new PineconeClient();
await pinecone.init({ apiKey: process.env.PINECONE_API_KEY });

const index = pinecone.Index("logs");
await index.upsert({
  vectors: [
    {
      id: chunk.id,
      values: embedding,
      metadata: {
        correlationId: chunk.correlationId,
        timestamp: chunk.timeRange.start,
        logLevel: chunk.maxLogLevel,
        originalLogIds: chunk.logIds,
      },
    },
  ],
});
```

### B. MongoDB Atlas Vector Search (You're already using MongoDB!)

```typescript
// Create vector search index in MongoDB Atlas
await db.collection("log_embeddings").createSearchIndex({
  name: "log_vector_index",
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 1536, // text-embedding-3-small dimension
        similarity: "cosine",
      },
    ],
  },
});

// Store embeddings
await db.collection("log_embeddings").insertOne({
  embedding: embedding,
  correlationId: chunk.correlationId,
  timestamp: chunk.timeRange.start,
  chunkText: text,
  originalLogIds: chunk.logIds,
});
```

### C. Weaviate or Qdrant (Self-hosted options)

**Recommendation:** Start with **MongoDB Atlas Vector Search** since you're already using MongoDB. It simplifies your infrastructure.

---

---

## 5. Complete Implementation Flow

```typescript
// services/logEmbeddingPipeline.ts
class LogEmbeddingPipeline {
  async process() {
    // 1. Fetch unprocessed logs
    const logs = await this.logIngestion.fetchUnprocessedLogs();

    // 2. Chunk by correlationId
    const chunks = this.chunker.groupByCorrelationId(logs);

    // 3. For each chunk:
    for (const chunk of chunks) {
      // 4. Generate embedding
      const embedding = await this.embedder.embedLogChunk(chunk);

      // 5. Store in vector DB
      await this.vectorStore.save({
        embedding,
        metadata: chunk,
        originalLogs: chunk.logIds,
      });

      // 6. Mark original logs as processed
      await this.logIngestion.markAsProcessed(chunk.logIds);
    }
  }
}
```

**Scheduling:** Run this pipeline:

- Every 5-10 minutes for near-real-time analysis
- Or trigger on-demand when the AI agent needs fresh data

---

---

## 6. Next Steps for the AI Agent

Once embeddings are stored, your AI agent can:

### 1. Convert user questions to embeddings

```typescript
const questionEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "Why did user registration fail?",
});
```

### 2. Vector Similarity Search

```typescript
const results = await vectorDB.search({
  vector: questionEmbedding,
  topK: 10, // Get 10 most relevant log chunks
});
```

### 3. Feed relevant logs to LLM for Analysis

```typescript
const analysis = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "Analyze these logs to answer the user's question",
    },
    {
      role: "user",
      content: `Question: ${question}\n\nRelevant Logs:\n${results}`,
    },
  ],
});
```

---

## Recommended Directory Structure

```
server/src/
  services/
    logEmbedding/
      ingestion.service.ts      # Fetch logs from MongoDB
      chunking.service.ts       # Group logs into chunks
      embedding.service.ts      # Create embeddings
      vectorStore.service.ts    # Vector DB operations
      pipeline.service.ts       # Orchestrate the flow
  models/
    LogChunk.ts                 # TypeScript interface
    EmbeddedLog.ts
```

---

This approach leverages your existing Winston + MongoDB setup and creates a scalable pipeline for AI analysis.
