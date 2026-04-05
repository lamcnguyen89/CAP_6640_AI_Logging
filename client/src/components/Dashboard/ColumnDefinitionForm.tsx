import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, InputGroup, FormGroup, Form, Dropdown, Table, Image, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { ColumnDefinition, isCsharpKeyword } from './ExperimentFormTypes';
import dropdownArrowUpImg from "../../assets/dropdownArrowUp.png";
import dropdownArrowDownImg from "../../assets/dropdownArrowDown.png";
import deleteIcon from '../../assets/deleteRed.png';
import editIcon from '../../assets/edit.png';
import '../../styles/App.css';

// Props
interface ColumnDefinitionFormProps {
  // Callback function to update the parent component with the column definition
  onColumnDefinitionChange: (columnDefinition: ColumnDefinition) => void;
  // The column definition, a state from the parent component
  columnDefinition: ColumnDefinition;
}

const ColumnDefinitionForm: React.FC<ColumnDefinitionFormProps> = ({ onColumnDefinitionChange, columnDefinition }) => {
  const [columnName, setColumnName] = useState<string>("");
  const [invalidColumnNameError, setInvalidColumnNameError] = useState<string>("");
  const [columnDescription, setColumnDescription] = useState<string>("");
  const [invalidColumnDescriptionError, setInvalidColumnDescriptionError] = useState<string>("");
  const [selectedDataType, setSelectedDataType] = useState<string>("String");
  const [selectedTransformType, setSelectedTransformType] = useState<string>("None");

  const [editingColumnIdx, setEditingColumnIdx] = useState<number>(-1);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<boolean>(false);
  const [pendingDeleteColumnIdx, setPendingDeleteColumnIdx] = useState<number>(-1);

  const isValidName = (input: string) => /^[a-zA-Z0-9_]*$/.test(input);

  // When adding/editing a specific column via the column editing form, handles name change
  const onColumnNameChange = (value: string) => {
    setColumnName(value);
    if (!isValidName(value)) {
      setInvalidColumnNameError("Invalid input - Please remove any spaces and special characters.");
    } else if (isCsharpKeyword(value.toLowerCase())) {
      setInvalidColumnNameError("Invalid input - Column name cannot be a CSharp keyword (\"string\", \"class\", \"while\", etc.).");
    } else {
      // Check if this column name is a duplicate of any existing column names
      const isDuplicate = columnDefinition.columns.some((column) => column.name.toLowerCase() === value.toLowerCase() && column.name !== columnName);
      if (isDuplicate) {
        setInvalidColumnNameError("Invalid input - Column name already exists for this column definition.");
      } else {
        setInvalidColumnNameError("");
      }
    }
  };

  // When adding/editing a specific column via the column editing form, handles the change of the column description input
  const onColumnDescriptionChange = (value: string) => {
    setColumnDescription(value);
    setInvalidColumnDescriptionError("");
  };

  // When adding/editing a specific column via the column editing form, handles the change of the data type dropdown selection
  const handleDataTypeSelect = (eventKey: string) => {
    setSelectedDataType(eventKey);
  };

  // When adding/editing a specific column via the column editing form, handles the change of the transform dropdown selection
  const handleTransformTypeSelect = (eventKey: string) => {
    setSelectedTransformType(eventKey);
  };

  // Adds a new column to the column definition, according to the current column form info
  const onAddColumn = () => {
    const trimmedColumnName = columnName.trim();
    const trimmedColumnDescription = columnDescription.trim();
    let valid = true;

    // Validate name and description before continuing
    if (trimmedColumnName === "") {
      setInvalidColumnNameError("Please provide a valid column name.");
      valid = false;
    }
    if (trimmedColumnDescription === "") {
      setInvalidColumnDescriptionError("Please provide a valid column description.");
      valid = false;
    }
    if (invalidColumnNameError !== "" || invalidColumnDescriptionError !== "") {
      valid = false;
    }

    if (!valid) {
      return;
    }

    // Create new column in the column definition's columns array
    const updatedColumnDefinition = { ...columnDefinition };
    const updatedColumns = [...updatedColumnDefinition.columns];
    updatedColumns.push({
      name: trimmedColumnName,
      description: trimmedColumnDescription,
      dataType: selectedDataType,
      transform: "None",
      existingId: undefined,
      needsUpdate: true,
    })
    updatedColumnDefinition.columns = updatedColumns;
    updatedColumnDefinition.needsUpdate = true;
    ResetColumnFields();
    onColumnDefinitionChange(updatedColumnDefinition);
  };

  // Begins editing a column by index, populating its info to the editing form
  const onBeginEditColumn = (index) => {
    const column = columnDefinition.columns[index];
    setColumnName(column.name);
    setColumnDescription(column.description);
    setSelectedDataType(column.dataType);
    setSelectedTransformType(column.transform);
    setEditingColumnIdx(index);
  };

  // Finishes editing the current column
  const onFinishEditingColumn = () => {
    const trimmedColumnName = columnName.trim();
    const trimmedColumnDescription = columnDescription.trim();
    let valid = true;

    // Validate name and description before continuing
    if (trimmedColumnName === "") {
      setInvalidColumnNameError("Please provide a valid column name.");
      valid = false;
    }
    if (trimmedColumnDescription === "") {
      setInvalidColumnDescriptionError("Please provide a valid column description.");
      valid = false;
    }
    if (invalidColumnNameError !== "" || invalidColumnDescriptionError !== "") {
      valid = false;
    }

    if (!valid) {
      return;
    }

    // Creates a new column object, and replaces the old column with the new column in the columns array
    const newColumn = {
      name: trimmedColumnName,
      description: trimmedColumnDescription,
      dataType: selectedDataType,
      transform: "None",
      existingId: columnDefinition.columns[editingColumnIdx].existingId,
      needsUpdate: true,
    };

    const updatedColumnDefinition = { ...columnDefinition };
    const updatedColumns = [...updatedColumnDefinition.columns];
    updatedColumns[editingColumnIdx] = newColumn;
    updatedColumnDefinition.columns = updatedColumns;
    updatedColumnDefinition.needsUpdate = true;
    ResetColumnFields();
    onColumnDefinitionChange(updatedColumnDefinition);
  };

  // Cancels editing the current column and clears the add/edit form
  const onCancelEditingColumn = () => {
    ResetColumnFields();
  };

  // Resets all column adding / editing fields, clearing the add/edit form
  const ResetColumnFields = () => {
    setColumnName("");
    setColumnDescription("");
    setSelectedDataType("String");
    setSelectedTransformType("None");
    setInvalidColumnNameError("");
    setInvalidColumnDescriptionError("");
    setEditingColumnIdx(-1);
  };

  // Marks column for deletion and prompts user to confirm deletion
  const onDeleteColumn = (index) => {
    setShowConfirmDeleteModal(true);
    setPendingDeleteColumnIdx(index);
  };

  // Deletes column from the columns array and updates the columnIdsToDelete array
  const confirmDeleteColumn = () => {
    if (pendingDeleteColumnIdx === -1) {
      return;
    }

    if (editingColumnIdx === pendingDeleteColumnIdx) {
      ResetColumnFields();
    }

    const updatedColumnDefinition = { ...columnDefinition };
    if (updatedColumnDefinition.columns[pendingDeleteColumnIdx].existingId !== undefined) {
      const updatedColumnIdsToRemove = [...updatedColumnDefinition.columnIdsToDelete, updatedColumnDefinition.columns[pendingDeleteColumnIdx].existingId];
      updatedColumnDefinition.columnIdsToDelete = updatedColumnIdsToRemove;
    }

    const updatedColumns = [...updatedColumnDefinition.columns];
    updatedColumns.splice(pendingDeleteColumnIdx, 1);
    updatedColumnDefinition.columns = updatedColumns;
    updatedColumnDefinition.needsUpdate = true;
    onColumnDefinitionChange(updatedColumnDefinition);
    setShowConfirmDeleteModal(false);
  }

  // Cancels the marked deletion of a column
  const cancelDeleteColumn = () => {
    setShowConfirmDeleteModal(false);
    setPendingDeleteColumnIdx(-1);
  }

  // Swaps the column at the given index with the column above it
  const onSwapColumnUp = (index) => {
    const updatedColumnDefinition = { ...columnDefinition };
    const updatedColumns = [...updatedColumnDefinition.columns];
    const temp = updatedColumns[index];
    updatedColumns[index] = updatedColumns[index - 1];
    updatedColumns[index - 1] = temp;

    if (editingColumnIdx === index) {
      setEditingColumnIdx(index - 1);
    }

    updatedColumnDefinition.columns = updatedColumns;
    updatedColumnDefinition.needsUpdate = true;
    onColumnDefinitionChange(updatedColumnDefinition);
  };

  // Swaps the column at the given index with the column below it
  const onSwapColumnDown = (index) => {
    const updatedColumnDefinition = { ...columnDefinition };
    const updatedColumns = [...updatedColumnDefinition.columns];
    const temp = updatedColumns[index];
    updatedColumns[index] = updatedColumns[index + 1];
    updatedColumns[index + 1] = temp;

    if (editingColumnIdx === index) {
      setEditingColumnIdx(index + 1);
    }

    updatedColumnDefinition.columns = updatedColumns;
    updatedColumnDefinition.needsUpdate = true;
    onColumnDefinitionChange(updatedColumnDefinition);
  };



  return (
    <Container>
      <Modal show={showConfirmDeleteModal}>
        <Modal.Header>
          <Modal.Body><b>Are you sure you want to delete this column?</b></Modal.Body>
        </Modal.Header>
        <Modal.Footer className="justify-content-center">
          <Button className="tertiary-button me-4" onClick={cancelDeleteColumn}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmDeleteColumn}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      <Row className="gx-0">
        <h2>CSV Column Metadata Configuration</h2>
      </Row>
      <Row className="gx-0">
        <Container style={{ border: "none", borderRadius: "5px", padding: "15px 45px", backgroundColor: "#EEE7ED", width: "fit-content", margin: 0 }}>
          <Row>
            <Col xs={"auto"} className="d-flex justify-content-end" style={{ marginBottom: "15px" }}>
              <FormGroup controlId="columnName" style={{ width: "200px" }}>
                <Form.Label>Column Name</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control
                    type="text"
                    required={false}
                    value={columnName}
                    placeholder="Column name"
                    onChange={(e) => {
                      onColumnNameChange(e.target.value);
                    }}
                    isInvalid={invalidColumnNameError !== ""}
                  />
                  <Form.Control.Feedback type="invalid">
                    {invalidColumnNameError}
                  </Form.Control.Feedback>
                </InputGroup>
              </FormGroup>
            </Col>
            <Col xs={"auto"} className="d-flex justify-content-end" style={{ marginBottom: "15px" }}>
              <FormGroup controlId="columnDataType">
                <Form.Label>Data Type</Form.Label>
                <Dropdown className="column-def-dropdown" onSelect={handleDataTypeSelect}>
                  <Dropdown.Toggle className="column-def-dropdown-toggle" variant="primary" id="dropdown-basic">{selectedDataType}</Dropdown.Toggle>
                  <Dropdown.Menu>
                    <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-download">A string of text characters</Tooltip>}>
                      <Dropdown.Item className="column-def-dropdown-item" eventKey="String">String</Dropdown.Item>
                    </OverlayTrigger>
                    <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-download">A number with no decimal functionality</Tooltip>}>
                      <Dropdown.Item className="column-def-dropdown-item" eventKey="Integer">Integer</Dropdown.Item>
                    </OverlayTrigger>
                    <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-download">A number with decimal functionality</Tooltip>}>
                      <Dropdown.Item className="column-def-dropdown-item" eventKey="Float">Float</Dropdown.Item>
                    </OverlayTrigger>
                    <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-download">A true/false value</Tooltip>}>
                      <Dropdown.Item className="column-def-dropdown-item" eventKey="Boolean">Boolean</Dropdown.Item>
                    </OverlayTrigger>
                    <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-download">A Unity GameObject's position, rotation, and scale</Tooltip>}>
                      <Dropdown.Item className="column-def-dropdown-item" eventKey="Transform">Transform</Dropdown.Item>
                    </OverlayTrigger>
                    <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-download">A date and time signifier</Tooltip>}>
                      <Dropdown.Item className="column-def-dropdown-item" eventKey="Date">Date</Dropdown.Item>
                    </OverlayTrigger>
                  </Dropdown.Menu>
                </Dropdown>
              </FormGroup>
            </Col>
            {/* "Transform" dropdown is not currently used, but is left here for future use
            <Col xs={"auto"} className="d-flex justify-content-end" style={{ marginBottom: "15px" }}>
              <FormGroup controlId="columnTransformType">
                <Form.Label>Transform</Form.Label>
                <Dropdown className="column-def-dropdown" onSelect={handleTransformTypeSelect}>
                  <Dropdown.Toggle className="column-def-dropdown-toggle" variant="primary" id="dropdown-basic">{selectedTransformType}</Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="None">None</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Uppercase">Uppercase</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Lowercase">Lowercase</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Trim">Trim</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Round (2)">Round (2)</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Round (4)">Round (4)</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Normalize">Normalize</Dropdown.Item>
                    <Dropdown.Item className="column-def-dropdown-item" eventKey="Custom">Custom</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </FormGroup>
            </Col>
            */}
          </Row>
          <Row>
            <Col className="d-flex" style={{ marginBottom: "15px" }}>
              <FormGroup controlId="columnDescription" style={{ width: "100%" }}>
                <Form.Label>Column Description</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    type="text"
                    required={false}
                    value={columnDescription}
                    placeholder="Brief description of this column"
                    onChange={(e) => {
                      onColumnDescriptionChange(e.target.value);
                    }}
                    isInvalid={invalidColumnDescriptionError !== ""}
                  />
                  <Form.Control.Feedback type="invalid">
                    {invalidColumnDescriptionError}
                  </Form.Control.Feedback>
                </InputGroup>
              </FormGroup>
            </Col>
          </Row>
          <Row className="d-flex justify-content-end" style={{ marginBottom: "15px" }}>
            {editingColumnIdx !== -1 ? (
              <>
                <Button variant="secondary" className="me-3" style={{ width: "80px" }} onClick={onCancelEditingColumn}>
                  Cancel
                </Button>
                <Button variant="primary" style={{ width: "160px" }} onClick={onFinishEditingColumn}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="primary" style={{ width: "160px" }} onClick={onAddColumn}>
                Add Column
              </Button>
            )}
          </Row>
        </Container>
      </Row>
      <div style={{ height: '20px' }}></div>
      <Row className="gx-0">
        <Col>
          <Table bordered>
            <thead>
              <tr>
                <th className="column-def-table-header">Order</th>
                <th className="column-def-table-header">Column Name</th>
                <th className="column-def-table-header">Data Type</th>
                {/*<th className="column-def-table-header">Transform</th>*/}
                <th className="column-def-table-header">Description</th>
                <th className="column-def-table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {columnDefinition.columns.map((column, index) => (
                <tr key={index}>
                  <td className="p-0 g-0 align-middle" style={{ fontWeight: "bold" }}>
                    <Row className="d-flex justify-content-center align-items-center p-0 g-0">
                      <Col xs="auto" className="p-0 g-0" style={{ fontWeight: "bold" }}>
                        {index + 1}
                      </Col>
                      {index == 2 && index != columnDefinition.columns.length - 1 && (
                        <Col xs="auto" className="p-0 g-0">
                          <Row className="g-0 p-0">
                            <Button
                              size="sm"
                              className="column-def-rearrange-btn"
                            ></Button>
                          </Row>
                          <Row className="g-0 p-0">
                            <Button
                              size="sm"
                              className="column-def-rearrange-btn"
                              onClick={() => onSwapColumnDown(index)}
                            >
                              <Image src={dropdownArrowDownImg} style={{ height: "8px", width: "24px" }} />
                            </Button>
                          </Row>
                        </Col>
                      )}
                      {index > 2 && index != columnDefinition.columns.length - 1 && (
                        <Col xs="auto" className="p-0 g-0">
                          <Row className="g-0 p-0">
                            <Button
                              size="sm"
                              className="column-def-rearrange-btn"
                              onClick={() => onSwapColumnUp(index)}
                            >
                              <Image src={dropdownArrowUpImg} style={{ height: "8px", width: "24px", padding: "0px", margin: "0px", }} />
                            </Button>
                          </Row>
                          <Row className="g-0 p-0">
                            <Button
                              size="sm"
                              className="column-def-rearrange-btn"
                              onClick={() => onSwapColumnDown(index)}
                            >
                              <Image src={dropdownArrowDownImg} style={{ height: "8px", width: "24px" }} />
                            </Button>
                          </Row>
                        </Col>
                      )}
                      {index > 2 && index == columnDefinition.columns.length - 1 && (
                        <Col xs="auto" className="p-0 g-0">
                          <Row className="g-0 p-0">
                            <Button
                              size="sm"
                              className="column-def-rearrange-btn"
                              onClick={() => onSwapColumnUp(index)}
                            >
                              <Image src={dropdownArrowUpImg} style={{ height: "8px", width: "24px", padding: "0px", margin: "0px", }} />
                            </Button>
                          </Row>
                          <Row className="g-0 p-0">
                            <Button
                              size="sm"
                              className="column-def-rearrange-btn"
                            ></Button>
                          </Row>
                        </Col>
                      )}
                    </Row>
                  </td>
                  <td className="align-middle">{column.name}</td>
                  <td className="align-middle" style={{ color: "#209E57" }}>{column.dataType}</td>
                  {/*<td className="align-middle" style={{ color: "#1C7CED" }}>{column.transform}</td>*/}
                  <td className="align-middle">{column.description}</td>
                  <td className="d-flex align-middle justify-content-center">
                    {index < 2 ? (
                      <>
                        <Image className="dashboard-icons me-4" src={editIcon} alt="Edit Icon" style={{ filter: "opacity(0.2)", cursor: "default" }} />
                        <Image className="dashboard-icons" src={deleteIcon} alt="Delete Icon" style={{ filter: "opacity(0.2)", cursor: "default" }} />
                      </>
                    ) : (
                      <>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Edit</Tooltip>}>
                          <Image className="dashboard-icons me-4" src={editIcon} alt="Edit Icon" onClick={() => onBeginEditColumn(index)} />
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Delete</Tooltip>}>
                          <Image className="dashboard-icons" src={deleteIcon} alt="Delete Icon" onClick={() => onDeleteColumn(index)} />
                        </OverlayTrigger>
                      </>
                    )}

                  </td>
                </tr>
              ))
              }
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}

export default ColumnDefinitionForm;
