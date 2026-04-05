import winston from 'winston'
import path from 'path'
import { MongoDB } from 'winston-mongodb'
/**
 * Unified Logger Utility with Winston
 * Provides environment-aware logging with different levels
 * Automatically silences logs during testing
*/

// Source: https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/


// Default Winston Log Levels (from lowest to highest priority)
// This enum is not used directly by Winston (It is built into Winston) but provides a reference for log levels in Winston for developers
export enum WinstonLogLevels {
  error = 0,
  warn = 1,
  info = 2,
  http = 3,
  verbose = 4,
  debug = 5,
  silly = 6
}

/**
 * Logger class that encapsulates Winston for structured logging.
 * It automatically configures log levels and transports based on the environment.
*/
class Logger {
  private winstonLogger: winston.Logger
  private isTestMode: boolean
  private isDevelopment: boolean

  // This constructor builds the Winston Logger object
  constructor() {
    // Determine environment
    this.isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'testing'
    this.isDevelopment = process.env.MODE === 'development' || process.env.NODE_ENV === 'development'

    // Configure Winston logger object. This object will be used for all logging operations
    this.winstonLogger = winston.createLogger({
      level: this.getWinstonLevel(), 
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }), // Include stack trace for errors
        winston.format.printf(({ level, message, timestamp, stack }) => {
          if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
          }
          return `${timestamp} [${level.toUpperCase()}]: ${message}`
        })
      ),
      transports: this.getTransports(),
      silent: this.isTestMode // Silence all logs during testing
    })
  }

  // Get the appropriate logging level based on the environment
  // Refer to the WinstonLogLevel enum for understanding the levels. Log levels are ordered from least to most verbose
  private getWinstonLevel(): string {
    if (this.isTestMode) {
      return 'error' // Least verbose logging in test mode
    } else if (this.isDevelopment) {
      return 'debug' // Most Verbose Logging for development mode
    } else {
      return 'info' // Default Logging level for production or other environments where mode is not specified and detailed logs are not required
    }
  }


// Gets the transports for the logger based on the environment.
// a Transport is defined as the method that log messages are sent to or stored in.
  // For example, a transport can be a a file that log messages are stored in, or can be the consle where messages are displayed, or a mongoDB database or even an offsite cloud service.
  private getTransports(): winston.transport[] {
    const transports: winston.transport[] = []

    // Console transport for all environments (except tests)
    if (!this.isTestMode) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      )
       // Add MongoDB transport for ALL environments (except tests)
    // This ensures logs always go to database regardless of environment
      try {
        const mongoUrl = `mongodb://${process.env.MONGO_LOGS_USER}:${process.env.MONGO_LOGS_PASS}@${process.env.MONGO_LOGS_HOST}:${process.env.MONGO_LOGS_PORT}/${process.env.MONGO_LOGS_DB}?authSource=admin`
        
        transports.push(
          new MongoDB({
            db: mongoUrl,
            collection: 'system_logs',
            options: { useUnifiedTopology: true },
            level: this.isDevelopment ? 'debug' : 'info', // Keep level filtering
            cappedSize: 0, // Set to 0 for no size limit (uncapped collection)
            // Remove expireAfterSeconds to prevent automatic deletion
            tryReconnect: true,
            decolorize: true, // Remove ANSI color codes for cleaner DB storage
            storeHost: true, // Store hostname information
            label: this.isDevelopment ? 'development' : 'production' // Add label to differentiate logs from different environments
            
          })
        )
      } catch (error) {
        console.error('MongoDB logging configuration failed - continuing without MongoDB transport')
      }
    }

    // File transports for NON-DEVELOPMENT environments (backup logging until DB is verified)
    // Keep files as safety net for production/staging until database logging is fully tested
    if (!this.isDevelopment && !this.isTestMode) {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join('logs', 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      )

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: path.join('logs', 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      )
    }
    return transports
  }

  /*
    1.  Message formatting  methods for different log levels
    2. These methods call the winston logger constructor and based on the log level, it will format the message and send it to the apppriate transport (i.e to the console, to a file and/or cloud service)
  */

  
  // Log method for an error message: Example usage: logger.error('An error occurred', error)
  error(message: string, ...args: any[]): void {
    this.winstonLogger.error(this.formatMessage(message, args))
  }

  // Log method for a warning message: Example usage: logger.warn('This is a warning', warning)
  warn(message: string, ...args: any[]): void {
    this.winstonLogger.warn(this.formatMessage(message, args))
  }

  // Log method for an informational message: Example usage: logger.info('Information message', info)
  info(message: string, ...args: any[]): void {
    this.winstonLogger.info(this.formatMessage(message, args))
  }

  // Log method for an HTTP request message: Example usage: logger.http('HTTP request received', req)
  debug(message: string, ...args: any[]): void {
    this.winstonLogger.debug(this.formatMessage(message, args))
  }

  // Log method for verbose messages: Example usage: logger.verbose('Verbose message', verboseInfo)
  // Special method for system startup messages (always shown except in tests)
  system(message: string, ...args: any[]): void {
    if (!this.isTestMode) {
      this.winstonLogger.info(`[SYSTEM] ${this.formatMessage(message, args)}`)
    }
  }

  // Formats the message with additional arguments
  private formatMessage(message: string, args: any[]): string {
    if (args.length > 0) {
      // Handle objects and arrays properly
      const formattedArgs = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      return `${message} ${formattedArgs}`
    }
    return message
  }
}

// Export singleton instance
export const logger = new Logger()
export default logger
