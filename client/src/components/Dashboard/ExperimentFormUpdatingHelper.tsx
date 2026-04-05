import { Collaborator, ExperimentBaseInfo, Site, FileType, Column } from "./ExperimentFormTypes";
import { updateCollaborators, createSite, deleteSite, updateSite } from "../../helpers/ExperimentApiHelper";
import { createFileType, deleteFileType, updateFileType } from "../../helpers/FilesAPIHelper";
import { createColumn, createColumnDefinition, deleteColumn, updateColumn, updateColumnDefinition } from "../../helpers/ColumnDefinitionApiHelper";

// Trims and returns all fields for the experiment
export const getTrimmedData = (collaborators: Collaborator[], experimentBaseInfo: ExperimentBaseInfo, sites: Site[], fileTypes: FileType[]) => {
  // Create trimmed collaborators, maintaining all previous info
  let trimmedCollaborators = collaborators.map(collaborator => ({
    email: collaborator.email ? collaborator.email.trim() : ''
  }));
  let trimmedExpName = experimentBaseInfo.name.trim();
  let trimmedExpDescription = experimentBaseInfo.description.trim();
  let trimmedIrbNumber = experimentBaseInfo.irbProtocolNumber.trim();
  let trimmedIrbEmail = experimentBaseInfo.irbEmailAddress.trim();
  let trimmedSites = sites.map(site => ({
    name: site.name ? site.name.trim() : '',
    shortName: site.shortName ? site.shortName.trim() : '',
  }));
  let trimmedFileTypes = fileTypes.map(fileType => ({
    fileName: fileType.fileName ? fileType.fileName.trim() : '',
    fileExtension: fileType.fileExtension ? fileType.fileExtension.trim() : '',
    fileDescription: fileType.fileDescription ? fileType.fileDescription.trim() : '',
  }));

  return { trimmedCollaborators, trimmedExpName, trimmedExpDescription, trimmedIrbNumber, trimmedIrbEmail, trimmedSites, trimmedFileTypes };
}

// Updates an experiment's collaborators based on the given collaborators array
// Returns true if the collaborators were successfully updated, false otherwise
export const updateExperimentCollaborators = async (
  collaborators: Collaborator[],
  experimentIdToEdit: string,
  auth,
) => {
  let valid = true;

  // Send the collaborators to the server to update the experiment's collaborators
  updateCollaborators(experimentIdToEdit, collaborators, auth.token)

  return valid;
}

// Updates an experiment's sites based on the given sites array
// Returns true if the sites were successfully updated, false otherwise
// Updates sites, siteIdsToRemove, and existingIds if applicable
export const updateExperimentSites = async (
  isMultiSite: boolean,
  sites: Site[],
  setSites,
  siteIdsToRemove: string[],
  setSiteIdsToRemove,
  experimentIdToEdit: string,
  auth,
) => {
  let valid = true;
  const updatedSites = [...sites];

  // If we are not multi-site, nothing needs to be done
  if (!isMultiSite) {
    return valid;
  }

  // Remove any sites that were removed
  if (siteIdsToRemove.length > 0) {
    const removeSitesPromises = siteIdsToRemove.map((s) =>
      deleteSite(s, auth.token)
    );

    const results = await Promise.all(removeSitesPromises);

    results.forEach((removeSiteRes) => {
      if (!removeSiteRes.success) {
        console.error("Failed to remove site: ", removeSiteRes.error);
        valid = false;
      }
    });

    setSiteIdsToRemove([]);
  }

  // Create any new sites
  const sitesToCreate = sites.filter((site) => site.needsUpdate && site.existingId === '');

  if (sitesToCreate.length !== 0) {
    const createSitePromises = sitesToCreate.map((s) =>
      createSite(s.name, s.shortName, experimentIdToEdit, auth.token)
    );

    const results = await Promise.all(createSitePromises);

    results.forEach((createSiteRes) => {
      if (createSiteRes.httpStatus >= 300) {
        console.error("Failed to add site: ", createSiteRes.error);
        valid = false;
      }
    });
  }

  // Update any existing sites which need updating
  const sitesToUpdate = sites.filter((site) => site.needsUpdate && site.existingId !== '');

  if (sitesToUpdate.length !== 0) {
    const updateSitePromises = sitesToUpdate.map((s) =>
      updateSite(s.existingId, s.name, s.shortName, auth.token)
    );

    const results = await Promise.all(updateSitePromises);

    results.forEach((updateSiteRes) => {
      if (updateSiteRes.httpStatus >= 300) {
        console.error("Failed to update site: ", updateSiteRes.error);
        valid = false;
      }
    });
  }

  return valid;
}

// Updates an experiment's file types based on the given file types array
// Returns true if the file types were successfully updated, false otherwise
// Updates fileTypes, fileTypesToRemove, and existingIds if applicable
export const updateExperimentFileTypes = async (
  fileTypes: FileType[],
  setFileTypes,
  fileTypeIdsToRemove: string[],
  setFileTypeIdsToRemove,
  experimentIdToEdit: string,
  auth,
) => {
  let valid = true;

  // Remove any file types that were removed
  if (fileTypeIdsToRemove.length > 0) {
    const removeFileTypesPromises = fileTypeIdsToRemove.map((ft) =>
      deleteFileType(experimentIdToEdit, ft, auth.token)
    );

    const results = await Promise.all(removeFileTypesPromises);

    results.forEach((removeFileTypeRes) => {
      if (!removeFileTypeRes.success) {
        console.error("Failed to remove file type: ", removeFileTypeRes.error);
        valid = false;
      }
    });

    setFileTypeIdsToRemove([]);
  }

  // Create or edit file types as necessary
  let updatedFileTypes = [...fileTypes];
  for (let i = 0; i < updatedFileTypes.length; i++) {
    let ft = updatedFileTypes[i];
    if (ft.needsUpdate && (ft.existingId === '' || ft.existingId === undefined)) {
      // If the file type needs an update but does not exist by ID, create a new file type
      const createFileTypeRes = await createFileType(ft.fileName, ft.fileExtension, ft.fileDescription, ft.columnDefinition, experimentIdToEdit, auth.token);

      if (createFileTypeRes.httpStatus >= 300) {
        // General error
        console.error("Failed to add file type: ", createFileTypeRes.error);
        valid = false;
      } else {
        // Success, update collaborator existing ID's and needs update
        updatedFileTypes[i].existingId = createFileTypeRes.fileType._id;
        updatedFileTypes[i].needsUpdate = false;
      }
    } else if (ft.needsUpdate && (ft.existingId !== '' && ft.existingId !== undefined)) {
      // If the file type needs an update and already exists by ID, update the file type
      // First, update the column definition
      if (ft.columnDefinition.needsUpdate) {
        if (ft.columnDefinition.existingId === '' || ft.columnDefinition.existingId === undefined) {
          // If there is no column definition, create a new one
          const columnDefRes = await createColumnDefinition(ft.existingId, ft.columnDefinition.columns, auth.token);
          if (columnDefRes.httpStatus >= 400) {
            valid = false;
            continue;
          }
          updatedFileTypes[i].columnDefinition.existingId = columnDefRes._id;
        } else if (ft.columnDefinition.existingId !== '' && ft.columnDefinition.existingId !== undefined) {
          // If there is a column definition, edit it
          // Start by removing any columns that were removed
          if (ft.columnDefinition.columnIdsToDelete.length > 0) {
            const removeColumnPromises = ft.columnDefinition.columnIdsToDelete.map((c) =>
              deleteColumn(ft.columnDefinition.existingId, c, auth.token)
            );

            const results = await Promise.all(removeColumnPromises);

            results.forEach((removeColumnRes) => {
              if (!removeColumnRes.success) {
                console.error("Failed to remove column: ", removeColumnRes.error);
                valid = false;
              }
            });

            updatedFileTypes[i].columnDefinition.columnIdsToDelete = [];
          }

          // Next, loop through each column, and create or update the column accordingly, if applicable
          let ftCols = ft.columnDefinition.columns;
          for (let j = 0; j < ftCols.length; j++) {
            if ((ftCols[j].existingId === '' || ftCols[j].existingId === undefined) && ftCols[j].needsUpdate) {
              // Column does not exist by ID; if it needs updating, add it as a new column
              const c = ftCols[j];
              try {
                const createColumnRes = await createColumn(
                  ft.columnDefinition.existingId,
                  c.name,
                  c.description,
                  c.dataType,
                  c.transform,
                  auth.token
                );

                if (createColumnRes.httpStatus >= 300) {
                  // General error
                  console.error("Failed to add column: ", createColumnRes.error);
                  valid = false;
                } else {
                  // If successful, set the existingId for the newly created column
                  updatedFileTypes[i].columnDefinition.columns[j].existingId = createColumnRes._id;
                  updatedFileTypes[i].columnDefinition.columns[j].needsUpdate = false;
                }
              } catch (err) {
                console.error("Error creating column: ", err);
                valid = false;
              }
            } else if (ftCols[j].existingId !== '' && ftCols[j].existingId !== undefined && ftCols[j].needsUpdate) {
              // Column exists by ID; if it needs updating, update it
              const c = ftCols[j];
              try {
                const updateColumnRes = await updateColumn(
                  ft.columnDefinition.existingId,
                  c.existingId,
                  c.name,
                  c.description,
                  c.dataType,
                  c.transform,
                  auth.token
                );

                if (updateColumnRes.httpStatus >= 300) {
                  // General error
                  console.error("Failed to update column: ", updateColumnRes.error);
                  valid = false;
                } else {
                  updatedFileTypes[i].columnDefinition.columns[i].needsUpdate = false;
                }
              } catch (err) {
                console.error("Error updating column: ", err);
                valid = false;
              }
            }
          }

          // If all columns are okay, proceed to update the column definition
          if (valid) {
            // Create an array of objects { _id, order }, where _id is the column ID and order is the index in the array
            const columnOrder = updatedFileTypes[i].columnDefinition.columns.map((column, index) => ({ _id: column.existingId, order: index + 1 }));
            const updateColumnDefRes = await updateColumnDefinition(ft.columnDefinition.existingId, columnOrder, auth.token);

            if (updateColumnDefRes.httpStatus >= 300) {
              valid = false;
            }
          }
        }
      }

      // Update the file type itself
      const updateFileTypeRes = await updateFileType(ft.existingId, ft.fileName, ft.fileExtension, ft.fileDescription, auth.token);
      if (updateFileTypeRes.httpStatus >= 300) {
        console.error("Failed to update file type: ", updateFileTypeRes.error);
        valid = false;
      }
    }
  }

  setFileTypes(updatedFileTypes);
  return valid;
}