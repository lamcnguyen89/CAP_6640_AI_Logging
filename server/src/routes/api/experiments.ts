import deleteMethods2 from "../../common/deleteMethods2";
import { errRes } from "../../common/utilities";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import passport from "passport";
import Experiment from "../../models/Experiment";
import Study from "../../models/Study";
import User from "../../models/User";
import Participant, { IParticipant } from "../../models/Participant";
import ColumnDefinition from "../../models/ColumnDefinition";
import Log from "../../models/Log";
import Site from "../../models/Site";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import File from "../../models/File";
import FileType from "../../models/FileType";
import * as BSON from "bson";
import Column from "../../models/Column";
import slugify from "slugify";
import archiver from "archiver";
import { logger } from "../../utils/logger";
import {
  getFileFromServer,
  getFileFromServerByParams,
  migrateFileToServer,
} from "../../utils/fileServerUtils";

import multer from "multer";
import UnityBuildToken from "../../models/UnityBuildToken";
import ShortCode from "../../models/ShortCode";
import crypto from "crypto";
import exp from "constants";
import {
  requireExperimentAdmin,
  requireExperimentCreator,
  requireExperimentDeveloper,
  requireExperimentMember,
} from "../../middleware/experimentPermissions";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const unzipper = require("unzipper");

const router = express.Router();
router.use(express.json());

/**
 * @route   POST api/experiments/
 * @desc    Create a new experiment according to incoming body; also creates a default site.
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Collaborators not found by email
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @returns {201} - Experiment created
 * @access  private
 */

// Source for Uploading Multiple Files: https://medium.com/@jomote/mastering-file-uploads-with-multer-in-node-js-84698cdba2b2
// Define uploaded files that will be sent to server using Multer. For now it is just an IRB Letter, but in the future, it could be many other files
const uploadFields = upload.fields([{ name: "irbLetter", maxCount: 1 }]);

router.post(
  "/",
  uploadFields,
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from body

    console.log("Request Body Data: ", req.body);
    console.log("Request Files: ", req.files);

    // Create Empty ExperimentInfo object to add the parsed experiment data in
    let experimentInfo;

    try {
      // The Experiment Info is sent as a JSON String field, so parse it first:
      experimentInfo = JSON.parse(req.body.experimentInfo || "{}");
    } catch (err) {
      res.status(400).json(errRes("Invalid JSON"));
      return;
    }

    // Set Logged in User ID to Variable
    let userId = req.user.id;

    // Destructure Experiment Info that is not a file
    let {
      name,
      description,
      irbProtocolNumber,
      irbEmailAddress,
      collaborators,
      isMultiSite,
      conditions,
    } = experimentInfo;

    // Set uploaded files to variables
    let irbLetterBuffer = "";
    let irbLetterName = "";

    try {
      if (req.files["irbLetter"]) {
        let irbLetter = req.files["irbLetter"][0];

        console.log("IRB Letter: ", irbLetter);
        // Check if file is a pdf
        if (irbLetter.mimetype !== "application/pdf") {
          res.status(400).json(errRes("Can only upload a pdf file"));
          return;
        }
        // Check file size
        if (irbLetter.size >= 5e7) {
          res
            .status(400)
            .json(errRes("IRB Letter cannot be greater then 50mb"));
          return;
        }

        // Set IRB Letter's data to a variable
        irbLetterBuffer = irbLetter.buffer;
        let irbLetterOriginalName = irbLetter.originalname.split(".");
        irbLetterName = irbLetterOriginalName[0];
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(errRes("IRB Upload failed"));
      return;
    }

    // Validate incoming fields (name, description, IRB num)
    if (!name) {
      res.status(400).json(errRes("Experiment name required"));
      return;
    }

    if (!description) {
      res.status(400).json(errRes("Experiment description required"));
      return;
    }

    if (!irbProtocolNumber) {
      res.status(400).json(errRes("IRB protocol number required"));
      return;
    }

    if (!irbEmailAddress) {
      res.status(400).json(errRes("IRB email address required"));
      return;
    }

    if (isMultiSite === undefined) {
      res.status(400).json(errRes("isMultiSite is required"));
      return;
    }

    try {
      // Ensure experiment does not already exist by this name
      const experiment = await Experiment.findOne({ name: name });
      if (experiment) {
        res
          .status(409)
          .json(errRes("Experiment with this name already exists"));
        return;
      }

      // Create new experiment
      const experimentInfoDoc = new Experiment({
        name: name,
        description: description,
        irbProtocolNumber: irbProtocolNumber,
        irbEmailAddress: irbEmailAddress,
        irbLetterName: irbLetterName,
        irbLetter: irbLetterBuffer,
        createdBy: userId,
        participants: [],
        collaborators: [],
        conditions: Array.isArray(conditions) ? conditions : [],
        isMultiSite: isMultiSite,
        draft: false,
      });

      // If this experiment is not multi-site, add a default site (hidden for non-multi-site exp's)
      let newSite;
      if (!isMultiSite) {
        const siteInfo = new Site({
          name: "Default Site",
          shortName: "SITE",
        });
        newSite = await siteInfo.save();

        experimentInfoDoc.sites = [new mongoose.Types.ObjectId(newSite._id)];
      }

      if (collaborators) {
        experimentInfoDoc.collaborators = collaborators.map((collaborator) => ({
          user: collaborator.user.id,
          permissionRole: collaborator.permissionRole || "Member",
        }));
      }

      // Save experiment
      let newExperiment = await experimentInfoDoc.save();

      // Update default site's parent experiment, if pertinent
      if (!isMultiSite) {
        newSite.parentExperiment = new mongoose.Types.ObjectId(
          newExperiment._id
        );
        await newSite.save();
      }

      res
        .status(201)
        .json({ success: true, experiment, _id: newExperiment._id });
      return;
    } catch (error) {
      console.error("Error creating experiment: ", error);
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
 * @route   POST api/experiments/:experimentId/webxr
 * @desc    Posts a webxr zip file to the experiment; requires collaborator developer access
 * @returns {201} - Successful adding of the zip
 * @returns {400} - Bad request, missing fields or improper zip
 * @returns {401} - Caller does not own this experiment
 * @returns {404} - Experiment not found
 * @returns {500} - General server error
 * @access  private
 */
router.post(
  "/:experimentId/webxr",
  upload.single("webxrZip"),
  passport.authenticate(["jwt", "unity-user-token"], { session: false }),
  requireExperimentDeveloper,
  async (req, res) => {
    try {
      const callerId = req.user.id;
      const experimentId = req.params.experimentId;

      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Ensure experiment exists and get it
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Check if the file is present
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }

      // Check if the file is a zip
      if (path.extname(req.file.originalname) !== ".zip") {
        res.status(400).json({ success: false, message: "File is not a zip" });
        return;
      }

      // Paths for saving the unzipped experience
      const webXrDir = path.resolve("/usr/uploads", "webxr");
      const destPath = path.join(webXrDir, experimentId);

      // Remove old webxr directory if it exists, and create a new one
      await fsPromises.rm(destPath, { recursive: true, force: true });
      await fsPromises.mkdir(destPath, { recursive: true });

      console.log("Unzipping WebXR zip file to directory: ", destPath);

      // Unzip the file
      await unzipper.Open.buffer(req.file.buffer).then((d) =>
        d.extract({ path: destPath })
      );

      console.log("WebXR zip file unzipped successfully");

      // Update the WebXR build number in the experiment
      experiment.webXrBuildNumber = (experiment.webXrBuildNumber || 0) + 1;
      await experiment.save();

      res
        .status(201)
        .json({ success: true, message: "WebXR zip uploaded successfully" });
      return;
    } catch (error) {
      // Upon general error, return server error
      console.error(`Error uploading WebXR zip: `, error);
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
 * @route   GET api/experiments/:experimentId/webxr/buildpaths
 * @desc    Gets the build paths of the webxr experience for this experiment; returns 404 if no build exists.
 *            All webxr builds are stored in /usr/uploads/webxr/<experimentId>/<buildFolderName>/Build/; the files are then <buildGeneralName>.wasm, etc.
 *            This route will return various info related to this pathing, including mainName (<buildFolderName>), buildName (<buildGeneralName>),
 *            and the paths to the loader, wasm, framework, and data files (<buildFolderName>/Build/<buildGeneralName>.wasm...).
 *            This return can then be used to find the <return>.wasm, <return.data, etc.
 * @returns {200} - Success, returns the build name as "name"
 * @returns {404} - Experiment or build not found
 * @returns {500} - General server error
 * @access  private
 */
router.get(
  "/:experimentId/webxr/buildpaths",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const experimentId = req.params.experimentId;
      const experimentRoot = path.resolve("/usr/uploads/webxr", experimentId);

      // Check if the experiment directory exists first
      try {
        const stat = await fsPromises.stat(experimentRoot);
        if (!stat.isDirectory()) {
          res.status(404).json({
            success: false,
            message: "No build found - experiment directory does not exist",
          });
          return;
        }
      } catch {
        res.status(404).json({
          success: false,
          message: "No build found - experiment directory does not exist",
        });
        return;
      }

      const rootEntries = await fsPromises.readdir(experimentRoot, {
        withFileTypes: true,
      });

      // Check if the experiment directory is empty
      if (!rootEntries.length) {
        res.status(404).json({
          success: false,
          message: "No build found - experiment directory is empty",
        });
        return;
      }

      let wrapperName = "";
      let buildDirPath = "";

      // Check if Build directory is in the root
      const directBuild = rootEntries.find(
        (e) => e.isDirectory() && e.name === "Build"
      );
      if (directBuild) {
        buildDirPath = path.join(experimentRoot, "Build");
      } else {
        // Build is wrapped, check inside wrapper
        const wrapperEntry = rootEntries.find((e) => e.isDirectory());
        if (!wrapperEntry) {
          res.status(404).json({
            success: false,
            message:
              "No build found - experiment folder contains no directories",
          });
          return;
        }

        wrapperName = wrapperEntry.name;
        const wrappedBuildPath = path.join(
          experimentRoot,
          wrapperName,
          "Build"
        );

        // Make sure Build folder exists within wrapped folder
        try {
          const stat = await fsPromises.stat(wrappedBuildPath);
          if (!stat.isDirectory()) throw new Error();
          buildDirPath = wrappedBuildPath;
        } catch {
          res.status(404).json({
            success: false,
            message: `No build found - experiment subfolder "${wrapperName}" does not contain a Build folder`,
          });
          return;
        }
      }

      // Check if the Build directory is empty
      const buildFiles = await fsPromises.readdir(buildDirPath, {
        withFileTypes: true,
      });
      if (!buildFiles.length) {
        res.status(404).json({
          success: false,
          message: "No build found - Experiment's Build folder is empty",
        });
        return;
      }

      // all Unity-generated files share the same stem (for example, "MyBuild.wasm", "MyBuild.data", etc.)
      // Get this stem from the first file in the Build directory
      const firstFileName = buildFiles[0].name;
      const buildStem = firstFileName.split(".")[0];

      // pick out the four files we need (loader, wasm, framework, data)
      const pick = (substring: string) =>
        buildFiles.find((f) => f.name.includes(substring))?.name ?? "";

      let loaderName = pick("loader");
      let wasmName = pick(".wasm");
      let frameworkName = pick("framework");
      let dataName = pick(".data");

      if (!loaderName || !wasmName || !frameworkName || !dataName) {
        res.status(404).json({
          success: false,
          message:
            "Build folder does not contain the expected *.loader, *.wasm, *.framework.js and *.data files",
        });
        return;
      }

      // strip “.gz” if the files were compressed
      const stripGz = (n: string) => (n.endsWith(".gz") ? n.slice(0, -3) : n);
      loaderName = stripGz(loaderName);
      wasmName = stripGz(wasmName);
      frameworkName = stripGz(frameworkName);
      dataName = stripGz(dataName);

      // Build the relative paths to the files
      const relativePrefix = wrapperName
        ? path.join(wrapperName, "Build")
        : "Build";

      res.status(200).json({
        success: true,
        mainName: wrapperName || "Build",
        buildName: buildStem,
        loaderPath: path.join(relativePrefix, loaderName),
        wasmPath: path.join(relativePrefix, wasmName),
        frameworkPath: path.join(relativePrefix, frameworkName),
        dataPath: path.join(relativePrefix, dataName),
      });
      return;
    } catch (error) {
      // Upon general error, return server error
      console.error(`Error getting build paths: `, error);
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
 * @route   POST  api/experiments/:experimentId/webxr/shortcode
 * @desc    Gets a short code to the WebXR experience for this experiment; requires collaborator member access
 *            Deletes existing short code if it exists, then creates a new one.
 *            Accepts an optional "siteId" in the body, to specify a particular site for the short code.
 * @returns {201} - Short code generated successfully
 * @returns {400} - Invalid experimentId or siteId
 * @returns {404} - Experiment, site, or WebXR build not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:experimentId/webxr/shortcode",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (req, res) => {
    try {
      // Get the experiment ID from the request parameters
      const experimentId = req.params.experimentId;
      if (!mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid experimentId",
        });
        return;
      }

      // Check if the experiment exists
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res.status(404).json({
          success: false,
          message: "Experiment not found",
        });
        return;
      }

      // Check the body for siteId, ensure site exists if provided
      const { siteId } = req.body;
      if (siteId && !mongoose.Types.ObjectId.isValid(siteId)) {
        res.status(400).json({
          success: false,
          message: "Invalid siteId",
        });
        return;
      }
      if (siteId) {
        const site = await Site.findById(siteId);
        if (!site) {
          res.status(404).json({
            success: false,
            message: "Site not found",
          });
          return;
        }
      }

      // Check if WebXR build exists for this experiment
      const webXrDir = path.resolve("/usr/uploads", "webxr", experimentId);
      try {
        const stat = await fsPromises.stat(webXrDir);
        if (!stat.isDirectory()) {
          res.status(404).json({
            success: false,
            message: "No WebXR build found for this experiment",
          });
          return;
        }
      } catch {
        res.status(404).json({
          success: false,
          message: "No WebXR build found for this experiment",
        });
        return;
      }

      // Delete any existing short codes created by this user for this experiment
      await ShortCode.deleteMany({
        createdBy: req.user.id,
        targetPath: { $regex: `^/webxr/${experimentId}` }
      });

      // Generate a unique alphanumeric short code (lowercase only)
      const generateShortCode = (): string => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let shortCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 1000;

      // Generate unique short code
      while (!isUnique && attempts < maxAttempts) {
        shortCode = generateShortCode();
        const existingCode = await ShortCode.findOne({ code: shortCode });
        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        res.status(500).json({
          success: false,
          message: "Unable to generate unique short code",
        });
        return;
      }

      // Create target path for WebXR experience
      const targetPath = siteId 
        ? `/vera-portal/webxr/${experimentId}?siteId=${siteId}`
        : `/vera-portal/webxr/${experimentId}`;

      // Create and save the short code
      const newShortCode = new ShortCode({
        code: shortCode!,
        targetPath: targetPath,
        createdBy: req.user.id
      });

      await newShortCode.save();

      res.status(201).json({
        success: true,
        message: "Short code generated successfully",
        code: shortCode!,
      });
    } catch (error) {
      // General server error catch
      console.error(
        `Error generating short code:`,
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
 * @route   GET  api/experiments/webxr/shortcode/:shortcode
 * @desc    Gets the validity of a short code for a WebXR experience; returns 404 if not found or expired.
 *            If the short code is valid, it will return the full code, including the target path.
 *            Expires the short code after use, so it can only be used once.
 *            NOTE: UNPROTECTED ROUTE - anyone can use this to get the full code, if they know the short code.
 * @returns {200} - Short code found, returns the full code
 * @returns {400} - Invalid short code format
 * @returns {404} - Short code not found or expired
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/webxr/shortcode/:shortcode",
  async (req, res) => {
    try {
      const { shortcode } = req.params;

      // Validate shortcode
      if (!shortcode || shortcode.length !== 4) {
        res.status(400).json({
          success: false,
          message: "Invalid short code",
        });
        return;
      }

      // Check if the short code exists
      const existingCode = await ShortCode.findOne({ code: shortcode });
      if (!existingCode) {
        res.status(404).json({
          success: false,
          message: "Short code not found",
        });
        return;
      }

      // Return the code
      res.status(200).json({
        success: true,
        message: "Short code found",
        fullCode: existingCode
      });

      // Delete the code after use
      await ShortCode.deleteOne({ code: shortcode });
      return;
    } catch (error) {
      // General server error catch
      console.error(
        `Error getting short code:`,
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
 * @route   PATCH  api/experiments/:experimentId
 * @desc    Patches an experiment by ID according to incoming body; requires collaborator admin access
 * @returns {200} - Experiment updated
 * @returns {400} - Bad request, missing fields
 * @returns {401} - Unauthorized, user is not creator of experiment
 * @returns {404} - Experiment not found
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/:experimentId",
  uploadFields,
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    // Get info from body

    console.log("Request Body Data: ", req.body);
    console.log("Request Files: ", req.files);

    // Create Empty ExperimentInfo object to add the parsed experiment data in
    let experimentInfo;
    let experimentId = req.params.experimentId;

    try {
      // The Experiment Info is sent as a JSON String field, so parse it first:
      experimentInfo = JSON.parse(req.body.experimentInfo || "{}");
    } catch (err) {
      res.status(400).json(errRes("Invalid JSON"));
      return;
    }

    // Set Logged in User ID to Variable
    let userId = req.user.id;

    // Destructure Experiment Info that is not a file
    let {
      name,
      description,
      irbProtocolNumber,
      irbEmailAddress,
      removeIrbLetter,
      isMultiSite,
      conditions,
    } = experimentInfo;

    // Set uploaded files to variables
    let irbLetterBuffer = "";
    let irbLetterName = "";

    try {
      if (req.files["irbLetter"]) {
        let irbLetter = req.files["irbLetter"][0];
        console.log("IRB Letter: ", irbLetter);

        // Check to see if the file has the mimetype of pdf
        if (irbLetter.mimetype !== "application/pdf") {
          res.status(400).json(errRes("Can only upload a pdf file"));
          return;
        }
        // Check file size
        if (irbLetter.size >= 5e7) {
          console.log("Cannot Upload IRB Letter Greater then 50mb");
          res
            .status(400)
            .json(errRes("IRB Letter cannot be greater then 50mb"));
          return;
        }

        // Set IRB Letter's data to a variable
        irbLetterBuffer = irbLetter.buffer;

        let irbLetterOriginalName = irbLetter.originalname.split(".");

        irbLetterName = irbLetterOriginalName[0];

        console.log("IRB Letter Buffer: ", irbLetterBuffer);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(errRes("IRB Upload Failed"));
      return;
    }

    try {
      // Validate at least one field to update
      if (
        !name &&
        !description &&
        !irbProtocolNumber &&
        !irbEmailAddress &&
        !irbLetterName &&
        !irbLetterBuffer &&
        isMultiSite !== undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            "At least one field (name, description, irbProtocolNumber, irbEmailAddress, irbLetter, isMultiSite) must be provided to update",
        });
        return;
      }
      // Find the experiment
      const experiment = await Experiment.findById(experimentId);

      // Validate experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "Experiment not found" });
        return;
      }

      // If patching name, ensure new name doesn't already exist

      if (name && name != experiment.name) {
        let existingExperiment = await Experiment.findOne({ name: name });
        if (existingExperiment) {
          res.status(409).json({
            success: false,
            message: "Experiment with this name already exists",
          });
          return;
        }
      }

      // Update experiment with new info
      if (name) experiment.name = name;
      if (description) experiment.description = description;
      if (irbProtocolNumber) experiment.irbProtocolNumber = irbProtocolNumber;
      if (irbEmailAddress) experiment.irbEmailAddress = irbEmailAddress;
      if (irbLetterName) experiment.irbLetterName = irbLetterName;
      if (irbLetterBuffer) experiment.irbLetter = Buffer.from(irbLetterBuffer);
      if (!irbLetterBuffer && removeIrbLetter)
        experiment.irbLetter = Buffer.from("");
      if (isMultiSite !== undefined) experiment.isMultiSite = isMultiSite;
      if (Array.isArray(conditions)) experiment.conditions = conditions;

      // Set Experiment to Draft
      experiment.draft = false;

      console.log("Saving Updated Experiment");
      // Save updated experiment
      await experiment
        .save()
        .then((updatedExperiment) => {
          res.status(200).json({ success: true, updatedExperiment });
          return;
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Failed to save the experiment" });
          return;
        });
    } catch (error) {
      // General server error catch
      console.error(
        `Error updating experiment with ID ${experimentId}:`,
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
 * @route   POST api/experiments/draft
 * @desc    Create a new experiment as a draft where you see the experiment but cannot add data to it.
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Collaborators not found by email
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @returns {201} - Experiment created
 * @access  private
 */

router.post(
  "/draft",
  uploadFields,
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from body

    console.log("Request Body Data: ", req.body);
    console.log("Request Files: ", req.files);

    // Create Empty ExperimentInfo object to add the parsed experiment data in
    let experimentDraftInfo;

    try {
      // The Experiment Info is sent as a JSON String field, so parse it first:
      experimentDraftInfo = JSON.parse(req.body.experimentInfo || "{}");
    } catch (err) {
      res.status(400).json(errRes("Invalid JSON"));
      return;
    }

    // Set Logged in User ID to Variable
    let userId = req.user.id;

    // Destructure Experiment Info that is not a file
    let {
      name,
      description,
      irbProtocolNumber,
      irbEmailAddress,
      collaborators,
      isMultiSite,
      conditions,
    } = experimentDraftInfo;

    // Set uploaded files to variables
    let irbLetterBuffer = "";
    let irbLetterName = ";";

    if (req.files["irbLetter"]) {
      let irbLetter = req.files["irbLetter"][0];
      // Check if file is a pdf

      if (irbLetter.mimetype !== "application/pdf") {
        res.status(401).json(errRes("Can only upload a pdf file"));
      }
      // Check file size
      if (irbLetter.size >= 5e7) {
        res.status(401).json(errRes("IRB Letter cannot be greater then 50mb"));
      }

      // Set IRB Letter's data to a variable
      irbLetterBuffer = irbLetter.buffer;

      let irbLetterOriginalName = irbLetter.originalname.split(".");

      irbLetterName = irbLetterOriginalName[0];
    }

    // Validate incoming fields (name, description, IRB num)
    if (!name) {
      res.status(400).json(errRes("Experiment name required"));
      return;
    }

    /*
    if (isMultiSite === undefined) {
      res.status(400).json(errRes("isMultiSite is required"));
      return;
    }
    */

    try {
      // Ensure experiment does not already exist by this name
      const experimentDraft = await Experiment.findOne({ name: name });
      if (experimentDraft) {
        res
          .status(409)
          .json(errRes("Experiment Draft with this name already exists"));
        return;
      }

      // Create new experiment Draft
      const experimentDraftDoc = new Experiment({
        name: name,
        description: description,
        irbProtocolNumber: irbProtocolNumber,
        irbEmailAddress: irbEmailAddress,
        irbLetterName: irbLetterName,
        irbLetter: irbLetterBuffer,
        createdBy: userId,
        participants: [],
        collaborators: [],
        conditions: Array.isArray(conditions) ? conditions : [],
        isMultiSite: isMultiSite,
        draft: true,
      });

      // If this experiment is not multi-site, add a default site (hidden for non-multi-site exp's)
      let newSite;
      if (!isMultiSite) {
        const siteInfo = new Site({
          name: "Default Site",
          shortName: "SITE",
        });
        newSite = await siteInfo.save();

        experimentDraftDoc.sites = [new mongoose.Types.ObjectId(newSite._id)];
      }

      // Add collaborators to experiment
      if (collaborators) {
        experimentDraftDoc.collaborators = collaborators.map(
          (collaborator) => ({
            user: collaborator.user.id,
            permissionRole: collaborator.permissionRole || "Member",
          })
        );
      }

      // Save draft
      let newExperimentDraft = await experimentDraftDoc.save();

      // Update default site's parent experiment, if pertinent
      if (!isMultiSite) {
        newSite.parentExperiment = new mongoose.Types.ObjectId(
          newExperimentDraft._id
        );
        await newSite.save();
      }

      res
        .status(201)
        .json({ success: true, experimentDraft, _id: newExperimentDraft._id });
      return;
    } catch (error) {
      console.error("Error creating experiment draft: ", error);
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
 * @route   PATCH  api/experiments/draft/:experimentId
 * @desc    Patches a draft experiment; requires collaborator admin access
 * @returns {200} - Experiment updated
 * @returns {400} - Bad request, missing fields
 * @returns {401} - Unauthorized, user is not creator of experiment
 * @returns {404} - Experiment not found
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/draft/:experimentId",
  uploadFields,
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    // Get info from body

    console.log("Request Body Data: ", req.body);
    console.log("Request Files: ", req.files);

    // Create Empty ExperimentInfo object to add the parsed experiment data in
    let experimentDraftInfo;
    let experimentId = req.params.experimentId;

    try {
      // The Experiment Info is sent as a JSON String field, so parse it first:
      experimentDraftInfo = JSON.parse(req.body.experimentInfo || "{}");
    } catch (err) {
      res.status(400).json(errRes("Invalid JSON"));
      return;
    }

    // Set Logged in User ID to Variable
    let userId = req.user.id;

    // Destructure Experiment Info that is not a file
    let {
      name,
      description,
      irbProtocolNumber,
      irbEmailAddress,
      collaborators,
      removeIrbLetter,
      isMultiSite,
      conditions,
    } = experimentDraftInfo;

    // Set uploaded files to variables
    let irbLetterBuffer = "";
    let irbLetterName = "";

    if (req.files["irbLetter"]) {
      let irbLetter = req.files["irbLetter"][0];
      // Check if file is a pdf
      if (irbLetter.mimetype !== "application/pdf") {
        res.status(401).json(errRes("Can only upload a pdf file"));
      }
      // Check file size
      if (irbLetter.size >= 5e7) {
        res.status(401).json(errRes("IRB Letter cannot be greater then 50mb"));
      }

      // Set IRB Letter's data to a variable
      irbLetterBuffer = irbLetter.buffer;
      let irbLetterOriginalName = irbLetter.originalname.split(".");
      irbLetterName = irbLetterOriginalName[0];
      console.log("IRB Letter Buffer: ", irbLetterBuffer);
    }

    // Validate at least one field to update
    if (
      !name &&
      !description &&
      !irbProtocolNumber &&
      !irbEmailAddress &&
      !collaborators &&
      !irbLetterBuffer &&
      isMultiSite !== undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "At least one field (name, description, irbProtocolNumber, irbEmailAddress, irbLetter, isMultiSite) must be provided to update",
      });
      return;
    }

    try {
      // Find the experiment
      const experimentDraft = await Experiment.findById(experimentId);

      // Validate experiment exists and caller is creator
      if (!experimentDraft) {
        res
          .status(404)
          .json({ success: false, message: "Experiment not found" });
        return;
      }
      if (experimentDraft.createdBy.toString() != userId) {
        res.status(401).json({
          success: false,
          message: "Cannot edit experiment draft if you are not the creator",
        });
        return;
      }

      // If patching name, ensure new name doesn't already exist

      if (name && name != experimentDraft.name) {
        let existingExperimentDraft = await Experiment.findOne({
          name: name,
        });
        if (existingExperimentDraft) {
          res.status(409).json({
            success: false,
            message: "Experiment Draft with this name already exists",
          });
          return;
        }
      }

      // Update experiment with new info
      if (name) {
        experimentDraft.name = name;
      }
      if (description) {
        experimentDraft.description = description;
      }
      if (irbProtocolNumber) {
        experimentDraft.irbProtocolNumber = irbProtocolNumber;
      }
      if (irbEmailAddress) {
        experimentDraft.irbEmailAddress = irbEmailAddress;
      }
      if (collaborators) {
        // Process collaborators to handle both legacy email strings and new object format
        let processedCollaborators = [];
        let invalidCollaborators = [];

        for (let i = 0; i < collaborators.length; i++) {
          // Handle both string emails and collaborator objects with email and permissionRole
          let collaboratorEmail, permissionRole;

          if (typeof collaborators[i] === "string") {
            collaboratorEmail = collaborators[i];
            permissionRole = "Member"; // Default permission role
          } else if (typeof collaborators[i] === "object") {
            collaboratorEmail =
              collaborators[i].email || collaborators[i].userEmail;
            permissionRole = collaborators[i].permissionRole || "Member";
          } else {
            continue; // Skip invalid collaborator entries
          }

          const collaborator = await User.findOne({ email: collaboratorEmail });
          if (collaborator) {
            if (userId === collaborator.id) {
              // Cannot add self as collaborator, ignore this one
              continue;
            }
            processedCollaborators.push({
              user: collaborator.id,
              permissionRole: permissionRole as
                | "Admin"
                | "Developer"
                | "Member",
            });
          } else {
            console.error(
              `Collaborator with email ${collaboratorEmail} not found`
            );
            invalidCollaborators.push(collaboratorEmail);
          }
        }

        // Only update if we have valid collaborators or if the array should be empty
        experimentDraft.collaborators = processedCollaborators;

        // Note: Unlike creation routes, we don't fail on invalid collaborators in updates
        // We just log them and continue with valid ones
        if (invalidCollaborators.length > 0) {
          console.warn(
            `Invalid collaborators found during update: ${invalidCollaborators.join(
              ", "
            )}`
          );
        }
      }
      if (irbLetterName) {
        experimentDraft.irbLetterName = irbLetterName;
      }
      if (irbLetterBuffer) {
        experimentDraft.irbLetter = Buffer.from(irbLetterBuffer); // Convert IRBLetter file that was converted to a string back to a buffer to store in database
      }

      if (!irbLetterBuffer && removeIrbLetter) {
        experimentDraft.irbLetter = Buffer.from("");
      }

      if (isMultiSite !== undefined) {
        experimentDraft.isMultiSite = isMultiSite;
      }
      if (Array.isArray(conditions)) {
        experimentDraft.conditions = conditions;
      }

      // Set Experiment as draft
      experimentDraft.draft = true;

      console.log("Saving Updated Experiment");
      // Save updated experiment
      await experimentDraft
        .save()
        .then((updatedExperiment) => {
          res.status(200).json({ success: true, updatedExperiment });
          return;
        })
        .catch((error) => {
          res.status(500).json({
            success: false,
            message: "Failed to save the experiment draft",
          });
          return;
        });
    } catch (error) {
      // General server error catch
      console.error(
        `Error updating experiment with ID ${experimentId}:`,
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
 * @route   GET  api/experiments/:experimentId
 * @desc    Get an experiment by ID; requires collaborator access
 * @returns {200} - Experiment found, returns experiment
 * @returns {400} - Invalid or missing experiment ID
 * @returns {404} - No experiment found by given ID
 * @returns {401} - Caller does not own this experiment
 * @returns {500} - Internal server error error
 * @access  private
 */
router.get(
  "/:experimentId",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (req, res) => {
    // Get info from params
    let experimentId = req.params.experimentId;
    let userId = req.user.id;

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experimentDocument = await Experiment.findById(experimentId)
        .populate("sites")
        .populate({
          path: "collaborators.user",
          populate: [{ path: "institution" }, { path: "lab" }],
        });

      // Ensure experiment exists
      if (!experimentDocument) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Convert Experiment Mongoose document to an object in order to extend the object by adding filetypes to it.
      let experimentObject = experimentDocument.toObject();

      //console.log("Experiment Object: ", experimentObject)

      // Fetch File Types
      const fileTypes = await FileType.find({ experimentId: experimentId });

      let fileTypesObject = [];

      for (const fileType of fileTypes) {
        let fileTypeObject = fileType.toObject();
        fileTypesObject.push(fileTypeObject);
      }

      experimentObject["fileTypes"] = fileTypesObject;

      // Ensure conditions are included in the response
      // (If using toObject, conditions should already be present, but this makes it explicit)
      if (!experimentObject.conditions) {
        experimentObject.conditions = experimentDocument.conditions || [];
      }

      let experiment = experimentObject;

      // Return found experiment
      console.log(experiment);
      res.json({ success: true, experiment });
      return;
    } catch (error) {
      // General server error catch
      console.error(`Error getting experiment with ID ${experimentId}:`, error);
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
 * @route   GET  api/experiments/:experimentId/filetypes
 * @desc    Gets all File Types for an experiment; requires collaborator access
 * @returns {400} - Bad request, missing fields
 * @returns {401} - Unauthorized User
 * @returns {404} - Collaborators not found by email
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @returns {200} - fetched filetypes
 * @access  private
 */
router.get(
  "/:experimentId/filetypes",
  passport.authenticate(["jwt", "unity-user-token"], { session: false }),
  requireExperimentMember,
  async (req, res) => {
    const experimentId = req.params.experimentId;
    const userId = req.user.id;

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Searching and Populating Nested Schemas Source: https://www.slingacademy.com/article/mongoose-defining-schema-nested-objects/
      // Referecing and Populating: https://mongoosejs.com/docs/populate.html

      // Get all file types that belong to an experiment
      await FileType.find({ experimentId: experimentId })
        .populate({
          path: "columnDefinition",
          strictPopulate: false,
          populate: {
            path: "columns",
            model: "columns",
            strictPopulate: false,
          },
        })
        .then((fileTypes) => {
          res.status(200).json({ success: true, fileTypes });
          return;
        });
    } catch (error) {
      // General server error catch
      console.error(`Error getting file types for experiment:`, error);
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
 * @route   GET  api/experiments/filetype/:filetypeid
 * @desc    Gets a file type by ID
 * @returns {400} - Bad request, invalid ID
 * @returns {404} - File type not found
 * @returns {500} - Internal server error
 * @returns {200} - Success, returns file type
 * @access  private
 */
router.get(
  "/filetype/:filetypeid",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const fileTypeId = req.params.filetypeid;

    try {
      // Validate file type ID
      if (!fileTypeId || !mongoose.Types.ObjectId.isValid(fileTypeId)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid or missing file type ID" });
        return;
      }

      // Get file type
      const fileType = await FileType.findById(fileTypeId).populate(
        "columnDefinition"
      );
      if (!fileType) {
        res
          .status(404)
          .json({ success: false, message: "File type not found by given ID" });
        return;
      }

      res.status(200).json({ success: true, fileType });
      return;
    } catch (error) {
      // General server error catch
      console.error("Error fetching file type by ID: ", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
    }
  }
);

/**
 * @route   POST  api/experiments/:experimentid/filetype
 * @desc    Creates a new filetype; requires collaborator admin access
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Experiment not found
 * @returns {500} - Internal server error
 * @returns {201} - Experiment created
 * @access  private
 */
router.post(
  "/:experimentId/filetype",
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    const experimentId = req.params.experimentId;
    let { name, extension, description, columnDefinition } = req.body;

    // Check if required fields are present
    if (!name) {
      res.status(400).json({
        success: false,
        message: errRes("File type name is required"),
      });
      return;
    }

    if (!extension) {
      res.status(400).json({
        success: false,
        message: errRes("File type extension is required"),
      });
      return;
    }

    if (!description) {
      res.status(400).json({
        success: false,
        message: errRes("File type description is required"),
      });
      return;
    }

    try {
      // Ensure experiment does not already exist by this name
      const oldFileType = await FileType.findOne({
        name: name,
        experimentId: experimentId,
      });
      if (oldFileType) {
        res.status(409).json({
          success: false,
          message: errRes("File type already exists for this experiment"),
        });
        return;
      }

      // Create the new file type
      const newFileType = new FileType({
        name: name,
        experimentId: experimentId,
        extension: extension,
        description: description,
      });

      await newFileType.save();

      // If a column definition is provided, create it and add it to the file type
      if (columnDefinition !== undefined) {
        // Create empty column definition
        const columnDefInfo = new ColumnDefinition({
          fileTypeId: newFileType._id,
          columns: [],
        });

        let newColumnDef = await columnDefInfo.save();

        // Create columns from request body
        if (columnDefinition.columns) {
          for (let col of columnDefinition.columns) {
            const { name, description, dataType, transform } = col;

            const columnInfo = new Column({
              columnDefinitionId: newColumnDef._id,
              name,
              description,
              dataType,
              transform,
              order: newColumnDef.columns.length + 1,
            });

            const newColumn = await columnInfo.save();
            newColumnDef.columns.push(newColumn._id);
          }
        }

        // Finalize new column definition
        newColumnDef = await columnDefInfo.save();

        // Update file type with new column definition
        newFileType.columnDefinition = newColumnDef.id;
        await newFileType.save();
      }

      res.status(200).json({ success: true, fileType: newFileType });
      return;
    } catch (error) {
      // General server error catch
      console.error(`Error creating new file type`, error);
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
 * @route   PATCH  api/experiments/filetype/:fileTypeId
 * @desc    Updates a filetype; requires collaborator admin access
 * @returns {200} - filetype updated
 * @returns {400} - Bad request, missing fields
 * @returns {401} - Unauthorized, user is not creator of experiment
 * @returns {404} - filetype not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/filetype/:fileTypeId",
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    const fileTypeId = req.params.fileTypeId;
    const { name, extension, description, columnDefinition } = req.body;

    try {
      // Check if FileType exists before patching
      let existingFileType = await FileType.findById(fileTypeId);
      if (!existingFileType) {
        res.status(404).json({
          success: false,
          message: errRes("File type does not exist for experiment"),
        });
        return;
      }

      // Update file type with new info
      let fileTypeObj = {};
      if (name) fileTypeObj["name"] = name;
      if (extension) fileTypeObj["extension"] = extension;
      if (description) fileTypeObj["description"] = description;

      // If a column definition is provided, ensure it exists before adding it to the file type
      if (columnDefinition !== undefined && columnDefinition !== "") {
        const columnDef = await ColumnDefinition.findById(columnDefinition);
        if (!columnDef) {
          res.status(404).json({
            success: false,
            message: errRes("Column definition not found by given ID"),
          });
          return;
        }

        fileTypeObj["columnDefinition"] = columnDefinition;
      }

      // Update the file type
      const fileTypeRes = await FileType.findByIdAndUpdate(
        fileTypeId,
        fileTypeObj
      );
      console.log("File Type Updated");
      res.status(200).json({
        success: true,
        message: "File Type Updated",
        fileType: fileTypeRes,
      });
    } catch (error) {
      console.error("Error while patching File Type: ", error);
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
 * @route   DELETE  api/experiments/:experimentId/filetype/:filetypeId
 * @desc    deletes a filetype and all associated files that contain that filetype; requires collaborator admin access
 * @returns {200} - filetype deleted
 * @returns {400} - Bad request, missing fields
 * @returns {401} - Unauthorized, user is not creator of experiment
 * @returns {404} - filetype not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:experimentId/filetype/:fileTypeId",
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    // Get FileType ID from request
    const { experimentId, fileTypeId } = req.params;
    const userId = req.user.id;

    console.log("FileTypeID: ", fileTypeId);

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Find File Type by ID
      const fileType = await FileType.findById(fileTypeId);
      if (!fileType) {
        res.status(404).json({
          success: false,
          message: "File Type by provided ID could not be found in database.",
        });
        return;
      }

      // delete all Files with the fileTypeID
      await File.deleteMany({ fileTypeId: fileTypeId });

      // Delete column definition, if applicable
      if (fileType.columnDefinition) {
        // Get the column definition and delete all of its columns
        const columnDef = await ColumnDefinition.findById(
          fileType.columnDefinition
        );
        if (columnDef) {
          await ColumnDefinition.deleteMany({
            _id: { $in: columnDef.columns },
          });
        }
        // Delete the actual column def
        await ColumnDefinition.deleteOne({ _id: fileType.columnDefinition });
      }

      // Delete the file type
      await FileType.deleteOne({ _id: fileTypeId });
      res.status(200).json({
        success: true,
        message: `File Type deleted with the file ID: ${fileTypeId}`,
      });
    } catch (error) {
      // General server error catch
      console.error("Error deleting FileType by ID: ", error);
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
 * @route   GET  api/experiments/:experimentId/filetype/:fileTypeId/files
 * @desc    Gets all fileIDs and their corresponding filetype that belong to an experiment.
 *            DOESN'T get the actual file data as this is too heavy.
 *            Requires collaborator access.
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Collaborators not found by email
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @returns {201} - Experiment created
 * @access  private
 */
router.get(
  "/:experimentId/filetype/:fileTypeId/files",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (req, res) => {
    const experimentId = req.params.experimentId;
    const userId = req.user.id;
    const fileTypeId = req.params.fileTypeId;

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Check if FileTypeId exists:
      const fileType = await FileType.findById(fileTypeId);

      if (!fileType) {
        res
          .status(404)
          .json({ success: false, message: "No FileType found by given ID" });
        return;
      }

      // Searching and Populating Nested Schemas Source: https://www.slingacademy.com/article/mongoose-defining-schema-nested-objects/
      // Referecing and Populating: https://mongoosejs.com/docs/populate.html

      // Get all files that belong
      await File.find({ fileType: fileTypeId })
        .select("_id")
        .then((files) => {
          res.status(200).json({ success: true, files });
          return;
        });
    } catch (error) {
      // General server error catch
      console.error(`Error getting files for experiment:`, error);
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
 * @route   GET  api/experiments/:experimentId/zip
 * @desc    Gets all participant logs for an experiment and zips them into a single file
 *            NOTE: Not currently active; included for reference and future use.
 * @returns {200} - Returns zip file of all participant logs
 * @returns {400} - Invalid or missing file
 * @returns {500} - Internal server error
 * @access  private
 */
/*
router.get(
  "/:experimentId/zip",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      console.log(
        "Getting all participant logs for experiment " + req.params.experimentId
      );

      // Ensure experiment exists
      const experiment = await Experiment.findById(req.params.experimentId);
      if (!experiment) {
        res.status(404).json({
          success: false,
          message: "Experiment not found by given ID.",
        });
        return;
      }

      // Get all participants in experiment
      const participants = await Participant.find({
        experimentId: req.params.experimentId,
      });

      // Get all logs for each participant
      const logsPromises = participants.map((participant: IParticipant) =>
        Log.find({ participant: participant._id })
      );
      const allLogs = await Promise.all(logsPromises);

      // Flatten the array of arrays
      const logs = allLogs.flat();

      // Create a temporary directory to store the log files
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
      }

      // Write each log to a file in the temporary directory
      logs.forEach((log) => {
        const logData = JSON.stringify(log);
        const logFilePath = path.join(
          tmpDir,
          `${log.participant}-${log.ts}.json`
        );
        fs.writeFileSync(logFilePath, logData);
      });

      // Create the zip file
      const zipFilePath = path.join(tmpDir, "logs.zip");
      // await zip(tmpDir, zipFilePath)

      // Stream the zip file to the client
      res.setHeader("Content-Disposition", "attachment; filename=logs.zip");
      res.setHeader("Content-Type", "application/zip");
      const fileStream = fs.createReadStream(zipFilePath);
      fileStream.pipe(res);

      // Clean up temporary files
      fileStream.on("end", () => {
        fs.readdir(tmpDir, (err, files) => {
          if (err) throw err;
          for (const file of files) {
            fs.unlink(path.join(tmpDir, file), (err) => {
              if (err) throw err;
            });
          }
        });
      });
    } catch (error) {
      console.error("Error creating experiment: ", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error,
      });
      return;
    }
  }
);*/

/**
 * @route   GET  api/experiments/:experimentId/participants/:participantId/filesize
 * @desc    Gets the size of all files associated with a participant; requires collaborator access
 * @returns {200} - Returns total file size
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/participants/:participantId/filesize",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (
    req: Request<{ experimentId: string; participantId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { experimentId, participantId } = req.params;

      const totalSizeResult = await File.aggregate([
        {
          $lookup: {
            from: "filetypes",
            localField: "fileType",
            foreignField: "_id",
            as: "fileTypeDoc",
          },
        },
        { $unwind: "$fileTypeDoc" },
        {
          $match: {
            "fileTypeDoc.experimentId": new mongoose.Types.ObjectId(
              experimentId
            ),
            participantUID: participantId,
            isActive: true, // Only count active files to avoid double-counting versions
          },
        },
        {
          $group: { _id: null, totalSize: { $sum: "$size" } },
        },
      ]);

      const totalSize =
        totalSizeResult.length > 0 ? totalSizeResult[0].totalSize : 0;

      res.status(200).json({
        participantId,
        totalSize,
      });
    } catch (error) {
      console.error("Error fetching file size:", error);
      const errorMessage = (error as Error).message || "Unknown error occurred";
      res
        .status(500)
        .json({ error: `Failed to fetch file size - ${errorMessage}` });
    }
  }
);

/**
 * @route   GET /api/experiments/:experimentId/participants/:participantId/combinedfilesize
 * @desc    Sums the size of logs (BSON) and uploaded files for a participant; requires collaborator access
 * @returns {200} - totalSize
 * @returns {404} - participant not found
 * @returns {500} - server error
 * @access  private
 */
router.get(
  "/:experimentId/participants/:participantId/combinedfilesize",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (
    req: Request<{ experimentId: string; participantId: string }>,
    res: Response
  ) => {
    try {
      const { experimentId, participantId } = req.params;

      const participantDoc = await Participant.findOne({
        uid: participantId,
        experimentId: experimentId,
      });
      if (!participantDoc) {
        res
          .status(404)
          .json({ error: "Participant not found in this experiment." });
        return;
      }

      const logs = await Log.find({ participant: participantId }).lean();
      let logsSize = 0;
      for (const logDoc of logs) {
        logsSize += BSON.calculateObjectSize(logDoc);
      }

      const filesSizeResult = await File.aggregate([
        {
          $lookup: {
            from: "filetypes",
            localField: "fileType",
            foreignField: "_id",
            as: "fileTypeDoc",
          },
        },
        { $unwind: "$fileTypeDoc" },
        {
          $match: {
            "fileTypeDoc.experimentId": new mongoose.Types.ObjectId(
              experimentId
            ),
            participantUID: participantId,
            isActive: true, // Only count active files to avoid double-counting versions
          },
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: "$size" },
          },
        },
      ]);
      const filesSize =
        filesSizeResult.length > 0 ? filesSizeResult[0].totalSize : 0;

      const totalSize = logsSize + filesSize;

      res.status(200).json({
        participantId,
        logsSize,
        filesSize,
        totalSize,
      });
      return;
    } catch (error) {
      console.error("Error fetching combined file size:", error);
      const errorMessage = (error as Error).message || "Unknown error occurred";

      res.status(500).json({
        error: `Failed to fetch combined file size - ${errorMessage}`,
      });
      return;
    }
  }
);

/**
 * @route   GET  api/experiments/:experimentid/participants
 * @desc    Gets all participants in an experiment; requires collaborator access
 * @returns {200} - Participants found
 * @returns {400} - Invalid or missing experiment ID
 * @returns {401} - Caller does not own this experiment
 * @returns {404} - Experiment by ID not found created by caller
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/participants",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (req, res) => {
    // Get info from body
    let experimentId = req.params.experimentId;
    let userId = req.user.id;

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Get all participants in the experiment
      Participant.find({ experimentId: experimentId })
        .populate("site")
        .then((participants) => {
          res.status(200).json({ success: true, participants });
          return;
        });
    } catch (error) {
      // General server error catch
      console.error(`Error getting participants for experiment:`, error);
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
 * @route   GET  api/experiments/:experimentid/sites
 * @desc    Gets all sites for given experiment; requires collaborator access
 * @returns {200} - Returns sites (nothing if it is not a multi-site experiment)
 * @returns {400} - Invalid or missing experiment ID
 * @returns {404} - Experiment by ID not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/sites",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (req, res) => {
    // Get info from params
    let experimentId = req.params.experimentId;

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // If the site is not multi-site, there are no sites to return
      if (!experiment.isMultiSite) {
        res.status(200).json({ success: true, sites: [] });
        return;
      }

      // Get all sites in the experiment
      const sites = experiment.sites;
      Site.find({ _id: { $in: sites } }).then((sites) => {
        res.status(200).json({ success: true, sites });
        return;
      });
    } catch (error) {
      // General server error catch
      console.error(`Error getting participants for experiment:`, error);
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
 * @route   DELETE  api/experiments/:experimentId
 * @desc    deletes experiment by ID, and all associated participants and sites; requires user to be creator of the experiment
 * @returns {204} - Experiment deleted
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:experimentId",
  passport.authenticate("jwt", { session: false }),
  requireExperimentCreator,
  (req, res) => {
    // Get info from body
    let experimentId = req.params.experimentId;
    let userId = req.user.id;

    try {
      // Delete all sites associated with the experiment
      Site.deleteMany({ parentExperiment: experimentId }).then(() => {
        // Call delete method
        deleteMethods2
          .deleteExperiment(experimentId, userId, req.serverConfig)
          .then(async (retVal) => {
            // Delete the WebXR directory for the experiment if it exists
            const webXrDir = path.resolve("/usr/uploads", "webxr");
            const destPath = path.join(webXrDir, experimentId);

            // Remove old webxr directory if it exists, and create a new one
            await fsPromises.rm(destPath, { recursive: true, force: true });
            res.status(204).json({ retVal, deletedExperimentId: experimentId });
            return;
          });
      });
    } catch (error) {
      // General server error catch
      console.error(`Error deleting experiment:`, error);
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
 * @route   GET  api/experiments/:experimentId/userPermissions
 * @desc    Get the current user's experiment permission level for an experiment
 * @returns {200} - Success, returns permission level
 * @returns {400} - Invalid or missing experiment ID
 * @returns {404} - Experiment not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/userPermissions",
  passport.authenticate(["jwt", "unity-user-token"], { session: false }),
  async (req, res) => {
    try {
      const experimentId = req.params.experimentId;
      const userId = req.user.id;

      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Check if user is the creator
      if (experiment.createdBy.toString() === userId) {
        res.status(200).json({
          success: true,
          permissionRole: "Creator",
          isCreator: true,
        });
        return;
      }

      // Find the user's collaborator role
      const collaborator = experiment.collaborators.find(
        (collab) => collab.user.toString() === userId
      );

      if (!collaborator) {
        res.status(200).json({
          success: true,
          permissionRole: "Unauthorized",
          isCreator: false,
        });
        return;
      }

      res.status(200).json({
        success: true,
        permissionRole: collaborator.permissionRole,
        isCreator: false,
      });
      return;
    } catch (error) {
      console.error(
        `Error getting collaborator permissions for experiment:`,
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
 * @route   GET  api/experiments/:experimentId/collaborators
 * @desc    get all collaborators for Experiment; requires collaborator access
 * @returns {200} - Collaborators found
 * @returns {400} - Invalid or missing experiment ID
 * @returns {404} - Experiment not found
 * @returns {401} - Caller does not own this experiment
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/collaborators",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async (req, res) => {
    // Get info from body
    let experimentId = req.params.experimentId;
    let userId = req.user.id;

    try {
      // Validate experimentId
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find experiment by ID
      const experiment = await Experiment.findById(experimentId);

      // Ensure experiment exists
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Get an array of user IDs from the experiment collaborators
      const userArray = experiment.collaborators.map((collaborator) =>
        collaborator.user.toString()
      );

      // send back an array of users with their permission roles
      User.find({ _id: { $in: userArray } }).then((users) => {
        // remove password field from all objects and add permission roles
        const collaborators = users.map((oneUser) => {
          const collaboratorInfo = experiment.collaborators.find(
            (collab) => collab.user.toString() === oneUser._id.toString()
          );

          oneUser.password = undefined;
          oneUser.date = undefined;

          return {
            ...oneUser.toObject(),
            permissionRole: collaboratorInfo?.permissionRole || "Member",
          };
        });

        res.status(200).json({ success: true, collaborators: collaborators });
        return;
      });
    } catch (error) {
      // General server error catch
      console.error(`Error getting collaborators for experiment:`, error);
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
 * @route   POST  api/experiments/:experimentId/collaborators
 * @desc    Add a new collaborator to an experiment; requires collaborator admin access
 * @returns {200} - Collaborator added
 * @returns {400} - Invalid or missing experiment ID or user ID
 * @returns {404} - Experiment not found
 * @returns {401} - Caller does not own this experiment
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:experimentId/collaborators",
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    // Extract info from request
    const experimentId = req.params.experimentId;
    const userEmail = req.body.userEmail; // ID of user to add as collaborator
    let permissionRole = req.body.permissionRole; // Permission level for the collaborator
    const userId = req.user.id;

    try {
      if (!permissionRole) permissionRole = "Member"; // Default permission level if not provided

      // Validate experiment ID
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Validate collaborator email
      if (!userEmail) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing collaborator email",
        });
        return;
      }

      // Find the experiment
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Find collaborator in users
      const collaborator = await User.findOne({ email: userEmail });
      if (!collaborator) {
        res.status(404).json({
          success: false,
          message: "Collaborator not found by given email",
        });
        return;
      }

      // Ensure we are not adding owner to collaborators
      if (
        collaborator.id.toString() === userId ||
        collaborator.id.toString() === experiment.createdBy.toString()
      ) {
        res.status(400).json({
          success: false,
          message: "Cannot add self (or creator) as collaborator",
        });
        return;
      }

      // Check if this user is already a collaborator
      if (
        experiment.collaborators.some(
          (uid) => uid.toString() === collaborator.id.toString()
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Collaborator already added to this experiment",
        });
        return;
      }

      // Add the collaborator with permission role
      experiment.collaborators.push({
        user: collaborator.id,
        permissionRole: permissionRole,
      });
      await experiment.save();

      res.status(200).json({
        success: true,
        message: "Collaborator added successfully",
        collaborator,
      });
      return;
    } catch (error) {
      // General server error catch
      console.error(`Error adding collaborator to experiment:`, error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
      return;
    }
  }
);

/**
 * @route   PUT  api/experiments/:experimentId/collaborators
 * @desc    Consolidates collaborators of an experiment accoring to incoming body; requires collaborator admin access
 * @returns {200} - Collaborators updated
 * @returns {400} - Missing or invalid request parameters
 * @returns {401} - Caller does not own this experiment or is not a collaborator
 * @returns {404} - Experiment not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.put(
  "/:experimentId/collaborators",
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    // Extract info from request
    const experimentId = req.params.experimentId;
    const userId = req.user.id;
    const collaborators = req.body.collaborators; // Array of collaborator objects with userId and permissionRole

    try {
      // Validate experiment ID
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find the experiment
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Get the list of existing collaborator user IDs from the experiment, then get the ones we need to add or remove
      const existingCollaborators = experiment.collaborators.map(
        (collaborator) => collaborator.user.toString()
      );

      // Extract user IDs from incoming collaborators for comparison
      const incomingCollaboratorIds = collaborators.map((collab) =>
        typeof collab === "string" ? collab : collab.user.id
      );

      const collaboratorsToAdd = incomingCollaboratorIds.filter(
        (collaboratorId) => !existingCollaborators.includes(collaboratorId)
      );

      let indexOfCaller = collaboratorsToAdd.indexOf(userId);
      if (indexOfCaller > -1) {
        collaboratorsToAdd.splice(indexOfCaller, 1); // Shouldn't "add" self as collaborator
      }

      const collaboratorsToRemove = existingCollaborators.filter(
        (collaboratorId) => !incomingCollaboratorIds.includes(collaboratorId)
      );

      indexOfCaller = collaboratorsToRemove.indexOf(userId);
      if (indexOfCaller > -1) {
        collaboratorsToRemove.splice(indexOfCaller, 1); // Shouldn't "remove" self as collaborator
      }

      // Update existing collaborators' permission roles if they've changed
      for (const existingCollab of experiment.collaborators) {
        const incomingCollab = collaborators.find((collab) => {
          const collabId = typeof collab === "string" ? collab : collab.user.id;
          return collabId === existingCollab.user.toString();
        });

        if (
          incomingCollab &&
          typeof incomingCollab === "object" &&
          incomingCollab.permissionRole
        ) {
          existingCollab.permissionRole = incomingCollab.permissionRole;
        }
      }

      // Remove collaborators that are no longer in the list
      if (collaboratorsToRemove.length > 0) {
        experiment.collaborators = experiment.collaborators.filter(
          (collaborator) =>
            !collaboratorsToRemove.includes(collaborator.user.toString())
        );
      }

      // Add new collaborators
      if (collaboratorsToAdd.length > 0) {
        // Only get collaborators who are users
        const newCollaborators = await User.find({
          _id: { $in: collaboratorsToAdd },
        });

        // Map new collaborators with their permission roles
        const newCollaboratorObjects = newCollaborators.map((user) => {
          const incomingCollab = collaborators.find((collab) => {
            const collabId =
              typeof collab === "string" ? collab : collab.user.id;
            return collabId === user.id.toString();
          });

          const permissionRole =
            typeof incomingCollab === "object" && incomingCollab.permissionRole
              ? incomingCollab.permissionRole
              : ("Member" as const);

          return {
            user: user.id,
            permissionRole,
          };
        });

        experiment.collaborators.push(...newCollaboratorObjects);
      }

      // Save the updated experiment
      await experiment.save();
      res.status(200).json({
        success: true,
        message: "Collaborators consolidated successfully",
        collaborators: experiment.collaborators,
      });
      return;
    } catch (error) {
      // General server error catch
      console.error(`Error consolidating collaborators in experiment:`, error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
      return;
    }
  }
);

/**
 * @route   POST  api/experiments/:experimentId/sites
 * @desc    Add a new site to an experiment; requires collaborator admin access
 * @returns {200} - Site added
 * @returns {400} - Invalid or missing site ID
 * @returns {404} - Experiment not found
 * @returns {401} - Caller does not own this experiment
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:experimentId/sites",
  passport.authenticate("jwt", { session: false }),
  requireExperimentAdmin,
  async (req, res) => {
    // Extract info from request
    const experimentId = req.params.experimentId;
    const siteId = req.body.siteId;
    const userId = req.user.id;

    try {
      // Validate experiment ID
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Validate site ID
      if (!siteId || !mongoose.Types.ObjectId.isValid(siteId)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid or missing site ID" });
        return;
      }

      // Find the experiment
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Find site
      const site = await Site.findById(siteId);
      if (!site) {
        res
          .status(404)
          .json({ success: false, message: "Site not found by given ID" });
        return;
      }

      // Check if this site is already in this experiment
      if (
        experiment.sites.some((uid) => uid.toString() === site.id.toString())
      ) {
        res.status(400).json({
          success: false,
          message: "Site already added to this experiment",
        });
        return;
      }

      // Add the Site
      experiment.sites.push(site.id);
      await experiment.save();

      res
        .status(200)
        .json({ success: true, message: "Site added successfully", site });
      return;
    } catch (error) {
      // General server error catch
      console.error(`Error adding site to experiment:`, error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
      return;
    }
  }
);

/**
 * @route   DELETE  api/experiments/:experimentId/collaborators/:collaboratorId
 * @desc    Remove a collaborator from an experiment; requires creator access
 * @returns {200} - Collaborator deleted
 * @returns {400} - Invalid or missing experiment ID or collaborator ID
 * @returns {404} - Experiment not found
 * @returns {401} - Caller does not own this experiment
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:experimentId/collaborators/:collaboratorId",
  passport.authenticate("jwt", { session: false }),
  requireExperimentCreator,
  async (req, res) => {
    // Extract info from request
    const experimentId = req.params.experimentId;
    const collaboratorId = req.params.collaboratorId;
    const userId = req.user.id;

    try {
      // Validate experiment ID
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Validate collaborator ID
      if (!collaboratorId || !mongoose.Types.ObjectId.isValid(collaboratorId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing collaborator ID",
        });
        return;
      }

      // Find the experiment
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found by given ID" });
        return;
      }

      // Check if this user is a collaborator
      if (
        !experiment.collaborators.some(
          (uid) => uid.toString() === collaboratorId
        )
      ) {
        res.status(404).json({
          success: false,
          message: "Given collaborator ID not found in this experiment",
        });
        return;
      }

      // Remove collaborator
      const userIndex = experiment.collaborators.findIndex(
        (uid) => uid.toString() === collaboratorId
      );

      experiment.collaborators.splice(userIndex, 1);
      await experiment.save();

      res
        .status(200)
        .json({ success: true, message: "Collaborator removed successfully" });
      return;
    } catch (error) {
      // General server error catch
      console.error(`Error removing collaborator from experiment:`, error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error", error });
      return;
    }
  }
);

/**
 * @route   GET api/experiments/
 * @desc    Gets all experiments, which the caller created or is a collaborator of.
 * @returns {200} - Success, returns experiments
 * @returns {500} - Server Error, returns error
 * @access  private
 */
router.get(
  "/",
  passport.authenticate(["jwt", "unity-user-token"], { session: false }),
  async (req, res) => {
    try {
      const callerId = req.user.id;

      // Get the authentication strategy used
      const authStrategy = (req.user as any).authStrategy || "unknown";

      let experiments;

      // If anything besides the jwt token was used, then when searching for experiments, mongoose will filter out any experiments that are drafts
      if (authStrategy == "jwt") {
        // Get experiments from database created by caller, or where caller is a collaborator and also allow for draft experiments to show
        experiments = await Experiment.find({
          $or: [{ createdBy: callerId }, { "collaborators.user": callerId }],
        }).populate("sites");
      } else {
        // If the Unity client or any other client is searching for experiment, do not return draft experiments
        // Search for all experiments created by caller or collaborator and which is not a draft
        experiments = await Experiment.find({
          $and: [
            { draft: false }, // Should not be a draft
            {
              $or: [
                { createdBy: callerId },
                { "collaborators.user": callerId },
              ],
            },
          ],
        }).populate("sites");
      }
      let allExperimentsObject = [];

      // Have to convert mongoose documents to an object in order to extend the object...
      experiments.forEach((experiment) => {
        allExperimentsObject.push(experiment.toObject());
      });

      // Use the for...of loop to handle async operations!!!!
      // Loop through the experiments object and for each experiment, search for all participants that belong to each experiment and add participant data to the Experiment Object
      for (const experiment of allExperimentsObject) {
        const participants = await Participant.find(
          {
            experimentId: experiment._id,
          },
          "state uid"
        );

        let experimentParticipantObject = [];
        // Convert participant to object and push to experimentParticipantObject
        for (const participant of participants) {
          let participantObject = participant.toObject();
          experimentParticipantObject.push(participantObject);
        }
        experiment["participants"] = experimentParticipantObject;

        // Search for files associated with each participant
        const participantUIDs = participants.map((p) => p.uid);
        const files = await File.find({
          participantUID: { $in: participantUIDs },
        });

        console.log(
          `Found ${files.length} files for experiment ${experiment.name}`
        );
        // If files are available, add a flag to the experiment object showing that files are available
        // This is used to show the "Download all files" button on the client side
        files.length > 0
          ? (experiment["hasFiles"] = true)
          : (experiment["hasFiles"] = false);
      }

      // Changing the variable name just so its less buggy to deal with on the clientside
      experiments = allExperimentsObject;

      // Return experiments
      res.status(200).json({ success: true, experiments });
      return;
    } catch (error) {
      // Upon general error, return server error
      console.error(`Error fetching all experiments for caller: `, error);
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
 * @route   GET api/experiments/:experimentId/zip
 * @desc    Download all participant files from an experiment, in formatted folder structure; requires collaborator access
 * @returns {200} - Success, returns zip file of all participant logs and files
 * @returns {404} - Experiment not found or no participants found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/zip",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async function (req, res) {
    try {
      const experimentId = req.params.experimentId;

      console.log("Downloading experiment files as zip...");

      // Get experiment, sites, and participants
      const [experiment, sites, participants] = await Promise.all([
        Experiment.findById(experimentId).select("name isMultiSite").lean(),
        Site.find({ parentExperiment: experimentId })
          .select("shortName")
          .lean(),
        Participant.find({ experimentId }).select("uid site pID").lean(),
      ]);

      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "No experiment found" });
        return;
      }

      if (participants.length == 0) {
        console.log("No participants found");
        res
          .status(404)
          .json({ success: false, message: "No participants found" });
        return;
      }

      // Get files associated with participants
      const files = await File.find({
        participantUID: { $in: participants.map((p) => p.uid) },
        isActive: true, // Only get active files
      })
        .populate("fileType") // Populate fileType to get name and extension
        .populate("uploadedBy", "firstName lastName email")
        .select(
          "participantUID fileType serverLocationFilePath originalFileName version _id uploadedBy uploadedAt"
        );

      console.log(
        `Found ${files.length} files for ${participants.length} participants`
      );

      // Prepare files and participants for easy access
      const filesByParticipant = new Map();
      for (const f of files) {
        const arr = filesByParticipant.get(f.participantUID) || [];
        arr.push(f);
        filesByParticipant.set(f.participantUID, arr);
      }

      const participantsBySite = new Map();
      for (const p of participants) {
        const arr = participantsBySite.get(String(p.site)) || [];
        arr.push(p);
        participantsBySite.set(String(p.site), arr);
      }

      // Prepare the zip to stream back to the client
      const zipName = `${slugify(experiment.name)}.zip`;
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

      const seenNames = new Set();

      // If the experiment is multi-site, we will have a folder for each site
      if (experiment.isMultiSite) {
        for (const site of sites) {
          const siteFolder = slugify(`Site-${site.shortName}`);
          const siteParticipants =
            participantsBySite.get(String(site._id)) || [];
          console.log(
            `Site ${site.shortName}: ${siteParticipants.length} participants`
          );

          for (const part of siteParticipants) {
            const partFolder = slugify(`Participant-${part.pID.toString()}`);
            const partFiles = filesByParticipant.get(part.uid) || [];
            console.log(`Participant ${part.pID}: ${partFiles.length} files`);

            for (const file of partFiles) {
              const fileType = file.fileType;
              const fileName = fileType?.name || "unknown-file";
              const fileExtension = fileType?.extension || "";
              const fullFileName = fileExtension
                ? `${fileName}.${fileExtension}`
                : fileName;

              let entry = `${siteFolder}/${partFolder}/${slugify(
                fullFileName
              )}`;
              // de-duplicate filenames
              let n = 1;
              while (seenNames.has(entry))
                entry = entry.replace(/(\.\w+)?$/, `_${n++}$1`);
              seenNames.add(entry);

              // Get file data from server filesystem instead of MongoDB
              let fileBuffer: Buffer;
              try {
                if (file.serverLocationFilePath) {
                  fileBuffer = await getFileFromServer(
                    file.serverLocationFilePath
                  );
                } else {
                  // Fallback: construct path using parameters
                  fileBuffer = await getFileFromServerByParams(
                    experimentId,
                    String(part.site),
                    part.uid,
                    fileType._id.toString(),
                    file.originalFileName || fullFileName,
                    file.version || 1
                  );
                }
              } catch (fileSystemError) {
                console.error(
                  "Error reading file from server:",
                  fileSystemError
                );

                // Fallback to MongoDB data if server file is not found
                const fileWithData = await File.findById(file._id).select(
                  "data"
                );
                if (fileWithData && fileWithData.data) {
                  console.log(
                    "Falling back to MongoDB data for file:",
                    file._id
                  );
                  fileBuffer = fileWithData.data;

                  // Migrate file to server if binary data is stored on MongoDB
                  try {
                    console.log(
                      `Migrating file to server for participant: ${part.uid}, fileType: ${fileType._id}`
                    );

                    await migrateFileToServer(
                      fileWithData,
                      part.uid,
                      experimentId,
                      fileType._id.toString(),
                      "save"
                    );

                    console.log(
                      `File migration completed successfully for file: ${file._id}`
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
                    file._id
                  );
                  console.error(
                    `Skipping file for participant ${part.uid}, file type ${fileType?.name}`
                  );
                  continue; // Skip this file if no data is available
                }
              }

              archive.append(fileBuffer, { name: entry });
            }
          }
        }
      } else {
        // If the experiment is NOT multi-site, put each participant in a single folder
        for (const part of participants) {
          const partFolder = slugify(`Participant-${part.pID.toString()}`);
          const partFiles = filesByParticipant.get(part.uid) || [];
          console.log(`Participant ${part.pID}: ${partFiles.length} files`);

          for (const file of partFiles) {
            const fileType = file.fileType;
            const fileName = fileType?.name || "unknown-file";
            const fileExtension = fileType?.extension || "";
            const fullFileName = fileExtension
              ? `${fileName}.${fileExtension}`
              : fileName;

            let entry = `${partFolder}/${slugify(fullFileName)}`;
            // de-duplicate filenames
            let n = 1;
            while (seenNames.has(entry))
              entry = entry.replace(/(\.\w+)?$/, `_${n++}$1`);
            seenNames.add(entry);

            // Get file data from server filesystem instead of MongoDB
            let fileBuffer: Buffer;
            try {
              if (file.serverLocationFilePath) {
                fileBuffer = await getFileFromServer(
                  file.serverLocationFilePath
                );
              } else {
                // Fallback: construct path using parameters
                fileBuffer = await getFileFromServerByParams(
                  experimentId,
                  String(part.site),
                  part.uid,
                  fileType._id.toString(),
                  file.originalFileName || fullFileName,
                  file.version || 1
                );
              }
            } catch (fileSystemError) {
              console.error("Error reading file from server:", fileSystemError);

              // Fallback to MongoDB data if server file is not found
              const fileWithData = await File.findById(file._id).select("data");
              if (fileWithData && fileWithData.data) {
                console.log("Falling back to MongoDB data for file:", file._id);
                fileBuffer = fileWithData.data;

                // Migrate file to server if binary data is stored on MongoDB
                try {
                  console.log(
                    `Migrating file to server for participant: ${part.uid}, fileType: ${fileType._id}`
                  );

                  await migrateFileToServer(
                    fileWithData,
                    part.uid,
                    experimentId,
                    fileType._id.toString(),
                    "save"
                  );

                  console.log(
                    `File migration completed successfully for file: ${file._id}`
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
                  file._id
                );
                console.error(
                  `Skipping file for participant ${part.uid}, file type ${fileType?.name}`
                );
                continue; // Skip this file if no data is available
              }
            }

            archive.append(fileBuffer, { name: entry });
          }
        }
      }

      console.log(`Total files processed: ${seenNames.size}`);

      if (seenNames.size === 0) {
        console.log("No files found to add to zip");
        res.status(404).json({
          success: false,
          message: "No files found for this experiment",
        });
        return;
      }

      // Finalize the archive
      await archive.finalize();
      console.log("Archive finalized successfully");
    } catch (err) {
      console.error("Error while downloading experiment: ", err);

      // Check if response was already sent (e.g., zip was streaming)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to Download Experiment",
          error: (err as Error)?.message || "Unknown error",
        });
      }
      return;
    }
  }
);

/**
 * @route   GET api/experiments/:experimentId/authtoken
 * @desc    Gets a unity-build-token for the experiment, which can be used to record data
 *            Creates the token if it doesn't exist yet, or returns existing token
 *            Requires collaborator access
 * @returns {200} - Success, returns auth token
 * @returns {401} - Unauthorized
 * @returns {404} - Experiment not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/authtoken",
  passport.authenticate("unity-user-token", { session: false }),
  requireExperimentMember,
  async function (req, res) {
    try {
      const experimentId = req.params.experimentId;
      const userId = req.user.id;

      // Validate experiment ID
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find the experiment and ensure it exists
      const experiment = await Experiment.findById(experimentId);
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "Experiment not found" });
        return;
      }

      // Get the existing token or create a new one
      let unityToken = await UnityBuildToken.findOne({
        experiment: experimentId,
        revoked: false,
      });
      if (!unityToken) {
        // Create a new token if it doesn't exist
        unityToken = new UnityBuildToken({
          experiment: experimentId,
          createdBy: userId,
          token: crypto.randomBytes(32).toString("hex"),
        });
        await unityToken.save();
      }

      // Return the token
      res.status(200).json({
        success: true,
        message: "Unity authentication token retrieved successfully",
        token: unityToken.token,
      });
    } catch (err) {
      console.error("Error while getting Unity authentication token: ", err);
      res.status(500).json({
        success: false,
        message: "Failed to get experiment token",
        error: (err as Error)?.message || "Unknown error",
      });
      return;
    }
  }
);

/**
 * @route   POST api/experiments/copy
 * @desc    Copies an existing experiment according to incoming body; Also searches for and duplicates a webxr build if it exists for the experiment.
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Collaborators not found by email
 * @returns {409} - Experiment already exists
 * @returns {500} - Internal server error
 * @returns {201} - Experiment created
 * @access  private
 */

// Source for Uploading Multiple Files: https://medium.com/@jomote/mastering-file-uploads-with-multer-in-node-js-84698cdba2b2
// Define uploaded files that will be sent to server using Multer. For now it is just an IRB Letter, but in the future, it could be many other files
const uploadFieldsCopied = upload.fields([{ name: "irbLetter", maxCount: 1 }]);

router.post(
  "/copy",
  uploadFieldsCopied,
  passport.authenticate(["jwt", "unity-user-token"], { session: false }),
  async (req, res) => {
    // Get info from body

    console.log("Request Body Data: ", req.body);
    console.log("Request Files: ", req.files);

    // Create Empty ExperimentInfo object to add the parsed experiment data in
    let experimentInfo;

    try {
      // The Experiment Info is sent as a JSON String field, so parse it first:
      experimentInfo = JSON.parse(req.body.experimentInfo || "{}");
    } catch (err) {
      res.status(400).json(errRes("Invalid JSON"));
      return;
    }

    // Set Logged in User ID to Variable
    let userId = req.user.id;

    // Destructure Experiment Info that is not a file
    let {
      sourceExperimentId,
      name,
      description,
      irbProtocolNumber,
      irbEmailAddress,
      collaborators,
      isMultiSite,
    } = experimentInfo;

    // Set uploaded files to variables
    let irbLetterBuffer = "";
    let irbLetterName = "";

    try {
      if (req.files["irbLetter"]) {
        let irbLetter = req.files["irbLetter"][0];

        console.log("IRB Letter: ", irbLetter);
        // Check if file is a pdf
        if (irbLetter.mimetype !== "application/pdf") {
          res.status(400).json(errRes("Can only upload a pdf file"));
          return;
        }
        // Check file size
        if (irbLetter.size >= 5e7) {
          res
            .status(400)
            .json(errRes("IRB Letter cannot be greater than 50MB"));
          return;
        }

        // Set IRB Letter's data to a variable
        irbLetterBuffer = irbLetter.buffer;
        let irbLetterOriginalName = irbLetter.originalname.split(".");
        irbLetterName = irbLetterOriginalName[0];
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(errRes("IRB Upload failed"));
      return;
    }

    // Validate incoming fields (name, description, IRB num)

    if (
      !sourceExperimentId ||
      !mongoose.Types.ObjectId.isValid(sourceExperimentId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid or missing source experiment ID",
      });
      return;
    }

    if (!name) {
      res.status(400).json(errRes("Experiment name required"));
      return;
    }

    if (!description) {
      res.status(400).json(errRes("Experiment description required"));
      return;
    }

    if (!irbProtocolNumber) {
      res.status(400).json(errRes("IRB protocol number required"));
      return;
    }

    if (!irbEmailAddress) {
      res.status(400).json(errRes("IRB email address required"));
      return;
    }

    if (isMultiSite === undefined) {
      res.status(400).json(errRes("isMultiSite is required"));
      return;
    }

    try {
      // Ensure experiment does not already exist by this name
      const experiment = await Experiment.findOne({ name: name });
      if (experiment) {
        res
          .status(409)
          .json(errRes("Experiment with this name already exists"));
        return;
      }

      // Create new experiment
      const experimentInfo = new Experiment({
        name: name,
        description: description,
        irbProtocolNumber: irbProtocolNumber,
        irbEmailAddress: irbEmailAddress,
        irbLetterName: irbLetterName,
        irbLetter: irbLetterBuffer,
        createdBy: userId,
        participants: [],
        collaborators: [],
        isMultiSite: isMultiSite,
        draft: false,
      });

      // If this experiment is not multi-site, add a default site (hidden for non-multi-site exp's)
      let newSite;
      if (!isMultiSite) {
        const siteInfo = new Site({
          name: "Default Site",
          shortName: "SITE",
        });
        newSite = await siteInfo.save();

        experimentInfo.sites = [new mongoose.Types.ObjectId(newSite._id)];
      }

      // Add collaborators to experiment
      let invalidCollaborators = [];
      if (collaborators) {
        for (let i = 0; i < collaborators.length; i++) {
          const collaborator = await User.findOne({ email: collaborators[i] });
          if (collaborator) {
            if (userId === collaborator.id) {
              // Cannot add self as collaborator, ignore this one
              continue;
            }
            experimentInfo.collaborators.push(collaborator.id);
          } else {
            console.error(
              `Collaborator with email ${collaborators[i]} not found`
            );
            invalidCollaborators.push(collaborators[i]);
          }
        }
      }

      // Check any invalid collaborators
      if (invalidCollaborators.length > 0) {
        res.status(404).json({
          success: false,
          message: "Collaborators not found by given emails",
          invalidCollaborators,
        });
        return;
      }

      // Save experiment
      let newExperiment = await experimentInfo.save();

      // Update default site's parent experiment, if pertinent
      if (!isMultiSite) {
        newSite.parentExperiment = new mongoose.Types.ObjectId(
          newExperiment._id
        );
        await newSite.save();
      }

      /*
        Duplicate File Types
      */

      // Search the mongo database for all file types that are associated with the source experiment
      console.log(
        `Duplicating file types from source experiment ${sourceExperimentId}`
      );

      const sourceFileTypes = await FileType.find({
        experimentId: sourceExperimentId,
      }).populate("columnDefinition");

      console.log(`Found ${sourceFileTypes.length} file types to duplicate`);

      // Duplicate Each FileType for the new Experiment
      for (const sourceFileType of sourceFileTypes) {
        // Create new file type with same properties but new experiment ID
        const newFileType = new FileType({
          name: sourceFileType.name,
          experimentId: newExperiment._id,
          extension: sourceFileType.extension,
          description: sourceFileType.description,
        });

        const savedFileType = await newFileType.save();

        // If Source FileType has column definitions, duplicate them as well
        if (sourceFileType.columnDefinition) {
          // Get the full source column definition with populated columns
          const sourceColumnDef = await ColumnDefinition.findById(
            sourceFileType.columnDefinition
          ).populate("columns");

          if (sourceColumnDef) {
            // Create new column definition for the new file type
            const newColumnDef = new ColumnDefinition({
              fileTypeId: savedFileType._id,
              columns: [],
            });

            const savedColumnDef = await newColumnDef.save();

            // Duplicate each column from the source column definition
            for (const sourceColumn of sourceColumnDef.columns) {
              // sourceColumn is populated, so we can access its properties directly
              const newColumn = new Column({
                columnDefinitionId: savedColumnDef._id,
                name: (sourceColumn as any).name,
                description: (sourceColumn as any).description,
                dataType: (sourceColumn as any).dataType,
                transform: (sourceColumn as any).transform,
                order: (sourceColumn as any).order,
              });

              const savedColumn = await newColumn.save();

              // Add the new column to the column definition's columns array
              savedColumnDef.columns.push(savedColumn._id);
            }

            // Save the updated column definition with all columns
            await savedColumnDef.save();

            // Update the new file type to reference the new column definition
            savedFileType.columnDefinition =
              savedColumnDef._id.toString() as any;
            await savedFileType.save();

            console.log(
              `Duplicated column definition with ${sourceColumnDef.columns.length} columns for file type ${savedFileType.name}`
            );
          }
        }
      }

      /*
        
        After saving the experiment, we can now create the WebXR build directory
      
      */

      // Ensure caller has access to source experiment
      const sourceExperiment = await Experiment.findById(sourceExperimentId);
      const callerId = req.user.id;

      const hasSourceAccess =
        sourceExperiment.createdBy.toString() === callerId ||
        sourceExperiment.collaborators.some(
          (uid) => uid.toString() === callerId
        );

      if (!hasSourceAccess) {
        res.status(401).json({
          success: false,
          message: "Caller does not have access to source experiment",
        });
        return;
      }

      // Check if source experiment has WebXR build
      const webXrDir = path.resolve("/usr/uploads", "webxr");
      const sourcePath = path.join(webXrDir, sourceExperimentId);
      const targetPath = path.join(webXrDir, newExperiment._id.toString());

      // Check if source WebXR directory exists. If it exists, create a copy of the experiment for the new experiment
      const sourceStat = await fsPromises.stat(sourcePath);
      if (sourceStat.isDirectory()) {
        console.log(`Copying WebXR build from ${sourcePath} to ${targetPath}`);

        // Remove existing target WebXR directory if it exists
        await fsPromises.rm(targetPath, { recursive: true, force: true });

        // Create target directory
        await fsPromises.mkdir(targetPath, { recursive: true });

        // Copy all files and directories from source to target
        const copyRecursive = async (src: string, dest: string) => {
          const entries = await fsPromises.readdir(src, {
            withFileTypes: true,
          });

          for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
              await fsPromises.mkdir(destPath, { recursive: true });
              await copyRecursive(srcPath, destPath);
            } else {
              await fsPromises.copyFile(srcPath, destPath);
            }
          }
        };

        await copyRecursive(sourcePath, targetPath);

        console.log("WebXR build copied successfully");

        // Update WebXR  build number in the new experiment
        newExperiment.webXrBuildNumber =
          (newExperiment.webXrBuildNumber || 0) + 1;
        await newExperiment.save();

        console.log(
          `WebXR build number updated to ${newExperiment.webXrBuildNumber} for experiment ${newExperiment.name}`
        );
      }

      res.status(201).json({
        success: true,
        experiment: newExperiment,
        _id: newExperiment._id,
      });
      return;
    } catch (error) {
      console.error("Error creating experiment: ", error);
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
 * @route   GET api/experiments/:experimentId/creator
 * @desc    Gets the user profile of the creator of the experiment; requires collaborator access
 * @returns {200} - Success, returns user profile
 * @returns {401} - Unauthorized
 * @returns {404} - Experiment not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:experimentId/creator",
  passport.authenticate("jwt", { session: false }),
  requireExperimentMember,
  async function (req, res) {
    try {
      const experimentId = req.params.experimentId;

      // Validate experiment ID
      if (!experimentId || !mongoose.Types.ObjectId.isValid(experimentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid or missing experiment ID",
        });
        return;
      }

      // Find the experiment and ensure it exists
      const experiment = await Experiment.findById(experimentId).populate({
        path: 'createdBy',
        populate: [
          { path: 'institution' },
          { path: 'lab' }
        ]
      });
      if (!experiment) {
        res
          .status(404)
          .json({ success: false, message: "Experiment not found" });
        return;
      }

      // Return the creator with populated institution and lab
      res.status(200).json({
        success: true,
        creator: experiment.createdBy
      });
    } catch (err) {
      console.error("Error while getting experiment creator: ", err);
      res.status(500).json({
        success: false,
        message: "Failed to get experiment creator",
        error: (err as Error)?.message || "Unknown error",
      });
      return;
    }
  }
);

// export this to be used as middleware in express
export default router;
