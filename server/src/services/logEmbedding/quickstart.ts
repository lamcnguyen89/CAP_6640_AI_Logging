/**
 * Quick Start Guide for Log Embedding Service
 *
 * This file demonstrates the simplest way to use the embedding services.
 */

import {
  logIngestionService,
  logChunkingService,
  embeddingService,
} from "./index";

/**
 * STEP 1: Check if everything is configured correctly
 */
export async function quickStart_CheckSetup() {
  console.log("\n=== Checking Service Setup ===");

  // Check OpenAI configuration
  if (!embeddingService.isReady()) {
    console.error("❌ OpenAI API key not configured!");
    console.log("Add OPENAI_API_KEY to your .env file");
    return false;
  }

  console.log("✅ OpenAI configured");
  console.log("   Model:", embeddingService.getModel());
  console.log("   Dimensions:", embeddingService.getDimensions());

  // Check log backlog
  try {
    const count = await logIngestionService.getUnprocessedCount();
    console.log("✅ Database connected");
    console.log("   Unprocessed logs:", count);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

/**
 * STEP 2: Process a small batch of logs
 */
export async function quickStart_ProcessBatch() {
  console.log("\n=== Processing Sample Batch ===");

  // Fetch 10 logs
  const logs = await logIngestionService.fetchUnprocessedLogs(10);
  console.log(`✅ Fetched ${logs.length} logs`);

  if (logs.length === 0) {
    console.log("No unprocessed logs found");
    return;
  }

  // Chunk them
  const chunks = logChunkingService.groupByCorrelationId(logs);
  console.log(`✅ Created ${chunks.length} chunks`);

  // Show first chunk details
  if (chunks.length > 0) {
    console.log("\nFirst chunk:");
    console.log("  ID:", chunks[0].id);
    console.log("  Logs:", chunks[0].logCount);
    console.log("  Level:", chunks[0].maxLogLevel);
  }

  // Estimate cost
  const cost = embeddingService.estimateBatchCost(chunks);
  console.log(`💰 Estimated cost: $${cost.toFixed(6)}`);

  // Create embeddings
  console.log("\n⏳ Creating embeddings...");
  const embeddings = await embeddingService.embedLogChunks(chunks);
  console.log(`✅ Created ${embeddings.length} embeddings`);

  // Validate
  const allValid = embeddings.every((emb) =>
    embeddingService.validateEmbedding(emb),
  );
  console.log(`✅ All embeddings valid: ${allValid}`);

  return { chunks, embeddings };
}

/**
 * STEP 3: Embed a user question (for similarity search later)
 */
export async function quickStart_EmbedQuestion(question: string) {
  console.log("\n=== Embedding User Question ===");
  console.log("Question:", question);

  const embedding = await embeddingService.embedText(question);

  console.log("✅ Question embedded");
  console.log("   Dimensions:", embedding.length);
  console.log(
    "   First 5 values:",
    embedding.slice(0, 5).map((v) => v.toFixed(4)),
  );

  return embedding;
}

/**
 * Complete quick start demonstration
 */
export async function runQuickStart() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Log Embedding Service - Quick Start  ║");
  console.log("╚════════════════════════════════════════╝");

  try {
    // Step 1: Check setup
    const isReady = await quickStart_CheckSetup();
    if (!isReady) {
      console.log("\n❌ Setup incomplete. Please configure and try again.");
      return;
    }

    // Step 2: Process a batch
    const result = await quickStart_ProcessBatch();

    if (result) {
      console.log("\n✅ SUCCESS! Embeddings created.");
      console.log("\nNext steps:");
      console.log("1. Set up Qdrant vector database");
      console.log("2. Store these embeddings in Qdrant");
      console.log("3. Build similarity search functionality");
      console.log("4. Create AI agent for log analysis");
    }

    // Step 3: Example question embedding
    await quickStart_EmbedQuestion("Why did the user login fail?");

    console.log("\n✅ Quick start complete!");
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Uncomment to run:
// runQuickStart();

export default {
  quickStart_CheckSetup,
  quickStart_ProcessBatch,
  quickStart_EmbedQuestion,
  runQuickStart,
};
