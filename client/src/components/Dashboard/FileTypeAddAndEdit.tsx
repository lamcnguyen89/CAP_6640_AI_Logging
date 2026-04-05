import React, { useState, useEffect } from "react";
import { Container, Button, Form, FormGroup, InputGroup, Row, Col, Modal } from "react-bootstrap";
import { FileType, ColumnDefinition, Column, getDefaultColumnDefinition, isCsharpKeyword } from "./ExperimentFormTypes";
import '../../styles/App.css'
import { getAllFiles } from "../../helpers/FilesAPIHelper";
import ColumnDefinitionForm from "./ColumnDefinitionForm";

// Props
interface FileTypeAddAndEditProps {
  // Callback function which is called upon saving changes to the file type
  onSaveFileType: (fileType: FileType, setFileType: (fileType: FileType) => void) => void;
  // Callback function which is called to pend saving changes to the file type, but show confirm modal first
  showEditConfirmThenSaveFile: (fileType: FileType, setFileType: (fileType: FileType) => void) => void;
  // Callback function which is called upon exiting the file type edit modal
  onCloseFileEdit: () => void;
  // The file type we are editing
  fileTypeToEdit: FileType;
  auth,
  experimentIdToEdit: string;
}

const FileTypeAddAndEdit: React.FC<FileTypeAddAndEditProps> = ({ onSaveFileType, showEditConfirmThenSaveFile, onCloseFileEdit, fileTypeToEdit, auth, experimentIdToEdit }) => {
  const [fileType, setFileType] = useState<FileType>(
    {
      fileName: "",
      fileExtension: "",
      fileDescription: "",
      invalidFileNameError: "",
      invalidFileExtensionError: "",
      invalidFileDescriptionError: "",
      columnDefinition: {
        columns: [],
        existingId: "",
        columnIdsToDelete: [],
        needsUpdate: false,
      },
      existingId: "",
      needsUpdate: false,
    }
  );
  const [oldFileExtension, setOldFileExtension] = useState<string>();
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  const [showColumnDefEdit, setShowColumnDefEdit] = useState<boolean>(false);

  // UseEffect to update fileType and oldFileExtension any time fileTypeToEdit updates
  useEffect(() => {
    if (fileTypeToEdit === undefined) {
      setFileType({
        fileName: "",
        fileExtension: "",
        fileDescription: "",
        invalidFileNameError: "",
        invalidFileExtensionError: "",
        invalidFileDescriptionError: "",
        columnDefinition: {
          columns: [],
          existingId: "",
          columnIdsToDelete: [],
          needsUpdate: false,
        },
        existingId: "",
        needsUpdate: false,
      });
      setOldFileExtension("");
    } else {
      setFileType(fileTypeToEdit);
      if (fileTypeToEdit.fileExtension === "csv") {
        setShowColumnDefEdit(true);
      } else {
        setShowColumnDefEdit(false);
      }
      setOldFileExtension(fileTypeToEdit.fileExtension);
    }

    setPendingChanges(false);
  }, [fileTypeToEdit]);

  // Validation of inputs
  const isValidName = (input: string) => /^[a-zA-Z0-9_]*$/.test(input);

  // Handles a change to the file type name input field
  const handleFileNameChange = (name: string) => {
    // Validate name
    if (!isValidName(name)) {
      setFileType({ ...fileType, fileName: name, invalidFileNameError: "Please do not use any special characters or spaces in your filename." });
    } else if (isCsharpKeyword(name.toLowerCase())) {
      setFileType({ ...fileType, fileName: name, invalidFileNameError: "Please do not use C# keywords in your filename (\"string\", \"while\", \"class\"...)." });
    } else if (name.length > 50) {
      setFileType({ ...fileType, fileName: name, invalidFileNameError: "Filename must be 50 characters or less." });
    } else {
      setFileType({ ...fileType, fileName: name, invalidFileNameError: "" });
    }

    setPendingChanges(true);
  }

  // Handles a change to the "Extension" field
  const handleFileExtensionChange = (extension: string) => {
    let updatedFileType = { ...fileType };
    // Validate extension
    if (!isValidName(extension)) {
      updatedFileType = { ...updatedFileType, fileExtension: extension, invalidFileExtensionError: "Please do not use any special characters or spaces in your filename." };
    } else {
      updatedFileType = { ...updatedFileType, fileExtension: extension, invalidFileExtensionError: "" };
    }

    // Check if new extension is CSV or not, and show/hide column definition accordingly
    if (extension === "csv") {
      setShowColumnDefEdit(true);
      if (fileType.columnDefinition.columns.length === 0) {
        updatedFileType = { ...updatedFileType, columnDefinition: getDefaultColumnDefinition() };
      }
    } else {
      setShowColumnDefEdit(false);
    }

    setFileType(updatedFileType);
    setPendingChanges(true);
  }

  // Handles a change to the "Description" field
  const handleFileDescriptionChange = (description: string) => {
    setFileType({ ...fileType, fileDescription: description, invalidFileDescriptionError: "" });

    setPendingChanges(true);
  }

  // Handles a change to the column definition (called from ColumnDefinitionForm.tsx)
  const handleColumnDefinitionChange = (columnDefinition: ColumnDefinition) => {
    setFileType({ ...fileType, columnDefinition: columnDefinition, needsUpdate: true });
    setPendingChanges(true);
  }

  // On submission, try to save the file type
  const onSubmitFileType = async () => {
    let valid = true;

    const updatedFileType = { ...fileType };
    // Validate fields
    if (updatedFileType.fileName === "") {
      updatedFileType.invalidFileNameError = "Please enter a filename.";
      valid = false;
    }
    if (fileType.fileExtension === "") {
      updatedFileType.invalidFileExtensionError = "Please enter a file extension.";
      valid = false;
    }
    if (fileType.fileDescription === "") {
      updatedFileType.invalidFileDescriptionError = "Please enter a file description.";
      valid = false;
    }
    if (fileType.invalidFileDescriptionError !== "" || fileType.invalidFileExtensionError !== "" || fileType.invalidFileNameError !== "") {
      valid = false;
    }

    if (!valid) {
      setFileType(updatedFileType);
      return;
    }

    // If the extension was changed, check if there is any data associated with the file.
    // Changing the extension can result in data loss, so we need to confirm with the user.
    if (oldFileExtension !== fileType.fileExtension) {
      // If this file type has an existing ID, check if it has data associated with it
      if (fileType.existingId !== '' && fileType.existingId !== undefined) {
        // If there are any files associated with the file type, there is associated data; show a confirmation modal
        let allFilesRes = await getAllFiles(auth.token, experimentIdToEdit, fileType.existingId);

        if (allFilesRes.httpStatus >= 500) {
          console.log(allFilesRes.message)
          return;
        }

        // Sort files by selected fileType
        allFilesRes.files = allFilesRes.files.filter((file) => file.fileType === fileType.existingId)

        // If any files exist, data exists for this filetype; do not edit extension yet, instead show a confirmation modal
        if (allFilesRes.files.length > 0) {
          showEditConfirmThenSaveFile(fileType, setFileType);
          return;
        }
      }
    }

    // Inputs are okay, try to save the file type
    onSaveFileType(fileType, setFileType);
  }



  return (
    <Container style={{ padding: "15px 45px", }}>
      <Row>
        <Row>
          {(fileType.existingId === '' || fileType.existingId === undefined) ?
            <h2>Create File Configuration</h2> :
            <h2>Edit File Configuration</h2>
          }
        </Row>
        <Row>
          <Col xs={8} className="d-flex justify-content-beginning mt-2">
            <FormGroup controlId="fileName" style={{ width: "100%" }}>
              <Form.Label>Filename</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="text"
                  required
                  value={fileType.fileName}
                  placeholder="Insert Filename"
                  onChange={(e) => {
                    handleFileNameChange(e.target.value);
                  }}
                  isInvalid={fileType.invalidFileNameError !== ""}
                />
                <Form.Control.Feedback type="invalid">
                  {fileType.invalidFileNameError}
                </Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
          </Col>
          <Col xs={4} className="d-flex justify-content-beginning mt-2">
            <FormGroup controlId="fileExtension" style={{ width: "100%" }}>
              <Form.Label>Extension</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="text"
                  required
                  maxLength={10}
                  value={fileType.fileExtension}
                  placeholder="Insert extension"
                  onChange={(e) => {
                    handleFileExtensionChange(e.target.value);
                  }}
                  isInvalid={fileType.invalidFileExtensionError !== ""}
                />
                <Form.Control.Feedback type="invalid">
                  {fileType.invalidFileExtensionError}
                </Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col xs={12} className="d-flex justify-content-beginning mt-2">
            <FormGroup controlId="fileDescription" style={{ width: "100%" }}>
              <Form.Label>Description</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required
                  value={fileType.fileDescription}
                  placeholder="Insert description for the file"
                  onChange={(e) => {
                    handleFileDescriptionChange(e.target.value);
                  }}
                  isInvalid={fileType.invalidFileDescriptionError !== ""}
                />
                <Form.Control.Feedback type="invalid">
                  {fileType.invalidFileDescriptionError}
                </Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
          </Col>
        </Row>
      </Row>
      <div style={{ height: '20px' }}></div>
      <Row>
        {showColumnDefEdit ? (
          <ColumnDefinitionForm
            onColumnDefinitionChange={handleColumnDefinitionChange}
            columnDefinition={fileType.columnDefinition}
          />
        ) : (
          <></>
        )
        }
      </Row>
      <Row>
        <Col xs={12}>
          <Row className="d-flex justify-content-end">
            {pendingChanges ? (
              <>
                <Button className="tertiary-button mt-3" onClick={onCloseFileEdit}>
                  Cancel
                </Button>
                <Button variant="primary" className="mt-3 ms-3" onClick={onSubmitFileType}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button className="tertiary-button mt-3" onClick={onCloseFileEdit}>
                  Back
                </Button>
              </>
            )}
          </Row >
        </Col>
      </Row>
    </Container >
  );
};

export default FileTypeAddAndEdit;