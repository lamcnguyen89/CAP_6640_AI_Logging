import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Button,
  Form,
  FormGroup,
  InputGroup,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  getExperiment,
  createExperiment,
  updateExperiment,
  createDraft,
  updateDraft,
  getUserExperimentPermission,
  getExperimentCreator,
} from "../../helpers/ExperimentApiHelper";
import {
  createColumnDefinition,
  getColumnDefinition,
} from "../../helpers/ColumnDefinitionApiHelper";
import {
  ExperimentBaseInfo,
  Collaborator,
  ConditionGroup,
  Site,
  FileType,
  Column,
  User,
} from "./ExperimentFormTypes";
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep";
import {
  validateBaseInfoFields,
  validateCollaborators,
  validateSites,
  validateFileTypes,
} from "./ExperimentFormValidationHelper";
import {
  getTrimmedData,
  updateExperimentCollaborators,
  updateExperimentSites,
  updateExperimentFileTypes,
} from "./ExperimentFormUpdatingHelper";

import { updateCollaborators } from "../../helpers/ExperimentApiHelper";
import ExperimentBaseInfoForm from "./ExperimentBaseInfoForm";
import CollaboratorsForm from "./CollaboratorsForm";
import ConditionsForm from "./ConditionsForm";
import SiteForm from "./SiteForm";
import FileTypesForm from "./FileTypesForm";
import "../../styles/App.css";
import labProfileImg from "../../assets/lab_profile.png";
import WebXRLinkDisplay from "./WebXRLinkDisplay";
import { getUserProfile } from "../../helpers/UsersApiHelper";

// Props
interface ExperimentFormProps {
  // onBack will be called when the user goes "back" to a previous form
  onBack: (pendingChanges) => void; // pendingChanges is a boolean that is true if there are unsaved changes
  // onProceed will be called when the user has successfully submitted the form (created/edited successfully)
  // onProceed: (experimentToManage) => void; // experimentToManage is the ID of the experiment we just created / edited
  onProceed: () => void;
  // Shows a confirmation modal when saving as a draft
  confirmDraft: () => void;
  // Shows confirmation modal when finalizing a draft
  finalizeDraft: () => void;
  // editing should be true if we are editing an existing experiment, false if we are creating a new one
  editing: boolean;
  // experimentIdToEdit should be the ID of the experiment we are editing, if we are editing one
  experimentIdToEdit: any;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({
  onBack,
  onProceed,
  confirmDraft,
  finalizeDraft,
  editing,
  experimentIdToEdit,
}) => {
  const auth = useSelector((state: any) => state.auth);

  const [pendingChanges, setPendingChanges] = useState(false);
  const [permissionRole, setPermissionRole] = useState<string>("Loading");
  const [expCreator, setExpCreator] = useState<User>(null);

  const [validated, setValidated] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState<number>(0);
  const forceRender = () => setRenderTrigger((prev) => prev + 1);

  const handleOnBack = () => {
    onBack(pendingChanges);
  };

  // The experiment's base info (name, description, IRB protocol number, IRB email address)
  // States updated via ExperimentBaseInfoForm.tsx sub-component
  const [experimentBaseInfo, setExperimentBaseInfo] = useState<
    ExperimentBaseInfo
  >({
    name: "",
    nameError: "",
    description: "",
    descriptionError: "",
    irbProtocolNumber: "",
    irbProtocolNumberError: "",
    irbEmailAddress: "",
    irbEmailAddressError: "",
    irbLetterName: "",
    irbLetter: "",
    irbLetterDownload: "",
    irbUploadStatus: "",
    irbLetterError: "",
    draft: true,
  });

  const [removeIrbLetter, setRemoveIrbLetter] = useState(false);

  const handleBaseInfoChange = (baseInfo: ExperimentBaseInfo) => {
    setExperimentBaseInfo(baseInfo);
    setPendingChanges(true);
  };

  // Collaborators for the experiment
  // States updated via CollaboratorsForm.tsx sub-component
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const handleCollaboratorsChange = (collaborators: Collaborator[]) => {
    setCollaborators(collaborators);
    setPendingChanges(true);
  };

  // Conditions for the experiment
  // States updated via ConditionsForm.tsx sub-component
  const [conditions, setConditions] = useState<ConditionGroup[]>([]);

  // Ensure deep copy to avoid reference issues when updating/removing
  const handleConditionsChange = (updatedConditions: ConditionGroup[]) => {
    setConditions([...updatedConditions]);
    setPendingChanges(true);
  };

  // Multi-site info for the experiment
  // States updated via SiteForm.tsx sub-component
  const [isMultiSite, setIsMultiSite] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteIdsToRemove, setSiteIdsToRemove] = useState<string[]>([]);
  const [noSitesError, setNoSitesError] = useState("");

  const handleSitesChange = (sites: Site[]) => {
    setSites(sites);
    setPendingChanges(true);
    setNoSitesError("");
  };

  const handleSitesIdsToRemoveChange = (siteIdsToRemove: string[]) => {
    setSiteIdsToRemove(siteIdsToRemove);
    setPendingChanges(true);
  };

  const handleIsMultiSiteChange = (isMultiSite: boolean) => {
    setIsMultiSite(isMultiSite);
    setPendingChanges(true);
    setNoSitesError("");
  };

  // File type info for the experiment
  // States updated via FileTypesForm.tsx sub-component
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [fileTypesIdsToRemove, setFileTypesIdsToRemove] = useState<string[]>(
    []
  );
  const [loaded, setLoaded] = useState(false);
  const takeSnapshot = useCallback(
    () => ({
      baseInfo: experimentBaseInfo,
      collaborators,
      isMultiSite,
      sites,
      siteIdsToRemove,
      fileTypes,
      fileTypesIdsToRemove,
    }),
    [
      experimentBaseInfo,
      collaborators,
      isMultiSite,
      sites,
      siteIdsToRemove,
      fileTypes,
      fileTypesIdsToRemove,
    ]
  );

  const [originalSnapshotObj, setOriginalSnapshotObj] = useState<any>(null);

  const handleFileTypesChange = (fileTypes: FileType[]) => {
    setFileTypes(fileTypes);
    setPendingChanges(true);
  };

  const handleFileTypesToRemoveChange = (idsToRemove: string[]) => {
    setFileTypesIdsToRemove(idsToRemove);
    setPendingChanges(true);
  };

  // Effect to get the experiment's existing information if we are editing an existing experiment
  useEffect(() => {
    if (editing && experimentIdToEdit !== null) {
      // Get the user's permission role for the experiment
      getUserExperimentPermission(experimentIdToEdit, auth.token)
        .then((response) => {
          setPermissionRole(response.permissionRole);
        })
        .catch((error) => {
          console.error("Error fetching user experiment permission:", error);
          setPermissionRole("Failure");
        });

      // Get the experiment's creator
      getExperimentCreator(experimentIdToEdit, auth.token).then((res) => {
        setExpCreator(res.creator);
      }).catch((error) => {
        console.error("Error fetching experiment creator:", error);
        setExpCreator(null);
      });

      // Function to handle the success of fetching an experiment, updating relevant info
      const onFetchSuccess = async (experiment) => {
        setExperimentBaseInfo({
          name: experiment.name,
          nameError: "",
          description: experiment.description,
          descriptionError: "",
          irbProtocolNumber: experiment.irbProtocolNumber,
          irbProtocolNumberError: "",
          irbEmailAddress: experiment.irbEmailAddress,
          irbEmailAddressError: "",
          irbLetterName: experiment.irbLetterName,
          irbLetter: "",
          irbLetterDownload: experiment.irbLetter,
          irbLetterError: "",
          draft: experiment.draft,
        });
        setCollaborators(
          experiment.collaborators.map((collab) => ({
            user: {
              id: collab.user._id,
              email: collab.user.email,
              firstName: collab.user.firstName || "",
              lastName: collab.user.lastName || "",
              institution: collab.user.institution?.name || "",
              lab: collab.user.lab?.name || "",
            },
            permissionRole: collab.permissionRole,
            invalidError: "",
            needsUpdate: false,
          }))
        );
        setIsMultiSite(experiment.isMultiSite);
        setSites(
          experiment.sites.map((site) => ({
            name: site.name,
            shortName: site.shortName,
            existingId: site._id,
            invalidNameError: "",
            invalidShortNameError: "",
            needsUpdate: false,
          }))
        );
        // Set conditions from experiment if present
        if (Array.isArray(experiment.conditions)) {
          setConditions(experiment.conditions);
        } else {
          setConditions([]);
        }
        // Set up each file type
        let fetchedFileTypes: FileType[] = [];
        for (let i = 0; i < experiment.fileTypes.length; i++) {
          let fileType = experiment.fileTypes[i];
          let columnsArr: Column[] = [];
          if (fileType.columnDefinition !== undefined) {
            const columnDefRes = await getColumnDefinition(
              fileType.columnDefinition,
              auth.token
            );
            if (columnDefRes.httpStatus === 200) {
              columnsArr = columnDefRes.columnDefinition.columns
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((col) => ({
                  name: col.name,
                  description: col.description,
                  dataType: col.dataType,
                  transform: col.transform,
                  existingId: col._id,
                  needsUpdate: false,
                }));
            }

            fetchedFileTypes.push({
              fileName: fileType.name,
              fileExtension: fileType.extension,
              fileDescription: fileType.description,
              existingId: fileType._id,
              invalidFileNameError: "",
              invalidFileExtensionError: "",
              invalidFileDescriptionError: "",
              needsUpdate: false,
              columnDefinition: {
                columns: columnsArr,
                columnIdsToDelete: [],
                existingId: fileType.columnDefinition,
                needsUpdate: false,
              },
            });
          } else {
            fetchedFileTypes.push({
              fileName: fileType.name,
              fileExtension: fileType.extension,
              fileDescription: fileType.description,
              existingId: fileType._id,
              invalidFileNameError: "",
              invalidFileExtensionError: "",
              invalidFileDescriptionError: "",
              needsUpdate: false,
              columnDefinition: undefined,
            });
          }
        }
        setFileTypes(fetchedFileTypes);
        setLoaded(true);
      };
      // Function to fetch the experiment and call onFetchSuccess if successful
      const fetchExperiment = async () => {
        try {
          const result = await getExperiment(
            experimentIdToEdit,
            auth.token,
            onFetchSuccess
          );
        } catch (error) {
          console.error("Error while fetching experiment: ", error);
        }
      };

      fetchExperiment();
    } else {
      setPendingChanges(true);

      // If we are creating an experiment, the creator is the current user
      // Fetch the user profile of the current user to set as the experiment creator
      setPermissionRole("Creator");
      getUserProfile(auth.token).then((profile) => {
        setExpCreator(profile.user);
      }).catch((error) => {
        console.error("Error fetching user profile:", error);
        setExpCreator(null);
      });
    }
  }, [editing, experimentIdToEdit, auth.token]);

  useEffect(() => {
    if (loaded) {
      setOriginalSnapshotObj(cloneDeep(takeSnapshot()));
      setPendingChanges(false);
    }
  }, [loaded]);

  useEffect(() => {
    if (editing && originalSnapshotObj) {
      const current = takeSnapshot();
      setPendingChanges(!isEqual(current, originalSnapshotObj));
    }
  }, [takeSnapshot, originalSnapshotObj, editing]);

  // Confirms changes to experiment info, and either creates or updates the experiment
  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    let invalid = false;

    // Ensure all base info fields are valid
    if (!validateBaseInfoFields(experimentBaseInfo, setExperimentBaseInfo)) {
      invalid = true;
    }

    // Ensure all collaborators are valid
    if (!validateCollaborators(collaborators, setCollaborators)) {
      invalid = true;
    }

    // Ensure all sites are valid
    if (!validateSites(sites, isMultiSite, setNoSitesError, setSites)) {
      invalid = true;
    }

    // Ensure all file types are valid
    if (!validateFileTypes(fileTypes, setFileTypes)) {
      invalid = true;
    }

    // If no inputs are invalid, continue to creation / update
    if (!invalid) {
      if (editing) {
        updateExistingExperiment();
      } else {
        createNewExperiment();
      }
    }
  };

  // Creates a new experiment with the new information
  const createNewExperiment = () => {
    setValidated(true);
    let invalid = false;

    let {
      trimmedCollaborators,
      trimmedExpName,
      trimmedExpDescription,
      trimmedIrbNumber,
      trimmedIrbEmail,
      trimmedSites,
      trimmedFileTypes,
    } = getTrimmedData(collaborators, experimentBaseInfo, sites, fileTypes);

    // Create the experiment first, then add sites and file types
    createExperiment(
      trimmedExpName,
      trimmedExpDescription,
      trimmedIrbNumber,
      trimmedIrbEmail,
      experimentBaseInfo.irbLetter,
      collaborators,
      isMultiSite,
      auth.token,
      async (expRes: any) => {
        // If an experiment already exists by this name, display an error
        if (expRes.httpStatus === 409) {
          let updatedExperimentBaseInfo = { ...experimentBaseInfo };
          updatedExperimentBaseInfo.nameError =
            "An experiment already exists by this name.";
          setExperimentBaseInfo(updatedExperimentBaseInfo);
          invalid = true;
        }
        // General server error
        else if (expRes.httpStatus >= 500) {
          invalid = true;
        } else {
          // If we made it this far, everything was okay when creating the experiment
          // Mark the collaborators as okay
          const updatedCollaborators = [...collaborators];
          updatedCollaborators.forEach((collaborator, index) => {
            updatedCollaborators[index].needsUpdate = false;
          });
          setCollaborators(updatedCollaborators);

          // Update sites
          let sitesValid = await updateExperimentSites(
            isMultiSite,
            sites,
            setSites,
            siteIdsToRemove,
            setSiteIdsToRemove,
            expRes._id,
            auth
          );
          if (!sitesValid) {
            invalid = true;
            return;
          }

          // Update file types
          let fileTypesValid = await updateExperimentFileTypes(
            fileTypes,
            setFileTypes,
            fileTypesIdsToRemove,
            setFileTypesIdsToRemove,
            expRes._id,
            auth
          );
          if (!fileTypesValid) {
            invalid = true;
            return;
          }

          // If we made it this far, everything is okay. Proceed
          setPendingChanges(false);
          setValidated(true);
          // onProceed(expRes._id);
          onProceed();
          return;
        }
      }
    );
  };

  // Updates an existing experiment with the new information
  const updateExistingExperiment = () => {
    let invalid = false;
    setValidated(true);

    let {
      trimmedCollaborators,
      trimmedExpName,
      trimmedExpDescription,
      trimmedIrbNumber,
      trimmedIrbEmail,
      trimmedSites,
      trimmedFileTypes,
    } = getTrimmedData(collaborators, experimentBaseInfo, sites, fileTypes);

    // Update existing experiment first, then update file types, collaborators and sites
    updateExperiment(
      experimentIdToEdit,
      trimmedExpName,
      trimmedExpDescription,
      trimmedIrbNumber,
      trimmedIrbEmail,
      experimentBaseInfo.irbLetter,
      removeIrbLetter,
      conditions,
      isMultiSite,
      auth.token,
      async (expRes: any) => {
        if (expRes.httpStatus === 404) {
          // Experiment not found
          invalid = true;
        } else if (expRes.httpStatus === 409) {
          // Experiment already exists by name
          setExperimentBaseInfo((prevState) => ({
            ...prevState,
            nameError: "An experiment already exists by this name.",
          }));
          invalid = true;
        } else if (expRes.httpStatus >= 500) {
          // General error
          invalid = true;
        } else {
          // Update collaborators
          let collaboratorsValid = await updateExperimentCollaborators(
            collaborators,
            experimentIdToEdit,
            auth
          );
          if (!collaboratorsValid) {
            invalid = true;
            forceRender();
            return;
          }

          // Update sites
          let sitesValid = await updateExperimentSites(
            isMultiSite,
            sites,
            setSites,
            siteIdsToRemove,
            setSiteIdsToRemove,
            experimentIdToEdit,
            auth
          );
          if (!sitesValid) {
            invalid = true;
            return;
          }

          // Update file types
          let fileTypesValid = await updateExperimentFileTypes(
            fileTypes,
            setFileTypes,
            fileTypesIdsToRemove,
            setFileTypesIdsToRemove,
            experimentIdToEdit,
            auth
          );
          if (!fileTypesValid) {
            invalid = true;
            return;
          }

          // If we made it this far, everything is okay. Proceed
          setPendingChanges(false);
          setValidated(true);

          if (experimentBaseInfo.draft) {
            finalizeDraft();
          } else {
            onProceed();
          }

          return;
        }
      },
      (errRes: any) => {
        invalid = true;
        return;
      }
    );
  };

  // Save Draft of Experiment
  const SubmitDraft = () => {
    // Trim Info
    let {
      trimmedExpName,
      trimmedExpDescription,
      trimmedIrbNumber,
      trimmedIrbEmail,
    } = getTrimmedData(collaborators, experimentBaseInfo, sites, fileTypes);

    let invalid = false;

    console.log("IRB Letter to be drafted: ", experimentBaseInfo.irbLetter);

    // Make sure that we at least have an experiment name
    if (trimmedExpName === "") {
      setExperimentBaseInfo((prev) => ({
        ...prev,
        nameError: "Please provide an experiment name.",
      }));
      invalid = true;
    }

    // Check if Editing or Create and either save draft or update draft
    if (!invalid) {
      if (editing) {
        updateDraft(
          experimentIdToEdit,
          trimmedExpName,
          trimmedExpDescription,
          trimmedIrbNumber,
          trimmedIrbEmail,
          experimentBaseInfo.irbLetter,
          collaborators,
          conditions,
          isMultiSite,
          auth.token,
          async (expRes: any) => {
            if (expRes.httpStatus === 404) {
              // Experiment not found
              invalid = true;
            } else if (expRes.httpStatus === 409) {
              // Experiment already exists by name
              setExperimentBaseInfo((prevState) => ({
                ...prevState,
                nameError: "An experiment already exists by this name.",
              }));
              invalid = true;
            } else if (expRes.httpStatus === 400) {
              // Experiment already exists by name
              setExperimentBaseInfo((prevState) => ({
                ...prevState,
                nameError: "Cannot upload file greater then 50mb",
              }));
            } else if (expRes.httpStatus >= 500) {
              // General error
              invalid = true;
            } else {
              // Update collaborators
              let collaboratorsValid = await updateExperimentCollaborators(
                collaborators,
                experimentIdToEdit,
                auth
              );
              if (!collaboratorsValid) {
                invalid = true;
                forceRender();
                return;
              }

              // Update sites
              let sitesValid = await updateExperimentSites(
                isMultiSite,
                sites,
                setSites,
                siteIdsToRemove,
                setSiteIdsToRemove,
                experimentIdToEdit,
                auth
              );
              if (!sitesValid) {
                invalid = true;
                return;
              }

              // Update file types
              let fileTypesValid = await updateExperimentFileTypes(
                fileTypes,
                setFileTypes,
                fileTypesIdsToRemove,
                setFileTypesIdsToRemove,
                experimentIdToEdit,
                auth
              );
              if (!fileTypesValid) {
                invalid = true;
                return;
              }

              // If we made it this far, everything is okay. Proceed
              setPendingChanges(false);
              setValidated(true);
              confirmDraft();
              //onProceed(experimentIdToEdit);
              return;
            }
          },
          (errRes: any) => {
            invalid = true;
            return;
          }
        );
      } else {
        createDraft(
          trimmedExpName,
          trimmedExpDescription,
          trimmedIrbNumber,
          trimmedIrbEmail,
          experimentBaseInfo.irbLetter,
          collaborators,
          conditions,
          isMultiSite,
          auth.token,
          async (expRes: any) => {
            // If an experiment already exists by this name, display an error
            if (expRes.httpStatus === 409) {
              let updatedExperimentBaseInfo = { ...experimentBaseInfo };
              updatedExperimentBaseInfo.nameError =
                "An experiment already exists by this name.";
              setExperimentBaseInfo(updatedExperimentBaseInfo);
              invalid = true;
            }
            // General server error
            else if (expRes.httpStatus >= 500) {
              invalid = true;
            } else {
              // If we made it this far, everything was okay when creating the experiment
              // Mark the collaborators as okay
              const updatedCollaborators = [...collaborators];
              updatedCollaborators.forEach((collaborator, index) => {
                updatedCollaborators[index].needsUpdate = false;
              });
              setCollaborators(updatedCollaborators);

              // Update sites
              let sitesValid = await updateExperimentSites(
                isMultiSite,
                sites,
                setSites,
                siteIdsToRemove,
                setSiteIdsToRemove,
                expRes._id,
                auth
              );
              if (!sitesValid) {
                invalid = true;
                return;
              }

              // Update file types
              let fileTypesValid = await updateExperimentFileTypes(
                fileTypes,
                setFileTypes,
                fileTypesIdsToRemove,
                setFileTypesIdsToRemove,
                expRes._id,
                auth
              );
              if (!fileTypesValid) {
                invalid = true;
                return;
              }

              // If we made it this far, everything is okay. Proceed
              setPendingChanges(false);
              setValidated(true);
              confirmDraft();
              // onProceed(expRes._id);
              return;
            }
          }
        );
      }
    }
  };

  return (
    <Container className="mt-4">
      <div style={{ height: "20px" }}></div>
      {/* Header */}
      <Row>
        <Col>
          {editing ? (
            <h1>
              Edit Experiment{" "}
              {experimentBaseInfo.draft ? (
                <p
                  className="status-output ms-4 me-4"
                  style={{
                    fontSize: "12px",
                    color: "#545454",
                    border: "2px solid #545454",
                  }}
                >
                  Draft
                </p>
              ) : (
                ""
              )}
            </h1>
          ) : (
            <h1>Create New Experiment</h1>
          )}
        </Col>
        <Col xs={5} md={4} lg={3} className="text-end align-self-center">
          <Link
            to="/vera-portal/Documentation/quickstart"
            style={{
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <img
              src={labProfileImg}
              style={{ width: "30px", height: "30px", marginRight: "12px" }}
            />
            Quick Start Guide
          </Link>
        </Col>
      </Row>
      {permissionRole === "Loading" ? (
        <Container className="text-center mt-5">
          <h2>Loading...</h2>
        </Container>
      ) : permissionRole === "Failure" ? (
        <Container className="text-center mt-5">
          <h2>There was an issue loading this experiment.</h2>
          <p>Please refresh the page and try again.</p>
        </Container>
      ) : permissionRole === "Unauthorized" ? (
        <Container className="text-center mt-5">
          <h2>You do not have permission to view this experiment.</h2>
          <p>Contact the experiment's owner to request permission.</p>
        </Container>
      ) : (
        <Container className="container-fluid">
          <div className="container mt-4">
            <Form noValidate onSubmit={submitForm}>
              <Row>
                <ExperimentBaseInfoForm
                  onBaseInfoChange={handleBaseInfoChange}
                  expBaseInfo={experimentBaseInfo}
                  removeIrbLetter={() => setRemoveIrbLetter(true)}
                  permissionRole={permissionRole}
                />
              </Row>
              <div style={{ height: "20px" }}></div>
              <Row>
                <FileTypesForm
                  onFileTypesChange={handleFileTypesChange}
                  fileTypes={fileTypes}
                  onFileTypesToRemoveChange={handleFileTypesToRemoveChange}
                  fileTypeIdsToRemove={fileTypesIdsToRemove}
                  auth={auth}
                  experimentIdToEdit={experimentIdToEdit}
                  permissionRole={permissionRole}
                />
              </Row>
              <div style={{ height: "20px" }}></div>
              <Row>
                <CollaboratorsForm
                  onCollaboratorsChange={handleCollaboratorsChange}
                  collaborators={collaborators}
                  permissionRole={permissionRole}
                />
              </Row>
              <div style={{ height: "20px" }}></div>
              <ConditionsForm
                conditions={conditions}
                onConditionsChange={handleConditionsChange}
                auth={auth}
                experimentIdToEdit={experimentIdToEdit}
                permissionRole={permissionRole}
              />
              <div style={{ height: "20px" }}></div>
              <Row>
                <SiteForm
                  onSitesChange={handleSitesChange}
                  sites={sites}
                  onSiteIdsToRemoveChange={handleSitesIdsToRemoveChange}
                  siteIdsToRemove={siteIdsToRemove}
                  isMultiSite={isMultiSite}
                  onIsMultiSiteChange={handleIsMultiSiteChange}
                  noSitesError={noSitesError}
                  collaborators={collaborators}
                  creator={expCreator}
                  auth={auth}
                  experimentIdToEdit={experimentIdToEdit}
                  permissionRole={permissionRole}
                />
              </Row>
              <div style={{ height: "20px" }}></div>
              <Row>
                <WebXRLinkDisplay
                  auth={auth}
                  experimentIdToEdit={experimentIdToEdit}
                  sites={sites}
                  isMultiSite={isMultiSite}
                  permissionRole={permissionRole}
                />
              </Row>
              <div style={{ height: "20px" }}></div>
              {/* Back / next buttons */}
              <div className="d-flex justify-content-end">
                <Button
                  className="tertiary-button me-4"
                  style={{ width: "120px", height: "36px" }}
                  type="button"
                  onClick={handleOnBack}
                >
                  {editing ? "Cancel" : "Back"}
                </Button>
                {experimentBaseInfo.draft ? (
                  <Button
                    className="tertiary-button me-4"
                    style={{
                      width: "120px",
                      height: "36px",
                      backgroundColor: "#644F64",
                      color: "white",
                    }}
                    type="button"
                    disabled={editing && !pendingChanges}
                    onClick={SubmitDraft}
                  >
                    {editing ? "Update Draft" : "Save as Draft"}
                  </Button>
                ) : null}
                <Button
                  variant="primary me-4"
                  style={{ width: "120px", height: "36px" }}
                  type="submit"
                  disabled={
                    !experimentBaseInfo.draft && editing && !pendingChanges
                  }
                >
                  {experimentBaseInfo.draft
                    ? "Finalize Draft"
                    : editing
                    ? "Save"
                    : "Submit"}
                </Button>
              </div>
              <div style={{ height: "20px" }}></div>
            </Form>
          </div>
        </Container>
      )}
    </Container>
  );
};

export default ExperimentForm;
