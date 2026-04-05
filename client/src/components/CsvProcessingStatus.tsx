import React from 'react';
import { ProgressBar, Alert, Spinner } from 'react-bootstrap';

interface ProcessingStatusProps {
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

const CsvProcessingStatus: React.FC<ProcessingStatusProps> = ({
  isProcessing,
  progress,
  error,
  batchInfo
}) => {
  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>CSV Processing Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  if (!isProcessing && !progress) {
    return null;
  }

  return (
    <div className="csv-processing-status" style={{ marginBottom: '1rem' }}>
      {isProcessing && (
        <Alert variant="info">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <Spinner 
              animation="border" 
              size="sm" 
              style={{ marginRight: '0.5rem' }}
            />
            <strong>Processing CSV file...</strong>
          </div>
          
          {progress && progress.total > 0 && (
            <div>
              <ProgressBar 
                now={progress.percentage} 
                label={`${progress.percentage}%`}
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                {progress.processed.toLocaleString()} of {progress.total.toLocaleString()} rows processed
                {batchInfo && (
                  <span style={{ marginLeft: '1rem' }}>
                    Batch {batchInfo.batchNumber} of {batchInfo.totalBatches}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {(!progress || progress.total === 0) && (
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              Parsing CSV file and preparing data...
            </div>
          )}
        </Alert>
      )}
      
      {!isProcessing && progress && (
        <Alert variant="success">
          <Alert.Heading>CSV Processing Complete</Alert.Heading>
          <p>
            Successfully processed {progress.processed.toLocaleString()} rows. 
            The table below will refresh with the new data.
          </p>
        </Alert>
      )}
    </div>
  );
};

export default CsvProcessingStatus;
