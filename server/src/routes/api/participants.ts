import express from "express";
import passport from "passport";
import mongoose from "mongoose";
import Participant, { IParticipant } from "../../models/Participant";
import Log from "../../models/Log";
import File from "../../models/File";
import FileType from "../../models/FileType";
import Experiment from "../../models/Experiment";
import User from "../../models/User";
import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import Image from "../../models/Image";
import { v4 as uuidv4 } from "uuid";
import busboy from "busboy";
import csv from "csv-parser";
import multer from "multer";
import Site from "../../models/Site";
import slugify from "slugify";
import archiver from "archiver";
import { parse } from "csv";
import BSON from "bson";
import { processCsvLogs } from "../../utils/csvHelper";
import fs from "fs";
import path from "path";
import websocketService from "../../services/websocketService";
import ProcessingStatus from "../../models/ProcessingStatus";
import {
  saveFileToServer,
  deleteFilesFromServer,
  getFileFromServer,
  migrateFileToServer,
  getFileFromServerByParams,
} from "../../utils/fileServerUtils";
process.env.TZ = "America/New_York";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();
export enum ParticipantState {
  CREATED = "CREATED",
  IN_EXPERIMENT = "IN_EXPERIMENT",
  PROCESSING = "PROCESSING",
  COMPLETE = "COMPLETE",
  INCOMPLETE = "INCOMPLETE",
  WITHDRAWN = "WITHDRAWN",
}
/**
 * @desc Simple error wrapper for return JSON message
 * @param msg Error message
 */
function err(msg: string) {
  return { success: false, error: msg };
}

/**
 * @param experiment the experiment ID for which you are trying to get the site ID for
 * @param siteId the site ID that was passed in the request; not always an ID if experimenter didn't know it
 * @returns Site object if siteId is valid, or null if siteId is invalid or not found
 */
async function ensureSite(experiment: any, siteId: any) {
  // Ensure site exists; if experiment has no sites, create default site.
  let site = null;
  if (mongoose.Types.ObjectId.isValid(siteId)) {
    site = await Site.findById(siteId);
    return site;
  }

  // If a site already exists for the experiment, try to use it -- assuming this is a default site.
  if (experiment.sites.length > 0) {
    site = await Site.findById(experiment.sites[0]);
    // If there is something there, but it is not found, erase it and create a new site.
    if (!site) {
      experiment.sites = [];
      await experiment.save();
      console.log(
        "Site not found by given ID; first registered site in experiment is not found; clearing."
      );
      // continue on to creating a default site.
    } else {
      console.log(
        "Site not found by given ID; using the first registered site in experiment"
      );
      return site;
    }
  }

  // If there are no sites in the experiment, create a new one
  if (experiment.sites.length === 0) {
    console.log("No sites found for experiment, creating default site");
    const defaultSite = new Site({
      name: "Default Site",
      parentExperiment: experiment._id,
      shortName: "SITE",
    });
    site = await defaultSite.save();
    experiment.sites.push(site._id);
    await experiment.save();
    return site;
  }

  // Otherwise, site was not found
  else {
    console.log("Site not found by given ID");
    // res.status(404).send({ message: "Site not found" })
    return;
  }
}

/**
 *
 * @param participantId
 * @param experimentId
 * @param siteId
 * @returns participant with participantId if found, otherwise new participant with supplied participantId, experimentId, and siteId.
 */
async function getParticipant(
  participantId: string,
  experimentId: string,
  siteId: string
) {
  // Get the participant and ensure it exists; create one if it does not exist

  let participant = await Participant.findOne({ uid: participantId });
  if (!participant) {
    console.log("Participant not found. Creating new participant");
    participant = new Participant({
      uid: participantId,
      experimentId,
      state: ParticipantState.IN_EXPERIMENT,
      site: siteId,
      sessionStart: new Date(),
    });
    await participant.save();
  }

  return participant;
}

/**
 *
 * @param experimentId
 * @returns experiment with experimentId if found, null otherwise
 */
async function getExperiment(experimentId: string) {
  let experiment = await Experiment.findOne({ _id: experimentId });
  return experiment;
}

/**
 * Helper function to save file to server file system
 * @param fileBuffer - The file buffer to save
 * @param experimentId - The experiment ID
 * @param siteId - The site ID
 * @param fileTypeId - The file type ID
 * @param originalFileName - The original file name
 * @param version - The file version number
 * @returns Promise<string> - The file path where the file was saved
 */
/**
 * @route   POST  api/participants
 * @desc    Create a new participant
 * @returns {200} - Success, returns new participant
 * @returns {400} - Invalid or missing experiment ID or site ID
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      let { experimentId, siteId } = req.body;
      let experiment = await getExperiment(experimentId);
      if (!experiment) {
        res.status(400).json(err("Experiment not found by given ID"));
        return;
      }

      // Check if experiment is draft:
      if (experiment.draft) {
        res.status(405).json(err("Cannot upload to draft"));
        return;
      }

      siteId = await ensureSite(experiment, siteId);
      if (!siteId) {
        res.status(400).json(err("Site not found by given ID"));
        return;
      }
      let participant = await getParticipant(uuidv4(), experimentId, siteId);
      res.status(200).json({ success: true, participant });
      return;
    } catch (error) {
      console.error("Error creating participant:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET  api/participants/:participantId
 * @desc    Get a participant by ID
 * @returns {200} - Participant found, returns participant
 * @returns {400} - Invalid or missing participant ID
 * @returns {404} - No participant found by given ID
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:participantId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const participantId = req.params.participantId;
    try {
      if (!participantId) {
        res.status(400).json(err("Invalid or missing participant ID"));
        return;
      }
      let participant;
      if (mongoose.Types.ObjectId.isValid(participantId)) {
        participant = await Participant.findById(participantId);
      } else {
        participant = await Participant.findOne({ uid: participantId });
      }

      if (!participant) {
        res.status(404).json(err("No participant found by given ID"));
        return;
      }
      res.status(200).json({ success: true, participant });
      return;
    } catch (error) {
      console.error(
        `Error getting participant with ID ${participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   PUT /api/participants/progress/:experimentId/:siteId/:participantId/:state
 * @desc    Update participant progress state manually
 * @access  private
 */
router.put(
  "/progress/:experimentId/:siteId/:participantId/:state",
  passport.authenticate(["jwt", "unity-build-token"], { session: false }),
  async (req, res): Promise<void> => {
    const { experimentId, siteId, participantId, state } = req.params;
    try {
      let experiment = await getExperiment(experimentId);
      if (!experiment) {
        res.status(404).json(err("Experiment not found by given ID"));
        return;
      }

      // If we are using unity-build-token strategy, ensure the token is authorized to edit this experiment
      const authStrategy = (req.user as any).authStrategy || "unknown";
      if (authStrategy === "unity-build-token") {
        if (experimentId.toString() !== req.user.id.toString()) {
          res.status(401).json({
            success: false,
            message:
              "Provided Unity experiment token is not authorized " +
              "to edit this experiment - IDs did not match.",
          });
          return;
        }
      } else if (authStrategy === "jwt") {
        // If we are using JWT strategy, ensure the user is authorized to edit this experiment
        if (
          experiment.createdBy.toString() !== req.user.id.toString() &&
          !experiment.collaborators.some(
            (collab) => collab.user.toString() === req.user.id.toString()
          )
        ) {
          res.status(401).json({
            success: false,
            message:
              "Caller does not own this experiment, nor are they a collaborator",
          });
          return;
        }
      } else {
        res.status(401).json({
          success: false,
          message:
            "Unauthorized for this experiment - unknown authentication strategy used",
        });
        return;
      }

      // Check if experiment is draft:
      if (experiment.draft) {
        res.status(405).json(err("Cannot upload to draft"));
        return;
      }

      const effectiveSiteId = siteId === "N/A" ? undefined : siteId;
      const participant = await getParticipant(
        participantId,
        experimentId,
        effectiveSiteId
      );
      if (!participant) {
        res.status(404).json({ message: "Participant not found" });
        return;
      }

      await setStateByParticipantObj(participant, state);
      res.status(200).json({ message: `State updated to ${state}` });
    } catch (error) {
      console.error("Error updating participant state:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * @route   POST  api/participants/:experimentId/:siteId
 * @desc    Creates a participant; uses Unity ID provided in the request body
 * @returns {201} - Participant created
 * @returns {401} - Unauthorized, caller does not own the experiment
 * @returns {400} - Invalid or missing participant ID
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:experimentId/:siteId",
  passport.authenticate(["jwt", "unity-build-token"], { session: false }),
  async (req, res): Promise<void> => {
    const { experimentId, siteId } = req.params;
    const participantId = req.body.participantId;

    try {
      // Validate participantID is okay
      if (!participantId) {
        res
          .status(400)
          .json(
            err(
              "Invalid or missing participantId in request body, cannot create participant"
            )
          );
        return;
      }

      // Ensure experiment and site exists
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res.status(404).json(err("Experiment not found by given ID"));
        return;
      }
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json(err("Site not found by given ID"));
        return;
      }

      // If we are using unity-build-token strategy, ensure the token is authorized to edit this experiment
      const authStrategy = (req.user as any).authStrategy || "unknown";
      if (authStrategy === "unity-build-token") {
        if (experimentId.toString() !== req.user.id.toString()) {
          res.status(401).json({
            success: false,
            message:
              "Provided Unity experiment token is not authorized " +
              "to edit this experiment - IDs did not match.",
          });
          return;
        }
      } else if (authStrategy === "jwt") {
        // If we are using JWT strategy, ensure the user is authorized to edit this experiment
        if (
          experiment.createdBy.toString() !== req.user.id.toString() &&
          !experiment.collaborators.some(
            (collab) => collab.user.toString() === req.user.id.toString()
          )
        ) {
          res.status(401).json({
            success: false,
            message:
              "Caller does not own this experiment, nor are they a collaborator",
          });
          return;
        }
      } else {
        res.status(401).json({
          success: false,
          message:
            "Unauthorized for this experiment - unknown authentication strategy used",
        });
        return;
      }

      // Ensure experiment does not exist
      let participant = await Participant.findOne({ uid: participantId });
      if (participant) {
        res.status(404).json(err("Participant already exists by provided ID"));
        return;
      }

      // Create new participant using helper function
      participant = await getParticipant(participantId, experimentId, siteId);

      res.status(201).json({ success: true, participant });
    } catch (error) {
      console.error("Error creating participant: ", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET  api/participants/images/:experimentId/:participantId
 * @desc    Gets the images associated with a participant by ID for a given experiment by ID
 * @returns {200} - Success, returns images
 * @returns {404} - participant, experiment, or image not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/images/:experimentId/:participantId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    console.log(
      "Getting images for participant: " +
        req.params.participantId +
        " from experiment: " +
        req.params.experimentId
    );

    try {
      // Ensure experiment exists
      const experiment = await Experiment.findById(req.params.experimentId);
      if (!experiment) {
        res.status(404).json(err("Experiment not found by given ID"));
        return;
      }

      // Ensure participant exists
      const participant = await Participant.findById(req.params.participantId);
      if (!participant) {
        res.status(404).json(err("Participant not found by given ID"));
        return;
      }

      // Find images
      const images = await Image.find({
        participant: req.params.participantId,
        study: req.params.experimentId,
      });
      if (!images || images.length === 0) {
        res.status(404).json(err("No images found for participant"));
        return;
      }

      // Return images
      res.status(200).json({ success: true, images });
      return;
    } catch (error) {
      // General server error catch
      console.error(
        `Error getting images for participant with ID ${req.params.participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   POST  api/participants/images/:experimentId/:participantId
 * @desc    Uploads an image associated with a participant by ID for a given experiment by ID
 * @returns {201} - Successful upload
 * @returns {400} - Invalid or missing image
 * @returns {404} - participant or experiment not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/images/:experimentId/:participantId",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async function (req, res): Promise<void> {
    console.log("Posting Participant image for " + req.params.participantId);

    // Ensure image exists
    if (!req.file) {
      res.status(400).json(err("No file uploaded."));
      return;
    }

    // Get info from params
    const experimentId = req.params.experimentId;
    const participantId = req.params.participantId;
    const image = req.file.buffer;
    console.log(req);
    const ts = new Date();

    try {
      // Ensure experiment exists
      const experiment = await getExperiment(experimentId);
      if (!experiment) {
        console.log("Experiment not found by given ID");
        res.status(404).send({ message: "Experiment not found" });
        return;
      }

      // Check if experiment is draft:
      if (experiment.draft) {
        res.status(405).json(err("Cannot upload to draft"));
        return;
      }

      // Get participant and ensure it exists; create one if it does not exist
      let participant = await Participant.findOne({
        uid: req.params.participantId,
      });
      if (participant == null) {
        console.log("Participant not found. Creating new participant");
        participant = new Participant({
          uid: req.params.participantId,
          experimentId: experimentId,
        });
      }

      // Create image
      const img = new Image({
        ts: ts,
        data: image,
        participant: participantId,
        experiment: experimentId,
      });

      // Save image
      await img.save().then(() => {
        console.log("Image saved successfully");
        res
          .status(200)
          .json({ success: true, message: "Image uploaded successfully." });
        return;
      });
    } catch (error) {
      // General server error catch
      console.error(
        `Error uploading image for participant with ID ${participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET  api/participants/files/:experimentId/:participantId
 * @desc    Gets the files associated with a participant by ID for a given experiment by ID
 * @returns {200} - Success, returns files
 * @returns {404} - participant, experiment, or file not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/files/:experimentId/:participantId",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    console.log(
      "Getting files for participant: " +
        req.params.participantId +
        " from experiment: " +
        req.params.experimentId
    );

    try {
      // Ensure experiment exists
      const experiment = await Experiment.findById(req.params.experimentId);
      if (!experiment) {
        res.status(404).json(err("Experiment not found by given ID"));
        return;
      }

      // Ensure participant exists
      const participant = await Participant.findById(req.params.participantId);
      if (!participant) {
        res.status(404).json(err("Participant not found by given ID"));
        return;
      }

      // Find files
      const files = await File.find({
        participant: req.params.participantId,
        experiment: req.params.experimentId,
        isActive: true, // Only return active files
      })
      .populate("uploadedBy", "firstName lastName email");
      if (!files || files.length === 0) {
        res.status(404).json(err("No files found for participant"));
        return;
      }

      // Return files
      res.status(200).json({ success: true, files });
      return;
    } catch (error) {
      // General server error catch
      console.error(
        `Error getting files for participant with ID ${req.params.participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   POST  api/participants/:participantId/filetypes/:fileTypeId/files
 * @desc    Posts a file associated with a participant by ID for a given file type by ID
 * @returns {201} - File uploaded successfully
 * @returns {400} - Invalid or missing file
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:participantUID/filetypes/:fileTypeId/files",
  upload.single("fileUpload"),
  passport.authenticate(["jwt", "unity-build-token"], { session: false }),
  async function (req, res): Promise<void> {
    try {
      // Validate file upload
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded." });
        return;
      }

      const splitFileName = req.file.originalname.split(".");
      const fileExtension =
        splitFileName[splitFileName.length - 1]?.toLowerCase();
      console.log(
        `Uploading file: ${req.file.originalname} (Size: ${req.file.size} bytes)`
      );

      // Get info to add to file model and filetype
      const ts = new Date();
      const participantUID = req.params.participantUID;
      const fileTypeId = req.params.fileTypeId;
      const mimetype = req.file.mimetype;
      const data = req.file.buffer;
      const size = req.file.size;
      const originalFileName = req.file.originalname; // Get the file name from the file that was uploaded
      const originalFileExtension = fileExtension; // Get the file extension from the file that was uploaded
      const userId = req.user.id;

      // Check to see if participant exists
      let participant = await Participant.findOne({ uid: participantUID });
      if (participant == null) {
        res
          .status(404)
          .json({ success: false, message: "No participant found" });
        return;
      }

      // Check to see if experiment exists
      let experiment = await Experiment.findOne({
        _id: participant.experimentId,
      });
      if (experiment == null) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      // If we are using unity-build-token strategy, ensure the token is authorized to edit this experiment
      const authStrategy = (req.user as any).authStrategy || "unknown";
      if (authStrategy === "unity-build-token") {
        if (experiment._id.toString() !== req.user.id.toString()) {
          console.log(
            "Failed to upload logs: Caller is not authorized for this experiment - " +
              "Unity Build Token ID did not match requested experiment"
          );
          res.status(401).json({
            success: false,
            message:
              "Provided Unity experiment token is not authorized " +
              "to edit this experiment - IDs did not match.",
          });
          return;
        }
      } else if (authStrategy === "jwt") {
        // Ensure caller created the experiment or is a collaborator
        if (
          experiment.createdBy.toString() !== userId &&
          !experiment.collaborators.some(
            (collab) => collab.user.toString() === req.user.id.toString()
          )
        ) {
          console.log(
            "Failed to upload logs: Caller is not owner or collaborator"
          );
          res.status(401).json({
            success: false,
            message: "Caller is not an owner or collaborator of the experiment",
          });
          return;
        }
      } else {
        console.log(
          "Failed to upload logs: Unauthorized for this experiment - unknown authentication strategy used"
        );
        res.status(401).json({
          success: false,
          message:
            "Unauthorized for this experiment - unknown authentication strategy used",
        });
        return;
      }

      // Check if experiment is draft:
      if (experiment.draft) {
        console.log("Failed to upload logs: Experiment is a draft");
        res
          .status(405)
          .json({ success: false, message: "Cannot upload to draft" });
        return;
      }

      // Check to see if FileType Exists
      let fileType = await FileType.findById(fileTypeId);
      if (!fileType) {
        console.log("Failed to upload logs: FileType not found");
        res.status(404).json({ success: false, message: "No File Type found" });
        return;
      }

      // Check to see if FileType Belongs to Experiment
      if (
        fileType.experimentId.toString() !== participant.experimentId.toString()
      ) {
        console.log(
          "Failed to upload logs: FileType does not belong to the experiment"
        );
        res.status(401).json({
          success: false,
          message: "FileType does not belong to the experiment",
        });
        return;
      }

      //Compare the uploaded File's extension with the File Type extension. If they don't match, return error
      if (fileType.extension !== originalFileExtension) {
        console.log("Failed to upload logs: Incorrect file type extension");
        res.status(401).json({
          success: false,
          message: `Incorrect file type extension, should be ${fileType.extension}`,
        });
        return;
      }

      // Check to see if FileType Belongs to Experiment
      if (
        fileType.experimentId.toString() !== participant.experimentId.toString()
      ) {
        console.log(
          "Failed to upload logs: FileType does not belong to the experiment"
        );
        res.status(401).json({
          success: false,
          message: "FileType does not belong to the experiment",
        });
        return;
      }

      //Compare the uploaded File's extension with the File Type extension. If they don't match, return error
      if (fileType.extension !== originalFileExtension) {
        console.log("Failed to upload logs: Incorrect file type extension");
        res.status(401).json({
          success: false,
          message: `Incorrect file type extension, should be ${fileType.extension}`,
        });
        return;
      }

      // Check to see if file already exist for this fileType and participant ID.
      // If it exists, version it
      const oldFile = await File.findOne({
        fileType: fileTypeId,
        participantUID: participantUID,
        isActive: true,
      }).populate("fileType");

      let newVersion = 1; // Default version number
      if (oldFile) {
        // Check if fileType is populated and has the extension property
        const populatedFileType = oldFile.fileType as any;

        if (
          populatedFileType &&
          populatedFileType.extension !== "csv" &&
          authStrategy === "unity-build-token"
        ) {
          // Check to see the file type, if it is not csv and unity-build-token is used then increment the version
          // Mark old file as inactive and mark time it was replaced
          oldFile.isActive = false;
          oldFile.replacedAt = new Date();
          try {
            await oldFile.save();
          } catch (error) {
            console.log("Failed to update old file: " + error);
            res.status(500).json({
              success: false,
              message: "Failed to update old file.",
              error: error,
            });
            return;
          }

          // Get the next version number
          // Search for the all versions of files, sort them and get the latest version number
          const latestVersion = await File.findOne({
            fileType: fileTypeId,
            participantUID: participantUID,
          })
            .sort({ version: -1 }) // Sort version descending to get the latest version
            .select("version");

          newVersion = latestVersion ? latestVersion.version + 1 : 1;
        } else if (
          populatedFileType &&
          populatedFileType.extension === "csv" &&
          authStrategy === "unity-build-token"
        ) {
          // If the file type is CSV and unity-build-token was used, we do not version it, but we delete the old file
          console.log(
            "CSV file detected with unity-build-token, deleting old file"
          );

          // Delete old files from server file system
          await deleteFilesFromServer(
            experiment._id.toString(),
            participant.site.toString(),
            participantUID,
            fileTypeId,
            originalFileName
          );

          await File.deleteMany({
            fileType: fileTypeId,
            participantUID: participantUID,
          });
        } else if (populatedFileType && authStrategy === "jwt") {
          // If the file type is present, including CSV and the file is being replaced on the web client side (using a JWT token instead of unity-build-token), we can version it
          // Mark old file as inactive and mark time it was replaced
          console.log(
            "File detected with JWT, marking old file as inactive and versioning"
          );
          oldFile.isActive = false;
          oldFile.replacedAt = new Date();
          try {
            await oldFile.save();
          } catch (error) {
            console.log("Failed to update old file: " + error);
            res.status(500).json({
              success: false,
              message: "Failed to update old file.",
              error: error,
            });
            return;
          }

          // Get the next version number
          // Search for the all versions of files, sort them and get the latest version number
          const latestVersion = await File.findOne({
            fileType: fileTypeId,
            participantUID: participantUID,
          })
            .sort({ version: -1 }) // Sort version descending to get the latest version
            .select("version");

          newVersion = latestVersion ? latestVersion.version + 1 : 1;
        }
      } else if (!oldFile) {
        // If no old file exists, we can just use version 1
        // TODO: If no old file exists, should we automatically delete all files for a participant and file type?
        console.log("No old file found, using version 1");
      }

      // Create File Object to save to database
      const file = new File({
        ts: ts,
        participantUID: participantUID,
        fileType: fileType._id,
        mimetype: mimetype,
        // data: data, // Do not store file data in the database, only store metadata
        size: size,
        version: newVersion,
        isActive: true,
        serverLocationFilePath: "", // Will be updated after file is saved to server
        originalFileName: originalFileName,
        replacedAt: null, // Set to null initially
         // Added authorship tracking 
        uploadedBy: req.user.id, // Capture who uploaded the file
        uploadedAt: new Date(), // Capture when the file was uploaded
      });

      // Make sure File is not too large
      if (BSON.calculateObjectSize(file) > 5e7) {
        console.log("Failed to upload logs: File is too large");
        res
          .status(400)
          .json({ success: false, message: "File size too large." });
        return;
      }

      // Save file to server file system
      let serverFilePath: string;
      try {
        serverFilePath = await saveFileToServer(
          data,
          experiment._id.toString(),
          participant.site.toString(),
          participantUID,
          fileTypeId,
          originalFileName,
          newVersion
        );
        console.log(`File saved to server: ${serverFilePath}`);
      } catch (fileSystemError) {
        console.error("Error saving file to server:", fileSystemError);
        res.status(500).json({
          success: false,
          message: "Failed to save file to server.",
          error: fileSystemError,
        });
        return;
      }
      console.log(`File saved to server at: ${serverFilePath}`);

      // Update the file document with the server file path
      file.serverLocationFilePath = serverFilePath;

      // Save the file
      await file
        .save()
        .then(() => {
          console.log("File saved successfully");
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({
            success: false,
            message: "Failed to save file.",
            error: error,
          });
          return;
        });

      /* Handles upload to Dropbox */

      try {
        const user = await User.findById(req.user.id);
        console.log("Begin uploading to dropbox....");
        // Check if user has dropbox token stored in profile
        if (user?.dropboxToken) {
          console.log("User Dropbox token found");
          // Create dropbox client using user's access token
          const dbx = new Dropbox({ accessToken: user.dropboxToken, fetch });

          // Fetches experiment data and extract various IDs needed for folder structure
          const exp = await Experiment.findById(participant.experimentId);
          const siteId = participant.site; // mongoose ObjectId or string
          const participantUID = participant.uid; // your generated UUID
          const fileTypeId = fileType._id.toString(); // from req.params.fileTypeId

          // Create a base path for the file upload following a specific hierarchy
          const dropboxBase = `/UCF-VERA/Experiment_${
            exp!._id
          }/Site_${siteId}/Participant_${participantUID}/Filetype_${fileTypeId}`;

          // Helper function to create folders in dropbox
          const ensureFolder = async (path: string) => {
            try {
              await dbx.filesCreateFolderV2({ path, autorename: false });
            } catch (err: any) {
              const tag = err.error?.error?.[".tag"];
              const ptag = err.error?.error?.path?.[".tag"];
              if (!(tag === "path" && ptag === "conflict")) throw err;
            }
          };

          try {
            console.log("Creating dropbox folders");
            // Create each level of the folder hierarchy one by one
            await ensureFolder("/UCF-VERA");
            await ensureFolder(`/UCF-VERA/Experiment_${exp!._id}`);
            await ensureFolder(
              `/UCF-VERA/Experiment_${exp!._id}/Site_${siteId}`
            );
            await ensureFolder(
              `/UCF-VERA/Experiment_${
                exp!._id
              }/Site_${siteId}/Participant_${participantUID}`
            );
            await ensureFolder(dropboxBase);

            console.log("Dropbox Folder Structure: ", dropboxBase);
            // Uploads the file from req.file to the constructed path. Uses "overwrite" mode to replace any existing file with the same name
            await dbx.filesUpload({
              path: `${dropboxBase}/${req.file.originalname}`,
              contents: req.file.buffer,
              mode: { ".tag": "overwrite" },
            });
            console.log("File successfully uploaded to Dropbox");
          } catch (folderError) {
            console.error(
              "Error creating folders or uploading file to Dropbox:",
              folderError
            );
            // Continue with the request - we don't want to fail the entire upload if just Dropbox sync fails
          }
        } else {
          console.log("Dropbox token not found, cannot sync files to Dropbox");
        }
      } catch (dropboxError) {
        console.error("Dropbox synchronization error:", dropboxError);
        // Continue processing - don't fail the whole request if just Dropbox sync fails
      }

      // Update participant
      participant.files.push(file._id);
      try {
        await participant.save();
      } catch (error) {
        console.log("Failed to upload logs: " + error);
        res.status(500).json({
          success: false,
          message: "Failed to update participant files.",
          error: error,
        });
        return;
      }

      // If the file is CSV, process the logs using the shared helper
      if (originalFileExtension === "csv") {
        try {
          // Before adding Logs from CSV, first delete any existing logs for this participant and file type
          console.log(
            "About to delete existing logs for participant: " +
              participantUID +
              " and file type: " +
              fileType._id
          );
          await Log.deleteMany({
            participant: participantUID,
            fileType: fileType._id,
          });

          console.log(
            "Adding new logs from CSV file for participant: " +
              participantUID +
              " and file type: " +
              fileType._id
          );

          await processCsvLogs(
            data,
            participantUID,
            fileType._id.toString(),
            experiment._id.toString()
          );
        } catch (csvErr) {
          console.log("Failed to upload logs: CSV file is corrupted");
          res.status(400).json({
            success: false,
            message: "Uploaded CSV file is corrupted.",
            error: "Uploaded CSV file is corrupted.",
          });
          return;
        }
      }

      // Send response
      console.log("Successfully uploaded participant file.");
      res.status(201).json({
        success: true,
        message: "File uploaded successfully.",
        file: { name: req.file.originalname, time: ts, size: req.file.size },
      });
      return;
    } catch (error) {
      // General server error catch
      console.log("Failed to upload logs: " + error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET api/participants/:participantUID/filetype/:fileTypeId/file/versions
 * @desc    Gets all versions of a file for a participant and filetype
 * @returns {200} - Returns all file versions
 * @returns {404} - participant or filetype not found
 * @returns {500} - Internal server error
 * @access  private
 */

router.get(
  "/:participantUID/filetype/:fileTypeId/versions",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const participantUID = req.params.participantUID;
      const fileTypeId = req.params.fileTypeId;
      const userId = req.user.id;
      console.log(
        "Getting all file versions for participant: " +
          participantUID +
          " and file type: " +
          fileTypeId
      );

      // Check if File Type Id exists
      const fileType = await FileType.findById(fileTypeId);
      if (!fileType) {
        res.status(404).json({ success: false, message: "No File Type found" });
        return;
      }

      // Check if experiment exists and user has access
      const experiment = await Experiment.findById(fileType.experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      // Ensure caller created the experiment or is a collaborator
      if (
        experiment.createdBy.toString() !== userId &&
        !experiment.collaborators.some(
          (collab) => collab.user.toString() === req.user.id.toString()
        )
      ) {
        res.status(401).json({
          success: false,
          message: "Caller does not own this experiment",
        });
        return;
      }

      // Get all versions of the file
      const fileVersions = await File.find({
        participantUID,
        fileType: fileTypeId,
      })
        .populate("fileType")
        .populate("uploadedBy", "firstName lastName email")
        .select("-data") // Exclude binary data for listing
        .sort({ version: -1 }); // Sort by version descending (newest first)

      if (fileVersions.length === 0) {
        res.status(404).json({
          success: false,
          message: "No files found for the given participant and file type",
        });
        return;
      }

      res.status(200).json({ success: true, versions: fileVersions });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve file versions",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   PUT api/participants/:participantUID/filetype/:fileTypeId/file/:fileId
 * @desc    Changes the active file version for a participant and filetype
 * @param {string} participantUID - The participant's UID
 * @returns {200} - Returns all file versions
 * @returns {404} - participant or filetype not found
 * @returns {500} - Internal server error
 * @access  private
 */

router.put(
  "/:participantUID/filetype/:fileTypeId/file/:fileId",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const participantUID = req.params.participantUID;
      const fileTypeId = req.params.fileTypeId;
      const fileId = req.params.fileId;
      const userId = req.user.id;

      // Check if File Type Id exists
      const fileType = await FileType.findById(fileTypeId);
      if (!fileType) {
        res.status(404).json({ success: false, message: "No File Type found" });
        return;
      }

      // Check if experiment exists and user has access
      const experiment = await Experiment.findById(fileType.experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      // Ensure caller created the experiment or is a collaborator
      if (
        experiment.createdBy.toString() !== userId &&
        !experiment.collaborators.some(
          (collab) => collab.user.toString() === req.user.id.toString()
        )
      ) {
        res.status(401).json({
          success: false,
          message: "Caller does not own this experiment",
        });
        return;
      }

      // First, verify that the specific file exists
      const targetFile = await File.findOne({
        _id: fileId,
        participantUID,
        fileType: fileTypeId,
      }).populate("fileType");

      if (!targetFile) {
        res.status(404).json({
          success: false,
          message: "File not found with the given ID",
        });
        return;
      }

      // Set all files for this participant and file type to inactive
      await File.updateMany(
        {
          participantUID,
          fileType: fileTypeId,
        },
        {
          $set: {
            isActive: false,
            replacedAt: new Date(),
          },
        }
      );

      // Set the target file as active and clear replacedAt
      await File.findByIdAndUpdate(fileId, {
        $set: {
          isActive: true,
          replacedAt: null,
        },
      });

      // Get all versions to return in response
      const fileVersions = await File.find({
        participantUID,
        fileType: fileTypeId,
      })
        .populate("fileType")
        .populate("uploadedBy", "firstName lastName email")
        .select("-data") // Exclude binary data for listing
        .sort({ version: -1 }); // Sort by version descending (newest first)

      // If CSV file, process logs
      if ((targetFile.fileType as any).extension === "csv") {
        try {
          // Before adding Logs from CSV, first delete any existing logs for this participant and file type
          console.log(
            "About to delete existing logs for participant: " +
              participantUID +
              " and file type: " +
              fileType._id
          );
          await Log.deleteMany({
            participant: participantUID,
            fileType: fileType._id,
          });

          console.log(
            "Adding new logs from CSV file for participant: " +
              participantUID +
              " and file type: " +
              fileType._id
          );

          // Get file buffer from server filesystem
          let fileBuffer: Buffer;
          if (targetFile.data) {
            // File still has data in MongoDB (not migrated yet)
            fileBuffer = targetFile.data;

            // Migrate file to server filesystem
            try {
              await migrateFileToServer(
                targetFile,
                participantUID,
                experiment._id.toString(),
                fileType._id.toString()
              );
              console.log(`File migration completed successfully`);
            } catch (migrationError) {
              console.error("Error migrating file to server:", migrationError);
              // Continue processing even if migration fails
            }
          } else {
            // File has been migrated to server, read from server filesystem
            try {
              if (targetFile.serverLocationFilePath) {
                // Use stored server path
                fileBuffer = await getFileFromServer(
                  targetFile.serverLocationFilePath
                );
              } else {
                // Construct path using file metadata
                const participant = await Participant.findOne({
                  uid: participantUID,
                });
                if (!participant) {
                  throw new Error("Participant not found");
                }

                fileBuffer = await getFileFromServerByParams(
                  experiment._id.toString(),
                  participant.site.toString(),
                  participantUID,
                  fileType._id.toString(),
                  targetFile.originalFileName ||
                    `${(targetFile.fileType as any).name}.${
                      (targetFile.fileType as any).extension
                    }`,
                  targetFile.version || 1
                );
              }
            } catch (fileSystemError) {
              console.error("Error reading file from server:", fileSystemError);
              res.status(500).json({
                success: false,
                message: "Failed to read file from server.",
                error: fileSystemError,
              });
              return;
            }
          }

          await processCsvLogs(
            fileBuffer,
            participantUID,
            fileType._id.toString(),
            experiment._id.toString()
          );
        } catch (csvErr) {
          console.log("Failed to upload logs: CSV file is corrupted");
          res.status(400).json({
            success: false,
            message: "Uploaded CSV file is corrupted.",
            error: "Uploaded CSV file is corrupted.",
          });
          return;
        }
      }

      res.status(200).json({
        success: true,
        message: "Active file version changed successfully",
        activeFileId: fileId,
        versions: fileVersions,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to change active file version",
        error: error,
      });
      return;
    }
  }
);

/**
 * Cleanup old file versions, keeping only the most recent N versions
 * @param participantUID - The participant's UID
 * @param fileTypeId - The file type ID
 * @param keepVersions - Number of versions to keep (default: 5)
 */
// TODO: Under Construction and needs to be tested
/*
export async function cleanupOldVersions(
  participantUID: string,
  fileTypeId: string,
  keepVersions: number = 5
) {
  try {
    // Get all versions for this participant and file type
    const allVersions = await File.find({
      participantUID,
      fileType: fileTypeId,
    })
      .sort({ version: -1 }) // Sort by version descending
      .select("_id version isActive");

    // If we have more versions than we want to keep
    if (allVersions.length > keepVersions) {
      // Keep the most recent versions (including the active one)
      const versionsToDelete = allVersions.slice(keepVersions);

      // Delete the old versions
      const idsToDelete = versionsToDelete.map((v) => v._id);
      await File.deleteMany({ _id: { $in: idsToDelete } });

      console.log(
        `Cleaned up ${versionsToDelete.length} old file versions for participant ${participantUID}`
      );
    }
  } catch (error) {
    console.error("Error cleaning up old file versions:", error);
  }
}
*/

/**
 * @route   DELETE  api/participants/:participantId
 * @desc    Deletes a participant and associated logs
 * @returns {204} - Successful deletion
 * @returns {404} - participant not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:participantId",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    console.log("Deleting participant logs for " + req.params.participantId);

    try {
      // Ensure participant exists
      let participant = await Participant.findOne({
        uid: req.params.participantId,
      });
      if (participant == null) {
        res.status(404).json(err("Participant not found by given ID"));
        return;
      }

      // Check to see if experiment exists
      let experiment = await Experiment.findOne({
        _id: participant.experimentId,
      });
      if (experiment == null) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      // Check if experiment is draft:
      if (experiment.draft) {
        res.status(405).json(err("Cannot upload to draft"));
        return;
      }

      // Delete participant and associated logs
      await Participant.deleteOne({ uid: req.params.participantId });
      await Log.deleteMany({ participant: req.params.participantId });
      res.status(204).json({
        success: true,
        message: "Participant and logs deleted successfully",
      });
      return;
    } catch (error) {
      // General server error catch
      console.error(
        `Error deleting participant with ID ${req.params.participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

// Sets the state of a given participant
export function setState(participantId, state) {
  Participant.findOne({ uid: participantId })
    .then((participant) => {
      if (participant !== null) {
        participant.state = state;
        participant.save();
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

// Sets the state of a given participant
export async function setStateByParticipantObj(participantObj, newState) {
  if (!participantObj || !participantObj._id) {
    console.log("Participant not found. Cannot set state to", newState);
    return;
  }
  const freshParticipant = await Participant.findById(participantObj._id);

  // If participant is already WITHDRAWN, do not override any state.
  if (freshParticipant.state === "WITHDRAWN") {
    console.log(
      `Participant is already WITHDRAWN, ignoring new state: ${newState}`
    );
    return;
  }

  // If trying to mark COMPLETE, do not update if current state is INCOMPLETE, WITHDRAWN, COMPLETE, or WITHDRAWN.
  if (
    newState === "COMPLETE" &&
    (freshParticipant.state === "INCOMPLETE" ||
      freshParticipant.state === "COMPLETE" ||
      freshParticipant.state === "WITHDRAWN")
  ) {
    console.log(
      `Not updating state to COMPLETE because current state is ${freshParticipant.state}`
    );
    return;
  }
  try {
    await Participant.findByIdAndUpdate(
      participantObj._id,
      { $set: { state: newState } },
      { new: true }
    );
    console.log(
      `Participant state updated to '${newState}' using findByIdAndUpdate.`
    );
  } catch (error) {
    console.error(`Error updating participant state to '${newState}':`, error);
  }
}

/**
 * @route   PATCH  api/participants/:participantId
 * @desc    Updates a participant by ID
 * @returns {200} - Successful update
 * @returns {400} - invalid parameter
 * @returns {404} - participant or experiment not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/:participantId",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      // Get participant and ensure it exists
      const participant = await Participant.findOne({
        uid: req.params.participantId,
      });
      if (participant == null) {
        res.status(404).json(err("Participant not found by given ID"));
        return;
      }

      // Get info from body
      const { exclude, email, note, state } = req.body;

      if (exclude == null && email == null && note == null && state == null) {
        res.status(400).json(err("At least one parameter must be provided"));
        return;
      }

      // Check to see if experiment exists
      let experiment = await Experiment.findOne({
        _id: participant.experimentId,
      });
      if (experiment == null) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      // Check if experiment is draft:
      if (experiment.draft) {
        res.status(405).json(err("Cannot upload to draft"));
        return;
      }

      // Update participant
      if (exclude != null) participant.exclude = exclude;
      if (email != null) participant.email = email;
      if (note != null) participant.note = note;
      if (state != null) participant.state = state;

      // Save participant
      await participant.save();
      res
        .status(200)
        .json({ success: true, message: "Participant updated successfully" });
      return;
    } catch (error) {
      // General server error catch
      console.error(
        `Error updating participant with ID ${req.params.participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   PUT  api/participants/:participantId/uid
 * @desc    Updates a participant's UID
 * @returns {200} - Successful update
 * @returns {400} - invalid parameter
 * @returns {404} - participant not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.put(
  "/:participantId/uid",
  passport.authenticate(["jwt", "unity-token"], { session: false }),
  async function (req, res) {
    try {
      // Get participant and ensure it exists
      const participant = await Participant.findById(req.params.participantId);
      if (!participant) {
        res.status(404).json(err("Participant not found by given ID"));
        return;
      }

      // Get info from body
      const { uid } = req.body;

      if (!uid) {
        res.status(400).json(err("UID was not provided"));
        return;
      }

      // Update participant
      participant.uid = uid;

      // Save participant
      await participant.save();
      res
        .status(200)
        .json({ success: true, message: "Participant updated successfully" });
      return;
    } catch (error) {
      // General server error catch
      console.error(
        `Error updating participant with ID ${req.params.participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET  api/participants/:participantId/logs
 * @desc    Gets the logs for a participant by ID
 * @returns {200} - Returns logs
 * @returns {404} - participant not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:participantId/logs",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      // Explicitly cast or convert the query parameters to string and then to number
      const page = parseInt(req.query.page as string) || 1; // Default to page 1
      const limit = parseInt(req.query.limit as string) || 30; // Default to 10 logs per page
      const skip = (page - 1) * limit;
      const fileTypeId = (req.query.fileTypeId as string) || null;
      const versionId = (req.query.versionId as string) || null;

      // Get participant
      const participant = await Participant.findOne({
        uid: req.params.participantId,
      });
      if (!participant) {
        res.status(404).json(err("Participant not found by given ID"));
        return;
      }

      // Get experiment
      const experiment = await Experiment.findById(participant.experimentId);
      if (!experiment) {
        res.status(404).json(err("Experiment not found by given ID"));
        return;
      }

      // Set up the query for logs, only optionally including fileTypeId if it is non-null
      const query: Record<string, any> = { participant: participant.uid };
      if (fileTypeId !== null && fileTypeId !== undefined) {
        query.fileType = fileTypeId;
      }

      // Check for CSV files that need migration from MongoDB to server filesystem
      try {
        // Only check CSV files for the specific fileTypeId if provided, otherwise check all CSV files
        const csvFileQuery: any = {
          participantUID: participant.uid,
          isActive: true,
        };

        // If fileTypeId is specified, only check that specific file type
        if (fileTypeId) {
          csvFileQuery.fileType = fileTypeId;
        }

        const csvFiles = await File.find(csvFileQuery).populate({
          path: "fileType",
          match: { extension: "csv" },
        });

        // Filter out files where fileType is null (non-CSV files)
        const csvFilesToCheck = csvFiles.filter(
          (file) => file.fileType !== null
        );

        for (const csvFile of csvFilesToCheck) {
          // Check if file exists on server
          let needsMigration = false;

          try {
            if (csvFile.serverLocationFilePath) {
              // Try to access the file using stored path
              await getFileFromServer(csvFile.serverLocationFilePath);
            } else {
              // Try to construct path and access file
              const fileType = csvFile.fileType as any;
              await getFileFromServerByParams(
                experiment._id.toString(),
                participant.site.toString(),
                participant.uid,
                fileType._id.toString(),
                csvFile.originalFileName ||
                  `${fileType.name}.${fileType.extension}`,
                csvFile.version || 1
              );
            }
          } catch (fileSystemError) {
            // File not found on server, needs migration
            needsMigration = true;
          }

          // Migrate file if needed and has MongoDB data
          if (needsMigration && csvFile.data) {
            try {
              const fileType = csvFile.fileType as any;
              await migrateFileToServer(
                csvFile,
                participant.uid,
                experiment._id.toString(),
                fileType._id.toString()
              );
              console.log(`CSV file migration completed successfully`);
            } catch (migrationError) {
              console.error(
                "Error migrating CSV file to server:",
                migrationError
              );
              // Continue processing even if migration fails
            }
          }
        }
      } catch (csvMigrationError) {
        console.error(
          "Error during CSV file migration check:",
          csvMigrationError
        );
        // Continue with logs retrieval even if CSV migration fails
      }

      // Get logs
      Log.find(query)
        .sort({ ts: 1 })
        .skip(skip)
        .limit(limit)
        .then(async (logs) => {
          if (!logs || logs.length === 0) {
            // Check if processing is in progress for this file type
            let processingStatus = null;
            if (fileTypeId) {
              processingStatus = await ProcessingStatus.findOne({
                participantId: participant.uid,
                fileTypeId: fileTypeId,
                ...(versionId && { versionId }),
                status: { $in: ["processing", "error"] },
              }).sort({ startedAt: -1 });
            }

            return res.status(404).json({
              ...err("No logs found for participant"),
              processingStatus: processingStatus
                ? {
                    status: processingStatus.status,
                    progress: processingStatus.progress,
                    error: processingStatus.error,
                    startedAt: processingStatus.startedAt,
                  }
                : null,
            });
          }

          Log.countDocuments(query).then(async (totalLogs) => {
            // Check processing status for completed or in-progress
            let processingStatus = null;
            if (fileTypeId) {
              processingStatus = await ProcessingStatus.findOne({
                participantId: participant.uid,
                fileTypeId: fileTypeId,
                ...(versionId && { versionId }),
              }).sort({ startedAt: -1 });
            }

            res.status(200).json({
              logs,
              totalLogs,
              processingStatus: processingStatus
                ? {
                    status: processingStatus.status,
                    progress: processingStatus.progress,
                    error: processingStatus.error,
                    startedAt: processingStatus.startedAt,
                    completedAt: processingStatus.completedAt,
                  }
                : null,
            });
            return;
          });
        })
        .catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
    } catch (error) {
      // General server error catch
      console.error(
        `Error getting logs of participant with ID ${req.params.participantId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET api/participants/zip/:experimentId
 * @desc    Download all participant files from an experiment
 * @returns {200} - Returns all logs and participant files for an experiment
 * @returns {404} - participant not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/zip/:experimentId",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      console.log(
        "Getting all participant logs for " + req.params.experimentId
      );

      let experiment = await Experiment.findOne({
        _id: req.params.experimentId,
      });
      if (experiment == null) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      // Get all participants from experimentId
      const participants = await Participant.find({
        experimentId: req.params.experimentId,
      });

      if (participants.length == 0) {
        console.log("No participants found");
        res
          .status(404)
          .json({ success: false, message: "No participants found" });
        return;
      }

      // Get all files from each participant and add it to an abject or array to be added to the response
      const filePromises = participants.map(
        async (participant: IParticipant) =>
          await File.find({
            participantUID: participant.uid,
            isActive: true,
          }).populate("fileType")
      );

      // Get All files that belong to each participant in the experiment
      let allFiles = await Promise.all(filePromises);

      /*
       Create Copy of the file objects from the MongoDB database, but change the files stored as binary data to a file stored as base64.
       Convert Binary data to Base64 in order to send as a json response
       Pure Binary data or files can't be sent with an HTTP response if there are other types of data being sent like text, so it has to be converted to base64
      */

      // Empty Array to store files and their metadata to be sent to the client
      var newFileArray = [];

      // Iterate through the files retrieved from mongoose and convert the raw binary data to base64
      allFiles.forEach((participantFileArray) => {
        if (participantFileArray.length == 0) {
          return;
        }

        participantFileArray.forEach(async (fileObject) => {
          // Convert file data from buffer/binary data to base64
          const base64Data = fileObject.data.toString("base64");

          // Create New Object that will contain the base64 file along with other metadata
          let newFileObject = {};

          // Get the keys from the original file from mongoose
          const fileKeys = Object.keys(fileObject.toJSON());

          // Copy those key value pairs from the old object to the new object... Except for the actual file data... We replace the old file data with base64
          fileKeys.forEach((key) => {
            if (key != "data") {
              newFileObject[key] = fileObject[key];
            } else if (key == "data") {
              newFileObject[key] = base64Data;
            }
          });

          newFileArray.push(newFileObject);
        });
      });

      // Get all logs for each participant
      const logsPromises = participants.map(
        async (participant: IParticipant) =>
          await Log.find({ participant: participant.uid }).catch((error) => {
            res.status(500).json({
              success: false,
              message: "Internal Server Error",
              error: error,
            });
            return;
          })
      );
      const allLogs = await Promise.all(logsPromises);

      if (allLogs.length == 0 && allFiles.length == 0) {
        console.log("No Logs Found");
        res.status(404).json({
          success: false,
          message: "No Logs or Files found for participants",
        });
        return;
      }

      // Send response containing  Logs and/or files
      res.status(200).json({ success: true, allLogs, newFileArray });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to Download Experiment",
        error: err,
      });
      return;
    }
  }
);

/**
 * @route   GET api/participants/zip/:experimentId/:siteId
 * @desc    Download all participant files from a specific site within an experiment
 * @returns {200} - Returns all logs and participant files for the site
 * @returns {404} - Site or participants not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/zip/:experimentId/:siteId",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const experimentId = new mongoose.Types.ObjectId(req.params.experimentId);
      const siteId = new mongoose.Types.ObjectId(req.params.siteId);

      console.log(
        `Getting participant logs for experiment ${experimentId} at site ${siteId}`
      );

      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "Experiment not found" });
        return;
      }

      // Validate if the site exists in the experiment's site list
      if (
        !experiment.sites.some((site) =>
          site.equals(new mongoose.Types.ObjectId(siteId))
        )
      ) {
        res.status(404).json({
          success: false,
          message: "Site not part of this experiment",
        });
        return;
      }

      // Get participants from the specified experiment and site
      const participants = await Participant.find({
        experimentId: experimentId,
        site: siteId,
      });

      if (participants.length === 0) {
        res.status(404).json({
          success: false,
          message: "No participants found for this site",
        });
        return;
      }

      // Fetch files per participant and convert to base64
      const filePromises = participants.map(
        async (participant: IParticipant) =>
          await File.find({
            participantUID: participant.uid,
            isActive: true,
          }).populate("fileType")
      );

      const allFilesRaw = await Promise.all(filePromises);
      const newFileArray = [];

      for (const participantFileArray of allFilesRaw) {
        for (const fileObject of participantFileArray) {
          let fileBuffer: Buffer;

          try {
            // Get binary data from server file system instead of MongoDB
            if (fileObject.serverLocationFilePath) {
              fileBuffer = await getFileFromServer(
                fileObject.serverLocationFilePath
              );
            } else {
              // Fallback: construct path using parameters
              const participant = participants.find(
                (p) => p.uid === fileObject.participantUID
              );
              const fileType = fileObject.fileType as any;
              fileBuffer = await getFileFromServerByParams(
                experimentId.toString(),
                participant.site.toString(),
                fileObject.participantUID,
                fileType._id.toString(),
                fileObject.originalFileName ||
                  `${fileType.name}.${fileType.extension}`,
                fileObject.version || 1
              );
            }
          } catch (fileSystemError) {
            console.error("Error reading file from server:", fileSystemError);
            // Fallback to MongoDB data if server file is not found
            if (fileObject.data) {
              console.log(
                "Falling back to MongoDB data for file:",
                fileObject._id
              );
              fileBuffer = fileObject.data;

              // Migrate file to server if binary data is stored on MongoDB
              try {
                const participant = participants.find(
                  (p) => p.uid === fileObject.participantUID
                );
                const fileType = fileObject.fileType as any;

                console.log(
                  `Migrating file to server for participant: ${fileObject.participantUID}, fileType: ${fileType._id}`
                );

                await migrateFileToServer(
                  fileObject,
                  fileObject.participantUID,
                  experimentId.toString(),
                  fileType._id.toString(),
                  "save"
                );

                console.log(
                  `File migration completed successfully for file: ${fileObject._id}`
                );
              } catch (migrationError) {
                console.error(
                  "Error migrating file to server:",
                  migrationError
                );
                // Continue processing even if migration fails
              }
            } else {
              console.error(
                "No file data available in MongoDB either for file:",
                fileObject._id
              );
              continue; // Skip this file if no data is available
            }
          }

          const base64Data = fileBuffer.toString("base64");

          const newFileObject = {
            ...fileObject.toObject(), // or .toJSON()
            data: base64Data, // override binary Buffer with string
          };

          newFileArray.push(newFileObject);
        }
      }

      // Fetch logs per participant
      const logsPromises = participants.map((participant: IParticipant) =>
        Log.find({ participant: participant.uid })
      );
      const allLogs = await Promise.all(logsPromises);

      if (allLogs.length === 0 && newFileArray.length === 0) {
        res.status(404).json({
          success: false,
          message: "No logs or files found for this site",
        });
        return;
      }

      res.status(200).json({ success: true, allLogs, newFileArray });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to download site-specific experiment data",
        error: err,
      });
      return;
    }
  }
);

/**
 * @route   GET api/participants/:participantUID/filetype/:fileTypeId/file
 * @desc    Gets information for the file associated with a particular filetype; does not include binary data
 * @returns {200} - Returns file data for the given filetype
 * @returns {404} - participant not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:participantUID/filetype/:fileTypeId/file",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const participantUID = req.params.participantUID;
      const fileTypeId = req.params.fileTypeId;
      const userId = req.user.id;

      // Check if File Type Id exists
      const fileType = await FileType.findById(fileTypeId);
      //console.log("File Type found:", fileType);

      if (!fileType) {
        res.status(404).json({ success: false, message: "No File Type found" });
        return;
      }

      // Check if experiment exists for the file type
      const experiment = await Experiment.findById(fileType.experimentId);

      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Ensure caller created the experiment or is a collaborator
      if (
        experiment.createdBy.toString() !== userId &&
        !experiment.collaborators.some(
          (collab) => collab.user.toString() === req.user.id.toString()
        )
      ) {
        res.status(401).json({
          success: false,
          message: "Caller does not own this experiment",
        });
        return;
      }

      // Check if Participant Exists
      const participant = await Participant.findOne({ uid: participantUID });

      if (!participant) {
        res.status(404).json({
          success: false,
          message: "No participant found by given ID",
        });
        return;
      }

      let file = await File.findOne({
        participantUID,
        fileType: fileTypeId,
        isActive: true, // Only get the active file
      })
        .populate("fileType")
        .populate("uploadedBy", "firstName lastName email")

        .select("-data")
        .sort({ version: -1 }); // Get the latest version

      if (!file) {
        console.log(
          `No file found for participant ${participantUID} and file type ${fileTypeId}`
        );

        // If no file found, just search by participanUID and fileTypeId without isActive, sort by the most recent timestamp and return that file.
        // There are still alot of files in the old system where there is no isActive,fileversion, and originalfilename fields, so we need to handle that case.
        console.log(
          `Searching for most recent file for participant ${participantUID} and file type ${fileTypeId} by timestamp instead of isActive`
        );
        file = await File.findOne({
          participantUID,
          fileType: fileTypeId,
        })
          .populate("fileType")
          .populate("uploadedBy", "firstName lastName email")

          .sort({ ts: -1 }) // Sort by timestamp descending (most recent first)
          .limit(1); // Ensure we only get one document

        // Next set the isActive field to true if it was not set before and add version 1
        // We want to automatically update the file to the new system where isActive is set to true for the first active file.
        console.log(
          `Setting isActive to true and version to 1 for file ${file._id} for participant ${participantUID} and file type ${fileTypeId}`
        );
        if (file) {
          file.isActive = true;
          file.originalFileName = fileType.name + "." + fileType.extension; // Set original file name
          file.version = 1; // Set version to 1 for the first active file
          await file.save();
        }
      }

      res.status(200).json({ success: true, file });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve file for File Type",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET api/participants/:participantUID/filetype/:fileTypeId/file/raw
 * @desc    Gets the raw data associated with a particular filetype; does not include the associated metadata.
 * @returns {200} - Returns file data for the given filetype
 * @returns {404} - participant not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:participantUID/filetype/:fileTypeId/file/raw",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const participantUID = req.params.participantUID;
      const fileTypeId = req.params.fileTypeId;
      const userId = req.user.id;

      // Check if File Type Id exists
      const fileType = await FileType.findById(fileTypeId);

      if (!fileType) {
        res.status(404).json({ success: false, message: "No File Type found" });
        return;
      }

      // Check if experiment exists for the file type
      const experiment = await Experiment.findById(fileType.experimentId);

      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Ensure caller created the experiment or is a collaborator
      if (
        experiment.createdBy.toString() !== userId &&
        !experiment.collaborators.some(
          (collab) => collab.user.toString() === req.user.id.toString()
        )
      ) {
        res.status(401).json({
          success: false,
          message: "Caller does not own this experiment",
        });
        return;
      }

      // Check if Participant Exists
      const participant = await Participant.findOne({ uid: participantUID });

      if (!participant) {
        res.status(404).json({
          success: false,
          message: "No participant found by given ID",
        });
        return;
      }

      // Find the active file for the participant and file type
      let file = await File.findOne({
        participantUID,
        fileType: fileTypeId,
        isActive: true,
      }) // Only get the active file
        .populate("fileType")
        .sort({ version: -1 }); // Get the latest version

      // If no active file found, try to find the most recent file by timestamp
      if (!file) {
        console.log(
          `No file found for participant ${participantUID} and file type ${fileTypeId}`
        );

        // If no file found, just search by participanUID and fileTypeId without isActive, sort by the most recent timestamp and return that file.
        // There are still alot of files in the old system where there is no isActive,fileversion, and originalfilename fields, so we need to handle that case.
        console.log(
          `Searching for most recent file for participant ${participantUID} and file type ${fileTypeId} by timestamp instead of isActive`
        );
        file = await File.findOne({
          participantUID,
          fileType: fileTypeId,
        })
          .populate("fileType")
          .sort({ ts: -1 }) // Sort by timestamp descending (most recent first)
          .limit(1); // Ensure we only get one document

        // Next set the isActive field to true if it was not set before and add version 1
        // We want to automatically update the file to the new system where isActive is set to true for the first active file.
        console.log(
          `Setting isActive to true and version to 1 for file ${file._id} for participant ${participantUID} and file type ${fileTypeId}`
        );
        if (file) {
          file.isActive = true;
          file.originalFileName = fileType.name + "." + fileType.extension; // Set original file name
          file.version = 1; // Set version to 1 for the first active file
          await file.save();
        }
      }

      // If still no file found, return 404
      if (!file) {
        res.status(404).json({
          success: false,
          message: "No file found for the given participant and file type",
        });
        return;
      }

      // Get binary data from server file system instead of MongoDB
      let fileBuffer: Buffer;
      try {
        // Use serverLocationFilePath if available, otherwise construct path
        if (file.serverLocationFilePath) {
          fileBuffer = await getFileFromServer(file.serverLocationFilePath);
        } else {
          // Fallback: construct path using parameters
          fileBuffer = await getFileFromServerByParams(
            experiment._id.toString(),
            participant.site.toString(),
            participantUID,
            fileTypeId,
            file.originalFileName || `${fileType.name}.${fileType.extension}`,
            file.version || 1
          );
        }
      } catch (fileSystemError) {
        console.error("Error reading file from server:", fileSystemError);
        // Fallback to MongoDB data if server file is not found
        if (file.data) {
          console.log("Falling back to MongoDB data");
          fileBuffer = file.data;

          // Save the file to server and remove from MongoDB to optimize storage
          try {
            const serverFilePath = await migrateFileToServer(
              file,
              participantUID,
              experiment._id.toString(),
              fileTypeId,
              "save"
            );
            console.log(`File migration completed successfully`);
          } catch (migrationError) {
            console.error("Error migrating file to server:", migrationError);
            // Continue with the request even if migration fails
          }
        } else {
          res.status(404).json({
            success: false,
            message: "File not found on server and no fallback data available",
          });
          return;
        }
      }

      res.set({
        "Content-Type": file.mimetype,
        "Content-Length": fileBuffer.length,
        "Content-Disposition": `attachment; filename="${fileType.name}.${fileType.extension}"`,
      });

      res.send(fileBuffer);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve file for File Type",
        error: error,
      });
      return;
    }
  }
);

/**
 * @route   GET api/participants/:participantId/zip
 * @desc    Download all participant files from a participant, in formatted folder structure
 * @returns {200} - Success, returns zip file of all participant logs and files
 * @returns {404} - Participant not found or no data found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:participantId/zip",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const participantId = req.params.participantId;

      console.log("Downloading participant files as zip...");

      // Get participant and ensure they exist
      const participant = await Participant.findOne({ uid: participantId });
      if (!participant) {
        res.status(404).json({
          success: false,
          message: "No participant found by provided ID",
        });
        return;
      }

      // Get the participant's associated experiment
      const experiment = await Experiment.findById(participant.experimentId);
      if (!experiment) {
        res.status(404).json({
          success: false,
          message: "No experiment found for this participant",
        });
        return;
      }

      // If the experiment isMultiSite, get the participant's site
      let site = undefined;
      if (experiment.isMultiSite) {
        site = await Site.findById(participant.site);
        if (!site) {
          res.status(404).json({
            success: false,
            message: "No site found for this participant",
          });
          return;
        }
      }

      // Get files associated with participant
      const files = await File.find({
        participantUID: participant.uid,
        isActive: true, // Only get active files
      })
        .populate("fileType") // Populate fileType to get name and extension
        .select(
          "participantUID fileType data serverLocationFilePath originalFileName version"
        );

      if (files.length === 0) {
        console.log("No files found to add to zip");
        res.status(404).json({
          success: false,
          message: "No files found for this participant",
        });
        return;
      }

      console.log(`Found ${files.length} files for participant`);

      // Prepare the zip to stream back to the client
      let mainName = `${slugify(experiment.name)}`;
      if (experiment.isMultiSite) {
        mainName += `_Site-${slugify(site.shortName)}`;
      }
      mainName += `_Participant-${participant.pID.toString()}`;
      const zipName = `${mainName}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

      const archive = archiver("zip", { zlib: { level: 9 } })
        .on("error", (err) => {
          console.error("Archive error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Archive creation failed",
              error: err.message,
            });
          } else {
            res.destroy(err);
          }
        })
        .on("warning", console.warn)
        .on("end", () => {
          console.log("Archive stream ended");
        });

      // Abort work if client aborts the connection
      req.on("close", () => {
        console.log("Client closed connection, aborting archive");
        archive.abort();
      });

      archive.pipe(res);

      for (const file of files) {
        const fileType = file.fileType as any; // Cast to handle populated fileType
        const fileName = fileType?.name || "unknown-file";
        const fileExtension = fileType?.extension || "";
        const fullFileName = fileExtension
          ? `${fileName}.${fileExtension}`
          : fileName;

        let entry = `${slugify(fullFileName)}`;

        // Get binary data from server file system instead of MongoDB
        let fileBuffer: Buffer;
        try {
          // Use serverLocationFilePath if available, otherwise construct path
          if (file.serverLocationFilePath) {
            fileBuffer = await getFileFromServer(file.serverLocationFilePath);
          } else {
            // Fallback: construct path using parameters
            fileBuffer = await getFileFromServerByParams(
              experiment._id.toString(),
              participant.site?.toString() || "",
              participant.uid,
              fileType._id.toString(),
              file.originalFileName || `${fileType.name}.${fileType.extension}`,
              file.version || 1
            );
          }
        } catch (fileSystemError) {
          console.error("Error reading file from server:", fileSystemError);
          // Fallback to MongoDB data if server file is not found
          if (file.data) {
            console.log("Falling back to MongoDB data for file:", file._id);
            fileBuffer = file.data;

            // Migrate file to server if binary data is stored on MongoDB
            try {
              console.log(
                `Migrating file to server for participant: ${participant.uid}, fileType: ${fileType._id}`
              );

              await migrateFileToServer(
                file,
                participant.uid,
                experiment._id.toString(),
                fileType._id.toString(),
                "save"
              );

              console.log(
                `File migration completed successfully for file: ${file._id}`
              );
            } catch (migrationError) {
              console.error("Error migrating file to server:", migrationError);
              // Continue processing even if migration fails
            }
          } else {
            console.error(
              "No file data available in MongoDB either for file:",
              file._id
            );
            continue; // Skip this file if no data is available
          }
        }

        archive.append(fileBuffer, { name: entry });
      }

      // Finalize the archive
      await archive.finalize();
      console.log("Archive finalized successfully");
    } catch (err) {
      console.error("Error while downloading participant files: ", err);

      // Check if response was already sent (e.g., zip was streaming)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to Download Participant Files",
          error: (err as Error)?.message || "Unknown error",
        });
      }
      return;
    }
  }
);

export default router;
