

// Creates an institution
// TODO add auth
export async function createInstitution(institutionName) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({name: institutionName}),
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error creating institution: ", error);
    return error;
  }
}



// Gets all institutions
export async function getInstitutions() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error fetching institutions: ", error);
    return error;
  }
}



// Deletes an institution
export async function deleteInstitution(institutionId, authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions/${institutionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error deleting institution: ", error);
    return error;
  }
}



// Updates an institution
export async function updateInstitution(institutionId, institutionName, authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions/${institutionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({name: institutionName}),
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error updating institution: ", error);
    return error;
  }
}



// Creates a lab
// TODO add auth
export async function createLab(institutionId, labName) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions/${institutionId}/labs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({name: labName}),
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error creating lab: ", error);
    return error;
  }
}



// Gets all labs for an institution
export async function getLabs(institutionId) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions/${institutionId}/labs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error fetching labs: ", error);
    return error;
  }
}



// Deletes a lab
export async function deleteLab(institutionId, labId, authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions/${institutionId}/labs/${labId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error deleting lab: ", error);
    return error;
  }
}



// Updates a lab
export async function updateLab(institutionId, labId, labName, authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/institutions/${institutionId}/labs/${labId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({name: labName}),
    });
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error updating lab: ", error);
    return error;
  }
}