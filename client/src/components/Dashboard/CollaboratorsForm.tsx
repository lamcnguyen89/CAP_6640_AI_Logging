import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Container,
  Button,
  Form,
  FormGroup,
  InputGroup,
  Row,
  Col,
  Modal,
  Table,
  Dropdown,
  ListGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Collaborator, User } from "./ExperimentFormTypes";
import { getUsersBySearch } from "../../helpers/UsersApiHelper";
import "../../styles/App.css";

// Props
interface CollaboratorsFormProps {
  // Callback function to update the parent component with the collaborators
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
  // The collaborators of the experiment, a state from the parent component
  collaborators: Collaborator[];
  permissionRole: string;
}

// Debounce to prevent excessive API calls while typing
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const CollaboratorsForm: React.FC<CollaboratorsFormProps> = ({
  onCollaboratorsChange,
  collaborators,
  permissionRole,
}) => {
  const auth = useSelector((state: any) => state.auth);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Search collaborators any time the debounced query changes (i.e. search criteria input changes)
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    if (debouncedQuery.trim() !== "") {
      getUsersBySearch(debouncedQuery, auth.token)
        .then((response) => {
          const results = response.users.map((user) => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            institution: user.institution || {name: ""},
            lab: user.lab || {name: ""},
          }));
          setSearchResults(results);
        })
        .catch((error) => {
          console.error("Error searching collaborators:", error);
        });
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, auth.token]);

  // Handle adding a collaborator
  const handleAddCollaborator = (user: User) => {
    // Check if the collaborator is already in the list
    if (!collaborators.some((c) => c.user.id === user.id)) {
      onCollaboratorsChange([
        ...collaborators,
        { user, permissionRole: "Member", invalidError: "", needsUpdate: true },
      ]);
    }
    setSearchQuery(""); // Clear search input after adding
    setSearchResults([]); // Clear search results after adding
  };

  // Handle removing a collaborator
  const handleRemoveCollaborator = (collaboratorId: string) => {
    const updatedCollaborators = collaborators.filter(
      (c) => c.user.id !== collaboratorId
    );
    onCollaboratorsChange(updatedCollaborators);
  };

  // Handle clicking outside the search container to clear search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Container
      style={{
        border: "1px solid lightgrey",
        borderRadius: "5px",
        padding: "15px 45px",
      }}
    >
      <Row>
        <Col>
          <h2>Collaborators</h2>
        </Col>
      </Row>
      <Row>
        <Form.Label>Search by Email</Form.Label>
        <div className="position-relative" ref={searchContainerRef}>
          <InputGroup>
            <Form.Control
              type="search"
              placeholder="Search collaborator by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (searchResults.length > 0) {
                    handleAddCollaborator(searchResults[0]);
                  }
                }
              }}
            />
          </InputGroup>
          {searchResults.length > 0 && (
            <ListGroup
              className="position-absolute w-100"
              style={{ zIndex: 1000, maxHeight: "300px", overflowY: "auto" }}
            >
              {searchResults.map((collab, index) => (
                <ListGroup.Item
                  key={index}
                  action
                  onClick={() => handleAddCollaborator(collab)}
                  className="d-flex justify-content-between align-items-start"
                  style={{ cursor: "pointer" }}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">
                      {collab.firstName} {collab.lastName}
                    </div>
                    <div className="text-muted small">{collab.email}</div>
                    <div className="text-muted small">
                      {collab.institution.name}
                      {collab.lab.name && ` • ${collab.lab.name}`}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
        <Container className="mt-3">
          <h3>Active Collaborators</h3>
          {collaborators.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <p>
                No collaborators added yet. Search and add collaborators using
                the search bar above.
              </p>
            </div>
          ) : (
            <Table bordered>
              <thead>
                <tr>
                  <th className="column-def-table-header">Name</th>
                  <th className="column-def-table-header">Email</th>
                  <th className="column-def-table-header">Institution</th>
                  <th className="column-def-table-header">Lab</th>
                  <th className="column-def-table-header">Permission Role</th>
                  <th className="column-def-table-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {collaborators.map((collab, index) => (
                  <tr key={index}>
                    <td className="align-middle">
                      {collab.user.firstName} {collab.user.lastName}
                    </td>
                    <td className="align-middle">{collab.user.email}</td>
                    <td className="align-middle">
                      {collab.user.institution.name
                        ? collab.user.institution.name
                        : "N/A"}
                    </td>
                    <td className="align-middle">
                      {collab.user.lab.name ? collab.user.lab.name : "N/A"}
                    </td>
                    <td className="align-middle">
                      {permissionRole === "Admin" || permissionRole === "Creator" ? (
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            size="sm"
                            style={{ width: "100%" }}
                          >
                            {collab.permissionRole}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <OverlayTrigger
                              placement="right"
                              overlay={
                                <Tooltip id="tooltip-admin">
                                  Admins can manage experiment metadata and file
                                  types, add new collaborators, and upload from
                                  Unity.
                                </Tooltip>
                              }
                            >
                              <Dropdown.Item
                                onClick={() => {
                                  const updatedCollaborators = collaborators.map(
                                    (c, i) =>
                                      i === index
                                        ? {
                                            ...c,
                                            permissionRole: "Admin" as const,
                                          }
                                        : c
                                  );
                                  onCollaboratorsChange(updatedCollaborators);
                                }}
                              >
                                Admin
                              </Dropdown.Item>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="right"
                              overlay={
                                <Tooltip id={`tooltip-developer-${index}`}>
                                  Developers can upload builds from Unity, but
                                  cannot manage experiment metadata, file types,
                                  or collaborators.
                                </Tooltip>
                              }
                            >
                              <Dropdown.Item
                                onClick={() => {
                                  const updatedCollaborators = collaborators.map(
                                    (c, i) =>
                                      i === index
                                        ? {
                                            ...c,
                                            permissionRole: "Developer" as const,
                                          }
                                        : c
                                  );
                                  onCollaboratorsChange(updatedCollaborators);
                                }}
                              >
                                Developer
                              </Dropdown.Item>
                            </OverlayTrigger>
                            <OverlayTrigger
                              placement="right"
                              overlay={
                                <Tooltip id="tooltip-admin">
                                  Members can view and download recorded data,
                                  but cannot manage experiment metadata, file
                                  types, collaborators, or upload from Unity.
                                </Tooltip>
                              }
                            >
                              <Dropdown.Item
                                onClick={() => {
                                  const updatedCollaborators = collaborators.map(
                                    (c, i) =>
                                      i === index
                                        ? {
                                            ...c,
                                            permissionRole: "Member" as const,
                                          }
                                        : c
                                  );
                                  onCollaboratorsChange(updatedCollaborators);
                                }}
                              >
                                Member
                              </Dropdown.Item>
                            </OverlayTrigger>
                          </Dropdown.Menu>
                        </Dropdown>
                      ) : (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id={`tooltip-admin-${index}`}>
                              You do not have permission to change collaborator roles
                            </Tooltip>
                          }
                        >
                          <span
                            className="d-inline-block w-100 text-center p-2 border rounded"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            {collab.permissionRole}
                          </span>
                        </OverlayTrigger>
                      )}
                    </td>
                    <td className="my-0 gy-0 py-0 align-middle">
                      {permissionRole === "Creator" ? (
                        <Button
                          variant="secondary"
                          className="m-0"
                          style={{ height: "100%", width: "100%" }}
                          onClick={() => {
                            handleRemoveCollaborator(collab.user.id);
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id="tooltip-remove">
                              Only the experiment creator can remove collaborators
                            </Tooltip>
                          }
                        >
                          <span className="d-inline-block w-100">
                            <Button
                              variant="secondary"
                              className="m-0"
                              style={{ 
                                height: "100%", 
                                width: "100%",
                                pointerEvents: "none"
                              }}
                              disabled
                            >
                              Remove
                            </Button>
                          </span>
                        </OverlayTrigger>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Container>
      </Row>
    </Container>
  );
};

export default CollaboratorsForm;
