import { useSelector } from "react-redux";
import React, { useCallback, useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import ExperimentCard from "../components/Dashboard/ExperimentCards";
import UsersTable from "../components/Dashboard/UsersTable";
import InviteUser from "../components/Dashboard/InviteUser";
import NavMenu from "../components/NavMenu";
import { Button, Form, FormGroup, InputGroup, Modal, Row, Col, Image } from "react-bootstrap";
import { getAdminStatus } from "../helpers/UsersApiHelper";
import { deleteExperiment, getAllExperiments, copyExperiment, getSite, createSite } from "../helpers/ExperimentApiHelper";
import { downloadDataSingleCSV, downloadExperimentDataFormatted } from "../helpers/FilesAPIHelper";
import GeneralModal from "../components/GeneralModal";
import { useHistory, Link } from "react-router-dom";
import labProfileImg from "../assets/lab_profile.png";
import searchIcon from "../assets/search.png";
import CustomAlert from '../components/CustomAlert';

// CSS imports
import "../styles/App.css";

// Interfaces
import { IExperiment } from "../interfaces/Experiment";
interface IFetchedExperiments {
  experiments: Array<IExperiment>
  success: boolean
}
import { Nav, NavItem, NavLink } from 'reactstrap'
import classnames from 'classnames'

const DashboardNavigation = ({ dashboardActions, setDashboardActions }) => {
  return (
    <div>
      <Nav tabs className="justify-content-center">
        <NavItem>
          <NavLink
            style={{ cursor: "pointer" }}
            className={classnames({ active: dashboardActions === "View Your Studies" })}
            onClick={() => setDashboardActions("View Your Studies")}
          >
            View Your Studies
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            style={{ cursor: "pointer" }}
            className={classnames({ active: dashboardActions === "View Other Researchers" })}
            onClick={() => setDashboardActions("View Other Researchers")}
          >
            View Other Researchers
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            style={{ cursor: "pointer" }}
            className={classnames({ active: dashboardActions === "Invite A Researcher" })}
            onClick={() => setDashboardActions("Invite A Researcher")}
          >
            Invite A Researcher
          </NavLink>
        </NavItem>
      </Nav>
      <h1 className="text-center mt-4">{dashboardActions}</h1>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState([]);
  const [searchItem, setSearchItem] = useState('');
  const [filteredExperiments, setFilteredExperiments] = useState(experiments);
  const [dashboardActions, setDashboardActions] = useState("View Your Studies");
  const [admin, setAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [showDownload, setShowDownload] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const [downloadPending, setDownloadPending] = useState(false);
  const [activeDownload, setActiveDownload] = useState("");

  const handleReload = () => window.location.reload();
  const handleCloseAlert = () => setShowError(false);

  const auth = useSelector((state: any) => {
    if (state.auth.isAuthenticated)
      return state.auth
  });

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const experimentsData = await getAllExperiments(auth.token);
        console.log("Experiments: ", experimentsData)
        setExperiments((oldExperiments) => [...oldExperiments, ...experimentsData]);
        setFilteredExperiments((oldExperiments) => [...oldExperiments, ...experimentsData]);
        setLoading(false);
      } catch (err) {
        if (err.toString().includes("Internal Server Error")) {
          setError("Internal Server Error Occured. Please refresh the page.")
          setShowError(true)
        }
        console.error("Error fetching studies:", err.toString());
      }
    };

    const checkAdminStatus = async () => {
      try {
        const adminStatus = await getAdminStatus(auth.user.id, auth.token);
        setAdmin(adminStatus.admin);
      } catch (err) {
        if (err.status >= 500) {
          setError("Internal Server Error Occurred. Please refresh the page.");
          setShowError(true);
        }
        console.error("Error fetching admin status:", err.message);
      }
    };

    fetchExperiments();
    checkAdminStatus();
  }, [auth]);

  const handleCloseDownload = () => setShowDownload(false);
  const handleShowDownload = () => setShowDownload(true);

  const handleInputChange = (e) => {
    const searchTerm = e.target.value;
    setSearchItem(searchTerm)

    const filteredItems = experiments.filter((experiment) =>
      experiment.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredExperiments(filteredItems);
  }

  const onZipError = (err: any) => {
    console.error(err)
    if (err.toString().includes("404")) { setMessage("No recorded participant data found for this experiment") }
    else { setMessage("An error occurred while downloading the experiment's data. Please refresh the page and try again.") }

    handleShowDownload()
    setDownloadPending(false);
    setActiveDownload("");
  }

  const onZipSuccess = () => {
    setMessage("Experiment data downloaded successfully!")
    handleShowDownload()
    setDownloadPending(false);
    setActiveDownload("");
  }

  const deleteExpCallback = useCallback(
    (experimentId: string) => {
      const actingFunction = (res: any) => {
        setFilteredExperiments((oldExperiments) => oldExperiments.filter((exp) => exp._id.toString() !== experimentId));
      }

      deleteExperiment(experimentId, auth.token, actingFunction);
    },
    [auth]
  );

  const copyExpCallback = useCallback(
    (
      sourceExperimentId: string,
      name: string,
      description: string,
      irbProtocolNumber: string,
      irbEmailAddress: string,
      irbLetter:File= null,
      collaborators: Array<string>,
      isMultiSite: boolean,
      sites: any
    ) => {

      const actingFunction = (expRes: any) => {
        console.log(expRes);

        // Add sites
        if (isMultiSite) {
          for (let i = 0; i < sites.length; i++) {
            // Create the site
            createSite(sites[i].name, sites[i].shortName, expRes._id, auth.token);
          }
        }

       location.reload()
      }

      const newName = `${name} Copy`


      console.log(`Experiment Name: ${name} Experiment Description: ${description} IRB Protocol Number: ${irbProtocolNumber} IRB Email Address ${irbEmailAddress} IRB Letter: ${irbLetter} collaborators: ${collaborators} isMultiSite: ${isMultiSite} sites: ${sites} `)
      copyExperiment(sourceExperimentId,newName, description, irbProtocolNumber, irbEmailAddress, irbLetter, collaborators, isMultiSite, auth.token, actingFunction);
    },
    [auth]
  );

  const downloadExpCallback = useCallback(
    (experimentId: string) => {
      if (downloadPending) {
        console.log("Download already in progress for another experiment");
        return;
      }

      setActiveDownload(experimentId);
      setDownloadPending(true);

      console.log("Downloading experiment data for ID: ", experimentId);
      downloadExperimentDataFormatted(experimentId, auth.token, onZipSuccess, onZipError, null)
    }
  );

  const currentScreen =
    dashboardActions === "View Your Studies" ? (
      <>
        <Container className="mt-4">
          <h1 className="mt-3 mb-3">Welcome, {auth.user.firstName}!</h1>
          <div>
            <Modal show={showDownload} onHide={handleCloseDownload}>
              <Modal.Body className="d-flex flex-column justify-content-center align-items-center">
                <p className="m-0 g-0" style={{ fontWeight: 'bold', textAlign: "center" }}>{message}</p>
              </Modal.Body>
              <Modal.Footer className="justify-content-center">
                <Button className="toast-button m-3" onClick={handleCloseDownload}>
                  Okay
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
          <Row className="gx-0" style={{ alignItems: "center" }}>
            <Col xs={"auto"} sm={"auto"} md={4} lg={5}>
              <Link to="/vera-portal/newexperiment/">
                <Button style={{ width: "300px" }} >Create New Experiment</Button>
              </Link>
            </Col>
            <Col xs={"auto"} sm={4} md={4} lg={3} className="text-end align-self-center">
              <Link to="/vera-portal/documentation/quickstart" style={{ textDecoration: 'none', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img src={labProfileImg} style={{ width: '30px', height: '30px', marginRight: '12px' }} />
                  <p style={{ margin: 0 }}>Quick Start Guide</p>
                </div>
              </Link>
            </Col>
            <Col xs={"auto"} sm={4} md={4} lg={4} className="d-flex justify-content-end">
              <InputGroup className="mt-2" style={{ width: '360px', height: '48px' }}>
                <Form.Control
                  placeholder="Search"
                  value={searchItem}
                  onChange={handleInputChange}
                  aria-label="search"
                  aria-describedby="basic-addon2"
                  style={{ alignItems: "center", color: "#868686" }}
                />
                <Button variant="outline-*" id="button-addon2">
                  <img src={searchIcon} style={{ width: '24px', height: '24px' }} />
                </Button>
              </InputGroup>
            </Col>
          </Row>
          <Row>
            {experiments.length === 0 && loading ? (
              <ExperimentCard id="" name="Loading..." participants={[]} draft={true} deleteExperiment={() => { }} copyExperiment={() => { }} downloadExperiment={() => { }} key="..." downloadPending={false} activeDownload={false} hasFiles={false} />
            ) : (
              filteredExperiments.map((exp: IExperiment) => (
                <ExperimentCard
                  id={exp._id}
                  name={exp.name}
                  participants={exp.participants}
                  draft={exp.draft}
                  deleteExperiment={() => deleteExpCallback(exp._id)}
                  copyExperiment={() => {
                    copyExpCallback(exp._id,exp.name, exp.description, exp.irbProtocolNumber, exp.irbEmailAddress, exp, exp.collaborators, exp.isMultiSite, exp.sites)
                  }}
                  downloadExperiment={() => {
                    downloadExpCallback(exp._id)
                  }}
                  downloadPending={downloadPending}
                  activeDownload={activeDownload === exp._id ? true : false}
                  hasFiles={exp.hasFiles}
                  key={Math.random()}
                />
              ))
            )}
          </Row>
          <div style={{ height: "20px" }}></div>
        </Container>
      </>
    ) : dashboardActions === "View Other Researchers" ? (
      <Container>
        <UsersTable />
      </Container>
    ) : (
      <InviteUser />
    );

  return (
    <>
      <NavMenu title="Dashboard" />
      <CustomAlert
        show={showError}
        message={error}
        onClose={handleCloseAlert}
        onReload={handleReload}
      />
      <Container className="container-fluid">
        {admin ? (
          <DashboardNavigation dashboardActions={dashboardActions} setDashboardActions={setDashboardActions} />
        ) : undefined}
        {currentScreen}
      </Container>
    </>
  );
};

Dashboard.displayName = "Dashboard";
export default Dashboard;