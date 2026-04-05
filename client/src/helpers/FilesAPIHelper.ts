import JSZip from "jszip";
import * as BSON from "bson";
import axios from 'axios';
import { getParticipantInfo } from "./ParticipantsApiHelper";
import { getExperimentAlternate, getSite } from "./ExperimentApiHelper";
import { debug } from "console";
import { saveAs } from "file-saver";

// Fetches a fileType with the given id, then calls onSuccess with the site from the response data
export async function getFileType(fileTypeId, authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/experiments/filetype/${fileTypeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      }
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data.fileType;
  } catch (error) {
    console.error("Error fetching file type: ", error);
    return error;
  }
}

// Creates a new file type with the given info, then calls actingFunction with the response data
export async function createFileType(
  fileName: string,
  fileExtension: string,
  fileDescription: string,
  columnDefinition: any,
  parentExperiment: string,
  authToken: string,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/experiments/${parentExperiment}/filetype`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name: fileName,
        extension: fileExtension,
        description: fileDescription,
        columnDefinition: columnDefinition,
        parentExperiment: parentExperiment,
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Updates a fileType with the given info, then calls actingFunction with the response data
export async function updateFileType(
  fileTypeId: string,
  fileName: string,
  fileExtension: string,
  fileDescription: string,
  authToken: string,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/experiments/filetype/${fileTypeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name: fileName,
        extension: fileExtension,
        description: fileDescription
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Deletes filetype by given ID
export async function deleteFileType(
  experimentId: string,
  fileTypeId: string,
  authToken: string,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/experiments/${experimentId}/filetype/${fileTypeId}`, {
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
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Dispatches a request to get all FileTypes for an experiment
export function getAllFileTypes(
  authToken: string,
  experimentId: string,
) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/filetypes`,
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

// Dispatches a request to get all FileIds and their associated filetype ONLY 
export async function getAllFiles(
  authToken: string,
  experimentId: string,
  fileTypeId: string
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/experiments/${experimentId}/filetype/${fileTypeId}/files`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Function to upload Data using Axios (THE REASON WE CAN'T USE THE FETCH API IS BECAUSE IT DOESN'T NATIVELY SUPPORT PROGRESS INDICATORS!!!!)
export function uploadParticipantFile(participantUID, fileUpload, fileTypeId, authToken, onUploadProgress) {
  const data = new FormData();

  //Prints out the entries applied to the formdata object
  /*
  for (var pair of data.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }
  */
  data.append('fileUpload', fileUpload);

  return axios.post(
    `${import.meta.env.BASE_URL}/api/participants/${participantUID}/filetypes/${fileTypeId}/files`,
    data,
    {
      headers: {
        Authorization: authToken,
        'Content-Type': 'multipart/form-data', // Axios will set the boundary automatically
      },
      onUploadProgress: (progressEvent) => {
        if (typeof onUploadProgress === 'function') {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onUploadProgress(percent);
        }
      },
    }
  )
    .then((response) => {
      console.log(response.data);
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}



// Function to fetch file versions for a given participant and file type
export async function fetchFileVersions(participantId: string, fileTypeId: string, authToken: string) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/participants/${participantId}/filetype/${fileTypeId}/versions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.versions || [];
  } catch (error) {
    console.error("Error fetching file versions:", error);
    return [];
  }
}

// Function to set selected file version as the active version
export async function setActiveFileVersion(participantId: string, fileTypeId: string,
  fileId: string, authToken: string) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/participants/${participantId}/filetype/${fileTypeId}/file/${fileId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error setting active file version:", error);
    return false;
  }
}


// Function to fetch file size
export async function fetchFileSize(experimentId: string, participantId: string, authToken: string): Promise<number | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/experiments/${experimentId}/participants/${participantId}/filesize`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });
    const textResponse = await response.text();

    const data = JSON.parse(textResponse);
    return data.totalSize;
  } catch (error) {
    console.error("Error fetching file size:", error);
    return null;
  }
}

export function downloadDataZip(experimentId: any,
  authToken: string, onError, onSuccess) {
  return fetch(`${import.meta.env.BASE_URL}/api/participants/zip/${experimentId}`,
    {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  )
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {

        /* This Section of Code gets the logs and puts it in a constant, gets the files associated with the experiment and puts in a separate constant, and creates an empty JSZIP object that will be downloaded once all the processed logs and files are added to it */

        // Get All Logs as an object from the server
        const allLogs = res.allLogs
        // Get All Files in an experiment as an object from the server
        //
        const allFiles = res.newFileArray


        // Create an empty JSZip Object to store all CSV files and participant files in the experiment to zip it to a single file for download
        let fileDownloadObject = new JSZip();


        /* This Section of Code takes all the logs that were sent as a json response and converts it to a series of CSV files */
        if (allLogs.length > 0) {

          allLogs.forEach(individualLog => {
            const dataFieldsSet = new Set()
            individualLog.forEach(log => {
              Object.keys(log.data || {}).forEach(field => dataFieldsSet.add(field))
            })
            const dataFields = Array.from(dataFieldsSet)
            // Define the fields you want from the log (excluding '_id', '__v', etc.)
            const fields = ['participant', 'ts', 'eventId'] // Adjust as needed

            const escapeCsvValue = (value) => {
              if (value === null || value === undefined) return ''
              if (typeof value === 'string') {
                value = value.replace(/"/g, '""')
                value = `"${value}"`
              }
              return value
            }

            const csvRows = individualLog.map(row => {
              const rowData = [
                ...fields.map(fieldName => {
                  switch (fieldName) {
                    case "ts":
                      return new Date(row[fieldName]).toISOString()
                    default:
                      return escapeCsvValue(row[fieldName])
                  }
                }),
                ...dataFields.map(fieldName => {
                  const dataValue = row.data ? row.data[fieldName] : ''
                  return escapeCsvValue(dataValue)
                })
              ]
              return rowData.join(',')
            })

            // Add header row
            const headerRow = [...fields, ...dataFields].map(field => `"${field}"`).join(',')
            csvRows.unshift(headerRow)

            // Create CSV Blob
            const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' })

            // Push CSV Blob to the zip file object. Give the CSV blob a file name
            if (individualLog.length != 0) {
              fileDownloadObject.file(`participantData_${individualLog[0].participant}.csv`, blob, { binary: true })
            }
          })

        }

        if (allFiles.length > 0) {
          /* This Section of Code takes all the files for the experiment, processes them for download and adds them to a zip file */
          allFiles.forEach((file) => {

            //1. Convert Base64 string sent from the server back to binary data so that it can be added to a blob
            const binaryData = atob(file.data)

            //2. Convert binary string to UINT8Array..... Why? I'm still trying to figure this out
            const arrayBuffer = new ArrayBuffer(binaryData.length)
            const uint8Array = new Uint8Array(arrayBuffer)
            for (let i = 0; i < binaryData.length; i++) {
              uint8Array[i] = binaryData.charCodeAt(i)
            }

            //3. Add the UINT-8 Array to a binary object that can be downloaded
            const fileBlob = new Blob([uint8Array], { type: file.mimetype })
            //4. Add this binary object to the zip file that will be downloaded
            fileDownloadObject.file(`ParticipantID_${file.participantUID}_${file.fileType.name}.${file.fileType.extension}`, fileBlob)

          })

        }

        /* This Section of Code takes the Zip File, and allows you to download it */
        fileDownloadObject.generateAsync({ type: "blob" })
          .then((blobData) => {

            let zipBlob = new Blob([blobData])
            const url = window.URL.createObjectURL(zipBlob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Experiment_Data_${experimentId}.zip`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

          })
        onSuccess()
      } else {
        onError(res)
      }
    })
    .catch(
      (err) => {
        console.error(err)
        onError(err)
      }
    )
}

export function downloadSiteDataZip(experimentId, siteId, authToken, onError, onSuccess) {
  return fetch(`${import.meta.env.BASE_URL}/api/participants/zip/${experimentId}/${siteId}`, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        const allLogs = res.allLogs;
        const allFiles = res.newFileArray;

        let fileDownloadObject = new JSZip();

        if (allLogs.length > 0) {
          allLogs.forEach(individualLog => {
            const dataFieldsSet = new Set();
            individualLog.forEach(log => {
              Object.keys(log.data || {}).forEach(field => dataFieldsSet.add(field));
            });
            const dataFields = Array.from(dataFieldsSet);
            const fields = ['participant', 'ts', 'eventId'];

            const escapeCsvValue = (value) => {
              if (value === null || value === undefined) return '';
              if (typeof value === 'string') {
                value = value.replace(/"/g, '""');
                value = `"${value}"`;
              }
              return value;
            };

            const csvRows = individualLog.map(row => {
              const rowData = [
                ...fields.map(fieldName => {
                  return fieldName === "ts"
                    ? new Date(row[fieldName]).toISOString()
                    : escapeCsvValue(row[fieldName]);
                }),
                ...dataFields.map(fieldName => {
                  const dataValue = row.data ? row.data[fieldName] : '';
                  return escapeCsvValue(dataValue);
                })
              ];
              return rowData.join(',');
            });

            const headerRow = [...fields, ...dataFields].map(field => `"${field}"`).join(',');
            csvRows.unshift(headerRow);

            const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });

            if (individualLog.length !== 0) {
              fileDownloadObject.file(
                `participantData_${individualLog[0].participant}.csv`,
                blob,
                { binary: true }
              );
            }
          });
        }

        if (allFiles.length > 0) {
          allFiles.forEach((file) => {
            const binaryData = atob(file.data);
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < binaryData.length; i++) {
              uint8Array[i] = binaryData.charCodeAt(i);
            }

            const fileBlob = new Blob([uint8Array], { type: file.mimetype });

            fileDownloadObject.file(
              `ParticipantID_${file.participantUID}_${file.fileType.name}.${file.fileType.extension}`,
              fileBlob
            );
          });
        }

        fileDownloadObject.generateAsync({ type: "blob" }).then((blobData) => {
          const zipBlob = new Blob([blobData]);
          const url = window.URL.createObjectURL(zipBlob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Experiment_Data_${experimentId}_${siteId}.zip`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

        onSuccess();
      } else {
        onError(res);
      }
    })
    .catch((err) => {
      console.error(err);
      onError(err);
    });
}

// Downloads experiment data formatted as a zip file (in pretty folder format)
export async function downloadExperimentDataFormatted(
  experimentId: any, 
  authToken: string, 
  onSuccess: () => void,
  onError: (error: any) => void,
  onProgress: (progress: number) => void
) {
  try {
    const res = await axios.get(`${import.meta.env.BASE_URL}/api/experiments/${experimentId}/zip`, {
      headers: { Authorization: authToken },
      responseType: "blob",
      onDownloadProgress: evt => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      }
    });

    // Check if response status is not 200
    if (res.status !== 200) {
      onError({ 
        status: res.status, 
        message: `Server returned status ${res.status}`,
        data: res.data 
      });
      return;
    }

    // Extract filename from Content-Disposition header, fallback to experimentId if not found
    const contentDisposition = res.headers['content-disposition'];
    let filename = `${experimentId}.zip`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    saveAs(res.data, filename);
    onSuccess();
  } catch (error) {
    console.error("Error downloading experiment data:", error);
    onError(error);
  }
}

export async function downloadDataSingleCSV(experimentId: any,
  authToken: string, onError, onSuccess) {

  /* Section of Code Below makes an API Call to get all the logged data for each participant in an experiment*/
  return fetch(`${import.meta.env.BASE_URL}/api/participants/logs/singlecsv/${experimentId}`, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        /* Section of Code Below Converts all the logs into a single formatted CSV file*/

        // Collect all unique data fields
        const allLogs = res.logs
        const dataFieldsSet = new Set()
        allLogs.forEach(log => {
          Object.keys(log.data || {}).forEach(field => dataFieldsSet.add(field))
        })
        const dataFields = Array.from(dataFieldsSet)

        // Define the fields you want from the log (excluding '_id', '__v', etc.)
        const fields = ['participant', 'ts', 'eventId'] // Adjust as needed

        const escapeCsvValue = (value) => {
          if (value === null || value === undefined) return ''
          if (typeof value === 'string') {
            value = value.replace(/"/g, '""')
            value = `"${value}"`
          }
          return value
        }

        const csvRows = allLogs.map(row => {
          const rowData = [
            ...fields.map(fieldName => {
              switch (fieldName) {
                case "ts":
                  return new Date(row[fieldName]).toISOString()
                default:
                  return escapeCsvValue(row[fieldName])
              }
            }),
            ...dataFields.map(fieldName => {
              const dataValue = row.data ? row.data[fieldName] : ''
              return escapeCsvValue(dataValue)
            })
          ]
          return rowData.join(',')
        })

        // Add header row
        const headerRow = [...fields, ...dataFields].map(field => `"${field}"`).join(',')
        csvRows.unshift(headerRow)

        /* This Section of Code allows you to download the CSV file to your computer */

        // Create CSV Blob and download it
        const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Experiment_Data_${experimentId}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        onSuccess()

      } else {
        onError(res)
      }
    })
    .catch(
      (err) => {
        console.error(err)
      }
    )

}

// Function to fetch total participant data size
export async function fetchCombinedFileSize(
  experimentId: string,
  participantId: string,
  authToken: string
): Promise<number> {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/participants/${participantId}/combinedfilesize`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch combined file size");
      return 0;
    }

    const data = await response.json();
    return data.totalSize || 0;
  } catch (error) {
    console.error("Error fetching combined file size:", error);
    return 0;
  }
}

// Function to fetch the file information associated with the participant and file type
export async function getFileforFileType(
  participantUID: string,
  fileTypeId: string,
  authToken: string,
) {
  return fetch(`${import.meta.env.BASE_URL}/api/participants/${participantUID}/filetype/${fileTypeId}/file`,
    {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  ).then((res) => res.json())
    .then((data) => {
      if (data && data.success) {
        return data.file
      }
    })
    .catch((error) => {
      console.error("Error fetching file:", error);
      return error;
    })
}

// Function to fetch the raw file data associated with the participant and file type
export async function getFileRawData(
  participantUID: string,
  fileTypeId: string,
  authToken: string,
) {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}/api/participants/${participantUID}/filetype/${fileTypeId}/file/raw`, {
      method: 'GET',
      headers: { Authorization: authToken },
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.error("File not found for the given participant and file type. Skipping this file.");
        return null;
      }
    }
    const blob = await res.blob();
    return blob;
  } catch (error) {
    console.error("Error fetching file data:", error);
    throw error;
  }
}

// Downloads a file associated with given file type
export async function downloadFile(participantId, fileTypeId, authToken) {
  try {
    // Fetch participant and experiment
    const participant = await getParticipantInfo(participantId, authToken);
    const friendlyPartId = participant.pID;

    const experiment = await getExperimentAlternate(participant.experimentId, authToken);
    const experimentName = experiment.name.replace(/\s+/g, '-');

    // Fetch the site (or fallback to "NOSITE")
    let siteId = "NOSITE";
    let siteName = "NOSITE";
    if (participant && participant.site) {
      siteId = participant.site;
      if (siteId === undefined || siteId === null || siteId === "") {
        siteId = "NOSITE";
      }
    }

    if (experiment.isMultiSite === true && siteId !== "NOSITE") {
      const siteRes = await getSite(siteId, authToken);
      const site = siteRes.site;
      siteName = site.shortName.replace(/\s+/g, '-');
    }

    // Get the file type
    const fileType = await getFileType(fileTypeId, authToken);

    // This is the blob of data we will download for this file type
    let blob = null;

    if (fileType.extension.toLowerCase() === "csv") {
      // If this is a CSV file, process its logs for download
      blob = await processLogsForDownload(participantId, fileType, authToken);
    } else {
      // If this not a CSV file, get its binary data
      blob = await getFileRawData(participantId, fileTypeId, authToken);
    }

    if (blob === null) {
      console.log("No data found for this file type, skipping download.");
      return false;
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0];

    // Download file
    if (siteId !== "NOSITE" && experiment.isMultiSite === true) {
      link.setAttribute('download', `${experimentName}_Site-${siteName}_Participant-${friendlyPartId}_${fileType.name}.${fileType.extension}`);
    } else {
      link.setAttribute('download', `${experimentName}_Participant-${friendlyPartId}_${fileType.name}.${fileType.extension}`);
    }

    // link.setAttribute('download', `${experimentId}_${uid}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true;
  } catch (error) {
    console.error('Error during download:', error)
    alert("An error occurred during the download.")
    return false;
  }
}

async function processLogsForDownload(participantId, fileType, authToken) {
  // Function to fetch the logs
  const fetchLogs = async (page, pageSize) => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}/api/participants/${participantId}/logs?page=${page}&limit=${pageSize}&fileTypeId=${fileType._id}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching logs:', error)
      throw error
    }
  }

  let allLogs = []
  let page = 1
  const pageSize = 100
  let totalPages = 1

  // Fetch logs page by page
  while (page <= totalPages) {
    const result = await fetchLogs(page, pageSize)

    if (result && result.logs && result.logs.length > 0) {
      allLogs = [...allLogs, ...result.logs]
      totalPages = Math.ceil(result.totalLogs / pageSize)
    } else {
      break
    }

    page++
  }

  if (allLogs.length > 0) {
    console.log("Got logs from server", allLogs)

    // Collect all unique data fields
    const dataFieldsSet = new Set()
    allLogs.forEach(log => {
      Object.keys(log.data || {}).forEach(field => dataFieldsSet.add(field))
    })
    const dataFields = Array.from(dataFieldsSet)

    const fields = ['ts', 'eventId']

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""')
        value = `"${value}"`
      }
      return value
    }

    const csvRows = allLogs.map(row => {
      const rowData = [
        ...fields.map(fieldName => {
          switch (fieldName) {
            case "ts":
              return new Date(row[fieldName]).toISOString()
            default:
              return escapeCsvValue(row[fieldName])
          }
        }),
        ...dataFields.map(fieldName => {
          const dataValue = row.data ? row.data[fieldName] : ''
          return escapeCsvValue(dataValue)
        })
      ]
      return rowData.join(',')
    })

    // Add header row
    const headerRow = [...fields, ...dataFields].map(field => `"${field}"`).join(',')
    csvRows.unshift(headerRow)

    // Create CSV Blob and download it
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' })
    return blob;
  } else {
    console.log("No data found for this file type, skipping")
    return null;
  }
}