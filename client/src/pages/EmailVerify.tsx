import { useEffect, useState, Fragment } from "react"
import { useParams, Link, useHistory } from "react-router-dom"
import { Container, Row, Col, Image, Button } from "react-bootstrap"
import '../styles/App.css'
import { verifyEmailURL } from "../helpers/UsersApiHelper"
import success from "../assets/success_icon.png"
import failure from "../assets/failure_icon.png"
import React from "react"
import veraLogo from '../assets/VERA-logo-main-300x157.png'
import nsfLogo from '../assets/NsfLogo.jpg'

interface IRouteState {
  userVerified: boolean;
  userId: string;
}

const EmailVerify = () => {
  type EmailParams = {
    id: string
    token: string
  }

  const [validUrl, setValidUrl] = useState<boolean | null>(null)
  const param = useParams<EmailParams>()
  const history = useHistory();

  // Verifies the email of the user
  useEffect(() => {
    verifyEmailURL(param.id, param.token)
      .then(response => {
        console.log(response)
        if (response.success) {
          setValidUrl(true)
        }
      }
      ).catch(error => {
        console.log(error)
        setValidUrl(false)
      })

  }, [param])


  // Redirects to the Login Page if user is verified or the url is valid

  useEffect(() => {

    if (validUrl !== null) {
      const data: IRouteState = { userVerified: validUrl, userId: param.id }
      console.log("Pushing the validURL State: ", data)
      history.push("/vera-portal", { data })
    }

  }, [validUrl])

  if (validUrl === null) {
    return <h1>Loading...</h1> // Display a loading message while verifying
  }


  return (
    <Fragment>
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
          <Col md={12} lg={5} className="d-flex flex-column align-items-stretch" style={{ backgroundColor: "#160335", color: "#FFFFFF", minHeight: "100vh", padding: "3rem" }}>
            <div>
              <Container className="mt-5 ms-5">

                <div>
                  <h1>Sign Up</h1>
                </div>

                {
                  validUrl ? (
                    <div style={{

                      backgroundColor: "white",
                      border: "solid 2px",
                      borderRadius: "6px",
                      borderColor: "#00d459",
                      padding: "10px",
                      width: "300px",
                      height: "50px",
                      marginTop: "50px",
                      marginBottom: "50px"
                    }}>
                      <Row>
                        <Col md={2} sm={12} xs={12}>
                          <img src={success} style={{ maxWidth: 30 }} alt="success_img" className="rounded mx-auto d-block" />
                        </Col>
                        <Col className="d-none d-sm-block d-sm-none d-md-block" md={10}>
                          <p style={{ color: "black", fontWeight: "bold" }}>Email Verified Successfully</p>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <p style={{ color: "white" }}>Redirecting to Login Page in 5 Seconds...</p>
                        </Col>
                      </Row>
                    </div>

                  ) : (
                    <div style={{

                      backgroundColor: "white",
                      border: "solid 2px",
                      borderRadius: "6px",
                      borderColor: "#fd3031",
                      padding: "10px",
                      width: "300px",
                      height: "50px",
                      marginTop: "50px",
                      marginBottom: "50px"
                    }}>
                      <Row>
                        <Col md={2} sm={12}>
                          <img src={failure} style={{ maxWidth: 30 }} alt="success_img" className="rounded mx-auto d-block" />
                        </Col>
                        <Col className="d-none d-sm-block d-sm-none d-md-block" md={10}>
                          <p style={{ color: "black", fontWeight: "bold" }}>Email Verification Failed</p>
                        </Col>
                      </Row>
                    </div>

                  )
                }
                <div>
                  <Link to="/vera-portal">
                    <Button className=" form-submit-button my-1">
                      Login to VERA
                    </Button>
                  </Link>
                </div>
              </Container>
            </div>
          </Col>
        </Row>
      </Container>
    </Fragment>
  )
}

export default EmailVerify
