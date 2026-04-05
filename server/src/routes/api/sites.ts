import express from "express";
import mongoose, { Types } from "mongoose";
import passport from "passport";
import Experiment from "../../models/Experiment";
import Participant from "../../models/Participant";
import Site from "../../models/Site";
import { ParticipantState } from "./participants";

const router = express.Router();
router.use(express.json());

/**
 * @route   GET api/sites/:siteId
 * @desc    Get a site by ID
 * @returns {400} - Bad request, invalid field
 * @returns {404} - Site not found by incoming ID
 * @returns {500} - Internal server error
 * @returns {200} - Returns the site
 * @access  private
 */
router.get(
  "/:siteId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get site ID from request
    const { siteId } = req.params;

    // Validate incoming site ID
    if (!siteId || !mongoose.Types.ObjectId.isValid(siteId)) {
      res.status(400).json({ success: false, message: "Site ID is required, but was not provided or is not a valid ID." });
      return;
    }

    try {
      // Find and return site by ID
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json({ success: false, message: "Site by provided ID could not be found in database." });
        return;
      }

      res.status(200).json({ success: true, site });
      return;
    } catch (error) {
      // General server error catch
      console.error("Error getting site by ID: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);

/**
 * @route   POST api/sites/
 * @desc    Create a new site according to incoming body
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Experiment not found by incoming ID
 * @returns {409} - Site already exists by incoming name for its parent experiment
 * @returns {500} - Internal server error
 * @returns {201} - Site created successfully
 * @access  private
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from body
    const { name, shortName, parentExperiment } = req.body;

    // Validate incoming fields (name, parent experiment)
    if (!name || !shortName) {
      res.status(400).json({ success: false, message: "Site name and short name are required, but at least one was not provided." });
      return;
    }

    if (!parentExperiment || !mongoose.Types.ObjectId.isValid(parentExperiment)) {
      res.status(400).json({ success: false, message: "Parent experiment is required, but was not provided or is not a valid ID." });
      return;
    }

    try {
      // Ensure parent experiment exists, and get it
      const experiment = await Experiment.findById(parentExperiment);
      if (!experiment) {
        res.status(404).json({ success: false, message: "Parent experiment by provided ID could not be found in database." });
        return;
      }

      // Check if a site with the same name already exists for this experiment
      let existingSite = await Site.findOne({ name, parentExperiment });
      if (existingSite) {
        res.status(409).json({ success: false, message: `A site with name '${name}' already exists for the given parent experiment.` });
        return;
      }
      existingSite = await Site.findOne({ shortName, parentExperiment });
      if (existingSite) {
        res.status(409).json({ success: false, message: `A site with short name '${shortName}' already exists for the given parent experiment.` });
        return;
      }

      // Create and save the new site
      const newSite = new Site({
        name,
        shortName,
        parentExperiment,
      });
      const siteResult = await newSite.save();

      // Update parent experiment's site list
      experiment.sites.push(new mongoose.Types.ObjectId(newSite._id));
      await experiment.save();

      // Return success
      res.status(201).json({ success: true, message: 'Site created successfully.', site: siteResult });
      return;
    } catch (error) {
      // General server error catch
      console.error("Error creating site: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);

/**
 * @route   PATCH  api/sites/:siteId
 * @desc    Patches a site by ID according to incoming body
 * @returns {200} - Site updated
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Site not found
 * @returns {409} - Site already exists by name
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/:siteId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from body
    const { name, shortName } = req.body;
    let siteId = req.params.siteId;

    // Validate at least one field to update
    if (!name && !shortName) {
      res.status(400).json({ success: false, message: "At least one field (name or shortName) must be provided to update" });
      return;
    }

    try {
      // Find the site and ensure it exists
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json("Site not found in database by given ID")
        return
      }

      // Ensure parent experiment exists, and get it
      const experiment = await Experiment.findById(site.parentExperiment);
      if (!experiment) {
        res.status(404).json({ success: false, message: "Given site does not have a valid parent experiment." });
        return;
      }

      // Check if a site with the same name already exists for this experiment
      if (name && name !== site.name) {
        const existingSite = await Site.findOne({ name: name, parentExperiment: site.parentExperiment });
        if (existingSite) {
          res.status(409).json({ success: false, message: `A site with name '${name}' already exists for its parent experiment.` });
          return;
        } else {
          site.name = name;
        }
      }

      // Check if a site with the same short name already exists for this experiment
      if (shortName && shortName !== site.name) {
        const existingSite = await Site.findOne({ shortName: shortName, parentExperiment: site.parentExperiment });
        if (existingSite) {
          res.status(409).json({ success: false, message: `A site with short name '${shortName}' already exists for its parent experiment.` });
          return;
        } else {
          site.shortName = shortName;
        }
      }

      // Update site with new info and save
      // (No info to save at this moment)

      await site.save().then((updatedSite) => {
        res.status(200).json({ success: true, updatedSite })
        return;
      });
    } catch (error) {
      // General server error catch
      console.error(`Error updating site with ID ${siteId}:`, error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
    }
  }
);

/**
 * @route   DELETE  api/sites/:siteId
 * @desc    Deletes a site by ID and updates parent experiment's sites array
 * @returns {200} - Site deleted
 * @returns {404} - Site not found by given ID
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:siteId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get site ID from request
    const { siteId } = req.params;

    try {
      // Find site by ID
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json({ success: false, message: "Site by provided ID could not be found in database." });
        return;
      }

      // Find and update parent experiment's sites array (if parent experiment exists)
      const experiment = await Experiment.findById(site.parentExperiment);
      if (experiment) {
        experiment.sites = experiment.sites.filter((site) => site.toString() !== siteId);
        await experiment.save();
      }

      // Delete site
      await site.deleteOne();

      // Delete all participants where site is the deleted site
      await Participant.deleteMany({ site: siteId });

      res.status(200).json({ success: true, message: "Site deleted successfully." });
      return;
    } catch (error) {
      // General server error catch
      console.error("Error deleting site by ID: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);

/**
 * @route   GET api/sites/:siteId/active-participant
 * @desc    Gets a site's current active participant
 * @returns {200} - Success, returns the active participant's database ID, pID, and Unity ID (uid)
 * @returns {404} - Site not found or no active participant exists
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:siteId/active-participant",
  async function (req, res) {
    try {
      const siteId = req.params.siteId;
      
      // Get the site and ensure it exists
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json({ success: false, message: "Site not found." });
        return;
      }

      // Get the active participant
      if (!site.activeParticipant) {
        res.status(404).json({ success: false, message: "No active participant found for this site." });
        return;
      }

      const activeParticipant = await Participant.findById(site.activeParticipant);
      if (!activeParticipant) {
        res.status(404).json({ success: false, message: "No active participant found for this site." });
        return;
      }

      // Return the new participant's ID and pID
      res.status(200).json({
        success: true,
        databaseID: activeParticipant._id,
        pID: activeParticipant.pID,
        unityID: activeParticipant.uid,
      });
      return;
    } catch (err) {
      console.error("Error while getting active participant: ", err);
      res.status(500).json({ success: false, message: "Failed to get active participant", error: err });
      return;
    }
  }
)

/**
 * @route   POST api/sites/:siteId/active-participant/create
 * @desc    Creates a new participant for a site, and sets them as the site's active participant
 * @returns {201} - Success, creates the new participant and returns their database ID and pID
 * @returns {404} - Site not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:siteId/active-participant/create",
  async function (req, res) {
    try {
      const siteId = req.params.siteId;
      
      // Get the site and ensure it exists
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json({ success: false, message: "Site not found." });
        return;
      }

      // Check if there is an active participant already
      if (site.activeParticipant) {
        const existingParticipant = await Participant.findById(site.activeParticipant);
        if (existingParticipant && (existingParticipant.state === ParticipantState.CREATED || existingParticipant.state === ParticipantState.IN_EXPERIMENT)) {
          // If participant is in an inconclusive state, mark them as incomplete
          existingParticipant.state = ParticipantState.INCOMPLETE;
          await existingParticipant.save();
          console.log(`Marked existing active participant as INCOMPLETE: ${existingParticipant._id}`);
        }
      }

      // Create a new participant (bare bones, to be adjusted by Unity)
      const newParticipant = new Participant({
        experimentId: site.parentExperiment,
        site: siteId,
        state: ParticipantState.CREATED,
        sessionStart: new Date(),
      });

      await newParticipant.save();
      console.log(`Created new active participant with ID: ${newParticipant._id}`);

      // Set the participant as the active participant in the experiment
      site.activeParticipant = new mongoose.Types.ObjectId(newParticipant._id);
      await site.save();

      // Return the new participant's ID and pID
      res.status(201).json({
        success: true,
        databaseID: newParticipant._id,
        pID: newParticipant.pID,
      });
      return;
    } catch (err) {
      console.error("Error while creating active participant: ", err);
      res.status(500).json({ success: false, message: "Failed to create active participant", error: err });
      return;
    }
  }
)

/**
 * @route   POST api/sites/:siteId/active-participant/conclude
 * @desc    Concludes the current active participant for a site
 * @returns {200} - Success, participant concluded
 * @returns {404} - Site not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/:siteId/active-participant/conclude",
  async function (req, res) {
    try {
      const siteId = req.params.siteId;
      
      // Get the site and ensure it exists
      const site = await Site.findById(siteId);
      if (!site) {
        res.status(404).json({ success: false, message: "Site not found." });
        return;
      }

      // Get the active participant
      if (!site.activeParticipant) {
        res.status(404).json({ success: false, message: "No active participant found for this site." });
        return;
      }

      const activeParticipant = await Participant.findById(site.activeParticipant);
      if (!activeParticipant) {
        res.status(404).json({ success: false, message: "Active participant not found." });
        return;
      }

      // Mark participant as complete if they are in an inconclusive state
      if (activeParticipant.state === ParticipantState.IN_EXPERIMENT || activeParticipant.state === ParticipantState.CREATED) {
        activeParticipant.state = ParticipantState.COMPLETE;
        await activeParticipant.save();
        console.log(`Marked existing active participant as COMPLETE: ${activeParticipant._id}`);
      }

      // Conclude the active participant
      site.activeParticipant = null;
      await site.save();

      res.status(200).json({
        success: true,
        message: "Active participant concluded successfully.",
        databaseId: activeParticipant._id,
        pID: activeParticipant.pID,
      });
      return;
    } catch (err) {
      console.error("Error while concluding active participant: ", err);
      res.status(500).json({ success: false, message: "Failed to conclude active participant", error: err });
      return;
    }
  }
)

export default router;
