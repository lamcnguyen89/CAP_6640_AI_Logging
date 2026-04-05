import { Collaborator, ExperimentBaseInfo, Site, FileType } from "./ExperimentFormTypes";

// Validates the base info fields, and returns whether all fields were valid or not
export const validateBaseInfoFields = (experimentBaseInfo: ExperimentBaseInfo, setExperimentBaseInfo) => {
  let valid = true;

  const trimmedName = experimentBaseInfo.name.trim();
  const trimmedDescription = experimentBaseInfo.description.trim();
  const trimmedIrbNumber = experimentBaseInfo.irbProtocolNumber.trim();
  const trimmedIrbEmail = experimentBaseInfo.irbEmailAddress.trim();

  // Name
  if (experimentBaseInfo.nameError !== "") {
    valid = false;
  } else if (trimmedName === "") {
    setExperimentBaseInfo((prev) => ({ ...prev, nameError: "Please provide an experiment name." }));
    valid = false;
  }

  // Description
  if (experimentBaseInfo.descriptionError !== "") {
    valid = false;
  } else if (trimmedDescription === "") {
    setExperimentBaseInfo((prev) => ({ ...prev, descriptionError: "Please provide a description." }));
    valid = false;
  }

  // IRB Protocol Number
  if (experimentBaseInfo.irbProtocolNumberError !== "") {
    valid = false;
  } else if (trimmedIrbNumber === "") {
    setExperimentBaseInfo((prev) => ({ ...prev, irbProtocolNumberError: "Please provide an IRB protocol number." }));
    valid = false;
  }

  // IRB Email Address
  if (experimentBaseInfo.irbEmailAddressError !== "") {
    valid = false;
  } else if (trimmedIrbEmail === "") {
    setExperimentBaseInfo((prev) => ({ ...prev, irbEmailAddressError: "Please provide an IRB email address." }));
    valid = false;
  }

  return valid;
};

// Validates the collaborators, and returns whether all collaborators were valid or not
export const validateCollaborators = (collaborators: Collaborator[], setCollaborators) => {
  let valid = true;

  // Check for duplicate collaborators based on email
  const emailToIndexMap = new Map<string, number>();
  const duplicateEmails: Array<{ email: string; firstIndex: number; duplicateIndex: number }> = [];
  
  collaborators.forEach((collaborator, index) => {
    const email = collaborator.user?.email ? collaborator.user.email.toLowerCase().trim() : "";
    if (email !== "") {
      if (emailToIndexMap.has(email)) {
        duplicateEmails.push({
          email,
          firstIndex: emailToIndexMap.get(email)!,
          duplicateIndex: index,
        });
      } else {
        emailToIndexMap.set(email, index);
      }
    }
  });

  // Remove duplicates by keeping only the first occurrence of each email
  let updatedCollaborators = [...collaborators];
  if (duplicateEmails.length > 0) {
    const indicesToRemove = new Set<number>();
    
    duplicateEmails.forEach(({ duplicateIndex }) => {
      indicesToRemove.add(duplicateIndex);
    });

    // Filter out the duplicate indices
    updatedCollaborators = collaborators.filter((_, index) => !indicesToRemove.has(index));
    
    setCollaborators(updatedCollaborators);
  }

  return valid;
}

// Validates the sites, and returns whether all sites are valid or not
export const validateSites = (sites: Site[], isMultiSite: boolean, setNoSitesError, setSites) => {
  const trimmedSites =
    sites.map(site => ({
      ...site,
      name: site.name ? site.name.trim() : '',
      shortName: site.shortName ? site.shortName.trim() : '',
    }));

  let valid = true;

  // If we are multi-site, ensure sites are okay
  if (isMultiSite) {
    // Ensure at least one site
    if (trimmedSites.length === 0) {
      setNoSitesError("Multi-site experiments require at least one site. Please add a site.");
      valid = false;
    }

    let updatedSites = [...trimmedSites];

    // Ensure all sites are valid
    trimmedSites.forEach((site, index) => {
      if (site.name === "") {
        updatedSites[index].invalidNameError = "Please provide a site name.";
        valid = false;
      }
      if (site.shortName === "") {
        updatedSites[index].invalidShortNameError = "Please provide a short site name.";
        valid = false;
      }
    });

    // Check for duplicate sites
    const siteNameToIndexMap = new Map<string, number>();
    const siteNameDuplicates: Array<{ name: string; firstIndex: number; duplicateIndex: number }> = [];
    const siteShortNameToIndexMap = new Map<string, number>();
    const siteShortNameDuplicates: Array<{ shortName: string; firstIndex: number; duplicateIndex: number }> = [];

    trimmedSites.forEach((site, index) => {
      const { name, shortName } = site;
      if (name !== undefined && name !== "") {
        if (siteNameToIndexMap.has(name.toLocaleLowerCase())) {
          siteNameDuplicates.push({
            name,
            firstIndex: siteNameToIndexMap.get(name.toLocaleLowerCase())!,
            duplicateIndex: index,
          });
        } else {
          siteNameToIndexMap.set(name.toLocaleLowerCase(), index);
        }
      }

      if (shortName !== undefined && shortName !== "") {
        if (siteShortNameToIndexMap.has(shortName.toLocaleLowerCase())) {
          siteShortNameDuplicates.push({
            shortName,
            firstIndex: siteShortNameToIndexMap.get(shortName.toLocaleLowerCase())!,
            duplicateIndex: index,
          });
        } else {
          siteShortNameToIndexMap.set(shortName.toLocaleLowerCase(), index);
        }
      }
    });

    if (siteNameDuplicates.length > 0) {
      siteNameDuplicates.forEach(({ name, firstIndex, duplicateIndex }) => {
        updatedSites[firstIndex].invalidNameError = "Duplicate site name - please remove duplicate names.";
        updatedSites[duplicateIndex].invalidNameError = "Duplicate site name - please remove duplicate names.";
        valid = false;
      });
    }

    if (siteShortNameDuplicates.length > 0) {
      siteShortNameDuplicates.forEach(({ shortName, firstIndex, duplicateIndex }) => {
        updatedSites[firstIndex].invalidShortNameError = "Duplicate site short name - please remove duplicate names.";
        updatedSites[duplicateIndex].invalidShortNameError = "Duplicate site short name - please remove duplicate names.";
        valid = false;
      });
    }

    setSites(updatedSites);
  }

  return valid;
}

// Validates the file types, and returns whether all file types are valid or not
export const validateFileTypes = (fileTypes: FileType[], setFileTypes) => {
  const trimmedFileTypes =
    fileTypes.map(fileType => ({
      ...fileType,
      fileName: fileType.fileName ? fileType.fileName.trim() : '',
      fileExtension: fileType.fileExtension ? fileType.fileExtension.trim() : '',
      fileDescription: fileType.fileDescription ? fileType.fileDescription.trim() : '',
    }))

  let valid = true;
  const updatedFileTypes = [...fileTypes];

  // Ensure all file types are valid
  trimmedFileTypes.forEach((fileType, index) => {
    if (fileType.fileName === "") {
      updatedFileTypes[index].invalidFileNameError = "Please provide a file type name.";
      valid = false;
    }
    if (fileType.fileExtension === "") {
      updatedFileTypes[index].invalidFileExtensionError = "Please provide a file type extension.";
      valid = false;
    }
    if (fileType.fileDescription === "") {
      updatedFileTypes[index].invalidFileDescriptionError = "Please provide a file type description.";
      valid = false;
    }
  });

  // Check for duplicate file types
  const fileTypeNameToIndexMap = new Map<string, number>();
  const fileTypeDuplicates: Array<{ fileName: string; firstIndex: number; duplicateIndex: number }> = [];

  trimmedFileTypes.forEach((fileType, index) => {
    const { fileName } = fileType;
    if (fileName !== null && fileName !== undefined) {
      if (fileTypeNameToIndexMap.has(fileName.toLocaleLowerCase())) {
        fileTypeDuplicates.push({
          fileName,
          firstIndex: fileTypeNameToIndexMap.get(fileName.toLocaleLowerCase())!,
          duplicateIndex: index,
        });
      } else {
        fileTypeNameToIndexMap.set(fileName.toLocaleLowerCase(), index);
      }
    }
  });

  if (fileTypeDuplicates.length > 0) {
    fileTypeDuplicates.forEach(({ fileName, firstIndex, duplicateIndex }) => {
      updatedFileTypes[firstIndex].invalidFileNameError = "Duplicate filename - please remove duplicate names.";
      updatedFileTypes[duplicateIndex].invalidFileNameError = "Duplicate filename - please remove duplicate names.";
      valid = false;
    });
  }

  setFileTypes(updatedFileTypes);
  return valid;
}