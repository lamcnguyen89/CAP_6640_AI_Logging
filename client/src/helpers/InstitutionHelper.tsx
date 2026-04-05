import { createInstitution, createLab, getInstitutions, getLabs } from "../helpers/InstitutionApiHelper"

export interface Institution {
  id: string;
  name: string;
}

export interface Lab {
  id: string;
  name: string;
}

export const fetchInstitutions = async (setAllInstitutions: any) => {
  const institutionsResponse = await getInstitutions();
  if (institutionsResponse.httpStatus === 200) {
    const mappedInstitutions = institutionsResponse.institutions.map(inst => ({
      id: inst._id,
      name: inst.name
    }));
    setAllInstitutions(mappedInstitutions);
  }
};

export const fetchLabs = async (institution: Institution, allInstitutions: any, setAllLabs: any) => {
  if (institution) {
    // Get the institution ID
    const institutionObj = allInstitutions.find(inst => inst.name === institution);
    if (!institutionObj) {
      setAllLabs([]);
      return;
    }
    const institutionId = institutionObj.id;
    const labsResponse = await getLabs(institutionId);
    if (labsResponse.httpStatus === 200) {
      const mappedLabs = labsResponse.labs.map(lab => ({
        id: lab._id,
        name: lab.name
      }));
      setAllLabs(mappedLabs);
    } else {
      console.error("Failed to fetch labs: ", labsResponse);
      setAllLabs([]);
    }
  } else {
    setAllLabs([]);
  }
};

// Handles adding a new institution
export const handleAddInstitution = async (allInstitutions: any, setAllInstitutions: any, setInstitution: any, setInvalidInstitution: any, newInstitutionName: string) => {
  console.log("Adding new institution: ", newInstitutionName);
  // Do not create a new institution if the new institution name is empty
  if (!newInstitutionName || newInstitutionName.trim() === "") {
    console.log("New institution name is empty.");
    return;
  }

  const trimmedNewInstitutionName = newInstitutionName.trim();

  // Check if the institution already exists
  if (allInstitutions.some(inst => inst.name.toLowerCase() === trimmedNewInstitutionName.toLowerCase())) {
    console.log("Institution already exists.");
    return;
  }

  // Create the new institution
  const response = await createInstitution(trimmedNewInstitutionName);
  if (response.httpStatus === 201) {
    setAllInstitutions([...allInstitutions, { id: response.institution._id, name: trimmedNewInstitutionName }]);
    setInstitution(trimmedNewInstitutionName);
    setInvalidInstitution("");
  } else {
    console.error("Failed to create institution: ", response);
  }
}

// Handles adding a new lab
export const handleAddLab = async (institution: string, allInstitutions: any, allLabs: any, setAllLabs: any, setLab: any, setInvalidLab: any, newLabName: string) => {
  // Do not create a new lab if no institution is selected or if the new lab name is empty
  if (!institution || institution.trim() === "" || !newLabName || newLabName.trim() === "") {
    console.log("No institution selected or new lab name is empty.");
    return;
  }

  const trimmedNewLabName = newLabName.trim();

  // Check if the lab already exists
  if (allLabs.some(lab => lab.name.toLowerCase() === trimmedNewLabName.toLowerCase())) {
    console.log("Lab already exists.");
    return;
  }

  // Find the institution ID
  const institutionObj = allInstitutions.find(inst => inst.name === institution);
  if (!institutionObj) {
    console.log("Institution not found.");
    return;
  }
  const institutionId = institutionObj.id;

  // Create the new lab
  const response = await createLab(institutionId, trimmedNewLabName);
  if (response.httpStatus === 201) {
    setAllLabs([...allLabs, { id: response.lab._id, name: trimmedNewLabName }]);
    setLab(trimmedNewLabName);
    setInvalidLab("");
  } else {
    console.error("Failed to create lab: ", response);
  }
}