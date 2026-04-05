import React, { useState, useRef, useEffect } from "react"
import { forgotPassword } from "../../helpers/AuthApiHelper"
import { Container, Row, Col, Form, Button } from "react-bootstrap"
import '../../styles/App.css'

const errorMessages = {
  incorrectInfo: "Email or password is incorrect.",
  cannotConnect: "Unable to connect. Check your network connection.",
  unknownError:
    "An unknown error occurred. Please refresh the page and try again.",
  notVerified: "Your account has not been verified, check your email",
  sendEmailFailed: "Your email doesn't exist or the email verification server is down",
  passwordReset: "Password has been reset. Check your email!",
  noEmailForgot: "Please enter an email if you forgot your password",
  noUser: "No user found with that email",
  incompleteInfo: "Please enter both email and password"
}



const ForgotPassword = (props: any) => {
  const { onSwapToLogin, showToast, toastMessage, toastTitle } = props
  const [err, setErr] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [alertColor, setAlertColor] = useState("#ff5959")
  const emailRef = useRef<HTMLInputElement>()

  const onError = (error: any) => {
    setIsLoading(false)
    if (error.toString() === "TypeError: Failed to fetch") {
      setErr(errorMessages.cannotConnect)
    } else if (error.toString() === "Email or password not found") {
      setErr(errorMessages.incorrectInfo)
    } else if (error.toString() === "Check email for verification link") {
      setErr(errorMessages.notVerified)
    } else if (error.toString() === "Email Not sent") {
      setErr(errorMessages.sendEmailFailed)
    } else if (error.toString() == "Forgot Password: No email entered") {
      setErr(errorMessages.noEmailForgot)
    } else if (error.toString() === "No user found") {
      setErr(errorMessages.noUser)
    } else { setErr(errorMessages.unknownError) }
  }

  useEffect(() => {
    // Check if grecaptcha is loaded
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          console.log("reCAPTCHA is ready");
        });
      } else {
        console.error("reCAPTCHA script not loaded. Ensure the script is included in the index.html.");
      }
    };

    // Ensure reCAPTCHA is ready
    loadRecaptcha();
  }, []);

  const tryReset = (e: any): void => {
    e.preventDefault()
    setErr("")

    if (!emailRef.current.value) {
      setErr(errorMessages.noEmailForgot)
      return
    }

    setIsLoading(true)

    const userData = {
      email: emailRef.current.value,
    };

    const onSuccess = (res: any) => {
      showToast()
      toastTitle()
      toastMessage()
      onSwapToLogin()
      setIsLoading(false)
      setAlertColor("#29a2bd")
      setErr(errorMessages.passwordReset)
      console.log('Reset password successful, result: ', res)
    }

    forgotPassword(userData, onError, onSuccess)

  }

  const alert = err ? (
    <div className="home-inputs">
      <div
        style={{
          background: alertColor,
          color: "white",
          borderRadius: "5px",
          padding: "5px",
        }}
      >
        {err}
      </div>
    </div>
  ) : null


  return (
    <Container style={{ maxWidth: "400px" }}>
      <Row>
        <Col>
          <Form className="d-grid gap-3" onSubmit={(e) => { tryReset(e) }}>
            <h2 style={{ paddingBottom: '2rem' }}>Forgot Password</h2>
            <Form.Group>
              <Form.Label>Email ID</Form.Label>
              <Form.Control
                ref={emailRef}
                type="email"
                placeholder="Enter your email"
                name="email"
              ></Form.Control>
            </Form.Group>
            {alert}
            <Container className="mt-4 d-flex justify-content-between align-items-center p-0" style={{ gap: '50px' }}>
              <Button type="submit" className="me-2 reset-password-button">
                {isLoading ? "Loading..." : "Send Link to Reset Password"}
              </Button>
              <span
                style={{ cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 'bold' }}
                onClick={onSwapToLogin}
                onMouseEnter={(e) => {
                  e.target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.target.style.textDecoration = 'none';
                }}
              >
                {isLoading ? "Loading..." : "Cancel"}
              </span>
            </Container>

          </Form>
        </Col>
      </Row>
    </Container>


  )

}

ForgotPassword.displayName = "ForgotPassword"
export default ForgotPassword