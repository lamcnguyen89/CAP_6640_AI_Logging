import React, { useState } from "react";
import { Container, Row, Button, Modal } from "react-bootstrap";
import NavMenu from "../components/NavMenu";
import ExperimentForm from "../components/Dashboard/ExperimentForm";
import ExperimentAccessError from "../components/ExperimentAccessError";
import "../styles/App.css";
import { useHistory, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const ExperimentDetails = () => {
  type ExperimentParams = {
    experimentId: string;
  };

  const param = useParams<ExperimentParams>();
  const experimentId = param.experimentId;
  const auth = useSelector((state: any) => state.auth);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showFinalizeDrafttModal, setShowFinalizeDraftModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleCloseDraftModal = () => {
    setShowDraftModal(false);
  };
  const handleShowDraftModal = () => {
    setShowDraftModal(true);
  };
  const handleCloseExitModal = () => {
    setShowExitModal(false);
  };
  const handleShowExitModal = () => {
    setShowExitModal(true);
  };

  const handleShowFinalizeDraftModal = () => {
    setShowFinalizeDraftModal(true);
  };

  const handleCloseFinalizeDraftModal = () => {
    setShowFinalizeDraftModal(false);
  };

  const handleCloseConfirmModal = () => setShowConfirmModal(false);
  const handleCloseAlertModal = () => setShowAlertModal(false);
  const handleExit = (pendingChanges: boolean) => {
    if (pendingChanges) {
      setShowConfirmModal(true);
    } else {
      history.push("/vera-portal/Dashboard");
    }
  };

  const history = useHistory();

  return (
    <>
      <NavMenu title="Experiment Details" />
      <Container>
        <div>
          <Modal show={showConfirmModal} onHide={handleCloseConfirmModal}>
            <Modal.Header>
              <Modal.Body className="text-center">
                <b style={{ color: "red" }}>
                  Are you sure you want to leave without saving your changes?
                </b>
              </Modal.Body>
            </Modal.Header>

            <Modal.Footer className="justify-content-center">
              <Button
                className="tertiary-button me-4"
                onClick={handleCloseConfirmModal}
              >
                No
              </Button>
              <Link to="/vera-portal/Dashboard">
                <Button variant="primary">Yes</Button>
              </Link>
            </Modal.Footer>
          </Modal>
        </div>
        <div>
          <Modal show={showAlertModal} onHide={handleCloseAlertModal}>
            <Modal.Header>
              <Modal.Body className="text-center">
                <b>Your experiment has been successfully updated.</b>
              </Modal.Body>
            </Modal.Header>
            <Modal.Footer className="justify-content-center">
              <Link to="/vera-portal/Dashboard">
                <Button variant="primary">Okay</Button>
              </Link>
            </Modal.Footer>
          </Modal>
        </div>
        <div>
          <Modal show={showDraftModal} onHide={handleCloseDraftModal}>
            <Modal.Body className="text-center">
              <b>Your changes have been made to the experiment draft.</b>{" "}
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
              <Link to="/vera-portal/Dashboard">
                <Button className="tertiary-button">Okay</Button>
              </Link>
            </Modal.Footer>
          </Modal>
        </div>
        <div>
          <Modal
            show={showFinalizeDrafttModal}
            onHide={handleCloseFinalizeDraftModal}
          >
            <Modal.Header>
              <Modal.Body className="text-center">
                <b>Your draft has been finalized into an experiment</b>
              </Modal.Body>
            </Modal.Header>
            <Modal.Footer className="justify-content-center">
              <Link to="/vera-portal/Dashboard">
                <Button variant="primary">Okay</Button>
              </Link>
            </Modal.Footer>
          </Modal>
        </div>
        <ExperimentAccessError
          experimentId={experimentId}
          authToken={auth.token}
        >
          <Container className="container-fluid">
            <ExperimentForm
              onProceed={() => setShowAlertModal(true)}
              confirmDraft={handleShowDraftModal}
              finalizeDraft={handleShowFinalizeDraftModal}
              onBack={(pendingChanges) => handleExit(pendingChanges)}
              editing={true}
              experimentIdToEdit={experimentId}
            />
          </Container>
        </ExperimentAccessError>
      </Container>
    </>
  );
};

export default ExperimentDetails;
