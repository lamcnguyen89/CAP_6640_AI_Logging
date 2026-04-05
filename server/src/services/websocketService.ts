// @ts-ignore
const jwt = require("jsonwebtoken");
import keys from "../config/keys";
import User from "../models/User";
import ProcessingStatus from "../models/ProcessingStatus";

/* 
WebSocket service for managing WebSocket connections and subscriptions .
Websocket connections allow real-time communication between the server and clients.
This service handles:
  - Registering and authenticating WebSocket connections
  - Subscribing to CSV processing updates for specific participants and file types
  - Broadcasting CSV processing updates to subscribed clients
  - Sending notifications for processing status changes (started, progress, completed, error)
  - Managing active connections and their authentication status
  - Provides methods to get connection counts and authenticated connection counts 

// Singleton WebSocket service to manage connections and subscriptions
    // This ensures only one instance of the service is used throughout the application
    // to avoid memory leaks and ensure consistent state management

*/

// Represents Websocket connection with authentication and subscription information
interface AuthenticatedConnection {
  ws: any; // WebSocket from express-ws
  userId: string;
  participantId?: string;
  fileTypeId?: string;
}

// Defines structure for CSV processing notifications sent over WebSocket
interface CsvProcessingUpdate {
  type: "csv_processing_update";
  participantId: string;
  fileTypeId: string;
  status: "started" | "progress" | "completed" | "error";
  progress?: {
    processed: number;
    total: number;
    percentage: number;
  };
  error?: string;
  batchInfo?: {
    batchNumber: number;
    totalBatches: number;
  };
}

export class WebSocketService {
  private static instance: WebSocketService;
  private connections: Map<string, AuthenticatedConnection> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Register a new WebSocket connection
      - Creates initial connection without authentication
      - Sets up event handlers for close and error events
      - Cleans up connection on close or error
   */
  public registerConnection(ws: any, connectionId: string): void {
    console.log(`Registering WebSocket connection: ${connectionId}`);

    // Set up basic connection without authentication initially
    const connection: AuthenticatedConnection = {
      ws,
      userId: "",
    };

    this.connections.set(connectionId, connection);

    // Clean up on close - using try-catch to handle typing issues
    try {
      ws.on("close", () => {
        console.log(`WebSocket connection closed: ${connectionId}`);
        this.connections.delete(connectionId);
      });

      ws.on("error", (error: any) => {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        this.connections.delete(connectionId);
      });
    } catch (error) {
      // Fallback for different WebSocket implementations
      console.warn("Could not set up WebSocket event handlers:", error);
    }
  }

  /**
   * Authenticate a WebSocket connection
      - Verifies JWT token and retrieves user information
      - Looks up  user in db to validate existence
      - Updates connection with authenticated user ID
      - Returns true if authentication is successful, false otherwise
   */
  public async authenticateConnection(
    connectionId: string,
    token: string
  ): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    try {
      const decoded = jwt.verify(token, keys.secretOrKey) as any;
      const user = await User.findById(decoded.id);

      if (!user) {
        return false;
      }

      // Update connection with user info
      connection.userId = user._id.toString();
      this.connections.set(connectionId, connection);

      console.log(
        `WebSocket connection authenticated: ${connectionId} for user: ${user._id}`
      );
      return true;
    } catch (error) {
      console.error("WebSocket authentication failed:", error);
      return false;
    }
  }

  /**
   * Subscribe a connection to CSV processing updates for a specific participant and file type
      - Updates connection with participant and file type IDs
      - Only allows authenticated connections to subscribe
      - Useful for real-time updates on CSV processing status for specific participants and file types
   */
  public subscribeToFileTypeProcessing(
    connectionId: string,
    participantId: string,
    fileTypeId: string
  ): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.userId) {
      connection.participantId = participantId;
      connection.fileTypeId = fileTypeId;
      this.connections.set(connectionId, connection);
      console.log(
        `Connection ${connectionId} subscribed to processing updates for participant: ${participantId}, fileType: ${fileTypeId}`
      );
    }
  }

  /**
   * Unsubscribe a connection from CSV processing updates
      - Removes participant and file type IDs from connection
      - Allows connection to stop receiving updates for specific participant and file type
      - Useful for cleaning up subscriptions when no longer needed
      - Helps prevent memory leaks by removing unused subscriptions
   */
  public unsubscribeFromFileTypeProcessing(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      delete connection.participantId;
      delete connection.fileTypeId;
      this.connections.set(connectionId, connection);
      console.log(
        `Connection ${connectionId} unsubscribed from processing updates`
      );
    }
  }

  /**
   * Broadcast CSV processing update to relevant connections
      - Sends update to all connections subscribed to the participant and file type
      - Filters connections to find those subscribed to specific participant and file type
      - Checks WebSocket state (1=OPEN) before sending
      - Handles errors gracefully to avoid crashing the server
   */
  public broadcastCsvProcessingUpdate(update: CsvProcessingUpdate): void {
    console.log(`Broadcasting CSV processing update:`, update);

    // Find connections subscribed to this participant and file type
    const relevantConnections = Array.from(this.connections.values()).filter(
      (connection) =>
        connection.userId &&
        connection.participantId === update.participantId &&
        connection.fileTypeId === update.fileTypeId
    );

    console.log(
      `Found ${relevantConnections.length} relevant connections for update`
    );

    relevantConnections.forEach((connection) => {
      if (connection.ws.readyState === 1) {
        // 1 = OPEN state
        try {
          connection.ws.send(JSON.stringify(update));
        } catch (error) {
          console.error("Error sending WebSocket message:", error);
        }
      }
    });
  }

  /* 
    The following methods handle CSV Processing Lifecycle notifications
      - notifyProcessingStarted: Notifies when CSV processing starts
      - notifyProcessingProgress: Updates progress in database in real-time
      - notifyProcessingCompleted: Marks process as completed in database. Sets progress to 100%
      - notifyProcessingError: Marks process as errored in database and sends error message. Broadcasts to all subscribers
  
  */

  /**
   * Send CSV processing started notification
   */
  public async notifyProcessingStarted(
    participantId: string,
    fileTypeId: string,
    versionId?: string
  ): Promise<void> {
    // Create or update processing status in database
    await ProcessingStatus.findOneAndUpdate(
      { participantId, fileTypeId, versionId },
      {
        participantId,
        fileTypeId,
        versionId,
        status: "processing",
        progress: { processed: 0, total: 0, percentage: 0 },
        startedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    this.broadcastCsvProcessingUpdate({
      type: "csv_processing_update",
      participantId,
      fileTypeId,
      status: "started",
    });
  }

  /**
   * Send CSV processing progress notification
   */
  public async notifyProcessingProgress(
    participantId: string,
    fileTypeId: string,
    processed: number,
    total: number,
    batchNumber?: number,
    totalBatches?: number,
    versionId?: string
  ): Promise<void> {
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    // Update processing status in database
    await ProcessingStatus.findOneAndUpdate(
      { participantId, fileTypeId, versionId },
      {
        status: "processing",
        progress: { processed, total, percentage },
      },
      { new: true }
    );

    this.broadcastCsvProcessingUpdate({
      type: "csv_processing_update",
      participantId,
      fileTypeId,
      status: "progress",
      progress: {
        processed,
        total,
        percentage,
      },
      batchInfo:
        batchNumber && totalBatches
          ? {
              batchNumber,
              totalBatches,
            }
          : undefined,
    });
  }

  /**
   * Send CSV processing completed notification
   */
  public async notifyProcessingCompleted(
    participantId: string,
    fileTypeId: string,
    totalProcessed: number,
    versionId?: string
  ): Promise<void> {
    // Update processing status in database
    await ProcessingStatus.findOneAndUpdate(
      { participantId, fileTypeId, versionId },
      {
        status: "completed",
        progress: {
          processed: totalProcessed,
          total: totalProcessed,
          percentage: 100,
        },
        completedAt: new Date(),
      },
      { new: true }
    );

    this.broadcastCsvProcessingUpdate({
      type: "csv_processing_update",
      participantId,
      fileTypeId,
      status: "completed",
      progress: {
        processed: totalProcessed,
        total: totalProcessed,
        percentage: 100,
      },
    });
  }

  /**
   * Send CSV processing error notification
   */
  public async notifyProcessingError(
    participantId: string,
    fileTypeId: string,
    error: string,
    versionId?: string
  ): Promise<void> {
    // Update processing status in database
    await ProcessingStatus.findOneAndUpdate(
      { participantId, fileTypeId, versionId },
      {
        status: "error",
        error,
        completedAt: new Date(),
      },
      { new: true }
    );

    this.broadcastCsvProcessingUpdate({
      type: "csv_processing_update",
      participantId,
      fileTypeId,
      status: "error",
      error,
    });
  }

  /**
   * Get count of active connections
   */
  public getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get count of authenticated connections
   */
  public getAuthenticatedConnectionCount(): number {
    return Array.from(this.connections.values()).filter((conn) => conn.userId)
      .length;
  }
}

export default WebSocketService.getInstance();
