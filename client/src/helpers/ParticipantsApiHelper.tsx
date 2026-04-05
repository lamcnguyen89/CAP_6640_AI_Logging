import { getExperimentAlternate, getSite } from "./ExperimentApiHelper";
import { downloadFile } from "./FilesAPIHelper";
import { saveAs } from "file-saver";
import axios from "axios";

export async function downloadParticipant(experimentId, uid, authToken) {
  try {
    console.log("Downloading participant...")
    const experiment = await getExperimentAlternate(experimentId, authToken);

    // Download for each file type
    const fileTypes = experiment.fileTypes || [];
    let numFilesDownloaded = 0;
    for (const fileType of fileTypes) {
      const fileDownloaded = await downloadFile(uid, fileType._id, authToken);
      if (fileDownloaded) {
        numFilesDownloaded++;
      }
    }
    if (numFilesDownloaded === 0) {
      alert("No files found for this participant to be downloaded.");
    }
  } catch (error) {
    console.error('Error during download:', error)
    alert("An error occurred during the download.")
    throw error
  }
}

// Downloads participant data formatted as a zip file (in pretty folder format)
export async function downloadParticipantFormatted(
  participantId: string,
  authToken: string, 
) {
  try {
    const res = await axios.get(`${import.meta.env.BASE_URL}/api/participants/${participantId}/zip`, {
      headers: { Authorization: authToken },
      responseType: "blob",
    });

    // Check if response status is not 200
    if (res.status !== 200) {
      console.error("Failed to download participant data:", res.statusText);
      return res;
    }

    // Extract filename from Content-Disposition header, fallback to participantId if not found
    const contentDisposition = res.headers['content-disposition'];
    let filename = `${participantId}.zip`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    saveAs(res.data, filename);
  } catch (error) {
    console.error("Error downloading experiment data:", error);
    return (error as any)?.response || {
      status: 500,
      message: "An error occurred while downloading the experiment data."
    };
  }
}

// Dispatches a request to delete a participant
export function deleteParticipant(participantId, authToken) {
  return fetch(`${import.meta.env.BASE_URL}/api/${participantId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken
    },
  })
}

// Dispatches a request to update a participant
export function updateParticipant(participantId, update, authToken) {
  return fetch(`${import.meta.env.BASE_URL}/api/${participantId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken
    },
    body: JSON.stringify(update)
  })
}

// Dispatches a request to get all participants
export function getAllParticipants(
  authToken: string,
  experimentId: string,
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/participants`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  )
    .then((res) => {
      console.log("Database API", res)
      return res.status == 200 ?
        res.json() : { success: false, type: "unauthorized", status: res.status, message: res.statusText }
    })

    .catch((res) => {
      console.error(res)
    })
}


export async function getParticipantInfo(participantId: string, authToken: string) {
  const response = await fetch(`${import.meta.env.BASE_URL}/api/participants/${participantId}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": authToken,
    },
  });
  if (!response.ok) {
    throw new Error(`Error fetching participant info: ${response.statusText}`);
  }
  const data = await response.json();
  return data.participant;
}

export async function markParticipantWithdrawn(
  experimentId: string,
  participant: { uid: string; site: string },
  authToken: string
) {
  const siteId = participant.site;
  if (!siteId) {
    throw new Error("Participant does not have a valid site ID.");
  }
  const url = `${import.meta.env.BASE_URL}/api/participants/progress/${experimentId}/${siteId}/${participant.uid}/WITHDRAWN`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authToken,
    },
  });
  if (!response.ok) {
    throw new Error(`Error updating participant status: ${response.statusText}`);
  }
  return await response.json();
}