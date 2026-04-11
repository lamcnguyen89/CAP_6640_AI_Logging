import { Collection, ObjectId } from "mongodb";
import { logsDatabase } from "../../config/logsDb";
import { ISystemLog } from "../../types/systemLog";
import logger from "../../utils/logger";

/**
 * Service for ingesting logs from MongoDB for embedding
 * Implements Step 1: Log Retrieval & Processing
 */
export class LogIngestionService {
  private readonly COLLECTION_NAME = "system_logs";
  private readonly DEFAULT_BATCH_SIZE = 500;
  private lastProcessedTime: Date;

  constructor() {
    // Initialize with a timestamp from 24 hours ago
    this.lastProcessedTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  /**
   * Get the logs collection
   */
  private async getCollection(): Promise<Collection<ISystemLog>> {
    const db = await logsDatabase.connect();
    return db.collection<ISystemLog>(this.COLLECTION_NAME);
  }

  /**
   * Fetch unprocessed logs from MongoDB
   * Returns logs that haven't been embedded yet
   *
   * @param batchSize - Number of logs to fetch (default: 500)
   * @param since - Optional timestamp to fetch logs from (defaults to lastProcessedTime)
   * @returns Array of unprocessed logs
   */
  async fetchUnprocessedLogs(
    batchSize: number = this.DEFAULT_BATCH_SIZE,
    since?: Date,
  ): Promise<ISystemLog[]> {
    try {
      const collection = await this.getCollection();
      const queryTime = since || this.lastProcessedTime;

      logger.debug("Fetching unprocessed logs", {
        batchSize,
        since: queryTime.toISOString(),
      });

      const logs = await collection
        .find({
          embedded: { $ne: true }, // Not yet processed
          timestamp: { $gte: queryTime }, // Only logs after the last processed time
        })
        .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first)
        .limit(batchSize)
        .toArray();

      logger.info("Fetched unprocessed logs", {
        count: logs.length,
        batchSize,
      });

      return logs;
    } catch (error) {
      logger.error("Error fetching unprocessed logs", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Fetch logs by correlation ID
   * Useful for grouping related logs from a single user journey
   *
   * @param correlationId - The correlation ID to filter by
   * @returns Array of logs with matching correlation ID
   */
  async fetchLogsByCorrelationId(correlationId: string): Promise<ISystemLog[]> {
    try {
      const collection = await this.getCollection();

      logger.debug("Fetching logs by correlation ID", { correlationId });

      const logs = await collection
        .find({
          correlationId,
        })
        .sort({ timestamp: 1 })
        .toArray();

      logger.debug("Fetched logs by correlation ID", {
        correlationId,
        count: logs.length,
      });

      return logs;
    } catch (error) {
      logger.error("Error fetching logs by correlation ID", {
        correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Mark logs as processed (embedded)
   * Updates the embedded flag and timestamp
   *
   * @param logIds - Array of log IDs to mark as processed
   */
  async markAsProcessed(logIds: string[]): Promise<void> {
    try {
      const collection = await this.getCollection();

      const objectIds = logIds.map((id) => new ObjectId(id));

      logger.debug("Marking logs as processed", {
        count: logIds.length,
      });

      const result = await collection.updateMany(
        { _id: { $in: objectIds } } as any,
        {
          $set: {
            embedded: true,
            embeddedAt: new Date(),
          },
        },
      );

      logger.info("Marked logs as processed", {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      });

      // Update last processed time to the current time
      this.lastProcessedTime = new Date();
    } catch (error) {
      logger.error("Error marking logs as processed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get count of unprocessed logs
   * Useful for monitoring the backlog
   *
   * @returns Number of unprocessed logs
   */
  async getUnprocessedCount(): Promise<number> {
    try {
      const collection = await this.getCollection();

      const count = await collection.countDocuments({
        embedded: { $ne: true },
      });

      logger.debug("Unprocessed log count", { count });

      return count;
    } catch (error) {
      logger.error("Error getting unprocessed count", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get logs within a time range
   *
   * @param startTime - Start of time range
   * @param endTime - End of time range
   * @param includeProcessed - Whether to include already processed logs (default: false)
   * @returns Array of logs within the time range
   */
  async fetchLogsInTimeRange(
    startTime: Date,
    endTime: Date,
    includeProcessed: boolean = false,
  ): Promise<ISystemLog[]> {
    try {
      const collection = await this.getCollection();

      const query: Record<string, any> = {
        timestamp: {
          $gte: startTime,
          $lte: endTime,
        },
      };

      if (!includeProcessed) {
        query.embedded = { $ne: true };
      }

      logger.debug("Fetching logs in time range", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        includeProcessed,
      });

      const logs = await collection
        .find(query)
        .sort({ timestamp: 1 })
        .toArray();

      logger.debug("Fetched logs in time range", {
        count: logs.length,
      });

      return logs;
    } catch (error) {
      logger.error("Error fetching logs in time range", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Reset the last processed time
   * Useful for reprocessing logs from a specific point
   *
   * @param time - New last processed time (defaults to 24 hours ago)
   */
  resetLastProcessedTime(time?: Date): void {
    this.lastProcessedTime = time || new Date(Date.now() - 24 * 60 * 60 * 1000);
    logger.info("Reset last processed time", {
      lastProcessedTime: this.lastProcessedTime.toISOString(),
    });
  }
}

// Export singleton instance
export const logIngestionService = new LogIngestionService();
export default logIngestionService;
