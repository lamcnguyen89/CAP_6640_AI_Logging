# Real-Time CSV Processing Updates

This document describes the real-time CSV processing feature that provides live updates when CSV files are being processed for log data.

## Overview

When a user switches between CSV file versions for a particular filetype, the system needs to:

1. Delete all existing logs for that participant and file type
2. Process the new CSV file and insert logs into the database
3. Provide real-time feedback to the user about the processing progress

## Files Modified/Created

### Backend Files

#### **New Files Created:**

1. **`/server/src/services/websocketService.ts`** - ✨ **NEW**

   - Centralized WebSocket connection management service
   - Handles authentication, subscription management, and real-time broadcasting
   - Manages connection lifecycle and cleanup
   - Integrates with MongoDB for status persistence

2. **`/server/src/models/ProcessingStatus.ts`** - ✨ **NEW**
   - MongoDB model for tracking CSV processing status
   - Stores progress, errors, timing, and completion information
   - Optimized with compound indexes for efficient queries

#### **Modified Files:**

3. **`/server/src/server.ts`** - 🔄 **MODIFIED**

   - Enhanced WebSocket handler to support CSV processing subscriptions
   - Added new message types: `subscribe_csv_processing`, `unsubscribe_csv_processing`
   - Integrated with the WebSocket service for connection management
   - Maintains backward compatibility with existing WebSocket functionality

4. **`/server/src/utils/csvHelper.ts`** - 🔄 **MODIFIED**

   - Added real-time progress updates during CSV processing
   - Emits start, progress, completion, and error notifications
   - Enhanced batch processing with progress tracking
   - Integrated WebSocket service for live updates

5. **`/server/src/routes/api/participants.ts`** - 🔄 **MODIFIED**
   - Added ProcessingStatus import and integration
   - Enhanced logs API to return processing status information
   - Added support for version-specific queries (`versionId` parameter)
   - Improved error handling with processing status context

### Frontend Files

#### **New Files Created:**

6. **`/client/src/hooks/useCsvProcessingWebSocket.ts`** - ✨ **NEW**

   - React hook for WebSocket connection management
   - Handles authentication and subscription to CSV processing updates
   - Auto-reconnection functionality with exponential backoff
   - Real-time processing status state management

7. **`/client/src/components/CsvProcessingStatus.tsx`** - ✨ **NEW**
   - React component for displaying processing progress
   - Visual progress bars with percentage and row counts
   - Batch processing information display
   - Error and success state notifications

#### **Modified Files:**

8. **`/client/src/components/LogView/FileTypePreview.tsx`** - 🔄 **MODIFIED**
   - Integrated WebSocket hook for real-time updates
   - Added CSV processing status component
   - Enhanced `getNoLogsText()` to show processing messages
   - Auto-refresh functionality when processing completes
   - Improved user experience with real-time feedback

### Documentation Files

#### **New Files Created:**

9. **`/REAL_TIME_CSV_PROCESSING.md`** - ✨ **NEW**
   - Comprehensive documentation of the real-time CSV processing feature
   - Architecture overview and component descriptions
   - Usage flow and WebSocket message specifications
   - Performance considerations and future enhancements

## Architecture

### Backend Components

1. **WebSocket Service** (`/server/src/services/websocketService.ts`)

   - Manages WebSocket connections
   - Handles authentication and subscription management
   - Broadcasts CSV processing updates to subscribed clients
   - Tracks processing status in MongoDB

2. **Processing Status Model** (`/server/src/models/ProcessingStatus.ts`)

   - Stores processing state in the database
   - Tracks progress, errors, and completion status
   - Indexed for efficient queries by participant and file type

3. **Enhanced CSV Helper** (`/server/src/utils/csvHelper.ts`)

   - Modified to emit real-time progress updates
   - Provides batch-level progress tracking
   - Sends start, progress, completion, and error notifications

4. **Updated Server WebSocket Handler** (`/server/src/server.ts`)

   - Supports new message types for CSV processing subscriptions
   - Integrates with the WebSocket service

5. **Enhanced Logs API** (`/server/src/routes/api/participants.ts`)
   - Returns processing status information along with logs
   - Supports version-specific queries

### Frontend Components

1. **WebSocket Hook** (`/client/src/hooks/useCsvProcessingWebSocket.ts`)

   - React hook for managing WebSocket connections
   - Handles authentication and subscription management
   - Provides real-time processing status updates
   - Auto-reconnection functionality

2. **Processing Status Component** (`/client/src/components/CsvProcessingStatus.tsx`)

   - Displays processing progress with progress bars
   - Shows batch information and error states
   - Success and error notifications

3. **Updated FileTypePreview** (`/client/src/components/LogView/FileTypePreview.tsx`)
   - Integrates WebSocket hook for real-time updates
   - Auto-refreshes logs when processing completes
   - Shows processing status during CSV operations

## Usage Flow

### When User Switches File Versions:

1. **Frontend**: User selects a different file version
2. **Backend**:

   - Sets the new version as active
   - Deletes existing logs for the participant/filetype
   - Starts CSV processing
   - Creates processing status record
   - Sends "started" notification via WebSocket

3. **Real-time Updates**:

   - CSV parser processes file in batches (1000 rows per batch)
   - After each batch is processed, sends progress update
   - Updates include: processed count, total count, percentage, batch info

4. **Completion**:

   - When all batches are processed, sends "completed" notification
   - Updates processing status to "completed"
   - Frontend auto-refreshes the logs table

5. **Error Handling**:
   - If any error occurs, sends "error" notification
   - Processing status updated with error details
   - User sees error message in the UI

## WebSocket Message Types

### Client → Server Messages

```json
{
  "type": "authenticate",
  "payload": { "token": "jwt-token" }
}

{
  "type": "subscribe_csv_processing",
  "payload": {
    "participantId": "participant-id",
    "fileTypeId": "filetype-id"
  }
}

{
  "type": "unsubscribe_csv_processing",
  "payload": {}
}
```

### Server → Client Messages

```json
{
  "type": "authentication",
  "payload": true
}

{
  "type": "csv_processing_update",
  "participantId": "participant-id",
  "fileTypeId": "filetype-id",
  "status": "started|progress|completed|error",
  "progress": {
    "processed": 1500,
    "total": 10000,
    "percentage": 15
  },
  "batchInfo": {
    "batchNumber": 2,
    "totalBatches": 10
  },
  "error": "Error message if status is error"
}
```

## Benefits

1. **Real-time Feedback**: Users see immediate feedback when CSV processing starts
2. **Progress Tracking**: Detailed progress information including batch processing
3. **Error Visibility**: Clear error messages if processing fails
4. **Auto-refresh**: Logs automatically refresh when processing completes
5. **Persistent Status**: Processing status is stored in database for recovery
6. **Scalable**: WebSocket connections only for active users viewing file types

## Implementation Details

### Key Changes Summary

**Backend (5 files modified/created):**

- ✨ **2 new files**: WebSocket service and Processing Status model
- 🔄 **3 modified files**: Server WebSocket handler, CSV helper, and participants API

**Frontend (3 files modified/created):**

- ✨ **2 new files**: WebSocket hook and processing status component
- 🔄 **1 modified file**: FileTypePreview component with real-time integration

**Documentation (1 file created):**

- ✨ **1 new file**: Comprehensive feature documentation

### Development Approach

The implementation follows these principles:

1. **Non-breaking changes**: All modifications maintain backward compatibility
2. **Separation of concerns**: WebSocket logic isolated in dedicated service
3. **Error resilience**: Comprehensive error handling and recovery mechanisms
4. **Performance optimization**: Efficient batch processing and selective updates
5. **User experience**: Multiple levels of feedback for different user scenarios

## Performance Considerations

1. **Batch Processing**: CSV files are processed in 1000-row batches to prevent memory issues
2. **Connection Management**: WebSocket connections are automatically cleaned up
3. **Selective Updates**: Only relevant clients receive processing updates
4. **Database Indexing**: Processing status queries are optimized with compound indexes
5. **Auto-reconnection**: Frontend automatically reconnects if WebSocket connection drops

## Error Recovery

1. **Connection Loss**: Frontend automatically attempts to reconnect
2. **Processing Errors**: Errors are captured and displayed to users
3. **Partial Processing**: If processing fails mid-way, status reflects actual progress
4. **Status Persistence**: Processing state is preserved across server restarts

## Future Enhancements

1. **Cancel Processing**: Add ability to cancel in-progress CSV processing
2. **Multiple File Types**: Support parallel processing of multiple file types
3. **File Validation**: Pre-validate CSV files before processing
4. **Retry Mechanism**: Automatic retry for failed batches
5. **Processing Queue**: Queue multiple processing requests for better resource management
