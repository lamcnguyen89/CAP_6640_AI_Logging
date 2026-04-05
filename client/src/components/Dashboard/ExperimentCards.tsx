// eslint-disable-next-line no-unused-vars
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Row, Col, Container, Button, Image, Modal, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, Link } from 'react-router-dom'
import copyIcon from '../../assets/file_copy.png'
import deleteIcon from '../../assets/delete.png'
import downloadIcon from '../../assets/download.png'
import '../../styles/App.css'

type props = {
  id: string
  name: string
  participants: Array<string>;
  draft: boolean
  deleteExperiment: any
  copyExperiment: any
  downloadExperiment: any
  downloadPending: boolean
  activeDownload: boolean
  hasFiles: boolean
  key: any
}

const ExperimentCard = ({ id, name, participants, draft, deleteExperiment, copyExperiment, downloadExperiment, downloadPending, activeDownload, hasFiles }: props) => {
  const auth = useSelector((state: any) => state.auth)

  const dispatch = useDispatch()
  const history = useHistory()

  const [show, setShow] = useState(false);
  const [showCopy, setShowCopy] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [drafted, setDrafted] = useState(false)
  const [hasFilesState, setHasFilesState] = useState(hasFiles)

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleCloseCopy = () => setShowCopy(false);
  const handleShowCopy = () => setShowCopy(true);

  const handleDeleteExperiment = () => {
    handleClose()
    deleteExperiment()
  }

  const handleCopyExperiment = () => {
    handleCloseCopy()
    copyExperiment()

  }

  const handleDownloadExperiment = () => {
    downloadExperiment()
  }

  

  // Get Experiment Stats
  useEffect(() => {

    // If the experiment has files, set the hasFilesState to true
    setHasFilesState(hasFiles)

    // Set Participant Count
    setParticipantCount(participants.length)

    // Set Completed Participant Count
    let completedCount = 0
    for (const x in participants) {
      //console.log(participants[x]["state"])
      if (participants[x]["state"] === "COMPLETE") {
        ++completedCount
      }
    }
    setCompletedCount(completedCount)

    // Show whether Experiment is in draft state or not
    setDrafted(draft)


  }, [])

  return (
    <Row>
      <div>
        <Modal show={show} onHide={handleClose}>
          <Modal.Body><b>Are you sure you want to delete the experiment</b>? </Modal.Body>
          <Modal.Footer className="justify-content-center">
            <Button className="cancel-button m-3" onClick={handleClose}>
              No
            </Button>
            <Button className="toast-button m-3" onClick={handleDeleteExperiment}>
              Yes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <div>
        <Modal show={showCopy} onHide={handleCloseCopy}>
          <Modal.Body><b>Do you want to duplicate the experiment named {name}</b>?</Modal.Body>
          <Modal.Footer className="justify-content-center">
            <Button className="cancel-button m-3" onClick={handleCloseCopy}>
              No
            </Button>
            <Button className="toast-button m-3" onClick={handleCopyExperiment}>
              Yes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <Container className={`experiment-cards mt-3`}>
        <Row className="d-flex justify-content-start align-items-center gx-0">
          <Col xs={4}>
            <Row className="d-flex justify-content-start align-items-center gx-0">
              <Col xs="auto">
                <Link to={`/vera-portal/manage/${id}`}>
                  <h3 className="experiment-link mt-1 ms-1">{name}</h3>
                </Link>
              </Col>
            </Row>
          </Col>
          <Col xs={8} className="d-flex justify-content-end align-items-center mt-3">
            <Row xs="auto" className="d-flex justify-content-center align-items-center mt-3">
              <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">The drafting state of this experiment</Tooltip>}>
                <Col><p className="status-output me-4">{drafted ? "Drafted" : "Finalized"}</p></Col>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">How many participants have enrolled in this experiment</Tooltip>}>
                <Col><p className="enrolled-title">Enrolled</p></Col>
              </OverlayTrigger>
              <Col><p className="enrolled-status" style={{ fontSize: "14px" }}>{participantCount}</p></Col>
              <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">How many participants have fully completed this experiment</Tooltip>}>
                <Col><p className="enrolled-title">Completed</p></Col>
              </OverlayTrigger>
              <Col><p className="enrolled-status me-4" style={{ fontSize: "14px" }}>{completedCount}</p></Col>
              <Col xs="auto">
                {hasFilesState ? (
                  <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Download all files</Tooltip>}>
                    <Image
                      src={downloadIcon}
                      className="dashboard-icons me-3 mb-3"
                      alt="Download Icon"
                      onClick={handleDownloadExperiment}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (!downloadPending || activeDownload) {
                            handleDownloadExperiment()
                          }
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label="Download all files"
                      style={{
                        opacity: downloadPending ? 0.5 : 1,
                        cursor: downloadPending ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </OverlayTrigger>
                ) : (
                  <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">No files to download</Tooltip>}>
                    <Image
                      src={downloadIcon}
                      className="dashboard-icons me-3 mb-3"
                      alt="Download Icon"
                      tabIndex={-1}
                      role="button"
                      aria-disabled="true"
                      style={{
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }}
                    />
                  </OverlayTrigger>
                )}
                <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Duplicate</Tooltip>}>
                  <Image className="dashboard-icons me-3 mb-3" 
                    src={copyIcon} 
                    alt="Copy Icon"
                    tabIndex={0}
                    role="button"
                    aria-label="Copy Experiment"
                    onKeyDown={(e) =>{
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleShowCopy()
                    }}}
                    style={{ cursor: 'pointer', '&:hover': { opacity: 0.1 } }} 
                    onClick={handleShowCopy} 
                  />
                </OverlayTrigger>
                <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Delete</Tooltip>}>
                  <Image className="dashboard-icons me-3 mb-3" 
                    src={deleteIcon} 
                    alt="Delete Icon"
                    tabIndex={0}
                    role="button"
                    aria-label="Delete Experiment"
                    onKeyDown={
                      (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleShow()
                        }
                      }
                    }
                    style={{ cursor: 'pointer' }} 
                    onClick={handleShow} 
                  />
                </OverlayTrigger>
              </Col>
              <Col>
                <Link to={`/vera-portal/experimentdetails/${id}`} >
                  <Button variant="secondary" className="mb-3" style={{ width: "200px", fontSize: "14px" }} >
                    {drafted ? "Edit Draft" : "Edit Experiment"}
                  </Button>
                </Link>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </Row>
  )
}

export default ExperimentCard