import fs from "fs";
import path from "path";
import Participant from "../models/Participant";
import File from "../models/File";

/**
 * Helper function to save file to server file system
 * @param fileBuffer - The file buffer to save
 * @param experimentId - The experiment ID
 * @param siteId - The site ID
 * @param participantId - The participant ID
 * @param fileTypeId - The file type ID
 * @param originalFileName - The original file name
 * @param version - The file version number
 * @returns Promise<string> - The file path where the file was saved
 */
export async function saveFileToServer(
  fileBuffer: Buffer,
  experimentId: string,
  siteId: string,
  participantId: string,
  fileTypeId: string,
  originalFileName: string,
  version: number
): Promise<string> {
  // Create directory structure: uploads/participantfiles/experimentId/siteId/participantId/fileTypeId/version/
  const uploadsDir = path.join(process.cwd(), "uploads");
  const participantFilesDir = path.join(uploadsDir, "participantfiles");
  const experimentDir = path.join(participantFilesDir, experimentId);
  const siteDir = path.join(experimentDir, siteId);
  const participantDir = path.join(siteDir, participantId);
  const fileTypeDir = path.join(participantDir, fileTypeId);
  const versionDir = path.join(fileTypeDir, version.toString());

  // Ensure directories exist
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  await fs.promises.mkdir(participantFilesDir, { recursive: true });
  await fs.promises.mkdir(experimentDir, { recursive: true });
  await fs.promises.mkdir(siteDir, { recursive: true });
  await fs.promises.mkdir(participantDir, { recursive: true });
  await fs.promises.mkdir(fileTypeDir, { recursive: true });
  await fs.promises.mkdir(versionDir, { recursive: true });

  // Use original filename without versioning since version is now a directory
  const fileName = originalFileName;

  // Full file path
  const filePath = path.join(versionDir, fileName);

  // Save file to disk
  await fs.promises.writeFile(filePath, fileBuffer);

  return filePath;
}

/**
 * Helper function to delete files from server file system
 * @param experimentId - The experiment ID
 * @param siteId - The site ID
 * @param participantId - The participant ID
 * @param fileTypeId - The file type ID
 * @param originalFileName - The original file name (optional, if not provided, deletes all files in the directory)
 */
export async function deleteFilesFromServer(
  experimentId: string,
  siteId: string,
  participantId: string,
  fileTypeId: string,
  originalFileName?: string
): Promise<void> {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const participantFilesDir = path.join(uploadsDir, "participantfiles");
    const fileTypeDir = path.join(
      participantFilesDir,
      experimentId,
      siteId,
      participantId,
      fileTypeId
    );

    // Check if directory exists
    if (!fs.existsSync(fileTypeDir)) {
      console.log(`Directory does not exist: ${fileTypeDir}`);
      return;
    }

    if (originalFileName) {
      // With the new structure, we need to search through version directories
      const versionDirs = await fs.promises.readdir(fileTypeDir, {
        withFileTypes: true,
      });
      const versionDirectories = versionDirs.filter((dirent) =>
        dirent.isDirectory()
      );

      for (const versionDir of versionDirectories) {
        const versionPath = path.join(fileTypeDir, versionDir.name);
        const files = await fs.promises.readdir(versionPath);

        // Find files that match the original filename
        const matchingFiles = files.filter((file) => file === originalFileName);

        for (const file of matchingFiles) {
          const filePath = path.join(versionPath, file);
          await fs.promises.unlink(filePath);
          console.log(`Deleted file from server: ${filePath}`);
        }
      }
    } else {
      // Delete all files in all version directories
      const versionDirs = await fs.promises.readdir(fileTypeDir, {
        withFileTypes: true,
      });
      const versionDirectories = versionDirs.filter((dirent) =>
        dirent.isDirectory()
      );

      for (const versionDir of versionDirectories) {
        const versionPath = path.join(fileTypeDir, versionDir.name);
        const files = await fs.promises.readdir(versionPath);

        for (const file of files) {
          const filePath = path.join(versionPath, file);
          await fs.promises.unlink(filePath);
          console.log(`Deleted file from server: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting files from server:", error);
    // Don't throw error - this shouldn't break the main flow
  }
}

/**
 * Helper function to get binary file from server file system
 * @param filePath - The complete file path to retrieve
 * @returns Promise<Buffer> - The file buffer
 * @throws Error if file doesn't exist or can't be read
 */
export async function getFileFromServer(filePath: string): Promise<Buffer> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file and return buffer
    const fileBuffer = await fs.promises.readFile(filePath);
    console.log(`Successfully read file from server: ${filePath}`);
    return fileBuffer;
  } catch (error) {
    console.error(`Error reading file from server: ${filePath}`, error);
    throw error;
  }
}

/**
 * Helper function to migrate file from MongoDB to server filesystem
 * @param targetFile - The file document from MongoDB
 * @param participantUID - The participant's UID
 * @param experimentId - The experiment ID
 * @param fileTypeId - The file type ID
 * @param updateMethod - Method to update the file document ('findByIdAndUpdate' or 'save')
 * @returns Promise<string> - The server file path where the file was saved
 * @throws Error if migration fails
 */
export async function migrateFileToServer(
  targetFile: any,
  participantUID: string,
  experimentId: string,
  fileTypeId: string,
  updateMethod: "findByIdAndUpdate" | "save" = "findByIdAndUpdate"
): Promise<string> {
  try {
    console.log(
      `Migrating file to server for participant ${participantUID}, fileType ${fileTypeId}`
    );

    const participant = await Participant.findOne({
      uid: participantUID,
    });
    if (!participant) {
      throw new Error("Participant not found");
    }

    const serverFilePath = await saveFileToServer(
      targetFile.data,
      experimentId,
      participant.site.toString(),
      participantUID,
      fileTypeId,
      targetFile.originalFileName ||
        `${(targetFile.fileType as any).name}.${
          (targetFile.fileType as any).extension
        }`,
      targetFile.version || 1
    );

    // Update the file document with server path and remove binary data
    if (updateMethod === "save") {
      targetFile.serverLocationFilePath = serverFilePath;
      //targetFile.data = undefined; //This line of code removes the Binary data from memory. For now, we keep the data in memory until further discussion
      await targetFile.save();
    } else {
      await File.findByIdAndUpdate(targetFile._id, {
        $set: { serverLocationFilePath: serverFilePath },
        $unset: { data: "" },
      });
    }

    console.log(
      `File migrated to server: ${serverFilePath} and removed from MongoDB`
    );

    return serverFilePath;
  } catch (error) {
    console.error("Error migrating file to server:", error);
    throw error;
  }
}

/**
 * Helper function to construct file path and get binary file from server file system
 * @param experimentId - The experiment ID
 * @param siteId - The site ID
 * @param participantId - The participant ID
 * @param fileTypeId - The file type ID
 * @param originalFileName - The original file name
 * @param version - The file version number
 * @returns Promise<Buffer> - The file buffer
 * @throws Error if file doesn't exist or can't be read
 */
export async function getFileFromServerByParams(
  experimentId: string,
  siteId: string,
  participantId: string,
  fileTypeId: string,
  originalFileName: string,
  version: number
): Promise<Buffer> {
  // Construct file path using the same structure as saveFileToServer
  const uploadsDir = path.join(process.cwd(), "uploads");
  const participantFilesDir = path.join(uploadsDir, "participantfiles");
  const experimentDir = path.join(participantFilesDir, experimentId);
  const siteDir = path.join(experimentDir, siteId);
  const participantDir = path.join(siteDir, participantId);
  const fileTypeDir = path.join(participantDir, fileTypeId);
  const versionDir = path.join(fileTypeDir, version.toString());
  const filePath = path.join(versionDir, originalFileName);

  return await getFileFromServer(filePath);
}
