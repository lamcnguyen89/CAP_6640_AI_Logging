import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Form,
  FormGroup,
  InputGroup,
  Row,
  Col,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { getAllParticipants } from "../../helpers/ParticipantsApiHelper";
import { Site, Collaborator, User } from "./ExperimentFormTypes";
import "../../styles/App.css";

// Props
interface SiteFormProps {
  // Callback function to update the parent component with the sites
  onSitesChange: (sites: Site[]) => void;
  // The sites of the experiment, a state from the parent component
  sites: Site[];
  // Callback function to update the parent component with the sites to remove
  onSiteIdsToRemoveChange: (siteIdsToRemove: string[]) => void;
  // The sites to remove from the experiment, a state from the parent component
  siteIdsToRemove: string[];
  // Callback function to update the parent component with the isMultiSite boolean
  onIsMultiSiteChange: (isMultiSite: boolean) => void;
  // Whether the experiment is multi-site or not, a state from the parent component
  isMultiSite: boolean;
  // An error associated with there being no sites, a state from the parent component
  noSitesError: string;
  // The collaborators of the experiment, used for auto-populating sites
  collaborators: Collaborator[];
  // The creator of the experiment, used for auto-populating sites
  creator: User;
  auth: any;
  experimentIdToEdit: string;
  permissionRole: string;
}

const SiteForm: React.FC<SiteFormProps> = ({
  onSitesChange,
  sites,
  onSiteIdsToRemoveChange,
  siteIdsToRemove,
  onIsMultiSiteChange,
  isMultiSite,
  noSitesError,
  collaborators,
  creator,
  auth,
  experimentIdToEdit,
  permissionRole,
}) => {
  // Validation of inputs
  const isValidInput = (input: string) => /^[a-zA-Z0-9\s]*$/.test(input);

  const [showSiteDeleteModal, setShowSiteDeleteModal] = useState(false);
  const handleCloseSiteDeleteModal = () => setShowSiteDeleteModal(false);
  const [pendingSiteDeleteIdx, setPendingSiteDeleteIdx] = useState(-1);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  // Function to generate acronym from institution and lab names
  const generateAcronym = (institution: string, lab: string) => {
    const words = [...institution.split(" "), ...lab.split(" ")];
    return words
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 8); // Limit to 8 characters for reasonable short names
  };

  // Function to auto-populate sites from collaborators and creator
  const autoPopulateSitesFromCollaborators = () => {
    if (collaborators.length === 0 && !creator) return;

    const uniqueSites = new Map<string, Site>();

    // Process creator first if they have institution and lab
    if (creator && creator.institution && creator.lab) {
      const siteName = `${creator.institution.name} - ${creator.lab.name}`;
      const siteKey = siteName.toLowerCase();

      if (!uniqueSites.has(siteKey)) {
        const shortName = generateAcronym(
          creator.institution.name,
          creator.lab.name
        );
        uniqueSites.set(siteKey, {
          name: siteName,
          shortName: shortName,
          existingId: "",
          invalidNameError: "",
          invalidShortNameError: "",
          needsUpdate: true,
        });
      }
    }

    // Process collaborators
    collaborators.forEach((collaborator) => {
      if (collaborator.user.institution && collaborator.user.lab) {
        const siteName = `${collaborator.user.institution.name} - ${collaborator.user.lab.name}`;
        const siteKey = siteName.toLowerCase();

        if (!uniqueSites.has(siteKey)) {
          const shortName = generateAcronym(
            collaborator.user.institution.name,
            collaborator.user.lab.name
          );
          uniqueSites.set(siteKey, {
            name: siteName,
            shortName: shortName,
            existingId: "",
            invalidNameError: "",
            invalidShortNameError: "",
            needsUpdate: true,
          });
        }
      }
    });

    if (uniqueSites.size > 0) {
      onSitesChange(Array.from(uniqueSites.values()));
      setHasAutoPopulated(true);
    }
  };

  // Handle multi-site toggle change
  const handleMultiSiteChange = (enabled: boolean) => {
    onIsMultiSiteChange(enabled);

    // Auto-populate sites when multi-site is first enabled and no sites exist
    if (enabled && sites.length === 1 && !hasAutoPopulated) {
      autoPopulateSitesFromCollaborators();
    }
  };

  // Reset auto-population flag when sites are manually cleared
  useEffect(() => {
    if (sites.length === 0) {
      setHasAutoPopulated(false);
    }
  }, [sites.length]);

  // Function to add new empty site fields
  const addEmptySite = () => {
    // Append an empty string to the sites arrays
    const updatedSites = [...sites];
    updatedSites.push({
      name: "",
      shortName: "",
      existingId: "",
      invalidNameError: "",
      invalidShortNameError: "",
      needsUpdate: true,
    });
    onSitesChange(updatedSites);
  };

  // Function to handle a change to one of the site's full names
  const handleSiteNameChange = (
    value: string,
    index: number,
    isShortName: boolean
  ) => {
    const oldName = sites[index].name;
    const oldShortName = sites[index].shortName;

    // Get site names and update the value at the given index
    const updatedSites = [...sites];
    if (isShortName) {
      updatedSites[index].shortName = value;
    } else {
      updatedSites[index].name = value;
    }

    // If this site was a duplicate name, remove the error on duplicates
    if (isShortName) {
      if (
        updatedSites[index].invalidShortNameError ===
        "Duplicate site short name - please remove duplicate names."
      ) {
        updatedSites.forEach((site, i) => {
          if (
            site.shortName !== undefined &&
            site.shortName !== "" &&
            oldShortName !== undefined &&
            oldShortName !== "" &&
            site.shortName.toLocaleLowerCase() ===
              oldShortName.toLocaleLowerCase() &&
            i !== index
          ) {
            updatedSites[i].invalidShortNameError = "";
          }
        });
      }
    } else {
      if (
        updatedSites[index].invalidNameError ===
        "Duplicate site name - please remove duplicate names."
      ) {
        updatedSites.forEach((site, i) => {
          if (
            site.name !== undefined &&
            site.name !== "" &&
            oldName !== undefined &&
            oldName !== "" &&
            site.name.toLocaleLowerCase() === oldName.toLocaleLowerCase() &&
            i !== index
          ) {
            updatedSites[i].invalidNameError = "";
          }
        });
      }
    }

    // Ensure input is okay
    if (!isValidInput(value)) {
      if (isShortName) {
        updatedSites[index].invalidShortNameError =
          "Please use valid input (letters and numbers only).";
      } else {
        updatedSites[index].invalidNameError =
          "Please use valid input (letters and numbers only).";
      }
    } else {
      if (isShortName) {
        updatedSites[index].invalidShortNameError = "";
      } else {
        updatedSites[index].invalidNameError = "";
      }
    }

    updatedSites[index].needsUpdate = true;
    onSitesChange(updatedSites);
  };

  // Function to start removing a site
  // First checks if there is data associated with the site, and asks for confirmation if there is
  // This does not actually remove the site, and rather just provides the setup to delete;
  // site removal actually occurs in the confirmSiteDeleteByIndex function
  const removeSite = (index: number) => {
    setPendingSiteDeleteIdx(index);

    // If the site has an existing ID, check to see if there is data associated with the site
    // If there is, show a confirmation modal; if not, remove the site (there is no data).
    if (
      sites[index].existingId !== "" &&
      sites[index].existingId !== undefined
    ) {
      // Get all participants for the experiment, to see if any are associated with the site
      getAllParticipants(auth.token, experimentIdToEdit)
        .then((res) => {
          if (res.status >= 500) {
            console.log(res.message);
            return;
          }

          // Sort participants by selected site
          res.participants = res.participants.filter(
            (participant) => participant.site === sites[index].existingId
          );

          // If any participants exist, data exists for this site; do not delete, instead show a confirmation modal
          if (res.participants.length > 0) {
            setShowSiteDeleteModal(true);
            return;
          } else {
            // No participants exist, site has no data; okay for deletion.
            confirmSiteDeleteByIndex(index);
          }
        })
        .catch((err) => {
          console.log(err);
          return;
        });
    } else {
      // Site has no associated ID, tehre is no data associated with it; okay to delete.
      confirmSiteDeleteByIndex(index);
    }
  };

  // Confirms site deletion by index, and proceeds to actually remove the site
  // (doesn't actually delete the site until form is submitted; just formally marks it for deletion)
  const confirmSiteDeleteByIndex = (indexToDelete) => {
    if (indexToDelete === -1) {
      return;
    }

    // Mark site as needing deletion and remove from list of sites
    if (sites[indexToDelete].existingId !== "") {
      const updatedSiteIdsToRemove = [...siteIdsToRemove];
      updatedSiteIdsToRemove.push(sites[indexToDelete].existingId);
      onSiteIdsToRemoveChange(updatedSiteIdsToRemove);
    }

    // If the site was a duplicate site, remove the duplicate name errors from other sites
    let updatedSites = [...sites];
    const currentName = sites[indexToDelete].name;
    const currentShortName = sites[indexToDelete].shortName;
    if (
      updatedSites[indexToDelete].invalidShortNameError ===
      "Duplicate site short name - please remove duplicate names."
    ) {
      updatedSites.forEach((site, i) => {
        if (
          site.shortName !== undefined &&
          site.shortName !== "" &&
          currentShortName !== undefined &&
          currentShortName !== "" &&
          site.shortName.toLocaleLowerCase() ===
            currentShortName.toLocaleLowerCase() &&
          i !== indexToDelete
        ) {
          updatedSites[i].invalidShortNameError = "";
        }
      });
    }
    if (
      updatedSites[indexToDelete].invalidNameError ===
      "Duplicate site name - please remove duplicate names."
    ) {
      updatedSites.forEach((site, i) => {
        if (
          site.name !== undefined &&
          site.name !== "" &&
          currentName !== undefined &&
          currentName !== "" &&
          site.name.toLocaleLowerCase() === currentName.toLocaleLowerCase() &&
          i !== indexToDelete
        ) {
          updatedSites[i].invalidNameError = "";
        }
      });
    }

    // Remove the site from the list of sites
    updatedSites = updatedSites.filter((_, i) => i !== indexToDelete);
    onSitesChange(updatedSites);

    // Close the site deletion confirm modal, if it was shown
    handleCloseSiteDeleteModal();
  };

  // Confirms site deletion, using the pending index to delete
  const confirmSiteDeleteByPending = () => {
    confirmSiteDeleteByIndex(pendingSiteDeleteIdx);
  };

  // Check if user has permission to edit sites
  const canEditSites =
    permissionRole === "Admin" || permissionRole === "Creator";

  // Helper function to render tooltip wrapper for disabled elements
  const renderWithTooltip = (
    element: React.ReactElement,
    tooltipId: string,
    tooltipText: string
  ) => {
    if (!canEditSites) {
      return (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={tooltipId}>{tooltipText}</Tooltip>}
        >
          <span style={{ display: "inline-block", width: "100%" }}>
            {element}
          </span>
        </OverlayTrigger>
      );
    }
    return element;
  };

  return (
    <Container
      style={{
        border: "1px solid lightgrey",
        borderRadius: "5px",
        padding: "15px 45px",
      }}
    >
      <Modal show={showSiteDeleteModal} onHide={handleCloseSiteDeleteModal}>
        <Modal.Header>
          <Modal.Body>
            <b>
              This site is currently in use, and data has been associated with
              it. Are you sure you want to delete this site? All data associated
              with this site will be lost.
            </b>
          </Modal.Body>
        </Modal.Header>
        <Modal.Footer className="justify-content-center">
          <Button
            className="tertiary-button me-4"
            onClick={handleCloseSiteDeleteModal}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmSiteDeleteByPending}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Row>
        <Col>
          <h2>Multi-Site Support</h2>
        </Col>
      </Row>

      <Row>
        <Col xs="auto">
          <Container
            className="mt-3"
            style={{
              border: "1px solid lightgrey",
              borderRadius: "5px",
              padding: "10px 10px",
            }}
          >
            <Row className="align-items-center justify-content-between">
              <Col xs="auto">
                <span>Enable multisite for this experiment</span>
              </Col>
              <Col xs="auto">
                {renderWithTooltip(
                  <Form.Check
                    type="switch"
                    id="multi-site-switch"
                    label=""
                    checked={isMultiSite}
                    disabled={!canEditSites}
                    onChange={(e) => {
                      handleMultiSiteChange(e.target.checked);
                    }}
                  />,
                  "multisite-switch-tooltip",
                  "You don't have permissions to modify multi-site settings."
                )}
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>

      {isMultiSite ? (
        <Row>
          <Col>
            {sites.length > 0 ? (
              sites.map((site, index) => (
                <FormGroup key={index} className="mt-3">
                  <Row>
                    <Col xl={4} lg={4} md={5} xs={5}>
                      <Form.Label>Name of the Site</Form.Label>
                      <InputGroup hasValidation>
                        {renderWithTooltip(
                          <Form.Control
                            type="text"
                            placeholder="Enter the site's full name"
                            required
                            value={site.name}
                            disabled={!canEditSites}
                            onChange={(e) =>
                              handleSiteNameChange(e.target.value, index, false)
                            }
                            isInvalid={site.invalidNameError !== ""}
                          />,
                          `site-name-tooltip-${index}`,
                        "You don't have permissions to modify multi-site settings."
                        )}
                        <Form.Control.Feedback type="invalid">
                          {site.invalidNameError}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Col>
                    <Col xl={4} lg={4} md={5} xs={5}>
                      <Form.Label>Short Name of the Site</Form.Label>
                      <InputGroup hasValidation>
                        {renderWithTooltip(
                          <Form.Control
                            type="text"
                            placeholder="Enter the site's short name"
                            required
                            value={site.shortName}
                            disabled={!canEditSites}
                            onChange={(e) =>
                              handleSiteNameChange(e.target.value, index, true)
                            }
                            isInvalid={site.invalidShortNameError !== ""}
                          />,
                          `site-short-name-tooltip-${index}`,
                        "You don't have permissions to modify multi-site settings."
                        )}
                        <Form.Control.Feedback type="invalid">
                          {site.invalidShortNameError}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Col>
                    <Col xl={2} lg={2} md={2} xs={2}>
                      {renderWithTooltip(
                        <Button
                          className="tertiary-button"
                          style={{
                            marginTop: "30px",
                            height: "48px",
                            width: "100px",
                          }}
                          disabled={!canEditSites}
                          onClick={() => removeSite(index)}
                        >
                          Remove
                        </Button>,
                        `remove-site-tooltip-${index}`,
                        "You don't have permissions to modify multi-site settings."
                      )}
                    </Col>
                  </Row>
                </FormGroup>
              ))
            ) : (
              <Row>
                <Col xl={8} lg={12} md={12} xs={12}>
                  <Container
                    className="mt-3"
                    style={{
                      border: "1px solid lightgrey",
                      borderRadius: "5px",
                      padding: "15px 20px",
                    }}
                  >
                    <p>You have not added any sites to this experiment yet.</p>
                  </Container>
                </Col>
              </Row>
            )}

            <Row>
              <Col>
                <Button
                  className="tertiary-button mt-3"
                  style={{ width: "120px", height: "36px" }}
                  disabled={!canEditSites}
                  onClick={addEmptySite}
                >
                  Add new site
                </Button>
              </Col>
            </Row>

            <Row>
              {noSitesError ? (
                <div>
                  <div style={{ height: "20px" }}></div>
                  <div className="home-inputs">
                    <div
                      style={{
                        background: "#ff5959",
                        color: "white",
                        borderRadius: "5px",
                        padding: "5px",
                      }}
                    >
                      {noSitesError}
                    </div>
                  </div>
                </div>
              ) : null}
            </Row>
          </Col>
        </Row>
      ) : (
        <div></div>
      )}
    </Container>
  );
};

export default SiteForm;
