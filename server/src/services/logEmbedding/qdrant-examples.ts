/**
 * Complete Pipeline Usage Examples with Qdrant Vector Storage
 *
 * This file demonstrates the full workflow:
 * MongoDB Logs → Retrieve → Chunk → Embed → Store in Qdrant → Search
 */

import { logEmbeddingPipeline } from "./pipeline.service";
import logger from "../../utils/logger";

/**
 * Example 1: Initialize and process a batch of logs
 * This is the most common workflow
 */
export async function processLogBatch() {
  console.log("\n=== Example 1: Processing Log Batch ===\n");

  try {
    // Initialize the pipeline (must be called once before use)
    console.log("🔧 Initializing pipeline...");
    await logEmbeddingPipeline.initialize();
    console.log("✅ Pipeline initialized\n");

    // Check pipeline status
    if (!logEmbeddingPipeline.isReady()) {
      console.error(
        "❌ Pipeline not ready. Check OPENAI_API_KEY and Qdrant connection.",
      );
      return;
    }

    // Get current statistics
    console.log("📊 Current Statistics:");
    const stats = await logEmbeddingPipeline.getStatistics();
    console.log(`   - Pending logs: ${stats.pendingLogs}`);
    console.log(`   - Vectors in Qdrant: ${stats.qdrantInfo.pointsCount}`);
    console.log();

    // Process a batch of 50 logs
    console.log("⏳ Processing batch of 50 logs...");
    const result = await logEmbeddingPipeline.processBatch(50);

    console.log("\n✅ Batch processed successfully!");
    console.log(`   - Logs processed: ${result.logsProcessed}`);
    console.log(`   - Chunks created: ${result.chunksCreated}`);
    console.log(`   - Embeddings stored: ${result.embeddingsStored}`);
    console.log(`   - Estimated cost: $${result.cost.toFixed(6)}`);
    console.log(`   - Duration: ${result.duration}ms`);

    return result;
  } catch (error) {
    console.error("❌ Error processing batch:", error);
    throw error;
  }
}

/**
 * Example 2: Process a specific correlation ID
 * Useful for debugging or targeted processing
 */
export async function processSpecificCorrelation(correlationId: string) {
  console.log("\n=== Example 2: Processing Specific Correlation ID ===\n");

  try {
    // Ensure pipeline is initialized
    if (!logEmbeddingPipeline.isReady()) {
      await logEmbeddingPipeline.initialize();
    }

    console.log(`🔍 Processing correlationId: ${correlationId}`);
    const result =
      await logEmbeddingPipeline.processCorrelationId(correlationId);

    if (result.chunk) {
      console.log("\n✅ Correlation ID processed!");
      console.log(`   - Log count: ${result.chunk.logCount}`);
      console.log(
        `   - Time range: ${result.chunk.timeRange.start} to ${result.chunk.timeRange.end}`,
      );
      console.log(`   - Max log level: ${result.chunk.maxLogLevel}`);
      console.log(`   - Embedding ID: ${result.embeddingId}`);
    } else {
      console.log("⚠️  No logs found for this correlation ID");
    }

    return result;
  } catch (error) {
    console.error("❌ Error processing correlation ID:", error);
    throw error;
  }
}

/**
 * Example 3: Search for similar logs using natural language
 * This demonstrates the AI agent workflow
 */
export async function searchSimilarLogs(query: string, limit: number = 5) {
  console.log("\n=== Example 3: Searching Similar Logs ===\n");

  try {
    // Ensure pipeline is initialized
    if (!logEmbeddingPipeline.isReady()) {
      await logEmbeddingPipeline.initialize();
    }

    console.log(`🔍 Searching for: "${query}"`);
    console.log(`   Limit: ${limit} results\n`);

    const results = await logEmbeddingPipeline.searchLogs(query, limit);

    if (results.length === 0) {
      console.log("⚠️  No results found");
      return results;
    }

    console.log(`✅ Found ${results.length} similar log chunks:\n`);

    results.forEach((result, index) => {
      console.log(
        `${index + 1}. Score: ${result.score.toFixed(4)} (higher is better)`,
      );
      console.log(`   Correlation ID: ${result.correlationId}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      console.log(`   Log Count: ${result.logCount}`);
      console.log(`   Sample Messages:`);
      result.sampleMessages.slice(0, 3).forEach((msg, i) => {
        console.log(`      ${i + 1}. ${msg}`);
      });
      console.log();
    });

    return results;
  } catch (error) {
    console.error("❌ Error searching logs:", error);
    throw error;
  }
}

/**
 * Example 4: Continuous processing (scheduled job)
 * Run this periodically to keep embeddings up to date
 */
export async function continuousProcessing(intervalMinutes: number = 5) {
  console.log("\n=== Example 4: Continuous Processing ===\n");
  console.log(
    `Starting continuous processing (every ${intervalMinutes} minutes)`,
  );
  console.log("Press Ctrl+C to stop\n");

  try {
    // Initialize once
    await logEmbeddingPipeline.initialize();

    // Process immediately
    await processSingleRun();

    // Then process on interval
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
      await processSingleRun();
    }, intervalMs);
  } catch (error) {
    console.error("❌ Error in continuous processing:", error);
    throw error;
  }
}

/**
 * Helper function for continuous processing
 */
async function processSingleRun() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Starting processing run...`);

    const stats = await logEmbeddingPipeline.getStatistics();
    console.log(`   Pending logs: ${stats.pendingLogs}`);

    if (stats.pendingLogs === 0) {
      console.log("   ✓ No logs to process");
      return;
    }

    const result = await logEmbeddingPipeline.processBatch(100);
    console.log(
      `   ✓ Processed ${result.logsProcessed} logs into ${result.embeddingsStored} embeddings`,
    );
    console.log(`   ✓ Cost: $${result.cost.toFixed(6)}`);
  } catch (error) {
    console.error("   ❌ Error in processing run:", error);
  }
}

/**
 * Example 5: Complete workflow demonstration
 * Shows all capabilities in sequence
 */
export async function completeWorkflowDemo() {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║  Complete Log Embedding Pipeline Demo     ║");
  console.log("╚════════════════════════════════════════════╝\n");

  try {
    // Step 1: Initialize
    console.log("STEP 1: Initialize Pipeline");
    console.log("─".repeat(50));
    await logEmbeddingPipeline.initialize();
    console.log("✅ Initialized\n");

    // Step 2: Check statistics
    console.log("STEP 2: Check Current Statistics");
    console.log("─".repeat(50));
    const initialStats = await logEmbeddingPipeline.getStatistics();
    console.log(`Pending logs: ${initialStats.pendingLogs}`);
    console.log(`Vectors in Qdrant: ${initialStats.qdrantInfo.pointsCount}\n`);

    // Step 3: Process logs
    if (initialStats.pendingLogs > 0) {
      console.log("STEP 3: Process Logs");
      console.log("─".repeat(50));
      const processResult = await logEmbeddingPipeline.processBatch(20);
      console.log(`✅ Processed ${processResult.logsProcessed} logs`);
      console.log(`✅ Created ${processResult.embeddingsStored} embeddings`);
      console.log(`💰 Cost: $${processResult.cost.toFixed(6)}\n`);
    } else {
      console.log("STEP 3: Process Logs");
      console.log("─".repeat(50));
      console.log("⚠️  No pending logs to process\n");
    }

    // Step 4: Search examples
    console.log("STEP 4: Search Examples");
    console.log("─".repeat(50));

    const queries = [
      "error in authentication",
      "user registration",
      "database connection",
    ];

    for (const query of queries) {
      console.log(`\n🔍 Query: "${query}"`);
      const results = await logEmbeddingPipeline.searchLogs(query, 3);
      console.log(`   Found ${results.length} results`);
      if (results.length > 0) {
        console.log(`   Top result score: ${results[0].score.toFixed(4)}`);
      }
    }

    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║  Demo Complete! 🎉                         ║");
    console.log("╚════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("\n❌ Error in workflow demo:", error);
    throw error;
  }
}

// Export all examples
export default {
  processLogBatch,
  processSpecificCorrelation,
  searchSimilarLogs,
  continuousProcessing,
  completeWorkflowDemo,
};

/**
 * Quick start - uncomment to run
 */
// Run the complete demo
// completeWorkflowDemo().catch(console.error);

// Or run individual examples:
// processLogBatch().catch(console.error);
// searchSimilarLogs("database error").catch(console.error);
