import axios from "axios";
import {
  Collaborator,
  ConditionGroup,
  User,
} from "../components/Dashboard/ExperimentFormTypes";

// Creates an experiment with the given info, then calls onSuccess with the response data
export function createExperiment(
  name: string,
  description: string,
  irbProtocolNumber: string,
  irbEmailAddress: string,
  irbLetter: File,
  collaborators: Collaborator[],
  conditions: ConditionGroup[],
  isMultiSite: boolean,
  authToken: string,
  actingFunction: any,
) {
  // Create Empty FormData Object and append fields to it
  const data = new FormData();

  // Append anything that isn't a file to the experimentInfo Object and convert to JSON object
  data.append(
    "experimentInfo",
    JSON.stringify({
      name: name,
      description: description,
      irbProtocolNumber: irbProtocolNumber,
      irbEmailAddress: irbEmailAddress,
      collaborators: collaborators,
      conditions: conditions,
      isMultiSite: isMultiSite,
    }),
  ); // Upload other types of data

  // Add Experiment Files to the formdata object
  data.append("irbLetter", irbLetter); // Upload irbLetter file

  // The formdata object will be sent in a fetch request to the server
  return fetch(`${import.meta.env.BASE_URL}/api/experiments/`, {
    method: "POST",
    headers: {
      Authorization: authToken,
    },
    body: data,
  })
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      actingFunction(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Creates an experiment with the given info, then calls onSuccess with the response data
export function copyExperiment(
  sourceExperimentId: string,
  name: string,
  description: string,
  irbProtocolNumber: string,
  irbEmailAddress: string,
  irbLetter: File,
  collaborators: string[],
  isMultiSite: boolean,
  authToken: string,
  actingFunction: any,
) {
  // Create Empty FormData Object and append fields to it
  const data = new FormData();

  // Append anything that isn't a file to the experimentInfo Object and convert to JSON object
  data.append(
    "experimentInfo",
    JSON.stringify({
      sourceExperimentId: sourceExperimentId,
      name: name,
      description: description,
      irbProtocolNumber: irbProtocolNumber,
      irbEmailAddress: irbEmailAddress,
      collaborators: collaborators,
      isMultiSite: isMultiSite,
    }),
  ); // Upload other types of data

  // Add Experiment Files to the formdata object
  data.append("irbLetter", irbLetter); // Upload irbLetter file

  // The formdata object will be sent in a fetch request to the server
  return fetch(`${import.meta.env.BASE_URL}/api/experiments/copy`, {
    method: "POST",
    headers: {
      Authorization: authToken,
    },
    body: data,
  })
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      actingFunction(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Adds a collaborator to an experiment
export async function addCollaboratorToExperiment(
  experimentId: string,
  email: string,
  authToken: string,
) {
  try {
    const response = await fetch(
      `${
        import.meta.env.BASE_URL
      }/api/experiments/${experimentId}/collaborators/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          userEmail: email,
        }),
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error adding collaborator", error };
  }
}

// Removes a collaborator from an experiment
export async function removeCollaboratorFromExperiment(
  experimentId: string,
  collaboratorId: string,
  authToken: string,
) {
  try {
    const response = await fetch(
      `${
        import.meta.env.BASE_URL
      }/api/experiments/${experimentId}/collaborators/${collaboratorId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.log(error);
    return { success: false, message: "Error removing collaborator", error };
  }
}

// Consolidates collaborators to match given array
export async function updateCollaborators(
  experimentId: string,
  collaborators: Collaborator[],
  authToken: string,
) {
  try {
    const response = await fetch(
      `${
        import.meta.env.BASE_URL
      }/api/experiments/${experimentId}/collaborators/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          collaborators: collaborators,
        }),
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error adding collaborator", error };
  }
}

// Gets the current user's permission role for an experiment
export async function getUserExperimentPermission(
  experimentId: string,
  authToken: string,
): Promise<{ success: boolean; permissionRole: string; isCreator: boolean }> {
  try {
    const response = await fetch(
      `${
        import.meta.env.BASE_URL
      }/api/experiments/${experimentId}/userPermissions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error fetching user experiment permission:", error);
    return { success: false, permissionRole: "Failure", isCreator: false };
  }
}

// Gets the creator of the experiment
export async function getExperimentCreator(
  experimentId: string,
  authToken: string,
): Promise<{ success: boolean; creator: User }> {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/creator`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error fetching experiment creator:", error);
    return { success: false, creator: null };
  }
}

// Updates an experiment with the given info, then calls onSuccess with the response data
export function updateExperiment(
  experimentId: string,
  name: string,
  description: string,
  irbProtocolNumber: string,
  irbEmailAddress: string,
  irbLetter: File,
  removeIrbLetter: boolean,
  conditions: ConditionGroup[],
  isMultiSite: boolean,
  authToken: string,
  onSuccess: any,
  onError: any,
) {
  // Create Empty FormData Object and append fields to it
  const data = new FormData();

  // Append anything that isn't a file to the experimentInfo Object and convert to JSON object
  data.append(
    "experimentInfo",
    JSON.stringify({
      name: name,
      description: description,
      irbProtocolNumber: irbProtocolNumber,
      irbEmailAddress: irbEmailAddress,
      removeIrbLetter: removeIrbLetter,
      conditions: conditions,
      isMultiSite: isMultiSite,
    }),
  ); // Upload other types of data

  // Add Experiment Files to the formdata object
  data.append("irbLetter", irbLetter); // Upload irbLetter file

  return fetch(`${import.meta.env.BASE_URL}/api/experiments/${experimentId}`, {
    method: "PATCH",
    headers: {
      Authorization: authToken,
    },
    body: data,
  })
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      onSuccess(data);
    })
    .catch((err) => {
      console.log(err);
      onError(err);
    });
}

// Creates Draft of Experiment
export function createDraft(
  name: string,
  description: string,
  irbProtocolNumber: string,
  irbEmailAddress: string,
  irbLetter: File,
  collaborators: Collaborator[],
  conditions: ConditionGroup[],
  isMultiSite: boolean,
  authToken: string,
  actingFunction: any,
) {
  // Create Empty FormData Object and append fields to it
  const data = new FormData();

  // Append anything that isn't a file to the experimentInfo Object and convert to JSON object
  data.append(
    "experimentInfo",
    JSON.stringify({
      name: name,
      description: description,
      irbProtocolNumber: irbProtocolNumber,
      irbEmailAddress: irbEmailAddress,
      collaborators: collaborators,
      conditions: conditions,
      isMultiSite: isMultiSite,
    }),
  ); // Upload other types of data

  // Add Experiment Files to the formdata object
  data.append("irbLetter", irbLetter); // Upload irbLetter file

  // The formdata object will be sent in a fetch request to the server
  return fetch(`${import.meta.env.BASE_URL}/api/experiments/draft`, {
    method: "POST",
    headers: {
      Authorization: authToken,
    },
    body: data,
  })
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      actingFunction(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Creates an experiment draft with the given info, then calls onSuccess with the response data
export function updateDraft(
  experimentId: string,
  name: string,
  description: string,
  irbProtocolNumber: string,
  irbEmailAddress: string,
  irbLetter: File,
  collaborators: Collaborator[],
  conditions: ConditionGroup[],
  isMultiSite: boolean,
  authToken: string,
  actingFunction: any,
  onError: any,
) {
  // Create Empty FormData Object and append fields to it
  const data = new FormData();

  // Append anything that isn't a file to the experimentInfo Object and convert to JSON object
  data.append(
    "experimentInfo",
    JSON.stringify({
      name: name,
      description: description,
      irbProtocolNumber: irbProtocolNumber,
      irbEmailAddress: irbEmailAddress,
      collaborators: collaborators,
      conditions: conditions,
      isMultiSite: isMultiSite,
    }),
  ); // Upload other types of data

  // Add Experiment Files to the formdata object
  data.append("irbLetter", irbLetter); // Upload irbLetter file

  return fetch(
    `${import.meta.env.BASE_URL}/api/experiments/draft/${experimentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: authToken,
      },
      body: data,
    },
  )
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      actingFunction(data);
    })
    .catch((err) => {
      console.log(err);
      console.log(err);
      onError(err);
    });
}

// Uploads a webxr zip file to the server
export async function uploadWebxrZip(
  authToken,
  experimentId: string,
  webxrZip: File,
  onUploadProgress: (progressEvent: ProgressEvent) => void,
) {
  try {
    const formData = new FormData();
    formData.append("webxrZip", webxrZip);

    const response = await axios.post(
      `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/webxr`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: authToken,
        },
        onUploadProgress: onUploadProgress,
      },
    );

    return response;
  } catch (error) {
    console.error("Error uploading webxr zip:", error);
    throw error;
  }
}

// Gets webxr experience path infos
export async function getWebxrPaths(authToken: string, experimentId: string) {
  try {
    const response = await fetch(
      `${
        import.meta.env.BASE_URL
      }/api/experiments/${experimentId}/webxr/buildpaths`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    if (response.status === 404) {
      return {
        success: false,
        message: "WebXR build paths not found.",
        httpStatus: 404,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : {
          success: false,
          message: await response.text(),
        };

    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error getting webxr paths:", error);
    throw error;
  }
}

// Generates a short code for the experiment
export async function generateShortCode(
  experimentId: string,
  authToken: string,
  siteId?: string,
) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/webxr/shortcode`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          siteId: siteId ?? null,
        }),
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error generating short code:", error);
    throw error;
  }
}

// Gets a short code; consumes code on use
export async function getShortCode(shortCode: string) {
  try {
    const response = await axios.get(
      `${import.meta.env.BASE_URL}/api/experiments/webxr/shortcode/${shortCode}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response;
  } catch (error) {
    console.error("Error getting short code:", error);
    throw error;
  }
}

// Fetches all experiments, then returns the experiments from the response data
export async function getAllExperiments(authToken) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();

    if (!data.success) {
      if (data.status >= 500) {
        throw new Error("Status-500, Internal Server Error Occured.");
      }
      throw new Error(data.message || "Failed to fetch experiments.");
    }

    return data.experiments;
  } catch (error) {
    console.error("Error fetching experiments:", error);
    throw error;
  }
}

// Fetches an experiment with the given id, then calls onSuccess with the experiment from the response data
export async function getExperiment(expId, authToken, onSuccess) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/${expId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || "Error fetching experiment",
      };
    }
    onSuccess(data.experiment);
    return data;
  } catch (error) {
    console.error("Error fetching experiment:", error);
    return error;
  }
}

// Fetches an experiment with the given id, directly returning the data
export async function getExperimentAlternate(expId, authToken) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/${expId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    return data.experiment;
  } catch (error) {
    console.error("Error fetching experiment:", error);
    return error;
  }
}

export async function getExperimentFullRes(expId, authToken) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/${expId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    data.status = response.status;
    return data;
  } catch (error) {
    console.error("Error fetching experiment:", error);
    return error;
  }
}

// Deletes an experiment with the given id, then calls actingFunction
export function deleteExperiment(
  experimentId: string,
  authToken: string,
  actingFunction: any,
) {
  fetch(`${import.meta.env.BASE_URL}/api/experiments/${experimentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => {
      console.log(res);
      actingFunction();
    })
    .catch((res) => {
      console.log(res);
    });
}

// Fetches all logs for an experiment with the given id, then calls actingFunction with the logs from the response data
export async function downloadData(
  experimentId: any,
  authToken: string,
  onError,
  onSuccess,
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/zip`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    },
  )
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        /* Section of Code Below Converts all the logs into a single formatted CSV file*/

        // Collect all unique data fields
        const allLogs = res.logs;
        onSuccess();
        const dataFieldsSet = new Set();
        allLogs.forEach((log) => {
          Object.keys(log.data || {}).forEach((field) =>
            dataFieldsSet.add(field),
          );
        });
        const dataFields = Array.from(dataFieldsSet);

        // Define the fields you want from the log (excluding '_id', '__v', etc.)
        const fields = ["participant", "ts", "eventId"]; // Adjust as needed

        const escapeCsvValue = (value) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "string") {
            value = value.replace(/"/g, '""');
            value = `"${value}"`;
          }
          return value;
        };

        const csvRows = allLogs.map((row) => {
          const rowData = [
            ...fields.map((fieldName) => {
              switch (fieldName) {
                case "ts":
                  return new Date(row[fieldName]).toISOString();
                default:
                  return escapeCsvValue(row[fieldName]);
              }
            }),
            ...dataFields.map((fieldName) => {
              const dataValue = row.data ? row.data[fieldName] : "";
              return escapeCsvValue(dataValue);
            }),
          ];
          return rowData.join(",");
        });

        // Add header row
        const headerRow = [...fields, ...dataFields]
          .map((field) => `"${field}"`)
          .join(",");
        csvRows.unshift(headerRow);

        /* This Section of Code allows you to download the CSV file to your computer */

        // Create CSV Blob and download it
        const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Experiment_Data_${experimentId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        onError(res);
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

// Fetches a site with the given id
export async function getSite(siteId, authToken) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/sites/${siteId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching site:", error);
    return error;
  }
}

// Creates a new site with the given info
export async function createSite(
  name: string,
  shortName: string,
  parentExperiment: string,
  authToken: string,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/sites/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name,
        shortName,
        parentExperiment,
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating site", error };
  }
}

// Updates a site with the given info
export async function updateSite(
  siteId: string,
  name: string,
  shortName: string,
  authToken: string,
) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/sites/${siteId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          name: name,
          shortName: shortName,
        }),
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Deletes site by given ID
export async function deleteSite(siteId: string, authToken: string) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/sites/${siteId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error deleting site", error };
  }
}

// Adds a site to an experiment with the given ids, then calls actingFunction with the response data
export function addSiteToExperiment(
  experimentId: string,
  siteId: string,
  authToken: string,
  actingFunction: any,
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/sites`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        siteId: siteId,
      }),
    },
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
