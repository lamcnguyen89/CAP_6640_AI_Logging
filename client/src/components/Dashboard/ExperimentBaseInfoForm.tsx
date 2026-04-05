import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Container,
  Form,
  FormGroup,
  InputGroup,
  Row,
  Col,
  Modal,
  OverlayTrigger,
  Tooltip,
  Image,
  Button,
} from "react-bootstrap";
import { ExperimentBaseInfo } from "./ExperimentFormTypes";
import InfoIcon from "../../assets/Info_Icon.png";
import downloadIcon from "../../assets/download_icon_purple.svg";
import uploadIcon from "../../assets/upload-icon-white.png";
import syncIcon from "../../assets/sync_icon_purple.svg";
import deleteIcon from "../../assets/delete_icon_purple.svg";
import "../../styles/App.css";

// Props
interface BaseInfoFormProps {
  // Callback function to update the parent component with the base info
  onBaseInfoChange: (baseInfo: ExperimentBaseInfo) => void;
  expBaseInfo: ExperimentBaseInfo; // The base info of the experiment, a state from the parent component
  removeIrbLetter: () => void;
  permissionRole: string;
}

const ExperimentBaseInfoForm: React.FC<BaseInfoFormProps> = ({
  onBaseInfoChange,
  expBaseInfo,
  removeIrbLetter,
  permissionRole,
}) => {
  // Validation of inputs (base input and emails)
  const isValidInput = (input: string) => /^[a-zA-Z0-9\s]*$/.test(input);
  const emailIsValid = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  // Handles a change to the "name" field
  const handleNameChange = (name: string) => {
    if (isValidInput(name)) {
      onBaseInfoChange({ ...expBaseInfo, name, nameError: "" });
    } else {
      onBaseInfoChange({
        ...expBaseInfo,
        name,
        nameError:
          "Please use only numbers and letters in your experiment name.",
      });
    }
  };

  // Handles a change to the "description" field
  const handleDescriptionChange = (description: string) => {
    onBaseInfoChange({ ...expBaseInfo, description, descriptionError: "" });
  };

  // Handles a change to the "IRB protocol number" field
  const handleIRBNumberChange = (irbProtocolNumber: string) => {
    if (isValidInput(irbProtocolNumber)) {
      onBaseInfoChange({
        ...expBaseInfo,
        irbProtocolNumber,
        irbProtocolNumberError: "",
      });
    } else {
      onBaseInfoChange({
        ...expBaseInfo,
        irbProtocolNumber,
        irbProtocolNumberError:
          "Please use only numbers and letters in your IRB protocol number.",
      });
    }
  };

  // Handles a change to the "IRB email address" field
  const handleIRBEmailChange = (irbEmailAddress: string) => {
    if (emailIsValid(irbEmailAddress)) {
      onBaseInfoChange({
        ...expBaseInfo,
        irbEmailAddress,
        irbEmailAddressError: "",
      });
    } else {
      onBaseInfoChange({
        ...expBaseInfo,
        irbEmailAddress,
        irbEmailAddressError: "Please provide a valid email.",
      });
    }
  };

  // Handles a change to the "IRB email address" field
  const handleIRBLetterChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files) {
        let irbLetter = e.target.files[0];
        console.log(irbLetter);

        if (irbLetter.size >= 5e7) {
          onBaseInfoChange({
            ...expBaseInfo,
            irbLetter: "",
            irbLetterError: "Irb Letter too large",
          });
          return;
        } else {
          onBaseInfoChange({ ...expBaseInfo, irbLetter, irbLetterError: "" });
        }
      }
    } catch (err) {
      console.log("Error Uploading Files");
    }
  };

  // Handle IRB Download
  const handleIRBDownload = (fileName: string, data: any) => {
    //1. Convert Base64 string sent from the server back to binary data so that it can be added to a blob
    const binaryData = atob(data);

    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }

    // Create Blob
    const blob = new Blob([uint8Array], { type: "application/pdf" });

    // Generate URL
    const fileUrl = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
  };

  const handleIRBLetterCheckDownload = (blob: Blob) => {
    // Generate URL
    const fileUrl = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${expBaseInfo.irbLetter.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
  };

  // Handles a change to the "IRB email address" field
  const handleDeleteIRBLetter = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      onBaseInfoChange({ ...expBaseInfo, irbLetter: "", irbLetterError: "" });

      if (expBaseInfo.irbLetterDownload) {
        onBaseInfoChange({
          ...expBaseInfo,
          irbLetterDownload: "",
          irbLetterError: "",
        });
        removeIrbLetter();
      }
    } catch (err) {
      console.log("Error Uploading Files");
    }
  };

  return (
    <Container
      style={{
        border: "1px solid lightgrey",
        borderRadius: "5px",
        padding: "15px 45px",
        backgroundColor: "#EEE7ED",
      }}
    >
      <Row>
        <Col lg={5} xl={4}>
          <FormGroup className="mb-4" controlId="experimentName">
            <Form.Label>Title of the Experiment</Form.Label>
            <InputGroup hasValidation>
              <OverlayTrigger
                show={
                  permissionRole !== "Admin" && permissionRole !== "Creator"
                    ? undefined
                    : false
                }
                placement="top"
                overlay={
                  <Tooltip id="tooltip-name-disabled">
                    You don't have permissions to edit the title
                  </Tooltip>
                }
              >
                <Form.Control
                  type="text"
                  required
                  value={expBaseInfo.name}
                  placeholder="Add a title to identify your experiment"
                  onChange={(e) => {
                    handleNameChange(e.target.value);
                  }}
                  isInvalid={expBaseInfo.nameError !== ""}
                  disabled={
                    permissionRole !== "Admin" && permissionRole !== "Creator"
                  }
                />
              </OverlayTrigger>
              <Form.Control.Feedback type="invalid">
                {expBaseInfo.nameError}
              </Form.Control.Feedback>
            </InputGroup>
          </FormGroup>
          <FormGroup className="mb-4" controlId="experimentDescription">
            <Form.Label>Experiment Description</Form.Label>
            <InputGroup hasValidation>
              <OverlayTrigger
                show={
                  permissionRole !== "Admin" && permissionRole !== "Creator"
                    ? undefined
                    : false
                }
                placement="top"
                overlay={
                  <Tooltip id="tooltip-description-disabled">
                    You don't have permissions to edit the description
                  </Tooltip>
                }
              >
                <Form.Control
                  as="textarea"
                  rows={6}
                  required
                  value={expBaseInfo.description}
                  placeholder="Add a description of your experiment that includes the goal of the experiment"
                  onChange={(e) => {
                    handleDescriptionChange(e.target.value);
                  }}
                  isInvalid={expBaseInfo.descriptionError !== ""}
                  disabled={
                    permissionRole !== "Admin" && permissionRole !== "Creator"
                  }
                />
              </OverlayTrigger>
              <Form.Control.Feedback type="invalid">
                {expBaseInfo.descriptionError}
              </Form.Control.Feedback>
            </InputGroup>
          </FormGroup>
        </Col>
        {/* IRB INFORMATION */}
        <Col lg={0} xl={2}></Col>
        <Col lg={6} xl={4}>
          <FormGroup className="mb-4" controlId="irbNumber">
            <Form.Label>IRB Protocol Number</Form.Label>
            <InputGroup hasValidation>
              <OverlayTrigger
                show={
                  permissionRole !== "Admin" && permissionRole !== "Creator"
                    ? undefined
                    : false
                }
                placement="top"
                overlay={
                  <Tooltip id="tooltip-irb-number-disabled">
                    You don't have permissions to edit the IRB information
                  </Tooltip>
                }
              >
                <Form.Control
                  type="text"
                  required
                  value={expBaseInfo.irbProtocolNumber}
                  placeholder="Provide your approval's protocol number"
                  onChange={(e) => handleIRBNumberChange(e.target.value)}
                  isInvalid={expBaseInfo.irbProtocolNumberError !== ""}
                  disabled={
                    permissionRole !== "Admin" && permissionRole !== "Creator"
                  }
                />
              </OverlayTrigger>
              <Form.Control.Feedback type="invalid">
                {expBaseInfo.irbProtocolNumberError}
              </Form.Control.Feedback>
            </InputGroup>
          </FormGroup>

          <FormGroup className="mb-4" controlId="irbEmail">
            <Form.Label>
              <Col>
                IRB Email Address
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="tooltip-white" className="white-tooltip">
                      Provide your institution's IRB email address enabling us
                      to notify your IRB regarding your study on VERA when you
                      are ready to commence the collection of data involving
                      human subjects.
                    </Tooltip>
                  }
                >
                  <Image
                    src={InfoIcon}
                    style={{ width: "16px", marginLeft: "10px" }}
                  />
                </OverlayTrigger>
              </Col>
            </Form.Label>
            <InputGroup hasValidation>
              <OverlayTrigger
                show={
                  permissionRole !== "Admin" && permissionRole !== "Creator"
                    ? undefined
                    : false
                }
                placement="top"
                overlay={
                  <Tooltip id="tooltip-irb-email-disabled">
                    You don't have permissions to edit the IRB information
                  </Tooltip>
                }
              >
                <Form.Control
                  type="text"
                  required
                  value={expBaseInfo.irbEmailAddress}
                  placeholder="Provide your institution's IRB email ID"
                  onChange={(e) => {
                    handleIRBEmailChange(e.target.value);
                  }}
                  isInvalid={expBaseInfo.irbEmailAddressError !== ""}
                  disabled={
                    permissionRole !== "Admin" && permissionRole !== "Creator"
                  }
                />
              </OverlayTrigger>
              <Form.Control.Feedback type="invalid">
                {expBaseInfo.irbEmailAddressError}
              </Form.Control.Feedback>
            </InputGroup>
          </FormGroup>
          <FormGroup className="mb-4">
            {/* Label row */}
            <Form.Label className="d-block mb-2">
              IRB Approval Letter
            </Form.Label>

            {/* Button row */}
            {(expBaseInfo.irbLetterDownload == "" &&
              expBaseInfo.irbLetter == "") ||
            (!expBaseInfo.irbLetterDownload && !expBaseInfo.irbLetter) ? (
              <>
                <div className="d-flex gap-2">
                  {/* Upload/Replace Button */}
                  <OverlayTrigger
                    show={
                      permissionRole !== "Admin" && permissionRole !== "Creator"
                        ? undefined
                        : false
                    }
                    placement="top"
                    overlay={
                      <Tooltip id="tooltip-irb-upload-disabled">
                        You don't have permissions to edit the IRB information
                      </Tooltip>
                    }
                  >
                    <Button
                      as="label"
                      variant="secondary"
                      htmlFor="irbLetter"
                      style={{
                        cursor: permissionRole !== "Admin" && permissionRole !== "Creator" ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        width: "140px",
                      }}
                      disabled={
                        permissionRole !== "Admin" &&
                        permissionRole !== "Creator"
                      }
                    >
                      <Image className="me-2" src={uploadIcon} />
                      Upload
                    </Button>
                  </OverlayTrigger>
                </div>

                {/* Hidden file input */}
                <Form.Control
                  type="file"
                  id="irbLetter"
                  accept=".pdf"
                  onChange={(e) => {
                    handleIRBLetterChange(e);
                  }}
                  style={{ display: "none" }}
                  isInvalid={expBaseInfo.irbLetterError !== ""}
                  disabled={
                    permissionRole !== "Admin" && permissionRole !== "Creator"
                  }
                />
              </>
            ) : (
              <Row>
                <Col className="d-flex align-items-center">
                  <div>
                    <b>
                      {expBaseInfo.irbLetter
                        ? `${expBaseInfo.irbLetter.name}`
                        : expBaseInfo.irbLetterDownload
                        ? `${expBaseInfo.irbLetterName}.pdf`
                        : "IRB Letter Uploaded"}
                    </b>
                  </div>
                </Col>
                <Col className="d-flex align-items-center">
                  <div
                    className="btn-group pt-2 pb-2 pe-3 ps-3"
                    style={{
                      border: "1px solid #644F64",
                      backgroundColor: "#E8E8E8",
                      width: "120px",
                      height: "36px",
                    }}
                  >
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip
                          id="tooltip-download"
                          className="white-tooltip"
                        >
                          {permissionRole !== "Admin" &&
                          permissionRole !== "Creator"
                            ? "Only Admins and Creators can download IRB letters"
                            : "Download IRB Letter"}
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="outline-primary"
                        onClick={() => {
                          if (
                            expBaseInfo.irbLetterDownload &&
                            !expBaseInfo.irbLetter
                          ) {
                            // If New IRB Letter is not uploaded and old IRB Letter is stored in database, download IRB Letter from database
                            handleIRBDownload(
                              expBaseInfo.irbLetterName,
                              expBaseInfo.irbLetterDownload
                            );
                          } else if (
                            expBaseInfo.irbLetter &&
                            expBaseInfo.irbLetterDownload
                          ) {
                            // If a new IRB Letter is staged to be saved to the Database and the Old IRB Letter is saved in the database, download the new IRB Letter
                            handleIRBLetterCheckDownload(expBaseInfo.irbLetter);
                          } else if (
                            expBaseInfo.irbLetter &&
                            !expBaseInfo.irbLetterDownload
                          ) {
                            // If new IRB Letter is staged to be saved in the database and there is no IRB Letter saved in the database, download new IRB Letter
                            handleIRBLetterCheckDownload(expBaseInfo.irbLetter);
                          } else {
                            console.log("No IRB Letter Available for download");
                          }
                        }}
                        style={{
                          padding: 0, // Remove button padding
                          border: "none", // Remove border
                          background: "transparent", // Remove background
                          display: "inline-flex", // For proper image alignment
                          alignItems: "center", // Center vertically
                          justifyContent: "center", // Center horizontally
                          marginLeft: "5px",
                          marginRight: "5px",
                          cursor: permissionRole !== "Admin" && permissionRole !== "Creator" ? "not-allowed" : "pointer",
                        }}
                        disabled={
                          permissionRole !== "Admin" &&
                          permissionRole !== "Creator"
                        }
                      >
                        <Image
                          src={downloadIcon}
                          style={{
                            width: "100%", // Fill button width
                            height: "100%", // Fill button height
                            objectFit: "contain", // Maintain aspect ratio
                            maxWidth: "16px", // Ensure it doesn't overflow
                            maxHeight: "16px", // Ensure it doesn't overflow
                          }}
                        />
                      </Button>
                    </OverlayTrigger>

                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="tooltip-replace" className="white-tooltip">
                          {permissionRole !== "Admin" &&
                          permissionRole !== "Creator"
                            ? "Only Admins and Creators can upload or replace IRB letters"
                            : "Upload or replace IRB Letter"}
                        </Tooltip>
                      }
                    >
                      <Button
                        as="label"
                        variant="outline-primary"
                        htmlFor="irbLetter"
                        style={{
                          padding: 0, // Remove button padding
                          border: "none", // Remove border
                          background: "transparent", // Remove background
                          display: "inline-flex", // For proper image alignment
                          alignItems: "center", // Center vertically
                          justifyContent: "center", // Center horizontally
                          marginLeft: "10px",
                          marginRight: "10px",
                          cursor: permissionRole !== "Admin" && permissionRole !== "Creator" ? "not-allowed" : "pointer",
                        }}
                        disabled={
                          permissionRole !== "Admin" &&
                          permissionRole !== "Creator"
                        }
                      >
                        <Image
                          className="me-2"
                          src={syncIcon}
                          style={{
                            width: "100%", // Fill button width
                            height: "100%", // Fill button height
                            objectFit: "contain", // Maintain aspect ratio
                            maxWidth: "16px", // Ensure it doesn't overflow
                            maxHeight: "16px", // Ensure it doesn't overflow
                          }}
                        />
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="tooltip-delete" className="white-tooltip">
                          {permissionRole !== "Admin" &&
                          permissionRole !== "Creator"
                            ? "Only Admins and Creators can delete IRB letters"
                            : "Delete IRB Letter"}
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="outline-primary"
                        style={{
                          padding: 0, // Remove button padding
                          border: "none", // Remove border
                          background: "transparent", // Remove background
                          display: "inline-flex", // For proper image alignment
                          alignItems: "center", // Center vertically
                          justifyContent: "center", // Center horizontally
                          marginLeft: "0px",
                          marginRight: "5px",
                          cursor: permissionRole !== "Admin" && permissionRole !== "Creator" ? "not-allowed" : "pointer",
                        }}
                        onClick={handleDeleteIRBLetter}
                        disabled={
                          permissionRole !== "Admin" &&
                          permissionRole !== "Creator"
                        }
                      >
                        <Image
                          src={deleteIcon}
                          style={{
                            width: "100%", // Fill button width
                            height: "100%", // Fill button height
                            objectFit: "contain", // Maintain aspect ratio
                            maxWidth: "16px", // Ensure it doesn't overflow
                            maxHeight: "16px", // Ensure it doesn't overflow
                          }}
                        />
                      </Button>
                    </OverlayTrigger>
                    <Form.Control
                      type="file"
                      id="irbLetter"
                      accept=".pdf"
                      onChange={(e) => {
                        handleIRBLetterChange(e);
                      }}
                      style={{ display: "none" }}
                    />
                  </div>
                </Col>
              </Row>
            )}
            <Form.Control.Feedback type="invalid">
              {expBaseInfo.irbLetterError}
            </Form.Control.Feedback>
          </FormGroup>

          <p style={{ fontSize: "14px", color: "#242424", fontWeight: "590" }}>
            Note: You do not need an IRB Protocol Number to create an experiment
            on VERA. However, you cannot gather human subjects data on VERA
            without IRB approval.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default ExperimentBaseInfoForm;
