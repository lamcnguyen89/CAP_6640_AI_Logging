import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import NavMenu from '../components/NavMenu'
import { updateUserProfile, getUserProfile, dropboxConnect, unlinkDropbox } from '../helpers/UsersApiHelper'
import { Form, FormGroup, InputGroup, Button, Container, Row, Col, Image, Figure, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap'
import '../styles/App.css'
import before from '../assets/Profile_Image_Before.png'
import after from '../assets/Profile_Image_After.png'
import sync_white from '../assets/sync_white.png'
import CustomAlert from '../components/CustomAlert'
import DropdownWithAddOption from '../components/Home/DropdownWithAddOption'
import { fetchInstitutions, fetchLabs } from '../helpers/InstitutionHelper'
import { Institution, Lab, handleAddInstitution, handleAddLab } from '../helpers/InstitutionHelper'

const Account = () => {
  const auth = useSelector((state: any) => state.auth)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const token = auth.token.split(" ")[1]
  const clipboard = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
  </svg>

  // Function to convert an image to a format that can be stored in the database
  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      fileReader.onload = () => {
        resolve(fileReader.result)
      }
      fileReader.onerror = (error) => {
        reject(error)
      }
    })
  }

  const dispatch = useDispatch()
  const currentUser = useSelector((state: any) => state.auth?.user)

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false)
    setSeed(Math.random())
  }

  // States for various fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [dropboxSynced, setDropboxSynced] = useState<boolean>(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // States for error handling
  const [genericError, setGenericError] = useState("")
  const [invalidFirstName, setInvalidFirstName] = useState("")
  const [invalidLastName, setInvalidLastName] = useState("")
  const [invalidEmail, setInvalidEmail] = useState("")
  const [invalidPassword, setInvalidPassword] = useState("")
  const [invalidCurrentPassword, setInvalidCurrentPassword] = useState("")
  const [invalidConfirmPassword, setInvalidConfirmPassword] = useState("")

  const [submitDisabled, setSubmitDisabled] = useState(true)
  const [alertColor, setAlertColor] = useState('#ff5959')
  const [profilePictureMessage, setProfilePictureMessage] = useState("Add profile picture")
  const [userProfile, setUserProfile] = useState({ firstName: "", lastName: "", email: "", institution: "", lab: "", profileImage: "" })
  const [imageUploaded, setImageUploaded] = useState(false)
  const [seed, setSeed] = useState(1)
  const [dropboxMsg, setDropboxMsg] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('dropbox') === 'connected') {
      setDropboxMsg('✅ Dropbox successfully connected!')
    }
  }, [])
  // Functions for determining whether input is valid
  const isAlphanumerical = (input: string) => /^[a-zA-Z0-9\s]+$/.test(input)
  const isValidPassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/
    if (!email || email.length > 254)
      return false
    return emailRegex.test(email)
  }

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
  }, [institution]);

  // If lab list changes, ensure the selected lab is still valid
  useEffect(() => {
    if (!allLabs.some(l => l.name === lab)) {
      setLab("");
    }
  }, [allLabs]);

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

  // Checks whether given password is valid, and updates feedback error messages accordingly
  const checkValidPassword = (passToCheck) => {
    let trimmedPassword = passToCheck.trim()

    if (!trimmedPassword) {
      setInvalidPassword("Please provide a password.")
      return false
    }
    else if (isValidPassword(trimmedPassword) === false) {
      setInvalidPassword("Password must contain more than 8 characters, and must contain at least one lowercase letter, one upppercase letter, one number, and one special character. Do not use spaces.")
      return false
    }
    else {
      setInvalidPassword("")
      return true
    }
  }

  // Checks whether given password matches existing password, and updates feedback error messages accordingly
  const checkPasswordsMatch = (passToCheck) => {
    let trimmedConfirmPassword = passToCheck.trim()
    let trimmedPassword = password.trim()

    if (!trimmedConfirmPassword) {
      setInvalidConfirmPassword("Please confirm your password.")
      return false
    }
    else if (trimmedPassword !== trimmedConfirmPassword) {
      setInvalidConfirmPassword("Passwords do not match.")
      return false
    }
    else {
      setInvalidConfirmPassword("")
      return true
    }
  }

  // Checks if something has changed, and we need to enable the submit button
  useEffect(() => {
    if (firstName !== userProfile.firstName || lastName !== userProfile.lastName || email !== userProfile.email ||
      institution !== userProfile.institution || lab !== userProfile.lab || currentPassword || password || confirmPassword) {
      setSubmitDisabled(false)
    } else {
      setSubmitDisabled(true)
    }
  }, [firstName, lastName, email, institution, lab, currentPassword, password, confirmPassword])

  // Get all users
  useEffect(() => {
    if (seed) {
      getUserProfile(auth.token)
        .then(res => {
          setUserProfile({
            firstName: res.user.firstName,
            lastName: res.user.lastName,
            email: res.user.email,
            institution: res.user.institution?.name,
            lab: res.user.lab?.name,
            profileImage: res.user.profileImage

          })

          setFirstName(res.user.firstName)
          setLastName(res.user.lastName)
          setEmail(res.user.email)
          setInstitution(res.user.institution?.name)
          setLab(res.user.lab?.name)
          setDropboxSynced(res.user.dropboxSynced ? true : false)
        }
        )
        .catch(err => {
          setError(err.message)
          setShowError(true)
        })
    }
  }, [seed])

  const handleReload = () => window.location.reload()
  const handleClose = () => setShowError(false)

  const messages = {
    passwordVerification: 'The inputted password does not match your current password.',
    unknownError: 'An unknown error occured; please refresh the page and try again.',
    unableToUpdate: 'Could not update user information',
    emptyFields: 'Please fill out at least one field',
    currentPassRequired: 'To change password, all password fields need to be entered',
    notMatch: 'Passwords do not match',
    notUpdate: 'Password not updated',
    invalidFirstName: 'Please only enter letters for First Name',
    invalidLastName: 'Please only enter letters for Last Name',
    invalidEmail: 'Please provide a valid email.',
    emailTaken: 'This email is already in use. Please provide a different email.',
    hardPassRequirements: 'Password must have at least eight characters, at least one uppercase letter, one lowercase letter, one number and one special character',
    easyPassRequirements: "New password must contain at least one lowercase letter, one upppercase letter, one number, and one special character. Do not use spaces.",
    success: 'Profile Update Successfully'
  }

  const onError = (err: any) => {
    setAlertColor('#ff5959')
    console.error(err)
    if (err.toString() === "Current password not matching") { setInvalidCurrentPassword(messages.passwordVerification) }
    else if (err.toString() === "Invalid Email Format") { setInvalidEmail(messages.invalidEmail) }
    else if (err.toString() === "Internal Server Error") { setGenericError(messages.unknownError) }
    else if (err.toString() === "Unable to update user information") { setGenericError(messages.unknownError) }
    else if (err.toString() === "Email already exists") { setInvalidEmail(messages.emailTaken) }
    else if (err.toString() === "Easy Password requirements not met") { setInvalidPassword(messages.hardPassRequirements) }
    else if (err.toString() === "Hard Password requirements not met") { setInvalidPassword(messages.hardPassRequirements) }
    else { setGenericError(messages.unknownError) }
    //setSeed(Math.random())
  }

  const onSuccess = (res: any) => {
    dispatch({
      type: 'SET_CURRENT_USER',
      payload: {
        token: auth.token,
        user: {
          ...currentUser,
          firstName,
          lastName,
          email,
          institution,
          lab,
        },
      },
    })

    setAlertColor("#29a2bd")
    setGenericError(messages.success)
    setImageUploaded(false)

    setFirstName("")
    setLastName("")
    setEmail("")
    setInstitution("")
    setLab("")
    setCurrentPassword("")
    setPassword("")
    setConfirmPassword("")

    setProfilePictureMessage("Add profile picture")
    setSeed(Math.random())
  }

  /*
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const base64 = await convertToBase64(file);
    setImageUploaded(true)
    setProfilePictureMessage("Profile picture Uploaded!")
    await setProfileImage(base64);
  };
  */

  const resetForm = async (e) => {
    e.preventDefault()
    window.location.reload()
  }

  const handleConnectDropbox = () => {
    // This code sets up an OAuth 2.0 Authorization flow for Dropbox integration in React
    dropboxConnect(auth.user.id)

  }

  // Function to unlink Dropbox account
  const handleUnlinkDropbox = () => {
    unlinkDropbox(auth.token,
      (res) => {
        console.log(res)
        handleCloseConfirmModal()


      }
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    setGenericError("")

    let trimmedFirstName = firstName.trim()
    let trimmedLastName = lastName.trim()
    let trimmedEmail = email.trim()
    let trimmedCurrentPassword = currentPassword.trim()
    let trimmedPassword = password.trim()
    let trimmedConfirmPassword = confirmPassword.trim()

    // Check if a field has not been filled out, or contains invalid inputs
    let invalid = false
    if (!trimmedFirstName) {
      setInvalidFirstName("Please provide a first name.")
      invalid = true
    }
    else if (!isAlphanumerical(trimmedFirstName)) {
      setInvalidFirstName("Please only use alphanumeric characters (A-Z, 0-9).")
      invalid = true
    }

    if (!trimmedLastName) {
      setInvalidLastName("Please provide a last name.")
      invalid = true
    }
    else if (!isAlphanumerical(trimmedLastName)) {
      setInvalidLastName("Please only use alphanumeric characters (A-Z, 0-9).")
      invalid = true
    }

    if (!trimmedEmail) {
      setInvalidEmail("Please provide an email.")
      invalid = true
    }
    else if (!isValidEmail(trimmedEmail)) {
      setInvalidEmail("Please provide a valid email.")
      invalid = true
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
    }

    // Only try passwords if at least one field is being used
    if (trimmedPassword || trimmedConfirmPassword || trimmedCurrentPassword) {
      if (!trimmedPassword) {
        setInvalidPassword("Please provide a new password.")
        invalid = true
      }
      else if (trimmedPassword.length < 8) {
        setInvalidPassword("New password must be at least 8 characters long.")
        invalid = true
      }
      else if (isValidPassword(trimmedPassword) === false) {
        setInvalidPassword("New password must contain at least one lowercase letter, one upppercase letter, one number, and one special character. Do not use spaces.")
        invalid = true
      }

      if (!trimmedCurrentPassword) {
        setInvalidCurrentPassword("Please provide your current password.")
        invalid = true
      }

      if (!trimmedConfirmPassword) {
        setInvalidConfirmPassword("Please confirm your new password.")
        invalid = true
      }
      else if (trimmedPassword !== trimmedConfirmPassword) {
        setInvalidConfirmPassword("Passwords do not match.")
        invalid = true
      }
    }

    // If no fields are invalid, try updating the user profile
    if (!invalid) {
      try {
        updateUserProfile(trimmedFirstName, trimmedLastName, trimmedEmail, institutionId, labId, trimmedCurrentPassword, trimmedPassword, undefined, auth.token, onSuccess, onError)
        return
      } catch (error) {
        setAlertColor('#ff5959')
        setGenericError(messages.notUpdate)
      }
    }
  }

  const alert = genericError ? (

    <Container
      className="text-center mt-4"
      style={{
        background: alertColor,
        color: "white",
        borderRadius: "5px",
        padding: "5px",
      }}
    >
      {genericError}
    </Container>

  ) : null

  return (
    <Container fluid={true} className="container-fluid">

      <NavMenu title="Profile Settings" />
      <Container fluid={true} className="container-fluid">
      </Container>

      <CustomAlert
        show={showError}
        message={error}
        onClose={handleClose}
        onReload={handleReload}
      />
      <Container className="mt-4 p-4">
        <Row className="align-items-start">
          <h2>Profile Settings</h2>
          {/*<p>{auth.token}</p>*/}
          <Modal show={showConfirmModal} onHide={handleCloseConfirmModal}>
            <Modal.Header>
              <Modal.Body className="text-center"><b style={{ color: "red" }}>Are you sure you want to unlink your Dropbox Account from your Profile?</b></Modal.Body>
            </Modal.Header>

            <Modal.Footer className="justify-content-center">
              <Button className="tertiary-button me-4" onClick={handleCloseConfirmModal}>
                No
              </Button>
              <Button variant="primary" onClick={handleUnlinkDropbox}>
                Yes
              </Button>
            </Modal.Footer>
          </Modal>
        </Row>
        <Row className="align-items-start">
          <Col lg={6} md={12}>
            <Row className="align-items-start">
              <div className="mt-2 mb-2 p-4 profile-form-box border border-secondary rounded">
                <h4 className="text-center">Edit Profile</h4>

                <Form noValidate className="d-grid gap-3" onSubmit={onSubmit}>{/*}
                <Form.Group className="text-center">

                <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip id="button-tooltip-2">Click Image to Upload  Profile Picture</Tooltip>}
                 >
                  <label htmlFor="profileImage">
                    {
                      (!userProfile.profileImage &&!profileImage) ? 
                      <Image className="profile-image w-50 mx-auto d-block img-fluid rounded-circle" alt="avatar1" src={before} /> :
                      <Image className="profile-image w-50 mx-auto d-block img-fluid rounded-circle" alt="avatar1" src={
                        imageUploaded ? profileImage : userProfile.profileImage} />
                    }
                    <input
                      name="profileImage"
                      className="justify-content-center"
                      label="profileImage"
                      type="file"
                      id="profileImage"
                      accept=".jpeg, .png, .jpg"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e)}
                    />
                  </label>
                  </OverlayTrigger>
                  <Figure.Caption>{profilePictureMessage}</Figure.Caption>
                
                </Form.Group>*/}
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
                          setInvalidFirstName("")
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
                          setLastName(e.target.value)
                          setInvalidLastName("")
                        }}
                        isInvalid={invalidLastName !== ""}
                      />
                      <Form.Control.Feedback type="invalid">{invalidLastName}</Form.Control.Feedback>
                    </InputGroup>
                  </FormGroup>
                  <FormGroup controlId="email">
                    <Form.Label>Email ID</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type="text"
                        required
                        value={email}
                        placeholder="Enter your Email"
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setInvalidEmail("")
                        }}
                        isInvalid={invalidEmail !== ""}
                      />
                      <Form.Control.Feedback type="invalid">{invalidEmail}</Form.Control.Feedback>
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
                </Form>
              </div>
            </Row>
            {/*
                <Row className="align-items-start">
                    <div className="mt-4 p-4 profile-form-box container border border-secondary rounded">
                      <h4 className="text-center">My VERA API Key</h4>
                      <Form>
                        <InputGroup className="justify-content-center">
                          <InputGroup.Text>
                            API Key&nbsp;
                            <Button variant="outline-info" style={{ paddingTop: "1px", paddingBottom: "1px", whiteSpace: "nowrap" }} onClick={() => {
                              // href={`/study/1/${value}/session`}
                              navigator.clipboard.writeText(token)
                              // document.body.removeChild(input)
                            }} > {clipboard}</Button>
                          </InputGroup.Text>
                          </InputGroup>
                      </Form>
                    </div>         
                </Row>
              */
            }

          </Col>
          <Col lg={6} md={12}>
            <Row className="align-items-start">
              <div className="p-4 mb-2 mt-2 border border-secondary rounded">
                <h4 className="text-center">Change Password</h4>
                <Form noValidate className="d-grid gap-3" onSubmit={onSubmit}>
                  <FormGroup controlId="currentPassword">
                    <Form.Label>Current Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type="password"
                        required
                        value={currentPassword}
                        placeholder="Enter your Current Password"
                        onChange={(e) => {
                          setCurrentPassword(e.target.value)
                          setInvalidCurrentPassword("")
                        }}
                        isInvalid={invalidCurrentPassword !== ""}
                      />
                      <Form.Control.Feedback type="invalid">{invalidCurrentPassword}</Form.Control.Feedback>
                    </InputGroup>
                  </FormGroup>
                  <FormGroup controlId="password">
                    <Form.Label>New Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type="password"
                        required
                        value={password}
                        placeholder="Enter your New Password"
                        onChange={(e) => {
                          setPassword(e.target.value)
                          checkValidPassword(e.target.value)
                        }}
                        isInvalid={invalidPassword !== ""}
                      />
                      <Form.Control.Feedback type="invalid">{invalidPassword}</Form.Control.Feedback>
                    </InputGroup>
                  </FormGroup>
                  <FormGroup controlId="confirmPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type="password"
                        required
                        value={confirmPassword}
                        placeholder="Confirm your New Password"
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          checkPasswordsMatch(e.target.value)
                        }}
                        isInvalid={invalidConfirmPassword !== ""}
                      />
                      <Form.Control.Feedback type="invalid">{invalidConfirmPassword}</Form.Control.Feedback>
                    </InputGroup>
                  </FormGroup>
                  {alert}
                </Form>
              </div>
            </Row>
            <Row className="align-items-start">
              {/* Dropbox connect button */}
              <div className="p-4 mb-2 mt-2 border border-secondary rounded">
                <h4 className="text-center">Dropbox Sync</h4>
                <Form>
                  <Form.Label style={{ color: "#644F64" }}>
                    Sync your Dropbox account to manage all participant and experiment data.
                  </Form.Label>
                  <Button
                    size="lg"
                    className="me-3"
                    variant="secondary"
                    style={{ width: "240px", fontSize: "14px" }}
                    onClick={handleConnectDropbox}
                  >
                    <Image className="me-2" src={sync_white} />
                    {dropboxSynced
                      ? "Re-connect Dropbox"
                      : "Connect Dropbox"}
                  </Button>
                  <Button
                    size="lg"
                    variant="tertiary-button"
                    style={{ width: "240px", fontSize: "14px", fontWeight: "bold", border: 'none', backgroundColor: "#EBE7E6", color: "#242424" }}
                    disabled={!dropboxSynced}
                    onClick={() => setShowConfirmModal(true)}
                  >
                    Unlink Dropbox
                  </Button>
                </Form>
              </div>
            </Row>
            <Row className="align-items-start">
              <div className="position-relative">
                <div className="position-absolute top-0 end-0">
                  <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Save changes you have made to your profile</Tooltip>}>
                    <Button className="account-save-button me-2" disabled={submitDisabled} onClick={onSubmit} >Save Changes</Button>
                  </OverlayTrigger>
                  <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Reset the changes you have made to your profile</Tooltip>}>
                    <Button className="secondary-button me-2" onClick={resetForm} disabled={submitDisabled} >Cancel</Button>
                  </OverlayTrigger>
                  <Link to="/vera-portal/Dashboard">
                    <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Go Back to the Experiment Dashboard</Tooltip>}>
                      <Button className="secondary-button" style={{ backgroundColor: "#EBE7E6", color: "#242424" }}>Back</Button>
                    </OverlayTrigger>
                  </Link>
                </div>
              </div>
            </Row>
          </Col>
        </Row>
      </Container>
    </Container>
  )
}

Account.displayName = 'Account'
export default Account





