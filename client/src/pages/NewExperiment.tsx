import React, { useState } from "react";
import { Container, Row, Button, Modal } from "react-bootstrap";
import NavMenu from "../components/NavMenu";
import '../styles/App.css'
import NewExperimentInstructions from "../components/Dashboard/NewExperimentInstructions";
import ExperimentForm from "../components/Dashboard/ExperimentForm";
import { useHistory, useParams, Link } from "react-router-dom";

const NewExperiment = () => {
  const [showInstructions, setShowInstructions] = useState(true);

  const history = useHistory();

  const navigateToDashboard = () => {
    history.push('/vera-portal/dashboard')
  };

  const navigateToExperimentManage = (experimentToManage) => {
    history.push('/vera-portal/manage/' + experimentToManage)
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)

  const [showDraftModal, setShowDraftModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const handleCloseConfirmModal = () => setShowConfirmModal(false)

  const handleCloseDraftModal = () => {
    setShowDraftModal(false)
  }
  const handleShowDraftModal = () => {
    setShowDraftModal(true)
  }

  return (
    <>
      <NavMenu title="Dashboard" />
      <Container className="container-fluid">
        <div>
          <Modal show={showDraftModal} onHide={handleCloseDraftModal}>
            <Modal.Body className="text-center"><b>Your Experiment has been saved in draft state</b> </Modal.Body>
            <Modal.Footer className="justify-content-center">
              <Link to="/vera-portal/Dashboard">
                <Button className="tertiary-button">
                  Okay
                </Button>
              </Link>
            </Modal.Footer>
          </Modal>
        </div>
        <Row>
          {showInstructions ? (
            <NewExperimentInstructions onProceed={() => setShowInstructions(false)} />
          ) : (
            <ExperimentForm onProceed={() => navigateToDashboard()} confirmDraft={handleShowDraftModal} finalizeDraft={undefined} onBack={(pendingChanges) => setShowInstructions(true)} editing={false} experimentToEdit={undefined} />
          )}
        </Row>
        <div style={{ height: '20px' }}></div>
      </Container>
    </>
  );
};

export default NewExperiment;