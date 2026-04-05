import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router'
import { connect } from 'react-redux'
import { finalizeSetup } from '../../helpers/AuthApiHelper'
import { Container, Row, Col, Form, FormGroup, InputGroup, Button, Modal, Dropdown } from "react-bootstrap"
import DropdownWithAddOption from './DropdownWithAddOption'
import { Institution, Lab } from '../../helpers/InstitutionHelper'
import { fetchInstitutions, fetchLabs, handleAddInstitution, handleAddLab } from '../../helpers/InstitutionHelper'

interface ISetupUserInfoFormProps {
  userId: string;
}

type FormElement = React.FormEvent<HTMLFormElement>

const SetupUserInfoForm: React.FC<ISetupUserInfoFormProps> = ({ userId }) => {
  const history = useHistory();

  // States for registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // States for errors and loading
  const [loading, setLoading] = useState(false);
  const [genericError, setGenericError] = useState("");
  const [invalidFirstName, setInvalidFirstName] = useState("");
  const [invalidLastName, setInvalidLastName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // States for institutions and labs
  const [institution, setInstitution] = useState("");
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [lab, setLab] = useState("");
  const [allLabs, setAllLabs] = useState<Lab[]>([]);
  const [invalidInstitution, setInvalidInstitution] = useState("");
  const [invalidLab, setInvalidLab] = useState("");

  // Effect to fetch institutions on component mount
  useEffect(() => {
    fetchInstitutions(setAllInstitutions);
  }, []);

  // Effect to fetch labs when institution changes
  useEffect(() => {
    fetchLabs(institution, allInstitutions, setAllLabs);
    setLab("");
  }, [institution]);

  // Handles institution selection change
  const handleInstitutionChange = (value: string) => {
    setInstitution(value);
    setInvalidInstitution("");
  }

  // Handles lab selection change
  const handleLabChange = (value: string) => {
    setLab(value);
    setInvalidLab("");
  }

  // Handles adding a new institution option
  const addInstitutionOption = (newInstitutionName: string) => {
    handleAddInstitution(allInstitutions, setAllInstitutions, setInstitution, setInvalidInstitution, newInstitutionName);
  }

  // Handles adding a new lab option
  const addLabOption = (newLabName: string) => {
    handleAddLab(institution, allInstitutions, allLabs, setAllLabs, setLab, setInvalidLab, newLabName);
  }

  // Functions for showing and hiding modals
  const handleShowSuccessModal = () => {
    setShowSuccessModal(true)
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    history.replace("/vera-portal/dashboard")
  }

  // Functions for determining whether input is valid
  const isAlphanumerical = (input: string) => /^[a-zA-Z0-9\s]+$/.test(input);

  // Checks whether given first name is valid, and updates feedback error messages accordingly
  const checkValidFirstName = (nameToCheck) => {
    let trimmedName = nameToCheck.trim();

    if (!trimmedName) {
      setInvalidFirstName("Please provide a first name.");
      return false;
    }
    else if (!isAlphanumerical(trimmedName)) {
      setInvalidFirstName("Please only use alphanumeric characters (A-Z, 0-9).");
      return false;
    }
    else {
      setInvalidFirstName("");
      return true;
    }
  }

  // Checks whether given last name is valid, and updates feedback error messages accordingly
  const checkValidLastName = (nameToCheck) => {
    let trimmedName = nameToCheck.trim();

    if (!trimmedName) {
      setInvalidLastName("Please provide a last name.");
      return false;
    }
    else if (!isAlphanumerical(trimmedName)) {
      setInvalidLastName("Please only use alphanumeric characters (A-Z, 0-9).");
      return false;
    }
    else {
      setInvalidLastName("");
      return true;
    }
  }

  // Tries to finalize the user's setup given the current credentials inputted
  const tryFinalizeSetup = (e: FormElement): void => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // Check if a field has not been filled out, or contains invalid inputs
    let invalid = false;

    if (checkValidFirstName(trimmedFirstName) === false) {
      invalid = true;
    }
    if (checkValidLastName(trimmedLastName) === false) {
      invalid = true;
    }
    const institutionObj = allInstitutions.find(inst => inst.name === institution);
    const institutionId = institutionObj ? institutionObj.id : "";
    if (!institution || institution === "Select your institution" || institutionId === "") {
      setInvalidInstitution("Please select an institution.");
      invalid = true;
    }
    const labObj = allLabs.find(l => l.name === lab);
    const labId = labObj ? labObj.id : "";
    if (!lab || lab === "Select your lab" || labId === "") {
      setInvalidLab("Please select a lab.");
      invalid = true;
    }    // If there are no errors, continue.
    if (!invalid) {
      // Execute reCAPTCHA v3
      if (window.grecaptcha) {
        window.grecaptcha.execute('6Lc4l2UqAAAAAD2Rzifl28ffROgI0ugpf9bClY3c', { action: 'register' }).then((captchaToken: string) => {
          // Call finalizeSetup function - now handles success via Redux
          finalizeSetup(userId, trimmedFirstName, trimmedLastName, institutionId, labId, captchaToken, (error: any) => {
            // Handle error case
            console.log('Setup finalization failed, error: ', error);
            let err = error.error;
            
            if (err && err.toString() === "TypeError: Failed to fetch") {
              setGenericError("Could not connect to the server. Please try again later.");
            } else if (err && err.toString() === "ReCAPTCHA verification failed") {
              setGenericError("ReCAPTCHA verification failed. Please refresh the page and try again.");
            } else {
              setGenericError("An unknown error occurred while setting up your account. Please refresh the page and try again.");
            }
            setLoading(false);
          });
          
          // Show success modal - the redirect will be handled by Redux state change
          handleShowSuccessModal();
          console.log('Setup finalization dispatched successfully');
          setLoading(false);
        }).catch(() => {
          setGenericError("ReCAPTCHA verification failed. Please refresh the page and try again.");
          setLoading(false);
        });
      } else {
        setGenericError("ReCAPTCHA verification failed. Please refresh the page and try again.");
        setLoading(false);
      }
    }
    else {
      setLoading(false);
    }
  }

  // A generic error which will show up if there is an unknown error with the registration process
  const alert = genericError ? (
    <div className="home-inputs">
      <div style={{ background: '#ff5959', color: 'white', borderRadius: '5px', padding: '5px' }}>
        {genericError}
      </div>
    </div>
  ) : null;

  return (
    <Container style={{ maxWidth: "400px" }}>
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal}>
        <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
          <p style={{ fontWeight: 'bold', color: '#644F64', textAlign: "center", fontSize: '14px' }}>Setup complete! Welcome to VERA, {firstName}!</p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button variant="primary" onClick={handleCloseSuccessModal}>Continue</Button>
        </Modal.Footer>
      </Modal>
      <Row>
        <Col>
          <Form noValidate className="d-grid gap-3" onSubmit={tryFinalizeSetup}>
            <h2 style={{ paddingBottom: '2rem' }}>Setup</h2>
            <FormGroup controlId="firstName">
              <Form.Label>First Name</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="text"
                  required
                  value={firstName}
                  placeholder="Enter your First Name"
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    checkValidFirstName(e.target.value);
                  }}
                  isInvalid={invalidFirstName !== ""}
                />
                <Form.Control.Feedback type="invalid">{invalidFirstName}</Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
            <FormGroup controlId="lastName">
              <Form.Label>Last Name</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="text"
                  required
                  value={lastName}
                  placeholder="Enter your Last Name"
                  onChange={(e) => {
                    setLastName(e.target.value);
                    checkValidLastName(e.target.value);
                  }}
                  isInvalid={invalidLastName !== ""}
                />
                <Form.Control.Feedback type="invalid">{invalidLastName}</Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
            <FormGroup controlId="institution">
              <Form.Label>Institution</Form.Label>
              <DropdownWithAddOption
                options={allInstitutions.map(inst => inst.name)}
                value={institution}
                addOption={true}
                placeholder="Select your institution"
                isInvalid={invalidInstitution !== ""}
                invalidFeedback={invalidInstitution}
                onValueChange={handleInstitutionChange}
                onAddOption={addInstitutionOption}
              />
            </FormGroup>
            {institution !== "" && (
              <FormGroup controlId="lab">
                <Form.Label>Lab</Form.Label>
                <DropdownWithAddOption
                  options={allLabs.map(lab => lab.name)}
                  value={lab}
                  addOption={true}
                  addOptionPlaceholder="Add new lab..."
                  placeholder="Select your lab"
                  isInvalid={invalidLab !== ""}
                  invalidFeedback={invalidLab}
                  onValueChange={handleLabChange}
                  onAddOption={addLabOption}
                />
              </FormGroup>
            )}
            {alert}
            <div style={{ height: '15px' }}></div>
            <Row className="d-flex justify-content-between align-items-center">
              <Col className="px-0" xs="auto">
                <Button type="submit" disabled={loading} className="form-submit-button" style={{ marginTop: '0px' }} >
                  {loading ? "Loading..." : "Submit"}
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}

const mapStateToProps = (state: any) => ({
  auth: state.auth
})

export default connect(mapStateToProps, dispatch => ({ dispatch: dispatch }))(SetupUserInfoForm as React.ComponentClass<any>)