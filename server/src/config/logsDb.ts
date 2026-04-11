import { MongoClient, Db } from "mongodb";
import logger from "../utils/logger";

/**
 * Database connection manager for the logs database
 * This is separate from the main application database
 */
class LogsDatabase {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionPromise: Promise<Db> | null = null;

  /**
   * Get or create a connection to the logs database
   */
  async connect(): Promise<Db> {
    // Return existing connection if available
    if (this.db) {
      return this.db;
    }

    // Return in-progress connection if exists
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  /**
   * Establish a new connection to the logs database
   */
  private async establishConnection(): Promise<Db> {
    try {
      const mongoUrl = `mongodb://${process.env.MONGO_LOGS_USER}:${process.env.MONGO_LOGS_PASS}@${process.env.MONGO_LOGS_HOST}:${process.env.MONGO_LOGS_PORT}/${process.env.MONGO_LOGS_DB}?authSource=admin`;

      this.client = new MongoClient(mongoUrl);
      await this.client.connect();

      this.db = this.client.db(process.env.MONGO_LOGS_DB);

      logger.system("Logs database connected successfully", {
        database: process.env.MONGO_LOGS_DB,
        host: process.env.MONGO_LOGS_HOST,
      });

      return this.db;
    } catch (error) {
      logger.error("Failed to connect to logs database", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Get the database instance (must call connect() first)
   */
  getDb(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.connectionPromise = null;
      logger.system("Logs database connection closed");
    }
  }
}

// Export singleton instance
export const logsDatabase = new LogsDatabase();
export default logsDatabase;
