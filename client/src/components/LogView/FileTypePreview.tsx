import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { Table, Container, Pagination, Row, Col, Button, Image, Spinner, Dropdown, DropdownButton } from 'react-bootstrap';
import { getFileforFileType, downloadFile, fetchFileVersions,setActiveFileVersion } from "../../helpers/FilesAPIHelper";
import { RetrievedFileInfo, convertDate } from "./FileTypeHelper";
import { useCsvProcessingWebSocket } from "../../hooks/useCsvProcessingWebSocket";
import CsvProcessingStatus from "../CsvProcessingStatus";
import downloadIcon from '../../assets/download_no_box_white.svg';
import get from 'lodash/get'

// Props
interface FileTypePreviewProps {
  previewedFileTypeId: string;
  previewedFileTypeName: string;
  participantId: string;
}

const FileTypePreview: React.FC<FileTypePreviewProps> = ({
  participantId,
  previewedFileTypeId,
  previewedFileTypeName
}) => {
  const auth = useSelector(state => state.auth);

  // General
  const [fileInfo, setFileInfo] = useState(undefined);
  const [fileVersions, setFileVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Logs data
  const [columns, setColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [logs, setLogs] = useState([]);

  // Pagination
  const [totalPages, setTotalPages] = useState<Number>(0);
  const [currentPage, setCurrentPage] = useState<Number>(1);
  const [pageSize, setPageSize] = useState<Number>(50);
  const [visiblePaginations, setVisiblePaginations] = useState([]);
  const [preservedTotalPages, setPreservedTotalPages] = useState<Number>(0); // Preserve pagination during processing
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const [reloadTimeoutId, setReloadTimeoutId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // WebSocket for real-time CSV processing updates
  const { isConnected, processingStatus } = useCsvProcessingWebSocket(
    participantId,
    previewedFileTypeId
  );

  // Auto-refresh logs when processing completes
  useEffect(() => {
    if (!processingStatus.isProcessing && processingStatus.progress && !processingStatus.error) {
      // Processing completed successfully, refresh the logs after a short delay
      setTimeout(() => {
        setCurrentPage(1); // Reset to first page
        // This will trigger the useEffect below to refetch logs
      }, 1000);
    }
  }, [processingStatus.isProcessing, processingStatus.progress, processingStatus.error]);

  // Preserve pagination when processing starts
  useEffect(() => {
    if (processingStatus.isProcessing && totalPages > 0 && preservedTotalPages === 0) {
      console.log('CSV processing started, preserving pagination:', totalPages);
      setPreservedTotalPages(totalPages);
    }
  }, [processingStatus.isProcessing, totalPages, preservedTotalPages]);

  // Auto-reload component after 5 seconds if CSV processing message is shown
  useEffect(() => {
    // Clear any existing timeout
    if (reloadTimeoutId) {
      clearTimeout(reloadTimeoutId);
      setReloadTimeoutId(null);
    }

    // Check if we should show the CSV processing message
    const shouldShowProcessingMessage = fileInfo && 
      fileInfo.fileType && 
      fileInfo.fileType.extension === "csv" && 
      columns.length === 0 && 
      convertDate(fileInfo.ts) !== "Never";

    if (shouldShowProcessingMessage) {
      console.log('CSV processing message detected, setting up auto-reload in 5 seconds');
      const timeoutId = window.setTimeout(() => {
        console.log('Auto-reloading FileTypePreview component after 5 seconds');
        // Trigger a refresh by incrementing the refresh trigger
        setRefreshTrigger(prev => prev + 1);
        setReloadTimeoutId(null);
      }, 5000);
      
      setReloadTimeoutId(timeoutId);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (reloadTimeoutId) {
        clearTimeout(reloadTimeoutId);
      }
    };
  }, [fileInfo?.fileType?.extension, fileInfo?.ts, columns.length]);

  // Get File Data Associated with this FileType
  useEffect(() => {
    if (!participantId || !previewedFileTypeId) {
      // Clear file info when no file type is selected
      setFileInfo(undefined);
      return;
    }

    // Clear file info immediately when switching file types to prevent stale data
    setFileInfo(undefined);

    getFileforFileType(participantId, previewedFileTypeId, auth.token).then((data: RetrievedFileInfo) => {

      // If File Data exists, then set the data to the state, else input blank data
      data ? (setFileInfo(data)) : (
        setFileInfo({
          _id: "",
          ts: "n/a",
          participantUID: "",
          fileType: {
            _id: previewedFileTypeId, // Set the correct file type ID
            name: "",
            experimentId: "",
            extension: "",
            description: ""
          },
          mimetype: "",
          size: 0
        })
      )

      // Fetch file versions after getting file info
      fetchFileVersions(participantId, previewedFileTypeId, auth.token)
        .then((versions) => {
          console.log('File versions for fileType', previewedFileTypeId, ':', versions);
          // Set the file versions to state
          
          versions ? (setFileVersions(versions)) : (
            setFileVersions([
              {
                fileType: {_id: "", name: "", experimentId: "", extension: "", description: "" },
                isActive: false,
                mimetype: "",
                originalFileName: "",
                participantUID: "",
                replacedAt: "null",
                size: 0,
                ts: "null",
                version: 0,
                _id: ""
              }
            ])
          )
        })
        .catch((error) => {
          console.error('Error fetching file versions:', error);
        });
    })
  }, [previewedFileTypeId, participantId, auth.token])

  // Builds the table columns and data based on the given logs
  function buildTableColumnsAndData(logs) {
    // Create a set of the logs
    const allDataKeys = new Set();
    logs.forEach((log) => {
      if (log.data) {
        Object.keys(log.data).forEach((k) => allDataKeys.add(k));
      }
    });

    // Map transform fields to objects
    const updatedLogs = logs.map((log) => {
      if (!log.data) return log;
      const newData = { ...log.data };
      Object.keys(newData).forEach((key) => {
        if (key.toLowerCase().includes('transform') && typeof newData[key] === 'string') {
          try {
            newData[key] = JSON.parse(newData[key]);
          } catch {
            newData[key] = {};
          }
        }
      });
      return { ...log, data: newData };
    });

    // Create base columns for the table
    const baseColumns = [
      {
        Header: 'Timestamp',
        accessor: 'ts',
      },
      {
        Header: 'Event ID',
        accessor: 'eventId',
      },
    ];

    // Create dynamic columns based on the keys in the logs
    const dynamicDataColumns = Array.from(allDataKeys).map((key) => ({
      Header: key,
      accessor: `data.${key}`,
      Cell: ({ value }) => {
        if (!value) return null;
        if (typeof key === 'string' && key.toLowerCase().includes("transform")) {
          const { position = {}, rotation = {}, localScale = {} } = value;
          return (
            <div style={{ textAlign: 'left' }}>
              <div><strong>Position:</strong> {formatVector3(position)}</div>
              <div><strong>Rotation:</strong> {formatQuaternion(rotation)}</div>
              <div><strong>Scale:</strong> {formatVector3(localScale)}</div>
            </div>
          );
        }
        if (typeof value === 'object') {
          return <pre>{JSON.stringify(value, null, 2)}</pre>;
        }
        return String(value);
      }
    }));

    // Finalize columns and data
    const columns = [...baseColumns, ...dynamicDataColumns];
    const data = updatedLogs.map((log) => ({
      ...log,
      ts: new Date(log.ts).toLocaleString(),
    }));

    return { columns, data };
  }

  function formatVector3({ x = 0, y = 0, z = 0 }) {
    return `(${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)})`;
  }

  function formatQuaternion({ x = 0, y = 0, z = 0, w = 1 }) {
    return `(${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}, ${w.toFixed(4)})`;
  }

  // Fetch logs from the server any time the previewed file type changes
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // If there is no file type to preview, display no logs.
        if (previewedFileTypeId === null || previewedFileTypeId === undefined || previewedFileTypeId === "") {
          console.log("No file type selected for preview.");
          setLogs([]);
          setColumns([]);
          setTableData([]);
          setTotalPages(0);
          setPreservedTotalPages(0);
          return;
        }

        // If fileInfo is not available yet, don't fetch logs
        if (!fileInfo) {
          console.log("FileInfo not available yet, skipping log fetch.");
          setLogs([]);
          setColumns([]);
          setTableData([]);
          setTotalPages(0);
          setPreservedTotalPages(0);
          return;
        }

        // Ensure fileInfo corresponds to the current previewed file type
        if (fileInfo.fileType && fileInfo.fileType._id !== previewedFileTypeId) {
          console.log("FileInfo is for a different file type, skipping log fetch.");
          setLogs([]);
          setColumns([]);
          setTableData([]);
          setTotalPages(0);
          setPreservedTotalPages(0);
          return;
        }

        // Only fetch logs if the file is CSV
        if (fileInfo.mimetype !== "text/csv") {
          console.log("File is not CSV (mimetype: " + fileInfo.mimetype + "), skipping log fetch.");
          setLogs([]);
          setColumns([]);
          setTableData([]);
          setTotalPages(0);
          setPreservedTotalPages(0);
          return;
        }

        console.log("File Type Preview - CSV file detected:", fileInfo.mimetype);
        
        // Fetch logs for the selected CSV file type
        const apiUrl = selectedVersionId 
          ? `${import.meta.env.BASE_URL}/api/participants/${participantId}/logs?page=${currentPage}&limit=${pageSize}&fileTypeId=${previewedFileTypeId}&versionId=${selectedVersionId}`
          : `${import.meta.env.BASE_URL}/api/participants/${participantId}/logs?page=${currentPage}&limit=${pageSize}&fileTypeId=${previewedFileTypeId}`;

        const response = await fetch(
          apiUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth.token,
            },
          }
        );

        // Ensure no errors occurred during the fetch
        if (response.status >= 500) {
          console.log("Issue previewing file type.");
          setLogs([]);
          setColumns([]);
          setTableData([]);
          // Don't reset totalPages if we're processing CSV - preserve pagination
          if (!processingStatus.isProcessing && preservedTotalPages === 0) {
            setTotalPages(0);
          } else if (processingStatus.isProcessing && preservedTotalPages === 0 && totalPages > 0) {
            // Preserve the current totalPages during processing
            setPreservedTotalPages(totalPages);
          }
          return;
        }

        const result = await response.json();

        // If response is <500 but not okay, there were no logs found. Display no logs.
        if (!response.ok) {
          console.log("No logs found for the file type: " + previewedFileTypeId);
          setLogs([]);
          setColumns([]);
          setTableData([]);
          // Don't reset totalPages if we're processing CSV - preserve pagination
          if (!processingStatus.isProcessing && preservedTotalPages === 0) {
            setTotalPages(0);
          } else if (processingStatus.isProcessing && preservedTotalPages === 0 && totalPages > 0) {
            // Preserve the current totalPages during processing
            setPreservedTotalPages(totalPages);
          }
          return;
        }

        // Response was okay, display logs.
        console.log("Displaying logs for the previewed file type: " + previewedFileTypeId);
        const { columns, data } = buildTableColumnsAndData(result.logs);
        setLogs(result.logs);
        setColumns(columns);
        setTableData(data);
        const newTotalPages = Math.ceil(result.totalLogs / pageSize);
        setTotalPages(newTotalPages);
        setPreservedTotalPages(newTotalPages); // Update preserved state with actual data
      } catch (err) {
        console.error("Error fetching logs for file type " + previewedFileTypeId + ":", err);
        setLogs([]);
        setColumns([]);
        setTableData([]);
        // Don't reset totalPages if we're processing CSV - preserve pagination
        if (!processingStatus.isProcessing && preservedTotalPages === 0) {
          setTotalPages(0);
        } else if (processingStatus.isProcessing && preservedTotalPages === 0 && totalPages > 0) {
          // Preserve the current totalPages during processing
          setPreservedTotalPages(totalPages);
        }
        return;
      }
    };
    fetchLogs();
  }, [currentPage, participantId, previewedFileTypeId, fileInfo, selectedVersionId, processingStatus.isProcessing, refreshTrigger]);

  // When previewed file type changes, reset the current page and selected version
  useEffect(() => {
    setCurrentPage(1);
    setSelectedVersionId(null);
    // Only reset preserved pagination when switching file types, not versions
    setPreservedTotalPages(0);
    // Clear any pending reload timeout when switching file types
    if (reloadTimeoutId) {
      clearTimeout(reloadTimeoutId);
      setReloadTimeoutId(null);
    }
    // Reset refresh trigger
    setRefreshTrigger(0);
  }, [previewedFileTypeId, reloadTimeoutId])

  // Logs pagination
  const goToNextPage = () => {
    const maxPages = totalPages || preservedTotalPages;
    if (currentPage < maxPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Any time the page changes, recalculate the visible paginations
  useEffect(() => {
    const effectiveTotalPages = totalPages || preservedTotalPages;
    
    // Set up start page; if this start page is less than 1, save leftovers to add to the end page.
    let newStartPage = currentPage - 4;
    let startLeftovers = 0;
    if (newStartPage < 1) {
      startLeftovers = 1 - (newStartPage);
      newStartPage = 1;
    }
    if (startLeftovers < 0) {
      startLeftovers = 0;
    }

    // Set up end page; if this end page is greater than the total pages, save leftovers to add to the start page.
    let newEndPage = currentPage + 5 + startLeftovers;
    let endLeftovers = 0;
    if (newEndPage > effectiveTotalPages) {
      endLeftovers = 0 - (effectiveTotalPages - newEndPage);
      newEndPage = effectiveTotalPages;
    }
    if (endLeftovers < 0) {
      endLeftovers = 0;
    }

    // Add leftovers to start page, if possible;
    newStartPage = newStartPage - endLeftovers;
    if (newStartPage < 1) {
      newStartPage = 1;
    }

    // Finally, set the visible paginations
    setVisiblePaginations(Array.from(
      { length: newEndPage - newStartPage + 1 },
      (_, i) => newStartPage + i
    ))

    // Scroll to the top of the table when the page changes
    if (tableScrollRef && tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, columns, tableData, totalPages, preservedTotalPages]);

  const getNoLogsText = () => {
    if (!fileInfo || !fileInfo.fileType) {
      return "Loading..."
    } else if (convertDate(fileInfo.ts) === "Never") {
      return "No file has been uploaded yet for this file type."
    } else if (fileInfo.fileType.extension === "csv") {
    
      return "Please wait while the CSV file is being processed. This may take a few minutes depending on the file size and server load."
    } else {
      return "This file type cannot be previewed. Download the file to view its contents."
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    
    const fileDownloaded = await downloadFile(participantId, previewedFileTypeId, auth.token);
    if (!fileDownloaded) {
      alert("No file found to be downloaded.");
    }

    setIsDownloading(false);
  };

  const handleVersionSelect = async (versionId) => {
    // Preserve current pagination state before switching versions
    if (totalPages > 0) {
      setPreservedTotalPages(totalPages);
    }
    
    setSelectedVersionId(versionId);
    // Reset pagination when switching versions
    setCurrentPage(1);
    
    // Set the active version on the server
    try {
      if (versionId) {
        await setActiveFileVersion(participantId, previewedFileTypeId, versionId, auth.token);
        console.log('Successfully set active version:', versionId);
      }
    } catch (error) {
      console.error('Error setting active version:', error);
      // You might want to show a user-friendly error message here
      alert('Failed to set active version. Please try again.');
    }
  };

  const getSelectedVersionInfo = () => {
    if (!selectedVersionId || !fileVersions.length) {
      return fileInfo; // Default to current file info
    }
    return fileVersions.find(version => version._id === selectedVersionId) || fileInfo;
  };

  const getActiveVersion = () => {
    if (!fileVersions.length) return null;
    const activeVersion = fileVersions.find(version => version.isActive);
    return activeVersion || fileVersions[0]; // Fallback to first version if no active found
  };

  const getCurrentlyViewedVersion = () => {
    if (selectedVersionId) {
      return fileVersions.find(v => v._id === selectedVersionId);
    }
    return getActiveVersion();
  };




  return (
    <Container className='file-type-preview' style={{ height: '532px', marginBottom: '1rem' }}>
      {previewedFileTypeId === null || previewedFileTypeId === undefined || previewedFileTypeId === "" ? (
        <h3 style={{ color: '#816F7D', marginLeft: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>Select a file type to preview and download associated data.</h3>
      ) : (
        <>
          {fileInfo ? (
            <>
              <div style={{ height: '10px' }}></div>
              <Row>
                <Col xs={9}>
                  <h3 className="mb-0">{previewedFileTypeName}</h3>
                  <p style={{ color: "#6c757d" }} className="mb-0">
                    Last updated: {convertDate(getSelectedVersionInfo()?.ts)} | {Math.round(getSelectedVersionInfo()?.size / 1000)} KB | {getSelectedVersionInfo()?.fileType?.extension || fileInfo?.fileType?.extension}
                    <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>
                      {(() => {
                        const currentVersion = getCurrentlyViewedVersion();
                        if (currentVersion) {
                          const isActive = currentVersion.isActive || (!selectedVersionId && currentVersion === getActiveVersion());
                          return `(Viewing Version ${currentVersion.version})`;
                        }
                        return '(Version info unavailable)';
                      })()}
                    </span>
                  </p>
                  {/* Added authorship information */}
                  <p style={{ color: "#6c757d", fontSize: "0.9rem" }} className="mb-1">
                    {(() => {
                      const versionInfo = getSelectedVersionInfo();
                      if (versionInfo?.uploadedBy) {
                        const uploaderName = `${versionInfo.uploadedBy.firstName} ${versionInfo.uploadedBy.lastName}`;
                        const uploadDate = convertDate(versionInfo.uploadedAt);
                        return `Uploaded by: ${uploaderName} on ${uploadDate}`;
                      }
                      return '';
                    })()}
                  </p>
                </Col>
                <Col xs={3} style={{ textAlign: 'right' }}>
                  <Button variant="secondary" style={{ width: "100%" }} disabled={fileInfo.fileType._id === "" || isDownloading} onClick={handleDownload}>
                    {isDownloading ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        Download File
                        <Image src={downloadIcon} className="ms-2" />
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
              <Row>
                <DropdownButton className="fileversion-dropdown" variant="secondary" id="dropdown-basic-button" title="File Versions" style={{ marginTop: '1rem', marginBottom: '1rem', color: '#FFFFFF'}}>
                  {fileVersions && fileVersions.length > 0 ? (
                    <>
                      <Dropdown.Item 
                        key="current" 
                        onClick={() => handleVersionSelect(null)}
                        active={selectedVersionId === null}
                      >
                        Current Version {fileInfo?.version} - {convertDate(fileInfo?.ts)}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      {fileVersions
                        .filter(version => version._id && version._id !== "") // Filter out empty versions
                        .map((version, index) => (
                          <Dropdown.Item 
                            key={version._id || index} 
                            onClick={() => handleVersionSelect(version._id)}
                            active={selectedVersionId === version._id}
                          >
                            Version {version.version} - {convertDate(version.ts)}
                          </Dropdown.Item>
                        ))
                      }
                    </>
                  ) : (
                    <Dropdown.Item disabled>No versions available</Dropdown.Item>
                  )}
                </DropdownButton>

              </Row>

              {/* CSV Processing Status */}
              <CsvProcessingStatus 
                isProcessing={processingStatus.isProcessing}
                progress={processingStatus.progress}
                error={processingStatus.error}
                batchInfo={processingStatus.batchInfo}
              />

              {columns.length > 0 ? (
                <>
                  <Row ref={tableScrollRef} style={{ maxHeight: "430px", overflowY: "auto" }}>
                    <Container className="log-table-border mx-2 g-0">
                      <Table className="log-table" responsive bordered hover>
                        <thead>
                          <tr>
                            {columns.map(col => (
                              <th key={col.accessor}>{col.Header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {columns.map(col => {
                                const value = get(row, col.accessor)
                                return (
                                  <td key={col.accessor}>
                                    {
                                      col.Cell
                                        ? col.Cell({ value })
                                        : (value != null ? String(value) : null)
                                    }
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Container>
                  </Row>
                  {(totalPages > 1 || (processingStatus.isProcessing && preservedTotalPages > 1)) && (
                    <Row>
                      <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={goToPrevPage} disabled={currentPage === 1} />
                        {visiblePaginations.map(page => (
                          <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                            {page}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={goToNextPage} disabled={currentPage >= (totalPages || preservedTotalPages)} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages || preservedTotalPages)} disabled={currentPage >= (totalPages || preservedTotalPages)} />
                      </Pagination>
                    </Row>
                  )}
                </>
              ) : (
                <h3 style={{ color: '#816F7D', marginLeft: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>{getNoLogsText()}</h3>
              )}
            </>
          ) : (
            <h3 style={{ color: '#816F7D', marginLeft: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>{getNoLogsText()}</h3>
          )}
        </>
      )}
    </Container>
  );
}

export default FileTypePreview;