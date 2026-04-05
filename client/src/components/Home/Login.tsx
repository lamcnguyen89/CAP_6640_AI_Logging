import React, { useState, useRef, useEffect, useCallback } from "react"
import { login, forgotPassword } from "../../helpers/AuthApiHelper"
import { Container, Row, Col, Form, FormGroup, InputGroup, Button } from "react-bootstrap"

const Login = (props: any) => {
  const { onSwapToRegister, onSwapToForgetPassword, onSwapToSetupUserInfo, resendVerificationLink } = props

  // States for fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // States for error handling
  const [invalidEmail, setInvalidEmail] = useState("")
  const [invalidPassword, setInvalidPassword] = useState("")
  const [genericError, setGenericError] = useState("")

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/
    if (!email || email.length > 254)
      return false
    return emailRegex.test(email)
  }

  useEffect(() => {
    // Check if grecaptcha is loaded
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          console.log("reCAPTCHA is ready")
        })
      } else {
        console.error("reCAPTCHA script not loaded. Ensure the script is included in the index.html.")
      }
    }

    // Ensure reCAPTCHA is ready
    loadRecaptcha()
  }, [])

  // Called when there is an error with logging in
  const onError = useCallback((error: any) => {
    setIsLoading(false)
    let err = error.error

    if (err.toString() === "User setup is incomplete") {
      props.onSwapToSetupUserInfo(error.userId)
      return
    }

    if (err.toString() === "TypeError: Failed to fetch") {
      setGenericError("Could not connect to the server. Please try again later.")
    } else if (err.toString() === "Email or password not found") {
      setGenericError("Email or password is incorrect. Please try again.")
    } else if (err.toString() === "Email sent") {
      setGenericError("Your email has not yet been verified. Please check your email for a verification link.")
    } else if (err.toString() === "Check email for verification link" || err.toString() === "Error sending verification email") {
      setGenericError("Your email has not yet been verified. Please check your email for a verification link.")
    } else if (err.toString() === "Email Not sent") {
      setGenericError("Your account is not verified, but a verification email could not be sent to your email. Please try again later.")
    } else if (err.toString() == "Forgot Password: No email entered") {
      setGenericError("Please enter your email address, then try again.")
    } else if (err.toString() === "No user found") {
      setGenericError("No user could be found with your provided email address. Please try again.")
    } else {
      console.log("Unknown error while logging in: " + err)
      setGenericError("An unknown error occurred. Please refresh the page and try again.")
    }
  })

  // Tries to login using current field credentials
  const tryLogin = useCallback((e: any): void => {
    e.preventDefault()
    e.stopPropagation()

    setIsLoading(true)

    let trimmedEmail = email.trim()
    let trimmedPassword = password.trim()

    let invalid = false

    // Validate fields
    if (!trimmedEmail) {
      setInvalidEmail("Please enter your email address.")
      invalid = true
    }
    else if (!isValidEmail(trimmedEmail)) {
      setInvalidEmail("Please enter a valid email address.")
      invalid = true
    }

    if (!trimmedPassword) {
      setInvalidPassword("Please enter your password.")
      invalid = true
    }

    // If no fields are invalid, continue login process
    if (!invalid) {
      if (window.grecaptcha) {
        // Execute reCAPTCHA v3
        window.grecaptcha.execute("6Lc4l2UqAAAAAD2Rzifl28ffROgI0ugpf9bClY3c", { action: 'login' })
          .then((token: string) => {
            const userData = {
              email: email,
              password: password
            }

            login(userData, token, onError)
          })
      } else {
        setGenericError("reCAPTCHA not loaded. Please refresh the page.")
        setIsLoading(false)
      }
    }
    else {
      setIsLoading(false)
    }
  })

  const alert = genericError ? (
    <div className="home-inputs">
      <div
        style={{
          background: "#ff5959",
          color: "white",
          borderRadius: "5px",
          padding: "5px",
        }}
      >
        {genericError}
      </div>
    </div>
  ) : null

  return (
    <Container style={{ maxWidth: "400px" }}>
      <Row>
        <Col>
          <Form noValidate className="d-grid gap-3" onSubmit={tryLogin}>
            <h2 style={{ paddingBottom: '2rem' }}>{
              resendVerificationLink ? "Enter Info to Resend Verification" :
                "Login"}</h2>
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
            <FormGroup controlId="password">
              <Form.Label>Password</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  type="password"
                  required
                  value={password}
                  placeholder="Enter your Password"
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setInvalidPassword("")
                  }}
                  isInvalid={invalidPassword !== ""}
                />
                <Form.Control.Feedback type="invalid">{invalidPassword}</Form.Control.Feedback>
              </InputGroup>
            </FormGroup>
            {alert}
            <div style={{ height: '15px' }}></div>
            <Button type="submit" className="form-submit-button" disabled={isLoading}>
              {isLoading ? "Loading..." : "Submit"}
            </Button>
            <Container className="d-flex justify-content-between align-items-center p-0" style={{ gap: '50px' }}>
              <p style={{ fontFamily: 'SF Pro', fontSize: "14px", fontWeight: 600 }}>
                {' '}
                <span
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onClick={onSwapToRegister}
                  onMouseEnter={(e) => {
                    e.target.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.textDecoration = 'none'
                  }}
                >
                  New to VERA? Sign up
                </span>
              </p>
              <p style={{ fontWeight: 600 }}>
                {' '}
                <span
                  style={{ cursor: 'pointer', color: '#EBE7E6' }}
                  onClick={onSwapToForgetPassword}
                >
                  Forgot Password?
                </span>
              </p>
            </Container>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}
Login.displayName = "Login"
export default Login

