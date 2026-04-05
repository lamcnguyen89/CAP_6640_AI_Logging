import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Image, Button, Form } from "react-bootstrap"
import '../styles/settings.css'
import { useParams, Link, NavLink, useHistory } from "react-router-dom"
import { useSelector, useDispatch } from 'react-redux'

import ToastNotification from '../components/ToastNotification'
import { getTokenStatus, resetPassword } from '../helpers/UsersApiHelper'
import veraLogo from '../assets/VERA-logo-main-300x157.png'
import nsfLogo from '../assets/NsfLogo.jpg'
import '../styles/App.css'
import CustomAlert from '../components/CustomAlert';

const ForgotPassword = () => {
  type EmailParams = {
    id: string,
    token: string
  }

  const messages = {
    formNotAllFilled: 'Please fill out every field above.',
    notMatch: 'Passwords do not match',
    notUpdate: 'Password not updated',
    success: 'Password updated successfully'
  }

  const initialState = {
    password: "",
    confirmPassword: ""
  }

  const history = useHistory()

  const handleNavigateClick = () => {
    history.push("/vera-portal")
  }

  const [formData, setFormData] = useState(initialState)
  const [message, setMessage] = useState(null)
  const param = useParams<EmailParams>()
  const [tokenStatus, setTokenStatus] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [alertColor, setAlertColor] = useState('#ff5959')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("Check Email to Verify Account")
  const [toastTitle, setToastTitle] = useState("Success")
  const [navButtonMessage, setNavButtonMessage] = useState("Cancel")

  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);


  const handleReload = () => window.location.reload();
  const handleCloseAlert = () => setShowError(false);
  const {
    password,
    confirmPassword
  } = formData





  useEffect(() => {
    console.log("User ID: ", param.id)
    console.log("User Token: ", param.token)
    getTokenStatus(param.id, param.token)
      .then((res) => {
        if (res.success) {
          setTokenStatus(true)
        } else {
          // throw error
          setTokenStatus(false)
          throw res
        }
      })
  }, [param])

  // Toggle the toast upon registration
  const toggleToast = () => {
    setShowToast(!showToast)
  }


  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (
      // Check if something wasn't filled out
      !password || !confirmPassword
    ) {
      setAlertColor('#ff5959')
      setMessage(messages.formNotAllFilled)
      return
    } else if (password != confirmPassword) {
      setMessage(messages.notMatch)
      return
    } else {

      resetPassword(param.id, password, param.token)
        .then((res) => {
          if (res.success) {
            setAlertColor("#29a2bd")
            setMessage(messages.success)
            setPasswordChanged(true)
            setNavButtonMessage("Go To Login")
            setShowToast(true)
            setToastMessage("Your password has been successfully reset")
          } else {
            setAlertColor('#ff5959')
            setMessage(messages.notUpdate)
            setShowToast(true)
            setToastMessage("Your password does not meet the password requirements")
            // throw error
            throw res

          }
        })
        .catch((err) => {
          if (err.status >= 500) {
            setError("Internal Server Error Occured. Please refresh the page.")
            setShowError(true)
          }
        })



    }
  }

  const alert = message ? (
    <div className="text-center">
      <div
        style={{
          background: alertColor,
          color: "white",
          borderRadius: "5px",
          padding: "5px",
        }}
      >
        {message}
      </div>
    </div>
  ) : null;

  if (!tokenStatus && !passwordChanged) {
    return (
      <Container fluid={true} className="container-fluid">
        <h2 className="text-center">Link has Expired</h2>
        <br />
        <div className="text-center">
          <Link to="/vera-portal">
            <button className="btn btn-primary my-1">Login</button>
          </Link>
        </div>

      </Container>
    )
  } else {
    return (

      <Container fluid className="full-height full-width">
        <CustomAlert
          show={showError}
          message={error}
          onClose={handleCloseAlert}
          onReload={handleReload}
        />
        <Row className="justify-content-md-center">
          <Col md={12} lg={7} className="d-flex flex-column justify-content-between" style={{ backgroundColor: "#FFFFF", color: "#242424", minHeight: "100vh", padding: "3rem" }}>
            <div>
              <div className="d-flex mb-4">
                <Image src={veraLogo} alt="VERA Logo" style={{ height: '80px', marginRight: '1rem' }}></Image>
              </div>
              <h1 style={{ padding: '3rem 0rem 0rem 0rem' }}>Virtual Experience Research Accelerator</h1>
              <p style={{ marginRight: '8rem' }}>A platform for conducting XR experiments at scale with flexible participant groups and study settings.</p>
            </div>
            <div style={{ padding: '3rem 0rem 0rem 0rem' }}>
              <p style={{ fontWeight: "600", fontSize: "16px" }}>Sponsors</p>
              <div className="d-flex align-items-start mt-4">
                <Image src={nsfLogo} alt="NSF Logo" style={{ height: '50px', marginRight: '1rem', marginTop: '1.5rem' }}></Image>
                <p style={{ fontFamily: 'SF Pro', fontSize: "14px", }}>
                  This material is based upon work supported by the National Science Foundation under Award numbers
                  2235066, 2235068, 2235070, 2350377, and 2235067.
                  <br /><br />
                  Any opinions, findings, and conclusions or recommendations expressed in this material are those of the
                  author(s) and do not necessarily reflect the views of the National Science Foundation.
                </p>
              </div>
            </div>
            <div className="text mt-5">
              <p style={{ fontFamily: 'SF Pro', fontSize: "14px", fontWeight: "600" }}>© Copyright 2024</p>
            </div>
          </Col>
          <Col md={12} lg={5} className="d-flex flex-column align-items-stretch justify-content-center" style={{ backgroundColor: "#160335", color: "#FFFFFF", minHeight: "100vh", padding: "3rem" }}>
            <div>
              <ToastNotification visible={showToast} changeState={toggleToast} toggleVisibility={toggleToast} message={toastMessage} toastTitle={toastTitle} />
              <Container style={{ maxWidth: "400px" }}>
                <Row>
                  <Col>
                    <Form className="d-grid gap-3" onSubmit={onSubmit}>
                      <h2 style={{ paddingBottom: '2rem' }}>Reset Password</h2>
                      <Form.Group>
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          vlaue={password}
                          type="password"
                          placeholder="Enter your new password"
                          name="password"
                          onChange={onChange}
                        ></Form.Control>
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                          value={confirmPassword}
                          type="password"
                          placeholder="Confirm your password"
                          name="confirmPassword"
                          onChange={onChange}
                        ></Form.Control>
                      </Form.Group>
                      {alert}
                      <Container className="mt-4 d-flex justify-content-between align-items-center p-0" style={{ gap: '50px' }}>
                        <Button type="submit" className="me-2 reset-password-button">
                          Submit
                        </Button>
                        <span
                          style={{ cursor: 'pointer', transition: 'all 0.3s ease', color: 'white', fontWeight: 'bold' }}
                          onClick={handleNavigateClick}
                          onMouseEnter={(e) => {
                            e.target.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.textDecoration = 'none';
                          }}
                        >
                          {navButtonMessage}
                        </span>

                      </Container>

                    </Form>
                  </Col>
                </Row>
              </Container>
            </div>
          </Col>
        </Row>
      </Container>


    )

  }



}

ForgotPassword.displayName = 'Account'
export default ForgotPassword

