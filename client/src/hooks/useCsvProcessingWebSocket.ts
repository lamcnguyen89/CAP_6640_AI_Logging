import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';


/*

WebSocket hook for CSV processing updates. This hook provides a complete websocket client implementation that:
  - Connects to the server's Websocket endpoint (/api/ws)
  - Authenticates using JWT token from Redux store
  - Subscribes to CSV processing updates for specific cparticipant/filetype combinations
  - Manages connection state and automatic reconnection
  - Provides real-time processing status updates to react components

*/


/* 
Example of How to use this hook in components:

  const { isConnected, processingStatus } = useCsvProcessingWebSocket(participantId, fileTypeId);

  // Display processing status in UI
    if (processingStatus.isProcessing) {
      // Show progress bar with processingStatus.progress
    } else if (processingStatus.error) {
      // Show error message
    }

*/

// Matches the serverside interface for processing updates
// This interface is found in server/src/services/websocketService.ts on the server
interface CsvProcessingUpdate {
  type: 'csv_processing_update';
  participantId: string;
  fileTypeId: string;
  status: 'started' | 'progress' | 'completed' | 'error';
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

// Internal state representation for react component
interface ProcessingStatus {
  isProcessing: boolean;
  progress: {
    processed: number;
    total: number;
    percentage: number;
  } | null;
  error: string | null;
  batchInfo: {
    batchNumber: number;
    totalBatches: number;
  } | null;
}

export const useCsvProcessingWebSocket = (participantId: string, fileTypeId: string) => {
  const auth = useSelector((state: any) => state.auth);
  const [ws, setWs] = useState<WebSocket | null>(null); // Current WebSocket instance
  const [isConnected, setIsConnected] = useState(false); // Connection status
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: null,
    error: null,
    batchInfo: null
  });// Current processing status
  
  const reconnectTimeoutRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Establish Websocket connection and handle events
  const connect = () => {
    // Prevents duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Auto-detects protocol (ws/wss) based on current page
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;
      setWs(websocket);

      websocket.onopen = () => {
        console.log('WebSocket connected for CSV processing updates');
        setIsConnected(true);
        
        // Authenticate
          // Connection opens
          // Send JWT token for authentication
          // Receive authentication response
          // Subscribe to updates for this participant/file type
        websocket.send(JSON.stringify({
          type: 'authenticate',
          payload: { token: auth.token }
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'authentication') {
            if (message.payload) {
              console.log('WebSocket authenticated successfully');
              // Subscribe to CSV processing updates for this participant and file type
              websocket.send(JSON.stringify({
                type: 'subscribe_csv_processing',
                payload: { participantId, fileTypeId }
              }));
            } else {
              console.error('WebSocket authentication failed');
              websocket.close();
            }
          } else if (message.type === 'csv_processing_subscription') {
            console.log('CSV processing subscription response:', message.payload);
          } else if (message.type === 'csv_processing_update') {
            const update: CsvProcessingUpdate = message;
            handleProcessingUpdate(update); // Updates processing status
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setWs(null);
        wsRef.current = null;
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 5000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };


  /* 
  Handles status transitions based on incoming updates.
  
  */

  const handleProcessingUpdate = (update: CsvProcessingUpdate) => {
    console.log('Received CSV processing update:', update);
    
    // Filter: Only process updates for the current participant and file type IDs
    if (update.participantId !== participantId || update.fileTypeId !== fileTypeId) {
      return; // Ignore updates for other participants/file types
    }

    switch (update.status) {
      // Set Processing flag and reset progress
      // Sets isProcessing:true, progress reset, error cleared
      case 'started':
        setProcessingStatus({
          isProcessing: true,
          progress: { processed: 0, total: 0, percentage: 0 },
          error: null,
          batchInfo: null
        });
        break;
        
      // Update Progress and batch Info
      // Updates progress/ batch while maintaining processing state
      case 'progress':
        setProcessingStatus(prev => ({
          ...prev,
          isProcessing: true,
          progress: update.progress || prev.progress,
          batchInfo: update.batchInfo || prev.batchInfo,
          error: null
        }));
        break;
      
      // Clear Processing flag and set final progress
      // Sets isProcessing:false, preserves final progress
      case 'completed':
        setProcessingStatus({
          isProcessing: false,
          progress: update.progress || null,
          error: null,
          batchInfo: update.batchInfo || null
        });
        break;
      
      // Clear Processing flag and set error
      // isProcessing:false, progress null, error set
      case 'error':
        setProcessingStatus({
          isProcessing: false,
          progress: null,
          error: update.error || 'Unknown error occurred',
          batchInfo: null
        });
        break;
    }
  };


// Initial Connection Effect
  useEffect(() => {
    if (auth.token && participantId && fileTypeId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [auth.token, participantId, fileTypeId]);

  // Update subscription when participantId or fileTypeId changes
  useEffect(() => {
    if (ws && isConnected && participantId && fileTypeId) {
      ws.send(JSON.stringify({
        type: 'subscribe_csv_processing',
        payload: { participantId, fileTypeId }
      }));
    }
  }, [ws, isConnected, participantId, fileTypeId]);

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Return the current connection state and processing status
  // Allows components to access connection status and processing state
  return {
    isConnected,
    processingStatus,
    disconnect
  };
};
