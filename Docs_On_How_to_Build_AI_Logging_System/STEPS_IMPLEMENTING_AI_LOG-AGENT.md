# Steps for Implementing AI Logging Agent

1. Structure Winston Logs to Include:

- requestId or correlationId to allow agent to track single user's journey across multiple log entries
- For logs, ensure they include timestamp, level, and are in json format (json format critical for AI Parsing )

2. Add Winston Log Calls to the API

3. Create System to Ingest and Embed Logs:

- Chunk Logs- break into manageable pieces
- Embed Logs (Turn text into numbers). Use OpenAI text-embedding-3-small
- Storage- Save embeddings to Vector DB

4. Build AI Agent
