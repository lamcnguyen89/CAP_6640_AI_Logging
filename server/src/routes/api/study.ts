// import fs from 'fs'
import express from "express"
import Experiment from "../../models/Experiment";
import Study from "../../models/Study";
import User from "../../models/User";
import { errRes } from "../../common/utilities";
import deleteMethods2 from "../../common/deleteMethods2";
import passport from "passport"
import mongoose, { Types } from "mongoose";


const fs = require('fs')
const path = require('path')

const multer = require('multer')
const { parse } = require('csv')
process.env.TZ = 'America/New_York'

// Configure Multer for File Uploads
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const router = express.Router()

// TODO: DELETE, this is for testing ability to Jest test JWT routes
router.get(
  "/testNoJwt",
  //passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    res.send("Study route works");
  }
);

// TODO: DELETE, this is for testing ability to Jest test JWT routes
router.get(
  "/testJwt",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    res.send("Study route works");
  }
);

/**
 * @route   GET api/studies/:studyId
 * @desc    Gets a study by ID.
 * @param   {String} studyId - ID of the study to get
 * @returns {200} - Success, returns study
 * @returns {400} - Bad request (improper studyId or no ID given)
 * @returns {403} - Unauthorized (caller is not creator or user of study)
 * @returns {404} - Study not found by ID
 * @returns {500} - Server Error, returns error
 * @access  private
 */
router.get(
  "/:studyId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Ensure studyId exists
      if (!req.params.studyId) {
        res.status(400).json({ success: false, message: "No study ID provided" });
        return;
      }

      // Validate studyId as an okay ID
      const studyId = req.params.studyId;
      if (!mongoose.Types.ObjectId.isValid(studyId)) {
        res.status(400).json({ success: false, message: "Invalid study ID" });
        return;
      }

      // Get study from database by ID
      const study = await Study.findById(studyId);

      // Check if study exists by ID
      if (!study) {
        res.status(404).json({ success: false, message: `Study not found with ID ${studyId}` });
        return;
      }

      // Check if caller is authorized (creator or in users array)
      const userId = req.user.id;
      const isCreator = study.createdBy.toString() === userId;
      const isInUsersArray = study.users.some(user => user.toString() === userId);

      // If the user is not a creator or not in the users array, deny access
      if (!isCreator && !isInUsersArray) {
        res.status(403).json({ success: false, message: "Caller is not creator or user of study" });
        return;
      }

      // Study found, return study
      res.status(200).json({ success: true, study: study });
    } catch (error) {
      // Upon general error, return server error
      console.error(`Error fetching study with ID ${req.params.studyId}:`, error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
    }
  }
);

/**
 * @route   POST api/studies
 * @desc    Creates a new study, and a default experiment for it
 * @param   {JSON} req.body - Study name, description, defaultExperimentName, defaultExperimentDescription, irbProtocolNumber
 * @returns {201} - Successful creation, returns the new study and experiment
 * @returns {400} - Bad request (missing fields)
 * @returns {409} - Conflict (study name already exists)
 * @returns {500} - Server error
 * @access  Private
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from request
    const { name, description, defaultExperimentName, defaultExperimentDescription, irbProtocolNumber } = req.body;
    const userId = req.user.id;

    // Check required fields
    if (!name || !defaultExperimentName) {
      res.status(400).json({ success: false, message: "Missing required fields: name or defaultExperimentName" });
      return;
    }

    try {
      // Check for existing study by name
      const existingStudy = await Study.findOne({ name }).collation({ locale: 'en', strength: 2 });
      if (existingStudy) {
        res.status(409).json({ success: false, message: "Study by given name already exists" });
        return;
      }

      // Create new study and save to database
      const newStudy = new Study({
        name,
        description,
        createdBy: userId,
        irbProtocolNumber,
        users: [userId],
      });
      await newStudy.save();

      // Create default experiment for study and save to database
      const newExperiment = new Experiment({
        name: defaultExperimentName,
        description: defaultExperimentDescription,
        createdBy: userId,
        study: newStudy._id,
      });
      await newExperiment.save();

      newStudy.defaultExperiment = new Types.ObjectId(newExperiment._id);
      await newStudy.save();

      res.status(201).json({ success: true, study: newStudy, defaultExperiment: newExperiment });
      return;
    } catch (error) {
      console.error("Error creating study and default experiment: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);

/**
 * @route   PATCH api/study/:studyId
 * @desc    Updates specific fields of an existing study
 * @param   {String} :studyId - ID of the study to update
 * @returns {200} - Successful update, returns updated study
 * @returns {400} - Invalid or missing fields
 * @returns {404} - Not found (study, user, or experiment)
 * @returns {409} - Conflict (study name already exists)
 * @returns {500} - Server error
 * @access  private
 */
router.patch(
  "/:studyId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get parameters from request
    const { studyId } = req.params;
    const { name, description, irbProtocolNumber, defaultExperiment, principleInvestigator } = req.body;

    // Validate studyId
    if (!studyId || !mongoose.Types.ObjectId.isValid(studyId)) {
      res.status(400).json({ success: false, message: "Invalid or missing study ID" });
      return;
    }

    // Validate at least one field to update
    if (!name && !description && !irbProtocolNumber && !principleInvestigator && !defaultExperiment) {
      res.status(400).json({ success: false, message: "At least one field (name, description, irbProtocolNumber, or users) must be provided to update" });
      return;
    }

    try {
      // Get the study from the database by ID
      const study = await Study.findById(studyId);

      // Ensure study exists
      if (!study) {
        res.status(404).json({ success: false, message: "Study not found" });
        return;
      }

      // Update name, if provided; ensure no duplicate names before entering.
      if (name) {
        const existingStudy = await Study.findOne({ name });
        if (existingStudy && existingStudy._id.toString() !== studyId) {
          res.status(409).json({ success: false, message: "Study name already exists" });
          return;
        }
        study.name = name;
      }

      // Update description and IRB number, if provided
      if (description) study.description = description;
      if (irbProtocolNumber) study.irbProtocolNumber = irbProtocolNumber;

      // Update principle investigator, if provided; validate investigator before entering.
      if (principleInvestigator) {
        // Validate as ID
        if (!mongoose.Types.ObjectId.isValid(principleInvestigator)) {
          res.status(400).json({ success: false, message: "Invalid format of principle investigator ID" });
          return;
        }
        // Ensure user exists
        const validUser = await User.find({ _id: { principleInvestigator } });
        if (!validUser) {
          res.status(404).json({ success: false, message: "Principle investigator ID could not be found in database" });
          return;
        }
        study.principleInvestigator = principleInvestigator;
      }

      // Update default experiment, if provided; ensure experiment exists before entering.
      if (defaultExperiment) {
        // Validate as ID
        if (!mongoose.Types.ObjectId.isValid(defaultExperiment)) {
          res.status(400).json({ success: false, message: "Invalid format of default experiment ID" });
          return;
        }
        // Ensure experiment exists
        const experimentExists = await Experiment.findById(defaultExperiment);
        if (!experimentExists) {
          res.status(404).json({ success: false, message: "Provided defaultExperiment ID does not exist" });
          return;
        }
        study.defaultExperiment = defaultExperiment;
      }

      // Save updated study
      const updatedStudy = await study.save();
      res.status(200).json({ success: true, study: updatedStudy });
    } catch (error) {
      console.error(`Error updating study with ID ${studyId}:`, error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
    }
  }
);


/**
 * @route   GET api/studies
 * @desc    Gets all studies, which the caller created or is a user of.
 * @returns {200} - Success, returns studies
 * @returns {500} - Server Error, returns error
 * @access  private
 */
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const callerId = req.user.id;

      // Get studies from database created by caller, or where caller is a user
      const studies = await Study.find({
        $or: [
          { createdBy: callerId },
          { users: { $in: [callerId] } },
        ],
      });

      // Return studies
      res.status(200).json({ success: true, studies });
    } catch (error) {
      // Upon general error, return server error
      console.error(`Error fetching all studies for caller: `, error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
    }
  }
);

/**
 * @route   DELETE api/study/:studyId
 * @desc    Deletes an existing study and its associated resources
 * @param   {String} :studyId - ID of the study to delete
 * @returns {204} - Successful deletion
 * @returns {400} - Invalid or missing study ID
 * @returns {404} - Study not found
 * @returns {500} - Server error
 * @access  Private
 */
router.delete(
  "/:studyId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { studyId } = req.params;
    const userId = req.user.id;

    // Validate study ID
    if (!studyId || !mongoose.Types.ObjectId.isValid(studyId)) {
      res.status(400).json({ success: false, message: "Invalid or missing study ID" });
      return;
    }

    try {
      // Get study from database and ensure existence
      const study = await Study.findById(studyId);
      if (!study) {
        res.status(404).json({ success: false, message: "Study not found" });
        return;
      }

      // Remove all associated experiments
      // Find all experiments with this study ID and delete
      await Experiment.find({ study: studyId }).then((experimentList) => {
        if (experimentList) {
          // Use the delete experiment function
          experimentList.forEach((exp) => {
            deleteMethods2
              .deleteExperiment(exp._id.toString(), userId, req.serverConfig)
              .then(async (retVal) => {
                // After completion, delete the study
                await Study.findByIdAndDelete(studyId);
                res.status(204).json({ success: true, message: "Study, associated experiments, and their associated participants, successfully deleted" });
                return;
              })
          });
        }
      });
    } catch (error) {
      console.error(`Error deleting study with ID ${studyId}:`, error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
    }
  }
);

export default router

