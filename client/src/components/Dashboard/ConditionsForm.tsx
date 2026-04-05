import React, { useEffect, useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { isCsharpKeyword } from "./ExperimentFormTypes";
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Image,
  Modal,
} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import deleteIcon from "../../assets/deleteRed.png";
import IConditionGroup from "../../interfaces/Condition";
import { getExperiment } from "../../helpers/ExperimentApiHelper";
import "../../styles/App.css";

interface ConditionsFormProps {
  conditions: IConditionGroup[];
  onConditionsChange: any;
  auth: any;
  experimentIdToEdit: string;
  permissionRole: string;
}

const ConditionsForm: React.FC<ConditionsFormProps> = (props) => {
  const [groupNameError, setGroupNameError] = useState("");
  const [conditionNameErrors, setConditionNameErrors] = useState<{
    [key: number]: string;
  }>({});
  // Timeout refs for error clearing
  const groupErrorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const conditionErrorTimeoutRefs = React.useRef<{
    [key: number]: NodeJS.Timeout;
  }>({});
  const {
    conditions,
    onConditionsChange,
    auth,
    experimentIdToEdit,
    permissionRole,
  } = props;
  const canEditConditions =
    permissionRole === "Admin" || permissionRole === "Creator";
  const showTooltip = !canEditConditions;
  // Tooltip text is now inlined in each OverlayTrigger instance below
  const [groupName, setGroupName] = useState("");
  // Track new condition inputs per group (by index)
  const [newConditionInputs, setNewConditionInputs] = useState<{
    [key: number]: { name: string; value: string };
  }>({});

  // Modal state for confirming removal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"group" | "condition" | null>(
    null
  );
  const [pendingGroupIdx, setPendingGroupIdx] = useState<number | null>(null);
  const [pendingCondIdx, setPendingCondIdx] = useState<number | null>(null);

  // Fetch experiment data when editing, but only set conditions if not already present
  useEffect(() => {
    if (experimentIdToEdit) {
      getExperiment(experimentIdToEdit, auth.token, (experiment) => {
        if (
          experiment &&
          Array.isArray(experiment.conditions) &&
          experiment.conditions.length > 0 &&
          (!conditions || conditions.length === 0)
        ) {
          onConditionsChange(experiment.conditions);
        }
      }).catch((error) => {
        console.error("Error fetching experiment conditions:", error);
      });
    }
  }, [experimentIdToEdit]);

  const handleAddGroup = () => {
    if (!canEditConditions) return;
    if (!groupName) return;
    // Prevent special characters (allow letters, numbers, underscores) and must start with a letter
    const trimmedGroupName = groupName.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedGroupName)) {
      setGroupNameError(
        "Group name must start with a letter and only contain letters, numbers, and underscores."
      );
      if (groupErrorTimeoutRef.current)
        clearTimeout(groupErrorTimeoutRef.current);
      groupErrorTimeoutRef.current = setTimeout(() => {
        setGroupNameError("");
      }, 15000);
      return;
    }
    if (isCsharpKeyword(trimmedGroupName)) {
      setGroupNameError("Group name cannot be a reserved C# keyword.");
      if (groupErrorTimeoutRef.current)
        clearTimeout(groupErrorTimeoutRef.current);
      groupErrorTimeoutRef.current = setTimeout(() => {
        setGroupNameError("");
      }, 15000);
      return;
    }
    // Prevent duplicate group names
    if (
      conditions.some(
        (g) =>
          g.groupName.trim().toLowerCase() === trimmedGroupName.toLowerCase()
      )
    ) {
      setGroupNameError("Group name already exists.");
      if (groupErrorTimeoutRef.current)
        clearTimeout(groupErrorTimeoutRef.current);
      groupErrorTimeoutRef.current = setTimeout(() => {
        setGroupNameError("");
      }, 15000);
      return;
    }
    setGroupNameError("");
    onConditionsChange([...conditions, { groupName, conditions: [] }]);
    setGroupName("");
  };

  // Show modal for group removal
  const handleRemoveGroupClick = (index: number) => {
    setModalType("group");
    setPendingGroupIdx(index);
    setShowModal(true);
  };

  // Confirm group removal
  const confirmRemoveGroup = () => {
    if (pendingGroupIdx !== null) {
      const updatedConditions = conditions.filter(
        (_, i) => i !== pendingGroupIdx
      );
      onConditionsChange(updatedConditions);
      setNewConditionInputs((prev) => {
        const copy = { ...prev };
        delete copy[pendingGroupIdx!];
        return copy;
      });
    }
    setShowModal(false);
    setPendingGroupIdx(null);
  };

  // Add a new condition to a group
  const handleAddCondition = (groupIdx: number) => {
    if (!canEditConditions) return;
    const input = newConditionInputs[groupIdx];
    if (!(input && input.name && input.value)) return;
    // Prevent special characters (allow letters, numbers, underscores) and must start with a letter
    const trimmedCondName = input.name.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedCondName)) {
      setConditionNameErrors((prev) => ({
        ...prev,
        [groupIdx]:
          "Condition name must start with a letter and only contain letters, numbers, and underscores.",
      }));
      if (conditionErrorTimeoutRefs.current[groupIdx]) {
        clearTimeout(conditionErrorTimeoutRefs.current[groupIdx]);
      }
      conditionErrorTimeoutRefs.current[groupIdx] = setTimeout(() => {
        setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
      }, 15000);
      return;
    }
    if (isCsharpKeyword(trimmedCondName)) {
      setConditionNameErrors((prev) => ({
        ...prev,
        [groupIdx]: "Condition name cannot be a reserved C# keyword.",
      }));
      if (conditionErrorTimeoutRefs.current[groupIdx]) {
        clearTimeout(conditionErrorTimeoutRefs.current[groupIdx]);
      }
      conditionErrorTimeoutRefs.current[groupIdx] = setTimeout(() => {
        setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
      }, 15000);
      return;
    }
    // Prevent duplicate condition names in group
    if (
      conditions[groupIdx].conditions.some(
        (c) => c.name.trim().toLowerCase() === trimmedCondName.toLowerCase()
      )
    ) {
      setConditionNameErrors((prev) => ({
        ...prev,
        [groupIdx]: "Condition name already exists in this group.",
      }));
      if (conditionErrorTimeoutRefs.current[groupIdx]) {
        clearTimeout(conditionErrorTimeoutRefs.current[groupIdx]);
      }
      conditionErrorTimeoutRefs.current[groupIdx] = setTimeout(() => {
        setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
      }, 15000);
      return;
    }
    setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
    const updatedGroups = conditions.map((group, idx) => {
      if (idx === groupIdx) {
        return {
          ...group,
          conditions: [
            ...group.conditions,
            { name: input.name, value: input.value },
          ],
        };
      }
      return group;
    });
    onConditionsChange(updatedGroups);
    setNewConditionInputs((prev) => ({
      ...prev,
      [groupIdx]: { name: "", value: "" },
    }));
  };

  // Remove a condition from a group directly (no modal)
  const handleRemoveCondition = (groupIdx: number, condIdx: number) => {
    if (!canEditConditions) return;
    const updatedGroups = conditions.map((group, idx) => {
      if (idx === groupIdx) {
        return {
          ...group,
          conditions: group.conditions.filter((_, i) => i !== condIdx),
        };
      }
      return group;
    });
    onConditionsChange(updatedGroups);
  };

  // Edit a condition in a group
  const handleEditCondition = (
    groupIdx: number,
    condIdx: number,
    field: "name" | "value",
    value: string
  ) => {
    if (!canEditConditions) return;
    // Only validate name edits
    if (field === "name") {
      const trimmedName = value.trim();
      // Must start with a letter and only contain letters, numbers, underscores
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedName)) {
        setConditionNameErrors((prev) => ({
          ...prev,
          [groupIdx]:
            "Condition name must start with a letter and only contain letters, numbers, and underscores.",
        }));
        if (conditionErrorTimeoutRefs.current[groupIdx]) {
          clearTimeout(conditionErrorTimeoutRefs.current[groupIdx]);
        }
        conditionErrorTimeoutRefs.current[groupIdx] = setTimeout(() => {
          setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
        }, 15000);
        return;
      }
      // Not a reserved C# keyword
      if (isCsharpKeyword(trimmedName)) {
        setConditionNameErrors((prev) => ({
          ...prev,
          [groupIdx]: "Condition name cannot be a reserved C# keyword.",
        }));
        if (conditionErrorTimeoutRefs.current[groupIdx]) {
          clearTimeout(conditionErrorTimeoutRefs.current[groupIdx]);
        }
        conditionErrorTimeoutRefs.current[groupIdx] = setTimeout(() => {
          setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
        }, 15000);
        return;
      }
      // Not a duplicate in group (ignore current index)
      if (
        conditions[groupIdx].conditions.some(
          (c, i) =>
            i !== condIdx &&
            c.name.trim().toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        setConditionNameErrors((prev) => ({
          ...prev,
          [groupIdx]: "Condition name already exists in this group.",
        }));
        if (conditionErrorTimeoutRefs.current[groupIdx]) {
          clearTimeout(conditionErrorTimeoutRefs.current[groupIdx]);
        }
        conditionErrorTimeoutRefs.current[groupIdx] = setTimeout(() => {
          setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
        }, 15000);
        return;
      }
      setConditionNameErrors((prev) => ({ ...prev, [groupIdx]: "" }));
    }
    const updatedGroups = conditions.map((group, idx) => {
      if (idx === groupIdx) {
        return {
          ...group,
          conditions: group.conditions.map((cond, i) =>
            i === condIdx ? { ...cond, [field]: value } : cond
          ),
        };
      }
      return group;
    });
    onConditionsChange(updatedGroups);
  };

  return (
    <Container
      style={{
        border: "1px solid lightgrey",
        borderRadius: "5px",
        padding: "15px 45px",
      }}
    >
      <Row>
        <h2>Conditions</h2>
      </Row>
      <Row>
        <Col xs="6">
          <Form.Label>Add a Group</Form.Label>
          <Form.Control
            type="text"
            id="conditionGroupName"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setGroupNameError("");
            }}
            required
            disabled={!canEditConditions}
          />
          {groupNameError && (
            <div style={{ color: "red", fontSize: "0.9em" }}>
              {groupNameError}
            </div>
          )}
        </Col>
      </Row>
      <Row>
        <Col>
          {showTooltip ? (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="add-group-btn-tooltip">
                  You do not have permission to add a group.
                </Tooltip>
              }
            >
              <span style={{ display: "inline-block" }}>
                <Button
                  className="tertiary-button mt-3"
                  onClick={() => handleAddGroup()}
                  disabled
                >
                  Add Group
                </Button>
              </span>
            </OverlayTrigger>
          ) : (
            <Button
              className="tertiary-button mt-3"
              onClick={() => handleAddGroup()}
              disabled={!canEditConditions}
            >
              Add Group
            </Button>
          )}
        </Col>
      </Row>
      <div className="mt-3">
        <Row>
          <Col>
            {conditions.length ? (
              conditions.map((group, groupIdx) => (
                <div key={groupIdx} className="mb-3">
                  <div className="p-2 bg-light border rounded rounded-bottom-0">
                    <Row className="align-items-center">
                      <Col>
                        <strong>{group.groupName}</strong>
                      </Col>
                      <Col xs="auto">
                        {showTooltip ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id={`remove-group-tooltip-${groupIdx}`}>
                                You do not have permission to remove a group.
                              </Tooltip>
                            }
                          >
                            <span style={{ display: "inline-block" }}>
                              <Button
                                className="w-auto px-4 py-4 tertiary-button"
                                onClick={() => handleRemoveGroupClick(groupIdx)}
                                disabled
                              >
                                Remove
                              </Button>
                            </span>
                          </OverlayTrigger>
                        ) : (
                          <Button
                            className="w-auto px-4 py-4 tertiary-button"
                            onClick={() => handleRemoveGroupClick(groupIdx)}
                            disabled={!canEditConditions}
                          >
                            Remove
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </div>
                  <div className="p-4 border border-top-0 rounded rounded-top-0">
                    <Row>
                      <Col xs="4">
                        <div className="p-3 bg-light border rounded">
                          <Form.Label>
                            Add Conditions to {group.groupName}
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Name"
                            className={
                              !conditionNameErrors[groupIdx] ? "mb-3" : ""
                            }
                            value={newConditionInputs[groupIdx]?.name || ""}
                            onChange={(e) => {
                              setNewConditionInputs((prev) => ({
                                ...prev,
                                [groupIdx]: {
                                  ...prev[groupIdx],
                                  name: e.target.value,
                                  value: prev[groupIdx]?.value || "",
                                },
                              }));
                              setConditionNameErrors((prev) => ({
                                ...prev,
                                [groupIdx]: "",
                              }));
                            }}
                            disabled={!canEditConditions}
                          />
                          {conditionNameErrors[groupIdx] && (
                            <div
                              className="my-1"
                              style={{ color: "red", fontSize: "0.9em" }}
                            >
                              {conditionNameErrors[groupIdx]}
                            </div>
                          )}
                          <Form.Control
                            type="text"
                            placeholder="Value"
                            className="mb-3"
                            value={newConditionInputs[groupIdx]?.value || ""}
                            onChange={(e) =>
                              setNewConditionInputs((prev) => ({
                                ...prev,
                                [groupIdx]: {
                                  ...prev[groupIdx],
                                  name: prev[groupIdx]?.name || "",
                                  value: e.target.value,
                                },
                              }))
                            }
                            disabled={!canEditConditions}
                          />
                          {showTooltip ? (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip
                                  id={`add-cond-btn-tooltip-${groupIdx}`}
                                >
                                  You do not have permission to add a condition.
                                </Tooltip>
                              }
                            >
                              <span style={{ display: "inline-block" }}>
                                <Button
                                  className="tertiary-button"
                                  onClick={() => handleAddCondition(groupIdx)}
                                  disabled
                                >
                                  Add Condition
                                </Button>
                              </span>
                            </OverlayTrigger>
                          ) : (
                            <Button
                              className="tertiary-button"
                              onClick={() => handleAddCondition(groupIdx)}
                              disabled={!canEditConditions}
                            >
                              Add Condition
                            </Button>
                          )}
                        </div>
                      </Col>
                      <Col xs="auto"></Col>
                      <Col>
                        {group.conditions.length > 0 ? (
                          <Table bordered>
                            <thead>
                              <tr>
                                <th>Condition</th>
                                <th>Value</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.conditions.map((cond, condIdx) => (
                                <tr key={condIdx}>
                                  <td className="text-center align-middle">
                                    <Form.Control
                                      type="text"
                                      value={cond.name}
                                      className="bg-white"
                                      placeholder="Condition Name"
                                      disabled
                                    />
                                  </td>
                                  <td className="text-center align-middle">
                                    <Form.Control
                                      type="text"
                                      value={cond.value}
                                      className="bg-white"
                                      placeholder="Condition Value"
                                      onChange={(e) =>
                                        handleEditCondition(
                                          groupIdx,
                                          condIdx,
                                          "value",
                                          e.target.value
                                        )
                                      }
                                      disabled={!canEditConditions}
                                    />
                                  </td>
                                  <td className="text-center align-middle">
                                    {showTooltip ? (
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={
                                          <Tooltip
                                            id={`delete-cond-tooltip-${groupIdx}-${condIdx}`}
                                          >
                                            You do not have permission to remove
                                            a condition.
                                          </Tooltip>
                                        }
                                      >
                                        <span
                                          style={{ display: "inline-block" }}
                                        >
                                          <Image
                                            src={deleteIcon}
                                            alt="Delete Icon"
                                            style={{
                                              cursor: "not-allowed",
                                            }}
                                          />
                                        </span>
                                      </OverlayTrigger>
                                    ) : (
                                      <Image
                                        src={deleteIcon}
                                        alt="Delete Icon"
                                        style={{
                                          cursor: canEditConditions
                                            ? "pointer"
                                            : "not-allowed",
                                        }}
                                        onClick={() =>
                                          canEditConditions &&
                                          handleRemoveCondition(
                                            groupIdx,
                                            condIdx
                                          )
                                        }
                                      />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <div className="text-muted mt-2">
                            No conditions added to this group yet.
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                </div>
              ))
            ) : (
              <span>No conditions added yet.</span>
            )}
          </Col>
        </Row>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove Conditions Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <span>
            Are you sure you want to remove this group and all of its
            conditions?
          </span>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="w-auto px-4 tertiary-button"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button className="w-auto px-4" onClick={confirmRemoveGroup}>
            Remove
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ConditionsForm;
