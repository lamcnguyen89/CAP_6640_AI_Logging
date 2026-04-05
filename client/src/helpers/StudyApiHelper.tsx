// NOTE: This file is not currently in use; included in codebase for potential future use.
// File may need checking / cleanup if used in the future.

export function getStudy(
  studyId: string,
  authToken: string,
  actingFunction: any
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/studies/${studyId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        actingFunction(res.study)
      } else throw res
    })
    .catch((res) => {
      console.error(res)
    })
}


export async function getAllStudies(authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/studies/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch studies.");
    }

    return data.studies;
  } catch (error) {
    console.error("Error fetching studies:", error);
    throw error;
  }
}

export function deleteStudy(
  studyId: string,
  authToken: string,
  actingFunction: any
) {
  fetch(
    `${import.meta.env.BASE_URL}/api/studies/${studyId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  )
    .then((res) => {
      console.log(res)
      actingFunction()
    })
    .catch((res) => {
      console.log(res)
    })
}

export function createNewStudy(
  studyName: string,
  studyDescription: string,
  defaultExperimentName: string,
  defaultExperimentDescription: string,
  irbProtocolNumber: string,
  authToken: string,
  actingFunction: any
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/studies/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name: studyName,
        description: studyDescription,
        defaultExperimentName: defaultExperimentName,
        defaultExperimentDescription: defaultExperimentDescription,
        irbProtocolNumber: irbProtocolNumber,
      }),
    }
  )
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      actingFunction(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

export function updateStudy(
  studyId: string,
  name: string,
  description: string,
  defaultExperiment: string,
  principleInvestigator: string,
  irbProtocolNumber: string,
  authToken: string,
  actingFunction: any
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/studies/${studyId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name: name,
        description: description,
        defaultExperiment: defaultExperiment,
        principleInvestigator: principleInvestigator,
        irbProtocolNumber: irbProtocolNumber,
      }),
    }
  )
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        actingFunction(res)
      } else {
        throw res
      }
    })
    .catch((err) => {
      console.log(err)
    })
}