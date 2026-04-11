/**
 * Interface for system logs stored by Winston in MongoDB
 * Matches the structure written by winston-mongodb transport
 */
export interface ISystemLog {
  _id?: string;
  timestamp: Date;
  level: string;
  message: string;
  correlationId?: string;
  meta?: Record<string, any>;
  hostname?: string;
  label?: string;

  // Flag to track if log has been embedded
  embedded?: boolean;
  embeddedAt?: Date;
}

/**
 * Interface for log batches/chunks
 */
export interface ILogChunk {
  id: string;
  correlationId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  logCount: number;
  logIds: string[];
  logs: ISystemLog[];
  maxLogLevel: string;
}
