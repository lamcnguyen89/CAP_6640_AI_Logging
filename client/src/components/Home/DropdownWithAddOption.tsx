import { on } from "events";
import React, { useState, useEffect } from "react";
import { Dropdown, FormControl, InputGroup, Button, Form, Container, Row, Col } from "react-bootstrap";

// Props
type DropdownWithAddOptionProps = {
  options: string[];
  addOption?: boolean;
  addOptionPlaceholder?: string;
  onAddOption?: (option: string) => void;
  value: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  isInvalid?: boolean;
  invalidFeedback?: string;
};

const DropdownWithAddOption: React.FC<DropdownWithAddOptionProps> = ({
  options,
  addOption = true,
  addOptionPlaceholder = "Add new option...",
  onAddOption,
  value,
  placeholder = "Select an option...",
  onValueChange,
  isInvalid = false,
  invalidFeedback = "",
}) => {
  // States
  const [selected, setSelected] = useState<string | undefined>(value);
  const [newOption, setNewOption] = useState("");
  const [invalidNewOption, setInvalidNewOption] = useState(false);

  // Ensures input is valid (alphanumeric, spaces, dashes, underscores, commas, and periods)
  const isValidInput = (input: string) => /^[A-Za-z0-9 _\-,.]+$/.test(input);

  // Update selected value when the component mounts or when the value prop changes
  // This ensures that the dropdown reflects the current value prop
  useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setSelected(placeholder || "Select an option...");
    } else {
      setSelected(value);
    }
  }, [value]);

  // Handle selection of an option from the dropdown
  const handleSelect = (val: string) => {
    setSelected(val);
    onValueChange?.(val);
  };

  // Handle when the user changes the input in the add option field
  const handleInputChange = (val: string) => {
    setNewOption(val);
    const trimmedVal = val.trim();

    // If the input is empty, reset the invalid state
    if (trimmedVal === "") {
      setInvalidNewOption(false);
      return;
    }

    // Validate the input and set invalid state accordingly
    if (!isValidInput(trimmedVal)) {
      setInvalidNewOption(true);
    } else {
      setInvalidNewOption(false);
    }
  }

  // Handle adding a new option to the dropdown via the input field (ensure it is valid)
  const handleAdd = () => {
    const val = newOption.trim();
    if (!val) return;

    // Check if new option is valid
    if (!isValidInput(val)) {
      setInvalidNewOption(true);
      return;
    } else {
      setInvalidNewOption(false);
    }

    // Add the new option if it doesn't already exist in the options
    if (!options.includes(val)) {
      onAddOption?.(val);
    }

    // Update the selected value and reset the input field
    setNewOption("");
    handleSelect(val);
  };

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle variant="outline-secondary" className={`w-100 text-start ${isInvalid ? "is-invalid" : ""}`}>
          {selected ?? placeholder}
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ minWidth: 260, maxHeight: 220, overflowY: "auto" }}>
          <Row>
            {options.map((opt) => (
              <Dropdown.Item key={opt} active={opt === selected} onClick={() => handleSelect(opt)}>
                {opt}
              </Dropdown.Item>
            ))}
          </Row>
          {addOption && (
            <>
              <Dropdown.Divider />
              <Row>
                <Col>
                  <InputGroup>
                    <FormControl
                      style={{ height: "36px" }}
                      placeholder={addOptionPlaceholder}
                      value={newOption}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAdd();
                          e.preventDefault();
                        }
                      }}
                      isInvalid={invalidNewOption}
                    />
                    <Button variant="secondary" style={{ height: "36px", width: "80px" }} onClick={handleAdd}>
                      Add
                    </Button>
                  </InputGroup>
                  {invalidNewOption && (
                    <Form.Control.Feedback type="invalid" className="d-block">
                      Please remove any special characters.
                    </Form.Control.Feedback>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
      {isInvalid && (
        <Form.Control.Feedback type="invalid" className="d-block">
          {invalidFeedback || "Please select a valid option."}
        </Form.Control.Feedback>
      )}
    </>
  );
};

export default DropdownWithAddOption;