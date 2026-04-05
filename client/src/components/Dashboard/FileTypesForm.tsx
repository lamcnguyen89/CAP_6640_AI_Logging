import React, { useState, useEffect } from "react";
import { Container, Button, Form, FormGroup, InputGroup, Row, Col, Modal, Table, Image, OverlayTrigger, Tooltip } from "react-bootstrap";
import { getAllFiles } from "../../helpers/FilesAPIHelper";
import { FileType } from "./ExperimentFormTypes";
import deleteIcon from '../../assets/deleteRed.png';
import editIcon from '../../assets/edit.png';
import '../../styles/App.css'
import FileTypeAddAndEdit from "./FileTypeAddAndEdit";

// Props
interface FileTypesFormProps {
  // Callback function to update the parent component with the file types
  onFileTypesChange: (fileTypes: FileType[]) => void;
  // The file types of the experiment, a state from the parent component
  fileTypes: FileType[];
  // Callback function to update the parent component with the file types to remove
  onFileTypesToRemoveChange: (idsToRemove: string[]) => void;
  // The file types to remove from the experiment, a state from the parent component
  fileTypeIdsToRemove: string[];
  // Auth
  auth: any;
  // The ID of the existing experiment we are editing, if applicable
  experimentIdToEdit: string;
  permissionRole: string;
}

const FileTypesForm: React.FC<FileTypesFormProps> = ({ onFileTypesChange, fileTypes, onFileTypesToRemoveChange, fileTypeIdsToRemove, auth, experimentIdToEdit, permissionRole }) => {

  const [showFileTypesDeleteModal, setShowFileTypesDeleteModal] = useState(false);
  const handleCloseFileTypesDeleteModal = () => setShowFileTypesDeleteModal(false);
  const [pendingFileTypesDeleteIdx, setPendingFileTypesDeleteIdx] = useState(-1);
  const [showFileEditParentModal, setShowFileEditParentModal] = useState(false);
  const [showEditFileConfirmModal, setShowEditFileConfirmModal] = useState<boolean>(false);
  const [showCompletionConfirmModal, setShowCompletionConfirmModal] = useState<boolean>(false);

  const [currentlyEditedFileTypeIdx, setCurrentlyEditedFileTypeIdx] = useState<number>(-1);
  const [pendingFileTypeChanges, setPendingFileTypeChanges] = useState<FileType>();
  const [editFormSetFileType, setEditFormSetFileType] = useState<(fileType: FileType) => void>(() => undefined);

  // Begins the process of removing a file type; doesn't actually remove until confirmation occurs.
  const removeFileType = async (index: number) => {
    setPendingFileTypesDeleteIdx(index);

    // If this file type has an existing ID, check if it has data associated with it
    if (fileTypes[index].existingId !== '' && fileTypes[index].existingId !== undefined) {
      // If there are any files associated with the file type, there is associated data; show a confirmation modal
      let allFilesRes = await getAllFiles(auth.token, experimentIdToEdit, fileTypes[index].existingId);

      if (allFilesRes.httpStatus >= 500) {
        console.log(allFilesRes.message)
        return;
      }

      // Sort files by selected fileType
      allFilesRes.files = allFilesRes.files.filter((file) => file.fileType === fileTypes[index].existingId)

      // If any files exist, data exists for this filetype; do not edit extension yet, instead show a confirmation modal
      if (allFilesRes.files.length > 0) {
        setShowFileTypesDeleteModal(true)
        return;
      }
    }

    // No files exist, jump to deletion
    confirmFileTypesDeleteByIndex(index);
  }

  // Confirms the deletion of a file type by index
  const confirmFileTypesDeleteByIndex = (indexToDelete: number) => {
    if (indexToDelete === -1) {
      return;
    }

    // Mark file type as needing deletion and remove from list of file types
    if (fileTypes[indexToDelete].existingId !== '') {
      let updatedFileTypeIdsToRemove = [...fileTypeIdsToRemove];
      updatedFileTypeIdsToRemove.push(fileTypes[indexToDelete].existingId);
      onFileTypesToRemoveChange(updatedFileTypeIdsToRemove);
    }

    // If the file type was a duplicate file type, remove the duplicate file type errors from other file types
    let updatedFileTypes = [...fileTypes];
    const currentName = fileTypes[indexToDelete].fileName;
    if (updatedFileTypes[indexToDelete].invalidFileNameError === "Duplicate filename - please remove duplicate names.") {
      updatedFileTypes.forEach((fileType, i) => {
        if (fileType.fileName !== undefined && fileType.fileName !== "" && currentName !== undefined && currentName !== "" &&
          fileType.fileName.toLocaleLowerCase() === currentName.toLocaleLowerCase() && i !== indexToDelete) {
          updatedFileTypes[i].invalidFileNameError = "";
        }
      });
    }

    // Update array of file types
    updatedFileTypes = updatedFileTypes.filter((_, i) => i !== indexToDelete);
    onFileTypesChange(updatedFileTypes);

    // Close confirmation modal, if applicable
    handleCloseFileTypesDeleteModal();
  }

  // Confirms deletion of a file type, by the index which is pending for deletion
  const confirmFileTypesDeleteByPending = () => {
    confirmFileTypesDeleteByIndex(pendingFileTypesDeleteIdx);
  }

  // Begins editing a file type, opening the modal
  const beginEditingFileType = (index: number) => {
    setShowFileEditParentModal(true);
    setCurrentlyEditedFileTypeIdx(index);
  }

  // Closes the file edit modal
  const handleCloseEditFileConfirmModal = () => {
    setShowEditFileConfirmModal(false);
  }

  // Closes the file edit confirmation modal
  const handleCloseEditCompletionConfirmModal = () => {
    setShowCompletionConfirmModal(false);
  }

  // Called when the FileTypeAddAndEdit modal wants to save a file type
  const onSaveFileType = (fileType: FileType, setFileType: (fileType: FileType) => void) => {
    setShowEditFileConfirmModal(false);

    let updatedFileTypes = [...fileTypes];

    // Check for duplicate names
    let duplicateNames = false;
    updatedFileTypes.forEach((existingFileType, i) => {
      if (existingFileType.fileName.toLocaleLowerCase() === fileType.fileName.toLocaleLowerCase() && i !== currentlyEditedFileTypeIdx) {
        setFileType({ ...fileType, invalidFileNameError: "Duplicate filename - please remove duplicate names." });
        duplicateNames = true;
      }
    });

    if (duplicateNames)
      return;

    fileType.needsUpdate = true;

    // If we are editing a file type, update that file type; otherwise, push a new file type.
    if (currentlyEditedFileTypeIdx !== -1) {
      updatedFileTypes[currentlyEditedFileTypeIdx] = fileType;
    } else {
      updatedFileTypes.push(fileType);
    }

    onFileTypesChange(updatedFileTypes);
    setShowFileEditParentModal(false);
    setShowCompletionConfirmModal(true);
  }

  // Called when the FileTypeAddAndEdit modal wants to save a file, but a confirmation needs to be shown first
  // due to editing an existing file's extension
  const showEditConfirmThenSaveFile = (fileType: FileType, setFileType: (fileType: FileType) => void) => {
    setPendingFileTypeChanges(fileType);
    setEditFormSetFileType(() => setFileType);
    setShowEditFileConfirmModal(true);
    setShowFileEditParentModal(false);
  }

  // Check if user has permission to modify file types
  const canModifyFileTypes = permissionRole === "Creator" || permissionRole === "Admin";

  return (
    <Container style={{ border: "1px solid lightgrey", borderRadius: "5px", padding: "15px 45px", }}>
      <Modal show={showFileTypesDeleteModal} onHide={handleCloseFileTypesDeleteModal}>
        <Modal.Header>
          <Modal.Body><b>This File Type is currently in use, and data has been associated with it. Are you sure you want to delete this File Type? All data associated with this site will be lost.</b></Modal.Body>
        </Modal.Header>
        <Modal.Footer className="justify-content-center">
          <Button className="tertiary-button me-4" onClick={handleCloseFileTypesDeleteModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmFileTypesDeleteByPending}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showEditFileConfirmModal}>
        <Modal.Header>
          <Modal.Body><b>You are attempting to edit this file type's extension, but there is already data recorded to this file.
            Changing the file type may result in data corruption for any existing recorded data. Continue?</b></Modal.Body>
        </Modal.Header>
        <Modal.Footer className="justify-content-center">
          <Button className="tertiary-button me-4" onClick={handleCloseEditFileConfirmModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSaveFileType(pendingFileTypeChanges, editFormSetFileType)}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showCompletionConfirmModal}>
        <Modal.Header>
          <Modal.Body><b>Your file type has been updated successfully.</b></Modal.Body>
        </Modal.Header>
        <Modal.Footer className="justify-content-center">
          <Button className="tertiary-button me-4" onClick={handleCloseEditCompletionConfirmModal}>
            Okay
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showFileEditParentModal} onHide={() => setShowFileEditParentModal(false)} size="lg">
        <FileTypeAddAndEdit
          fileTypeToEdit={fileTypes[currentlyEditedFileTypeIdx]}
          onSaveFileType={onSaveFileType}
          showEditConfirmThenSaveFile={showEditConfirmThenSaveFile}
          onCloseFileEdit={() => setShowFileEditParentModal(false)}
          auth={auth}
          experimentIdToEdit={experimentIdToEdit}
        />
      </Modal>
      <Row>
        <h2>Participant File Management</h2>
      </Row>
      <Row>
        <Col>
          <h3>Associated Files</h3>
            <span>
              <Button 
                className="tertiary-button mt-3" 
                onClick={() => beginEditingFileType(-1)}
                disabled={!canModifyFileTypes}
              >
                Add New File
              </Button>
            </span>
          <Table bordered className="mt-2">
            <thead>
              <tr>
                <th className="column-def-table-header">Filename</th>
                <th className="column-def-table-header">Extension</th>
                <th className="column-def-table-header">Description</th>
                <th className="column-def-table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fileTypes.length > 0 ? (
                fileTypes.map((fileType, index) => (
                  <tr key={index}>
                    <td className="align-middle">{fileType.fileName}</td>
                    <td className="align-middle">{fileType.fileExtension}</td>
                    <td className="align-middle">{fileType.fileDescription}</td>
                    <td className="d-flex align-middle justify-content-center">
                      <OverlayTrigger 
                        placement="top" 
                        overlay={
                          <Tooltip id={`tooltip-edit-${index}`}>
                            {canModifyFileTypes ? "Edit" : "You don't have permission to edit file types"}
                          </Tooltip>
                        }
                      >
                        <Image 
                          className={`dashboard-icons me-4 ${!canModifyFileTypes ? 'disabled-icon' : ''}`} 
                          src={editIcon} 
                          alt="Edit Icon" 
                          onClick={canModifyFileTypes ? () => beginEditingFileType(index) : undefined}
                          style={!canModifyFileTypes ? { opacity: 0.5, cursor: 'not-allowed' } : { cursor: 'pointer' }}
                        />
                      </OverlayTrigger>
                      <OverlayTrigger 
                        placement="top" 
                        overlay={
                          <Tooltip id={`tooltip-delete-${index}`}>
                            {canModifyFileTypes ? "Delete" : "You don't have permission to delete file types"}
                          </Tooltip>
                        }
                      >
                        <Image 
                          className={`dashboard-icons ${!canModifyFileTypes ? 'disabled-icon' : ''}`} 
                          src={deleteIcon} 
                          alt="Delete Icon" 
                          onClick={canModifyFileTypes ? () => removeFileType(index) : undefined}
                          style={!canModifyFileTypes ? { opacity: 0.5, cursor: 'not-allowed' } : { cursor: 'pointer' }}
                        />
                      </OverlayTrigger>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center">No file types have been added yet.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Col>
      </Row >
    </Container >
  );
};

export default FileTypesForm;