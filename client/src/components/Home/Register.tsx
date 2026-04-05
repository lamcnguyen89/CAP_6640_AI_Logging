import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { register } from '../../helpers/AuthApiHelper'
import { Container, Row, Col, Form, FormGroup, InputGroup, Button, Modal, Dropdown } from "react-bootstrap"

interface IRegisterProps {
  auth: any
  onSwapToLogin: any
  onSwapToLanding: any
  toggle: any
  toast: any
  dispatch: any
  showToast: any
  toastTitle: any
  toastMessage: any
}

type FormElement = React.FormEvent<HTMLFormElement>

const Register: React.FC<IRegisterProps> = ({ onSwapToLogin, onSwapToLanding }) => {
  // States for registration fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States for errors and loading
  const [loading, setLoading] = useState(false);
  const [genericError, setGenericError] = useState("");
  const [invalidEmail, setInvalidEmail] = useState("");
  const [invalidPassword, setInvalidPassword] = useState("");
  const [invalidConfirmPassword, setInvalidConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Functions for showing and hiding modals
  const handleShowSuccessModal = () => {
    setShowSuccessModal(true)
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    onSwapToLogin()
  }

  // Functions for determining whether input is valid
  const isValidPassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/;
    if (!email || email.length > 254)
      return false;
    return emailRegex.test(email);
  };

  // Checks whether given email is valid, and updates feedback error messages accordingly
  const checkValidEmail = (emailToCheck) => {
    let trimmedEmail = emailToCheck.trim();

    if (!trimmedEmail) {
      setInvalidEmail("Please provide an email.");
      return false;
    }
    else if (!isValidEmail(trimmedEmail)) {
      setInvalidEmail("Please provide a valid email.");
      return false;
    }
    else {
      setInvalidEmail("");
      return true;
    }
  }

  // Checks whether given password is valid, and updates feedback error messages accordingly
  const checkValidPassword = (passToCheck) => {
    let trimmedPassword = passToCheck.trim();

    if (!trimmedPassword) {
      setInvalidPassword("Please provide a password.");
      return false;
    }
    else if (isValidPassword(trimmedPassword) === false) {
      setInvalidPassword("Password must contain more than 8 characters, and must contain at least one lowercase letter, one upppercase letter, one number, and one special character. Do not use spaces.");
      return false;
    }
    else {
      setInvalidPassword("");
      return true;
    }
  }

  // Checks whether given password matches existing password, and updates feedback error messages accordingly
  const checkPasswordsMatch = (passToCheck) => {
    let trimmedConfirmPassword = passToCheck.trim();
    let trimmedPassword = password.trim();

    if (!trimmedConfirmPassword) {
      setInvalidConfirmPassword("Please confirm your password.");
      return false;
    }
    else if (trimmedPassword !== trimmedConfirmPassword) {
      setInvalidConfirmPassword("Passwords do not match.");
      return false;
    }
    else {
      setInvalidConfirmPassword("");
      return true;
    }
  }

  // Tries to register given the current credentials inputted
  const tryRegister = (e: FormElement): void => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Check if a field has not been filled out, or contains invalid inputs
    let invalid = false;

    if (checkValidEmail(trimmedEmail) === false) {
      invalid = true;
    }
    if (checkValidPassword(trimmedPassword) === false) {
      invalid = true;
    }
    if (checkPasswordsMatch(trimmedConfirmPassword) === false) {
      invalid = true;
    }

    // If there are no errors, continue.
    if (!invalid) {
      // Execute reCAPTCHA v3
      if (window.grecaptcha) {
        window.grecaptcha.execute('6Lc4l2UqAAAAAD2Rzifl28ffROgI0ugpf9bClY3c', { action: 'register' }).then((captchaToken: string) => {
          // Call register function
          register(trimmedEmail, trimmedPassword, captchaToken, (res: any) => {
            // 200, successful registration; show toast and return to login.
            if (res.httpStatus === 200) {
              handleShowSuccessModal()
              console.log('Register successful, result: ', res);
              setLoading(false);
              // 401, duplicate email
            } else if (res.httpStatus === 409) {
              console.log('Register failed, result: ', res);
              setInvalidEmail("This email is already registered to an existing account.");
              setLoading(false);
              // Else, server error (likely 500)
            } else {
              console.log('Register failed, result: ', res);
              setGenericError("An unknown error occurred while registering. Please refresh the page and try again.");
              setLoading(false);
            }
          });
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
          <p style={{ fontWeight: 'bold', color: '#644F64', textAlign: "center", fontSize: '14px' }}>Registration successful! Check your email for a verification link.</p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button variant="primary" onClick={handleCloseSuccessModal}>Okay</Button>
        </Modal.Footer>
      </Modal>
      <Row>
        <Col>
          <Form noValidate className="d-grid gap-3" onSubmit={tryRegister}>
            <h2 style={{ paddingBottom: '2rem' }}>Sign Up</h2>
            <FormGroup controlId="email">
              <Form.Label>Email ID</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="text"
                  required
                  value={email}
                  placeholder="Enter your Email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    checkValidEmail(e.target.value);
                  }}
                  isInvalid={invalidEmail !== ""}
                />
                <Form.Control.Feedback type="invalid">{invalidEmail}</Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
            <FormGroup controlId="password">
              <Form.Label>Password</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="password"
                  required
                  value={password}
                  placeholder="Enter your Password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    checkValidPassword(e.target.value);
                  }}
                  isInvalid={invalidPassword !== ""}
                />
                <Form.Control.Feedback type="invalid">{invalidPassword}</Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
            <FormGroup controlId="confirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="password"
                  required
                  value={confirmPassword}
                  placeholder="Confirm your Password"
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    checkPasswordsMatch(e.target.value);
                  }}
                  isInvalid={invalidConfirmPassword !== ""}
                />
                <Form.Control.Feedback type="invalid">{invalidConfirmPassword}</Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
            {alert}
            <div style={{ height: '15px' }}></div>
            <Row className="d-flex justify-content-between align-items-center">
              <Col className="px-0" xs="auto">
                <Button type="submit" disabled={loading} className="form-submit-button" style={{ marginTop: '0px' }} >
                  {loading ? "Loading..." : "Submit"}
                </Button>
              </Col>
              <Col className="px-0 text-end" xs="auto">
                <p style={{ marginTop: "20px", fontFamily: 'SF Pro', fontSize: "14px", fontWeight: 600 }}>
                  {' '}
                  <span
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onClick={onSwapToLanding}
                    onMouseEnter={(e) => {
                      e.target.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.textDecoration = 'none';
                    }}
                  >
                    Cancel
                  </span>
                </p>
              </Col>
            </Row>
            <Container className="d-flex justify-content-between align-items-center p-0" style={{ gap: '50px' }}>
              <p style={{ fontFamily: 'SF Pro', fontSize: "14px", fontWeight: 600 }}>
                {' '}
                <span
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onClick={onSwapToLogin}
                  onMouseEnter={(e) => {
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Returning to VERA? Login
                </span>
              </p>
            </Container>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}

const mapStateToProps = (state: any) => ({
  auth: state.auth
})

export default connect(mapStateToProps, dispatch => ({ dispatch: dispatch }))(Register as React.ComponentClass<any>)