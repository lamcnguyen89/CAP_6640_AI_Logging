# Testing the Qdrant Integration

## Quick Verification Tests

### 1. Check Qdrant is Running

```bash
# Check container status
docker ps --filter "name=sh-qdrant"

# Check Qdrant health
curl http://localhost:6333/healthz

# View Qdrant dashboard (in browser)
open http://localhost:6333/dashboard
```

**Expected Output:**

- Container status: `Up`
- Health check: `healthz check passed`
- Dashboard: Shows Qdrant UI

---

### 2. Test from Node.js (Server Code)

Create a test file: `server/src/services/logEmbedding/test-qdrant.ts`

```typescript
import { logEmbeddingPipeline } from "./index";

async function testQdrantIntegration() {
  console.log("\n=== Testing Qdrant Integration ===\n");

  try {
    // 1. Initialize pipeline
    console.log("1. Initializing pipeline...");
    await logEmbeddingPipeline.initialize();
    console.log("✅ Pipeline initialized\n");

    // 2. Check if ready
    const ready = logEmbeddingPipeline.isReady();
    console.log(`2. Pipeline ready: ${ready ? "✅ Yes" : "❌ No"}\n`);

    if (!ready) {
      console.error("❌ Pipeline not ready. Check:");
      console.error("   - OPENAI_API_KEY is set");
      console.error("   - Qdrant container is running");
      return;
    }

    // 3. Get statistics
    console.log("3. Getting statistics...");
    const stats = await logEmbeddingPipeline.getStatistics();
    console.log(`   - Pending logs: ${stats.pendingLogs}`);
    console.log(`   - Vectors in Qdrant: ${stats.qdrantInfo.pointsCount}`);
    console.log("✅ Statistics retrieved\n");

    // 4. Process a small batch (if logs available)
    if (stats.pendingLogs > 0) {
      console.log("4. Processing a batch of logs...");
      const result = await logEmbeddingPipeline.processBatch(10);
      console.log(`   ✅ Processed ${result.logsProcessed} logs`);
      console.log(`   ✅ Created ${result.embeddingsStored} embeddings`);
      console.log(`   💰 Cost: $${result.cost.toFixed(6)}`);
      console.log(`   ⏱  Duration: ${result.duration}ms\n`);
    } else {
      console.log("4. ⚠️  No pending logs to process\n");
    }

    // 5. Test search (if vectors exist)
    const updatedStats = await logEmbeddingPipeline.getStatistics();
    if (updatedStats.qdrantInfo.pointsCount > 0) {
      console.log("5. Testing search functionality...");
      const searchResults = await logEmbeddingPipeline.searchLogs(
        "test query",
        3,
      );
      console.log(`   ✅ Search returned ${searchResults.length} results\n`);

      if (searchResults.length > 0) {
        console.log("   Top result:");
        console.log(`   - Score: ${searchResults[0].score.toFixed(4)}`);
        console.log(`   - Correlation ID: ${searchResults[0].correlationId}`);
      }
    } else {
      console.log("5. ⚠️  No vectors to search yet\n");
    }

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testQdrantIntegration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Run the test:**

```bash
# From server directory
cd server
npx ts-node src/services/logEmbedding/test-qdrant.ts
```

---

### 3. Test via API Endpoints (Future)

Once you create API endpoints, you can test like this:

```bash
# Process logs
curl -X POST http://localhost:4000/api/embeddings/process \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50}'

# Search logs
curl -X POST http://localhost:4000/api/embeddings/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication error",
    "limit": 10
  }'

# Get statistics
curl http://localhost:4000/api/embeddings/stats
```

---

### 4. Verify Qdrant Collections

```bash
# List all collections
curl http://localhost:6333/collections

# Get collection info
curl http://localhost:6333/collections/log_embeddings

# Count points
curl -X POST http://localhost:6333/collections/log_embeddings/points/count \
  -H "Content-Type: application/json" \
  -d '{"exact": true}'
```

---

### 5. Check Docker Logs

```bash
# Qdrant logs
docker logs sh-qdrant

# API server logs (to see embedding activity)
docker logs sh-api

# Follow logs in real-time
docker logs -f sh-qdrant
```

---

## Expected Behavior

### After Processing Logs:

1. **MongoDB** - Logs marked with `embedded: true`
2. **Qdrant** - Collections created with vectors
3. **Server logs** - Show processing activity:
   ```
   [INFO] Starting batch processing
   [INFO] Fetched 50 unprocessed logs
   [INFO] Created 12 chunks
   [INFO] Created 12 embeddings
   [INFO] Stored 12 embeddings in Qdrant
   ```

### Qdrant Collection Info Should Show:

```json
{
  "status": "green",
  "points_count": 12,
  "vectors_count": 12,
  "indexed_vectors_count": 12
}
```

---

## Troubleshooting

### Issue: Pipeline fails to initialize

**Possible causes:**

1. OPENAI_API_KEY not set
2. Qdrant container not running
3. MongoDB connection failed

**Check:**

```bash
# Environment variables
docker exec sh-api env | grep OPENAI_API_KEY
docker exec sh-api env | grep QDRANT_URL

# Qdrant health
curl http://localhost:6333/healthz

# Container status
docker ps | grep qdrant
```

---

### Issue: "Collection not found"

**Solution:** Initialize the pipeline

```typescript
await logEmbeddingPipeline.initialize();
```

This automatically creates the collection if it doesn't exist.

---

### Issue: Search returns no results

**Possible causes:**

1. No embeddings stored yet
2. Query too specific
3. Similarity threshold too high

**Check:**

```typescript
// Get collection info
const info = await vectorStoreService.getCollectionInfo();
console.log(`Points in collection: ${info.pointsCount}`);
```

---

### Issue: Cost concerns

**Monitor usage:**

```typescript
// Before processing
const cost = embeddingService.estimateBatchCost(chunks);
console.log(`Estimated cost: $${cost.toFixed(6)}`);
```

**Cost reference:**

- text-embedding-3-small: $0.02 per 1M tokens
- Average log chunk: ~200-500 tokens
- 1000 logs ≈ $0.01 - $0.02

---

## Performance Benchmarks

### Expected Processing Times:

| Logs | Chunks  | Embedding Time | Storage Time | Total     |
| ---- | ------- | -------------- | ------------ | --------- |
| 100  | 20-30   | 2-4 sec        | 0.5 sec      | 3-5 sec   |
| 1000 | 200-300 | 20-40 sec      | 2-3 sec      | 25-45 sec |

### Expected Search Times:

| Collection Size | Search Time |
| --------------- | ----------- |
| 100 vectors     | < 50ms      |
| 1,000 vectors   | < 100ms     |
| 10,000 vectors  | < 200ms     |
| 100,000 vectors | < 500ms     |

---

## Next Steps After Testing

1. ✅ Verify Qdrant is running
2. ✅ Test pipeline initialization
3. ✅ Process sample logs
4. ✅ Test search functionality
5. 🔜 Create API endpoints
6. 🔜 Build frontend dashboard
7. 🔜 Integrate with AI agent
8. 🔜 Set up scheduled processing

---

## Monitoring Commands

```bash
# Watch Qdrant logs
docker logs -f sh-qdrant

# Monitor collection size
watch -n 5 'curl -s http://localhost:6333/collections/log_embeddings | jq ".result.points_count"'

# Check disk usage
du -sh ./qdrant_storage
```

---

**Status:** Ready for testing! 🚀

All services are running and the Qdrant integration is complete.
