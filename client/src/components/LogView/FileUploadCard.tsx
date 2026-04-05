
import React, { useEffect, useState, ChangeEvent } from "react";
import { uploadParticipantFile, getFileforFileType } from "../../helpers/FilesAPIHelper";
import { Stack, Row, Col, Modal, Container, Button, Spinner, Form, InputGroup, Image, Tooltip, OverlayTrigger } from 'react-bootstrap';
import DragAndDrop from "./DragAndDrop";

import { useSelector } from 'react-redux';
import { RetrievedFileInfo, convertDate } from "./FileTypeHelper";
import stickyNote from '../../assets/sticky_note_2.png';
import sync from '../../assets/sync.png';
import close from '../../assets/close.png'
import '../../styles/App.css'
import CustomAlert from "../CustomAlert";
import { useLogView } from "../../contexts/LogViewContext";

// React Drop Zone with Progress Bar: https://www.bezkoder.com/react-dropzone-multiple-files-upload/
// React Upload Progress Bar: https://www.youtube.com/watch?v=edR6Az7shv8
// Editing Modal: https://react-bootstrap.netlify.app/docs/components/modal/

interface FileUploadCardProps {
  fileTypeId: string;
  fileTypeName: string;
  extension: string;
  description: string;
  participantId: string;
  isPreviewed: boolean;
  handlePreviewedFileTypeChange: (fileTypeId: string, fileTypeName: string) => void;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  fileTypeId,
  fileTypeName,
  extension,
  description,
  participantId,
  isPreviewed,
  handlePreviewedFileTypeChange
}) => {

  const auth = useSelector(state => state.auth);
  const { reloadFileTypePreview } = useLogView();

  // Errors / Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // File Data
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("select") // "select" | "selected" | "uploading" | "completed"
  const [fileUpload, setFileUpload] = useState<File>("")
  const [retrievedFileInfo, setRetrievedFileInfo] = useState("")
  const [fileUploadRefresh, setFileUploadRefresh] = useState("")


  // Handle Button Clicks and page rendering
  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    setFileUpload("")
    setProgress(0)
    setUploadStatus("select")
  };
  const handleShowUploadModal = () => setShowUploadModal(true);
  const handleShowSuccessModal = () => setShowSuccessModal(true);
  const handleCloseSuccessModal = () => setShowSuccessModal(false);
  const handleReload = () => window.location.reload();
  const handleCloseAlert = () => setShowError(false);
  const handleSelectFileType = () => handlePreviewedFileTypeChange(fileTypeId, fileTypeName);

  // When upload status reaches completion, do this
  useEffect(() => {
    if (progress == 100) {
      // Set a time delay to allow progress bar to finish rendering on the page
      setTimeout(
        () => {
          // Handle successful upload as desired...
          setError('');
          handleCloseUploadModal();
          setUploadStatus("select")
          setFileUploadRefresh(Math.random())
          handleShowSuccessModal();
          reloadFileTypePreview(); // Reload the fileTypePreview component to show the new file
        }, 2000
      )
    }
  }, [progress])


  const handleUploadClick = async () => {
    console.log("File Upload Data: ", fileUpload)

    if (!fileUpload) return;

    // Check to see if file extension matches
    const splitFileName = fileUpload.name.split(".")
    const ext = splitFileName[splitFileName.length - 1]?.toLowerCase();
    console.log("File extension: ", ext, "Expected extension: ", extension);

    if (ext !== extension && ext) {
      setError(`Please only upload a ${extension} file `)
      return
    }

    // Check file to see if it is below certain size
    const maxFileUploadSize: number = 16777216;
    if (fileUpload.size > maxFileUploadSize) {
      setError(` File size cannot be greater then ${Math.round(maxFileUploadSize * 0.001)} KB`)
      return
    }

    try {
      const response = await uploadParticipantFile(
        participantId,
        fileUpload,
        fileTypeId,
        auth.token,
        setProgress // This Progress State monitors the upload progress and sets a state. When it reaches 100%, the upload is successful and some stuff happens
      );
      if (response && response.success === false) {
        setError(response.message);
        return;
      }

    } catch (err) {
      console.error(err);
      setError("An error occurred during file upload.");
      setShowError(true);
    }
  };

  // Get File Data Associated with this FileType
  useEffect(() => {
    getFileforFileType(participantId, fileTypeId, auth.token).then((data: RetrievedFileInfo) => {

      // If File Data exists, then set the data to the state, else input blank data
      data ? (setRetrievedFileInfo(data)) : (
        setRetrievedFileInfo({
          _id: "",
          ts: "n/a",
          participantUID: "",
          fileType: {
            _id: "",
            name: "",
            experimentId: "",
            extension: "",
            description: ""
          },
          mimetype: "",
          size: 0
        })
      )
    })
  }, [fileUploadRefresh])


  return (
    <Container className={`mb-1 ${isPreviewed ? 'upload-card-activated' : 'upload-card'}`} onClick={handleSelectFileType}>
      <CustomAlert show={showError} message={error} onClose={handleCloseAlert} onReload={handleReload} />
      {/* Upload modal */}
      <Modal dialogClassName="upload-modal" show={showUploadModal} onHide={handleCloseUploadModal}>
        <Modal.Header style={{ fontSize: '24px', paddingLeft: '25px' }}><b>Replace File</b></Modal.Header>
        <Modal.Body>
          <Row>
            <Form.Group>
              <DragAndDrop fileExtension={extension} setFileUpload={setFileUpload} setUploadStatus={setUploadStatus} />
            </Form.Group>
          </Row>
          <Row>
            <Form.Group>
              {uploadStatus == "uploading" ?
                <div style={{ marginTop: '25px', marginBottom: '5px' }} >
                  <Row className="justify-content-center">
                    <Col md={"auto"}>
                      <div style={{ fontWeight: 'bold' }}>{fileUpload.name}</div>
                    </Col>
                    <Col md={7}>
                      <div className="progress-bg" >
                        <div className="progress" style={{ width: `${progress}%` }} />
                      </div>
                    </Col>
                    <Col md={1}>
                      <div className="pb-1">
                        {
                          progress !== 100 && <img src={close} onClick={
                            () => {
                              setFileUpload("")
                              setUploadStatus("select")
                            }
                          } />
                        }
                      </div>
                    </Col>
                  </Row>
                </ div> : null
              }
            </Form.Group>
          </Row>
          <Row>
            <Form.Group>
              <Container style={{ color: '#816F7D', marginTop: '25px', marginBottom: '25px' }}>
                Note: You can only edit the file configurations at the Experiment level. To modify this information, navigate to the Experiment view Screen.
              </Container>
            </Form.Group>
          </Row>
          <Row>
            <Col>
              <Form.Group>
                <Form.Label>File Name</Form.Label>
                <InputGroup>
                  <Form.Control
                    style={{ color: '#A9A9A9' }}
                    type="text"
                    required
                    value={fileTypeName}
                    placeholder="File Type Name of the file"
                    readOnly={true}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>File Extension</Form.Label>
                <InputGroup>
                  <Form.Control
                    style={{ color: '#A9A9A9' }}
                    type="text"
                    required
                    value={extension}
                    placeholder="File Extension of the file"
                    readOnly={true}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <InputGroup>
                <Form.Control
                  style={{ color: '#A9A9A9', height: '96px' }}
                  as="textarea"
                  rows={6}
                  name="fileDescription"
                  value={description}
                  placeholder="Lorem Ipsum"
                  readOnly={true}
                />
              </InputGroup>
              {error && (
                <div style={{ color: 'red', marginTop: '8px' }}>
                  {error}
                </div>
              )}
            </Form.Group>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button style={{ backgroundColor: "#E8E8E8", color: "#644F64" }} onClick={handleCloseUploadModal}>Discard</Button>
          <Button onClick={handleUploadClick} disabled={uploadStatus == "uploading" ? false : true
          }>Save</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showSuccessModal} onHide={handleShowSuccessModal} centered>
        <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
          <p style={{ color: "#644F64", fontWeight: 'bold' }}>
            The file has been replaced successfully!
          </p>

        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button onClick={handleCloseSuccessModal} style={{ backgroundColor: '#E8E8E8', color: '#644F64', fontSize: '14px', fontWeight: 'bold' }}>Back</Button>
        </Modal.Footer>

      </Modal>
      <Row>
        <Col md={10} sm={10} xs={10}>
          <p><b>{fileTypeName}</b></p>
        </Col>
        <Col className="d-flex justify-content-end" md={2} sm={2} xs={2}>
          {/*<Image className="notes-button" src={stickyNote} fluid alt="Notes Icon" onClick={() => { console.log("Notes Button Pressed") }} />*/}
          {<OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Manually upload and replace file</Tooltip>}>
            <Image className="upload-button" src={sync} fluid alt="Sync Icon" onClick={handleShowUploadModal} />
          </OverlayTrigger>}
        </Col>
      </Row>
      <Row>
        <p className="fileRow">Last Updated: {convertDate(retrievedFileInfo.ts)} <br />
          {Math.round(retrievedFileInfo.size / 1000)} KB | {extension}
        </p>
      </Row>
    </Container>

  )

}

export default FileUploadCard
