import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router'
import { RouteComponentProps } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Container, Row, Col, Image, Button, Modal } from "react-bootstrap"
import '../styles/App.css'
import LoginForm from '../components/Home/Login'
import RegisterForm from '../components/Home/Register'
import ForgotPassword from '../components/Home/ForgotPassword'
import ToastNotification from '../components/ToastNotification'
import veraLogo from '../assets/VERA-logo-main-300x157.png'
import nsfLogo from '../assets/NsfLogo.jpg'
import success from "../assets/success_icon.png"
import failure from "../assets/failure_icon.png"
import SetupUserInfoForm from '../components/Home/SetupUserInfoForm'


interface IHomeState {
  showLoginForm: boolean
  showToast: boolean
}

// Interface for when passing whether the account is verified or not
interface LocationState {
  data: {
    userVerified: boolean | null;
    userId: string | null;
  }
}

interface MyPageProps extends RouteComponentProps<{}, {}, LocationState> {
  location: {
    state?: LocationState;
  };
}


const Home = (props: MyPageProps) => {
  // States for toggling between login and register forms, and for the toast notification
  const [showLandingButtons, setShowLandingButtons] = useState(true)
  const [homeForms, setHomeForms] = useState("Login")
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("Check Email to Verify Account")
  const [toastTitle, setToastTitle] = useState("Welcome to Vera")
  const [userVerificationStatus, setUserVerificationStatus] = useState<boolean | null>()
  const [userId, setUserId] = useState<string>(undefined)
  const [resendVerificationLink, setResendVerificationLink] = useState<boolean | null>()
  const [showVerificationModal, setShowVerificationModal] = useState(false)



  const history = useHistory()

  // Redirect to dashboard if user is authenticated 
  const { isAuthenticated } = useSelector((state: any) => state.auth)
  useEffect(() => {
    if (isAuthenticated && homeForms === "Login") history.replace('/vera-portal/Dashboard')
  }, [isAuthenticated, history]) // only re-run effect if isAuthenticated changes; history should never change


  // Check if user is verified or ID exists
  useEffect(() => {
    if (props.location.state !== undefined && props.location.state.data.userId) {
      setUserId(props.location.state.data.userId)
    } else {
      setUserId(undefined)
    }
    if (props.location.state !== undefined && props.location.state.data.userVerified) {
      setUserVerificationStatus(props.location.state.data.userVerified)
      handleShowVerificationModal()
    } else {
      setUserVerificationStatus(null)
    }
  }, [props])

  // Toggle Modal
  const handleShowVerificationModal = () => {
    setShowVerificationModal(true)
  }
  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false)
    setUserVerificationStatus("")
    // Empty Props
    props.location.state = undefined
  }

  // Toggle from landing page to forms
  const swapToLoginForm = () => {
    setShowLandingButtons(false);
    setHomeForms("Login")
  }
  const swapToRegisterForm = () => {
    setShowLandingButtons(false);
    setHomeForms("Register")
  }
  const swapToForgotPasswordForm = () => {
    setShowLandingButtons(false);
    setHomeForms("ForgotPassword")
  }
  const swapToSetupForm = () => {
    setShowLandingButtons(false);
    setHomeForms("SetupForm")
  }
  const handleSetupSwapFromLogin = async (userId: string) => {
    setShowLandingButtons(false);
    setUserId(userId);
    console.log("Setting userId in Home: ", userId)
    setHomeForms("SetupForm");
  }
  const swapToLanding = () => {
    setShowLandingButtons(true);
  }
  // Toggle the toast upon registration
  const toggleToast = () => {
    setShowToast(!showToast)
  }

  const renderSwitch = (param: string) => {
    switch (param) {
      case 'Login':
        return (
          <LoginForm
            onReset={() => setShowToast(true)}
            onSwapToRegister={swapToRegisterForm}
            onSwapToForgetPassword={swapToForgotPasswordForm}
            onSwapToSetupUserInfo={handleSetupSwapFromLogin}
            resendVerificationLink={resendVerificationLink}
          />
        )
      case 'Register':
        return (
          <RegisterForm
            onSwapToLogin={swapToLoginForm}
            onSwapToLanding={swapToLanding}
          />
        )
      case 'ForgotPassword':
        return (
          <ForgotPassword
            onSwapToLogin={swapToLoginForm}
            showToast={() => setShowToast(true)}
            toastMessage={() => setToastMessage("Reset your password through the link sent to your Email ID")}
            toastTitle={() => setToastTitle("Reset Password")}
          />
        )
      case 'SetupForm':
        return (
          <SetupUserInfoForm
            userId={userId}
          />
        )
    }
  }

  return (
    <Container fluid className="full-height full-width">
      <Modal show={showVerificationModal} onHide={handleCloseVerificationModal}>
        <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
          <Image src={
            userVerificationStatus ? success : failure
          } style={{ width: '40px', height: '40px' }} />
          <p style={{ fontWeight: 'bold', color: '#644F64', textAlign: "center", fontSize: '14px', marginTop: '10px' }}>
            {
              userVerificationStatus ? "Your email has been verified successfully!" :
                "Your email verification has failed. Reverify to continue with VERA."
            }
          </p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button className="btn-primary" onClick={() => { handleCloseVerificationModal(); swapToSetupForm() }}>Continue to Setup</Button>
          <Button className="btn-primary" style={{ display: userVerificationStatus ? 'none' : 'block' }} onClick={() => {
            handleCloseVerificationModal();
            swapToSetupForm();
            setResendVerificationLink(true)

          }}>Resend Link</Button>
        </Modal.Footer>
      </Modal>
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
              <p style={{ fontSize: "14px" }}>
                This material is based upon work supported by the National Science Foundation under Award numbers
                2235066, 2235068, 2235070, 2350377, and 2235067.
                <br /><br />
                Any opinions, findings, and conclusions or recommendations expressed in this material are those of the
                author(s) and do not necessarily reflect the views of the National Science Foundation.
              </p>
            </div>
          </div>
          <div className="text mt-5">
            <p style={{ fontWeight: "600", fontSize: "14px" }}>© Copyright 2024</p>
          </div>
        </Col>
        <Col md={12} lg={5} className="d-flex flex-column align-items-stretch justify-content-center" style={{ backgroundColor: "#160335", color: "#FFFFFF", minHeight: "100vh", padding: "3rem" }}>
          <div>
            {showLandingButtons ?
              <Container className="d-flex flex-column align-items-center justify-content-center gap-5">
                <Button className="tertiary-button" style={{ width: "320px", height: "48px", fontSize: "14px" }} onClick={() => swapToLoginForm()}>Login</Button>
                <Button variant="secondary" style={{ width: "320px", height: "48px", fontSize: "14px" }} onClick={() => swapToRegisterForm()}>Sign up</Button>
              </Container>
              : <div>
                <ToastNotification visible={showToast} changeState={toggleToast} message={toastMessage} toggleVisibility={toggleToast} toastTitle={toastTitle} />
                {renderSwitch(homeForms)}
              </div>
            }
          </div>
        </Col>
      </Row>
    </Container>
  )
}

Home.displayName = 'Home'
export default Home
