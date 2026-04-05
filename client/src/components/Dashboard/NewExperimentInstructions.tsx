import React from "react";
import { Button, Container, Row, Col, ListGroup } from "react-bootstrap";
import '../../styles/App.css'
import labProfileImg from '../../assets/lab_profile.png'
import { Link } from "react-router-dom";

interface NewExperimentInstructionsProps {
  onProceed: () => void;
}

const NewExperimentInstructions: React.FC<NewExperimentInstructionsProps> = ({ onProceed }) => {
  const downloadUnityPackage = () => {
    console.log("User wants to download Unity package");
    let url = "/vera-portal/static/VERA-Unity-plugin-0.1.0.unitypackage";
    let fileName = "VERA-Unity-plugin-0.1.0.unitypackage";
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement("a")
        link.href = url
        link.download = fileName || "downloaded-file"
        document.body.appendChild(link)

        link.click()

        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => {
        console.error("Error fetching the file:", error)
      })
    // TODO: Implement download functionality
  }

  return (
    <Container className="mt-4">
      <div style={{ height: '20px' }}></div>
      { /* Header */}
      <Row>
        <Col>
          <h1>Create New Experiment</h1>
        </Col>
        <Col xs={5} md={4} lg={3} className="text-end align-self-center">
          <Link to="/vera-portal/documentation/quickstart" style={{ textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <img src={labProfileImg} style={{ width: '30px', height: '30px', marginRight: '12px' }} />
            Quick Start Guide
          </Link>
        </Col>
      </Row>
      <div style={{ height: '20px' }}></div>
      { /* Instructions */}
      <Row>
        <Col>
          <Container style={{ borderRadius: "15px", border: "2px solid #816F7D", padding: "30px 60px", }}>
            <h2 className="mb-3" style={{ fontWeight: "700", color: "#816F7D" }}>Instructions</h2>
            <ListGroup as="ol" numbered variant="flush" className="instructions-list">
              <ListGroup.Item as="li" className="instructions-list-item">
                Create a new experiment to initiate the setup for your first experiment.
              </ListGroup.Item>
              <ListGroup.Item as="li" className="instructions-list-item">
                Download and install the VERA Unity package in Unity. This installation enables use of VERA Unity plugin for data collection. You can access the download anytime from the <Link to="/vera-portal/documentation" style={{ textDecoration: 'none' }}>Resources</Link> page.
              </ListGroup.Item>
              <ListGroup.Item as="li" className="instructions-list-item">
                For comprehensive information on how to conduct an experiment and the methodology by which VERA collects data from Unity, please consult the <Link to="/vera-portal/documentation" style={{ textDecoration: 'none' }}>Resources</Link> page.
              </ListGroup.Item>
            </ListGroup>
            <Button variant="secondary" onClick={downloadUnityPackage} className="mt-2">
              Download Unity Package
            </Button>
            <div style={{ height: '20px' }}></div>
          </Container>
        </Col>
      </Row>
      <div style={{ height: '40px' }}></div>
      {/* Cancel and Next buttons */}
      <Row className="mt-4">
        <Col>
          <div className="d-flex justify-content-end">
            <Link to="/vera-portal/Dashboard">
              <Button style={{ width: "120px", height: "36px" }} className="tertiary-button me-4" style={{ height: "36px" }}>
                Cancel
              </Button>
            </Link>
            <Button variant="primary" style={{ width: "120px", height: "36px" }} onClick={onProceed}>
              Next
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NewExperimentInstructions;