import React, { useEffect, useState, ChangeEvent } from "react";
import { getAllFileTypes } from "../../helpers/FilesAPIHelper";
import { Row, Col, Modal, Container, Button, Spinner, Form, InputGroup, Image } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import FileUploadCard from "./FileUploadCard";
import { ParticipantState } from "../../pages/Admin";
import '../../styles/App.css'

interface LogViewSideBarProps {
  participantId: string;
  experimentId: string;
  previewedFileTypeId: string;
  handlePreviewedFileTypeChange: (fileTypeId: string, fileTypeName: string) => void;
  participantInfo: any;
  handleWithdrawParticipant: () => void;
}

interface FileType {
  _id: string;
  name: string;
  experimentId: string;
  extension: string;
  description: string;
}

const LogViewSideBar: React.FC<LogViewSideBarProps> = ({ participantId, experimentId, previewedFileTypeId, handlePreviewedFileTypeChange, participantInfo, handleWithdrawParticipant }) => {

  const auth = useSelector(state => state.auth);

  const [fileTypeList, setFileTypeList] = useState([])

  // Get FileTypes and File Information before rendering page
  useEffect(() => {

    getAllFileTypes(auth.token, experimentId).then((fileTypeResponse) => {
      setFileTypeList(fileTypeResponse.fileTypes)
    })

  }, [])

  return (
    <>
      <Container className="fileUpload-component">
        <Container >
          <Row >
            <h3>Associated Files</h3>
          </Row>
        </Container>

        {/* File type list */}
        <Row style={{ maxHeight: "300px", overflowY: "auto" }}>
          {fileTypeList ? (
            fileTypeList.map((ft: FileType) => (
              <div key={ft._id}>
                <FileUploadCard
                  fileTypeId={ft._id}
                  fileTypeName={ft.name}
                  extension={ft.extension}
                  description={ft.description}
                  participantId={participantId}
                  isPreviewed={previewedFileTypeId === ft._id}
                  handlePreviewedFileTypeChange={handlePreviewedFileTypeChange}
                />
              </div>
            ))
          ) : (
            <Row>
              <p>No file types defined</p>
            </Row>
          )}
        </Row>
        {/* Action Center / widthdraw area */}
        <Row>
          <Container
            className="action-card-withdrawn"
            style={{
              padding: '20px 16px 10px 16px',
              backgroundColor: '#FFFFFF',
              width: '271px',
              height: '160px',
              border: '1px solid #E8E8E8'
            }}
          >
            <Container>
              <h5 style={{ marginBottom: '12px', fontSize: '16px' }} className='column-def-table-header'>Action Center</h5>
              <Container
                style={{
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px',
                  fontSize: '14px'
                }} className="withdrawn-row ">
                <strong style={{ marginRight: '8px' }}>Status:</strong>
                <Container
                  style={{
                    border: '1px solid #E8E8E8',
                    borderRadius: '4px',
                    padding: '6px 20px',
                    backgroundColor: '#ffffff',
                  }}
                  className={participantInfo?.state === "COMPLETE" ? "complete" : (participantInfo?.state === "INCOMPLETE" ? "in-complete" : (participantInfo?.state === "WITHDRAWN" ? "withdrawn" : "in-experiment"))}
                >
                  {ParticipantState[participantInfo?.state]}
                </Container>
              </Container>
              <Button
                onClick={handleWithdrawParticipant}
                disabled={participantInfo?.state === "WITHDRAWN"}
                className="withdrawn-btn"
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#644F64',
                  color: '#fff',
                  border: '1px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Mark as Withdrawn
              </Button>
            </Container>
          </Container>
        </Row>
      </Container>

    </>
  )

}

export default LogViewSideBar;