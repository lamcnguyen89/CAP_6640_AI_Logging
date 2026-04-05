import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Container, Row, Col, Image, Button } from "react-bootstrap"
import '../styles/App.css'
import LoginForm from '../components/Home/Login'
import veraLogo from '../assets/VERA-logo-main-300x157.png'
import nsfLogo from '../assets/NsfLogo.jpg'
const AuthPage = () => {
  const history = useHistory()
  const auth = useSelector((state: any) => state.auth)
  const { isAuthenticated } = useSelector((state: any) => state.auth)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")

  const unityServerUrl = 'http://localhost:8080/auth'

  // Fetches the Unity token from the server
  const fetchUnityToken = async () => {
    try {
      const response = await axios.get(`${import.meta.env.BASE_URL}/api/users/unitytoken`, {
        headers: {
          Authorization: `${auth.token}`,
        },
      })
      return response.data.unityToken;
    } catch (error) {
      console.error('Error fetching Unity token:', error)
      setMessage("Error: Unable to fetch Unity token")
    }
  }

  // Send the token to Unity server
  const sendTokenToUnity = async (unityToken) => {
    try {
      await axios.post(unityServerUrl, unityToken, {
        headers: {
          'Content-Type': 'text/plain', // Ensure text format for simplicity
        },
      })
      console.log('Token sent to Unity server')
    } catch (error) {
      console.error('Error sending token to Unity server:', error)
      setMessage("Error: Unity is not currently listening for a token")
    }
  }

  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        if (isAuthenticated) {
          const dashboard = {
            pathname: "/vera-portal/Dashboard/",
            hash: ""
          }
          
          // Send the token to Unity server
          const unityToken = await fetchUnityToken()
          await sendTokenToUnity(unityToken)
          // Wait 5 seconds then redirect to /Dashboard
          setTimeout(() => {
            history.push(dashboard)
          }, 5000)
        }
      } catch (error) {
        console.error('Authentication error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    console.log("Handling authentication")
    handleAuthentication()
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </div>
    )
  }

  return (
    <Container fluid className="full-height full-width">
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
              <p style={{ fontFamily: 'SF Pro', fontSize: "14px"}}>
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
        <Col md={12} lg={5} className="d-flex flex-column align-items-center justify-content-center text-center" style={{ backgroundColor: "#160335", color: "#FFFFFF", minHeight: "100vh", padding: "3rem" }}>
          <div>
            <h1>Authentication</h1>
            {isAuthenticated ? (<>
              <p>Authenticated! {message}</p>
              <p>Redirecting you to the Dashboard in 5 seconds.</p>
            </>
            ) : (
              <>
                <p>You are not logged in.</p>
                <p> Please log in first.</p>
                <div style={{ height: '50px' }}></div>
                <LoginForm
                />
              </>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default AuthPage
