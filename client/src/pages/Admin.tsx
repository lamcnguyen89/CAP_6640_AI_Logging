import React, { useCallback, useEffect, useState } from "react"
import styled from 'styled-components'
import { useTable, useSortBy, useFilters } from 'react-table'

import NavMenu from '../components/NavMenu'
import { persistedState } from "../main"
//
import { HashRouter } from 'react-router-dom'
import { Container, Button, Row, Col, Table, Modal, ModalHeader, Spinner, ModalFooter, ModalBody, Dropdown, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap'
import { ChangeEvent } from 'react'

import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/App.css'
import { trackPromise } from 'react-promise-tracker'
import { usePromiseTracker } from "react-promise-tracker"
import Loader from 'react-loader-spinner'
import { useHistory, useParams, useLocation } from "react-router-dom"
import useWebSocket, { ReadyState } from 'react-use-websocket'

// import 'bootstrap/dist/css/bootstrap.min.css'
import { deleteParticipant, getAllParticipants, updateParticipant, downloadParticipantFormatted, getParticipantInfo } from "../helpers/ParticipantsApiHelper"
import { downloadExperimentDataFormatted, downloadSiteDataZip, fetchCombinedFileSize } from "../helpers/FilesAPIHelper"
import { getExperiment } from "../helpers/ExperimentApiHelper"
import LogView from "./LogView"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import { ThreeDots } from "react-loader-spinner"
const clipboard = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
</svg>
import CustomAlert from '../components/CustomAlert';
import { IExperiment } from "../interfaces/Experiment"
import ExperimentAccessError from "../components/ExperimentAccessError"

const PollingInterval = 10000 // Poll every 10 seconds (adjust as needed)
export enum ParticipantState {
  CREATED = "Created",
  IN_EXPERIMENT = "In Experiment",
  PROCESSING = "Processing",
  COMPLETE = "Complete",
  INCOMPLETE = "Incomplete",
  WITHDRAWN = "Withdrawn",
}

const LoadingIndicator = () => (
  <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
    <ThreeDots color="#2BAD60" height="100" width="100" />
  </div>
)


export interface IParticipant {
  state: string
  email: string
  note: string
  consented: boolean
  info: string
  uid: string
  comments: any[]
}

function ParticipantTable({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
    initialState: { sortBy: [{ id: 'pID', desc: false }] }
  }, useFilters, useSortBy)

  return (
    <Table {...getTableProps()} className="results-table">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>
                {column.render('Header')}
                <div>{column.canFilter ? column.render('Filter') : null}</div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
};
// Use throughout your app instead of plain `useDispatch` and `useSelector`
type AppDispatch = typeof persistedState.store.dispatch
type RootState = ReturnType<typeof persistedState.store.getState>

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
interface AdminProps {
  match: any
}
let prevValues
const Admin: React.FC<AdminProps> = ({ match }) => {
  const location = useLocation();

  const auth = useSelector((state: any) => state.auth)

  const history = useHistory()

  let { experimentId } = useParams<{ experimentId: string }>()
  const searchParams = new URLSearchParams(location.search);

  const [message, setMessage] = useState("Note: Your account doesn't yet have an institutional agreement and/or IRB on file, and so is not appproved for human subjects research.")
  const [loading, setLoading] = useState(true)
  const [alertColor, setAlertColor] = useState('#ff5959')
  let [showLogs, setShowLogs] = useState(null)
  let [participants, setParticipants] = useState<IParticipant[]>(prevValues ?? [])
  const [experiment, setExperiment] = useState<IExperiment | undefined>();
  const [show, setShow] = useState(false)
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = participants ? Math.ceil(participants.length / pageSize) : 1;

  const currentData = participants
    ? participants.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      updatePageInUrl(newPage);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      updatePageInUrl(newPage);
    }
  };

  const updatePageInUrl = (page: number) => {
    const params = new URLSearchParams(location.search);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    history.push(`${location.pathname}?${params.toString()}`);
  };

  // Sites
  const [selectedSite, setSelectedSite] = useState()
  const [selectedSiteName, setSelectedSiteName] = useState("All Sites")

  // Initialize site selection and pagination from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    
    // Initialize page from URL
    const pageParam = urlParams.get('page');
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
      }
    }

    // Initialize site selection from URL
    if (experiment && experiment.isMultiSite) {
      const siteParam = urlParams.get('siteFilter');

      if (siteParam && siteParam !== 'All Sites') {
        const site = experiment.sites.find((site) => site.name === siteParam);
        if (site) {
          setSelectedSiteName(siteParam);
          setSelectedSite(site);
        } else {
          setSelectedSiteName("All Sites");
          setSelectedSite(undefined);
        }
      }
    }
  }, [experiment, location.search, totalPages]);

  const handleSiteSelect = (eventKey) => {
    setSelectedSiteName(eventKey)

    // Update URL parameters
    const params = new URLSearchParams(location.search);
    if (eventKey === "All Sites") {
      params.delete('siteFilter');
    } else {
      params.set('siteFilter', eventKey);
    }
    // Reset to page 1 when changing site and remove page parameter
    params.delete('page');
    history.push(`${location.pathname}?${params.toString()}`);

    // Get site object from experiment
    if (experiment !== undefined) {
      let site = experiment.sites.find((site) => site.name === eventKey)
      setSelectedSite(site)
      setCurrentPage(1) // Reset to first page when changing site
    }
  };

  const handleShowLogs = (uid) => {
    setShowLogs(uid)
    const params = new URLSearchParams(location.search);
    params.set('participantId', uid);
    history.push(`${location.pathname}?${params.toString()}`);
  }

  const handleReload = () => window.location.reload();
  const handleCloseAlert = () => setShowError(false);

  const CustomButton = ({ onClick, disabled, children }) => (
    <button
      style={{ border: 'none', background: 'none', padding: '0' }} // Custom styles
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );

  // Get Experiment Data
  useEffect(() => {
    if (experiment == undefined) {

      const expActingFunction = (exp: any) => {
        setExperiment({
          id: exp._id,
          name: exp.name,
          description: exp.description,
          createdBy: exp.createdBy,
          collaborators: exp.collaborators,
          sites: exp.sites,
          isMultiSite: exp.isMultiSite,
        });
      };
      trackPromise(
        getExperiment(experimentId, auth.token, expActingFunction)
          .catch((err) => {
            if (err.status >= 500) {
              setError("Internal Server Error Occured. Please refresh the page.")
              setShowError(true)
            }
            console.error(err)
          }
          )
        , 'participant')
    }
  }, [experiment]);

  useEffect(() => {
    if (experiment !== undefined) {
      const existingParticipantId = new URLSearchParams(location.search).get("participantId");
      if (existingParticipantId) {
        setShowLogs(existingParticipantId);
      } else {
        setShowLogs(null); // Clear participant view if no ID is present
      }
    }
  }, [experiment, location]);



  // Polling function to refresh the participant list
  const fetchParticipants = useCallback(() => {
    getAllParticipants(auth.token, experimentId)
      .then((res) => {
        if (res.status >= 500) {
          setError("Internal Server Error Occured. Please refresh the page.")
          setShowError(true)
          return
        }

        // Sort participants by selected site
        const urlParams = new URLSearchParams(location.search);
        const currentSite = urlParams.get('siteFilter');

        if (experiment.isMultiSite && currentSite && currentSite !== "All Sites") {
          const site = experiment.sites.find((site) => site.name === currentSite);
          if (site) {
            res.participants = res.participants.filter((participant) => participant.site._id === site._id);
          }
        }

        // If the number of participants is different, update the state
        if (prevValues === undefined || res.length !== prevValues.length) {
          setParticipants(res.participants)
          prevValues = res.participants
          return
        } else {
          console.log("NO changes")
        }

        // Check if any participant's state has changed
        const hasChanged = participants.some((participant, index) => {
          return participant.state !== res[index].state
        })

        // If there are changes, update the participants state
        if (hasChanged) {
          setParticipants(res)
          setLoading(false) // Data has changed, update the loading state
        } else {
          setLoading(false) // No change, so no need to update participants, but stop loading
        }
        prevValues = res;
      })
      .catch((err) => {
        console.error(err)
        setLoading(false) // Handle errors by stopping loading
        history.replace("/vera-portal/Dashboard")
      }
      )
  }, [experiment, location.search])

  useEffect(() => {
    if (auth.isAuthenticated && experiment != undefined) {
      // Initial fetch of participants
      fetchParticipants()

      // Set up polling interval
      //const intervalId = setInterval(fetchParticipants, PollingInterval)

      // Clean up interval on component unmount
      //return () => clearInterval(intervalId)

    }
  }, [auth.isAuthenticated, fetchParticipants, experiment])

  const socketUrl = `${window.location.protocol == "http:" ? "ws:" : "wss:"}//${window.location.hostname}${window.location.port !== "80" ? ":" + window.location.port : ""}/vera-portal/api/ws`
  // console.log(persistedState.store.getState().auth)

  const { sendJsonMessage, readyState } = useWebSocket(socketUrl, {
    share: true,
    onOpen: () => {
      sendJsonMessage(msg)
    },
    onMessage: (msg) => {
      try {
        let parsed = JSON.parse(msg.data)
        switch (parsed.type) {
          case "authentication":
            if (!parsed.payload) {
              console.log(parsed)
              console.log("Logging out...")
              dispatch({ type: 'LOGOUT' }); history.replace('/vera-portal')
            }
            break
          default:
          // console.log(parsed);
        }

      } catch {
        console.log(msg)
      }
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: () => true,
  })
  var msg = {
    type: 'authenticate',
    payload: { token: persistedState.store.getState().auth.token.slice(7) }
  }
  const dispatch = useAppDispatch()
  const alert = message ? (
    <div className="text-center">
      <div
        style={{
          background: alertColor,
          color: "white",
          borderRadius: "5px",
          padding: "5px",
        }}
      >
        {message}
      </div>
    </div>
  ) : null;


  // Effect hook for WebSocket readyState
  /*
  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      const interval = setInterval(() => {
        sendJsonMessage({ type: "ping" })
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [readyState, sendJsonMessage])
*/

  let [selectedParticipant, setSelectedParticipant] = useState<IParticipant>({
    state: "",
    email: "",
    note: "",
    consented: false,
    info: "",
    uid: "",
    comments: []
  })

  const [index, setIndex] = useState(undefined)
  const [showDetails, setShowDetails] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const handleClose = () => setShow(false)
  const { promiseInProgress } = usePromiseTracker({ area: "table" })
  const { promiseInProgress: participantPromiseInProgress } = usePromiseTracker({ area: "participant" })
  let setExcludeCallback = useCallback((uid, exclude) => {
    updateParticipant(uid, { exclude }, auth.token)
      .then(async (res) => {
        let js = await res.text()
        console.log(res.status)
      })
  }, [])
  const [downloadingParticipants, setDownloadingParticipants] = useState({});

  const handleDownloadParticipant = useCallback(async (uid) => {
    setDownloadingParticipants(prev => ({ ...prev, [uid]: true }))

    try {
      const res = await downloadParticipantFormatted(uid, auth.token)
      if (res && res.status === 404) {
        window.alert("This participant has no associated data available to download.")
      } else if (res && res.status >= 400) {
        window.alert("An error occurred during download. Please refresh the page and try again.")
      }
    } catch (error) {
      console.error("Error downloading participant data:", error)
      window.alert("An error occurred during download. Please refresh the page and try again.")
    }

    setDownloadingParticipants(prev => {
      const { [uid]: _, ...rest } = prev
      return rest
    })

  }, [experiment, auth.token]);

  const columns = React.useMemo(() => {
    let multiSiteColumn = experiment?.isMultiSite ? [{
      Header: 'Site',
      accessor: 'site', // Or however your data field is named
      width: 50,
      disableFilters: true,
      Cell: ({ value }) => {
        return <span>{value.shortName || 'No site'}</span>;
      }
    }] : [];

    let mainColumns = [
      {
        Header: 'Participant ID',
        accessor: 'pID',
        Cell: ({ value, row }) =>
          `${value}`,
        width: 30,
        disableFilters: true
      },
      {
        Header: 'Timestamp',
        accessor: 'sessionStart',
        Cell: ({ value, row }) =>
          value === undefined ? "" : new Date(value).toLocaleString(),
        width: 50,
        disableFilters: true
      },
      {
        Header: 'Status',
        accessor: "state",
        width: 50,
        disableFilters: true,
        Cell: ({ row }) => {
          const participant = row.original;
          const [currentStatus, setCurrentStatus] = useState<string | null>(participant.state);
          useEffect(() => {
            const loadStatus = async () => {
              try {
                const info = await getParticipantInfo(participant._id, auth.token);
                setCurrentStatus(info.state);
              } catch (error) {
                console.error("Error fetching participant status:", error);
              }
            };
            loadStatus();
          }, [participant._id, auth.token]);
          if (!currentStatus) {
            return "Loading...";
          }
          const statusClass =
            currentStatus === "CREATED"
              ? "created"
              : currentStatus === "COMPLETE"
                ? "complete"
                : currentStatus === "INCOMPLETE"
                  ? "in-complete"
                  : currentStatus === "WITHDRAWN"
                    ? "withdrawn"
                    : "in-experiment";

          return (
            <p className={statusClass}>
              {ParticipantState[currentStatus]}
            </p>
          );
        },
      },
      {
        Header: 'Data Files',
        width: 30,
        Cell: ({ row }) => {
          const uid = row.original.uid
          const isDownloading = downloadingParticipants[uid]

          return (
            <CustomButton
              disabled={isDownloading}
              onClick={() => handleDownloadParticipant(uid)}
              children={isDownloading ? <Spinner size="sm" /> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Download</Tooltip>}>
                  <rect width="32" height="32" rx="4" fill="#F2F2F2" />
                </OverlayTrigger>
                <mask id="mask0_538_2430" maskUnits="userSpaceOnUse" x="4" y="4" width="24" height="24">
                  <rect x="4" y="4" width="24" height="24" fill="#D9D9D9" />
                </mask>
                <g mask="url(#mask0_538_2430)">
                  <path d="M16 20L11 15L12.4 13.55L15 16.15V8H17V16.15L19.6 13.55L21 15L16 20ZM10 24C9.45 24 8.97917 23.8042 8.5875 23.4125C8.19583 23.0208 8 22.55 8 22V19H10V22H22V19H24V22C24 22.55 23.8042 23.0208 23.4125 23.4125C23.0208 23.8042 22.55 24 22 24H10Z" fill="#816F7D" />
                </g>
              </svg>}
            />
          )
        }
      },
      {
        Header: 'File Size',
        accessor: "filesize",
        width: 50,
        disableFilters: true,
        Cell: ({ row }) => {
          const participant = row.original;
          const [combinedSize, setCombinedSize] = useState<number | null>(null);

          useEffect(() => {
            const loadSize = async () => {
              const total = await fetchCombinedFileSize(participant.experimentId, participant.uid, auth.token);
              setCombinedSize(total);
            };
            loadSize();
          }, [participant.experimentId, participant.uid]);

          if (combinedSize === null) {
            return "Loading...";
          }

          const sizeInMB = (combinedSize / (1024 * 1024)).toFixed(2);
          return `${sizeInMB} MB`;
        },
      },
      {
        Header: 'View Logs',
        width: 30,
        disableFilters: true,
        accessor: (row) => row.uid,
        Cell: ({ value, row }) => <Button variant="outline-secondary" style={{ width: '75px' }} onClick={() => { handleShowLogs(value) }}>View</Button>
      },
    ];

    if (multiSiteColumn != null) {
      return [...multiSiteColumn, ...mainColumns];
    } else {
      return mainColumns;
    }
  }, [downloadingParticipants, handleDownloadParticipant]);

  let deleteParticipantCallback = useCallback((participant) => {
    console.log("Deleting ", participant)
    console.log("Deleting ", selectedParticipant)

    deleteParticipant(participant.uid, auth.token)
      .then(async (res) => {
        let status = res.status
        console.log(status)
        if (res.status === 200) {
          setShowConfirmDelete(false)
          setShowDetails(false)

          console.log(participant)
          let participantIndex = participants.indexOf(participant)
          if (participants.length > 1) {
            setSelectedParticipant(participants[(participantIndex + 1) % (participants.length - 1)])
          } else {
            setSelectedParticipant({
              state: "",
              email: "",
              note: "",
              consented: false,
              info: "",
              uid: "",
              comments: []
            })
          }
          setParticipants((prev) => prev.filter(participant => participant.uid !== participant.uid))
        }
      })
      .catch((err) => {
        if (err.status >= 500) {
          setError("Internal Server Error Occured. Please refresh the page.")
          setShowError(true)
        }
      })
  }, [selectedParticipant])

  // Zip
  const [showDownload, setShowDownload] = useState(false);
  const handleCloseDownload = () => setShowDownload(false);
  const handleShowDownload = () => setShowDownload(true);

  const onZipError = (err: any) => {
    console.error(err)
    if (err.toString().includes("404")) { setMessage("No recorded participant data found for this experiment") }
    else { setMessage("An error occurred while downloading the experiment's data. Please refresh the page and try again.") }

    handleShowDownload()
    setDownloadPending(false)
  }

  const onZipSuccess = () => {
    setMessage("Experiment data downloaded successfully!")
    handleShowDownload()
    setDownloadPending(false)
  }

  const downloadExpData = () => {
    if (downloadPending)
      return;

    console.log("Downloading experiment as zip")

    setDownloadPending(true)
    downloadExperimentDataFormatted(experimentId, auth.token, onZipSuccess, onZipError, null)
  }

  useSelector((state: any) => state.auth)

  // console.log(players)
  return (showLogs === null ?
    <Container fluid className="container-fluid">
      <Modal show={showDownload} onHide={handleCloseDownload}>
        <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
          <p className="m-0 g-0" style={{ fontWeight: 'bold', textAlign: "center" }}>{message}</p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button className="toast-button m-3" onClick={handleCloseDownload}>
            Okay
          </Button>
        </Modal.Footer>
      </Modal>
      <NavMenu title="Management" />
      <CustomAlert
        show={showError}
        message={error}
        onClose={handleCloseAlert}
        onReload={handleReload}
      />
      <ExperimentAccessError 
        experimentId={experimentId}
        authToken={auth.token}
      >
        <HashRouter basename={`/`} hashType="noslash">
          <Container>
            <Container>
            <div className="experiment-results">

              {/* Header */}
              <Row className="justify-content-between align-items-center gx-0">
                <div style={{ height: '20px' }}></div>
                <Col xs={"auto"}>
                  <h1>{experiment ? experiment.name : undefined}</h1>
                </Col>
                <Col xs={"auto"}>
                  <Row className="d-flex justify-content-center align-items-center">
                    <Button className="tertiary-button me-3" style={{ width: "160px", color: "#644F64", fontWeight: "bold" }} onClick={downloadExpData} disabled={downloadPending}>Download Data</Button>
                    {experiment && experiment.isMultiSite ? (
                      <Dropdown className="site-dropdown" onSelect={handleSiteSelect}>
                        <Dropdown.Toggle variant="primary" id="dropdown-basic" className="site-dropdown-toggle">{selectedSiteName}</Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item eventKey="All Sites" className="site-dropdown-item">All Sites</Dropdown.Item>
                          {experiment ? experiment.sites.map((site, index) => {
                            return <Dropdown.Item key={index} eventKey={site.name} className="site-dropdown-item">
                              {site.shortName + " (" + site.name + ")"}
                            </Dropdown.Item>
                          }) : <Dropdown.Item key={0} eventKey="All Sites" className="site-dropdown-item">All Sites</Dropdown.Item>}
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : null}
                  </Row>
                </Col>
                <div style={{ height: '20px' }}></div>
              </Row>

              {/* Table */}
              <Row className="justify-content-center align-items-center">
                {promiseInProgress || !Array.isArray(columns) || !Array.isArray(participants) ?
                  <LoadingIndicator></LoadingIndicator>
                  :
                  <ParticipantTable columns={columns} data={currentData} />}
              </Row>
              <div style={{ height: "20px" }}></div>
              {/* Pagination */}
              <Row className="d-flex justify-content-center align-items-center">
                {participants && participants.length > pageSize && (
                  <Pagination>
                    <Pagination.Prev onClick={goToPrevPage} disabled={currentPage === 1} />

                    {/* Numbered pages */}
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const page = index + 1;
                      return (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => {
                            setCurrentPage(page);
                            updatePageInUrl(page);
                          }}
                        >
                          {page}
                        </Pagination.Item>
                      );
                    })}

                    <Pagination.Next
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                )}
              </Row>

              <Button style={{ alignSelf: "flex-end", padding: "8px 16px" }} onClick={() => history.replace('/vera-portal/Dashboard')}>Back</Button>
              <div style={{ height: "20px" }}></div>
            </div>
          </Container>

          <Modal isOpen={show} toggle={() => setShow(!show)}>
            <ModalHeader>
              Create new participant
            </ModalHeader>
            <ModalBody>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => {
                // console.log("Saving timestamp...")
                handleClose()
              }}>
                Save
              </Button>
            </ModalFooter>
          </Modal>
          <Modal isOpen={showConfirmDelete} toggle={() => setShowConfirmDelete(!showConfirmDelete)}>
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalBody>
              <p>This will delete the participant and remove any related logs, exit surveys and related data.</p>
              <Button onClick={() => {
                deleteParticipantCallback(selectedParticipant)
              }
              }>Confirm</Button>
              <Button onClick={() => { setShowConfirmDelete(false); setShowDetails(true) }}>Cancel</Button>
            </ModalBody>
          </Modal>
          <Modal size="lg" style={{ width: '100%' }} isOpen={showDetails} toggle={() => setShowDetails(!showDetails)}>
            <ModalHeader>
              {
                selectedParticipant ? selectedParticipant.note ? selectedParticipant.note : `UID: ${selectedParticipant.uid}` :
                  "none"
              }
            </ModalHeader>
            <ModalBody>
              {participantPromiseInProgress ? <LoadingIndicator></LoadingIndicator> :
                <Table responsive size="lg">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>{selectedParticipant.note}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>UID</th>
                      <td>{selectedParticipant.uid}</td>
                    </tr>
                  </tbody>
                </Table>
              }
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button variant="danger" onClick={() => { setShowConfirmDelete(true) }}>
                Delete
              </Button>
            </ModalFooter>
          </Modal>
        </Container>
      </HashRouter>
      </ExperimentAccessError>
    </Container > : <LogView match={match} participant={showLogs} setShowLogs={setShowLogs} experiment={experiment} handleDownloadParticipant={handleDownloadParticipant}></LogView>)
}

export default Admin