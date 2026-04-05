import express, { Request, Response } from "express";
import mongoose from "mongoose";
import passport from "passport";
import Institution from "../../models/Institution";
import User from "../../models/User";
import Lab from "../../models/Lab";

const router = express.Router();
router.use(express.json());



/**
 * @route   GET api/institutions/
 * @desc    Get all institutions
 * @returns {500} - Internal server error
 * @returns {200} - Institution fetched
 * @access  public
 */
router.get(
  "/",
  async (req, res) => {
    try {
      // Get all institutions
      const institutions = await Institution.find();
      res.status(200).json({ success: true, institutions });
      return;
    } catch (error) {
      // General error handling
      console.error("Error getting institutions: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   POST api/institutions/
 * @desc    Create a new institution according to incoming body
 * @returns {400} - Bad request, missing fields
 * @returns {409} - Institution already exists
 * @returns {500} - Internal server error
 * @returns {201} - Institution created
 * @access  private
 */
// TODO add auth
router.post(
  "/",
  //passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Ensure user is an admin
      /*
      const user = await User.findById(req.user.id);
      if (!user || !user.admin) {
        res.status(403).json({ success: false, message: "Only admins can create institutions" });
        return;
      }*/

      // Validate request body
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: "Missing institution name" });
        return;
      }

      // Check if institution already exists
      const existingInstitution = await Institution.findOne({ name });
      if (existingInstitution) {
        res.status(409).json({ success: false, message: "Institution already exists by given name" });
        return;
      }

      // Create new institution
      const newInstitution = new Institution({name});
      await newInstitution.save();
      res.status(201).json({ success: true, message: "Institution created successfully", institution: newInstitution });
      return;
    } catch (error) {
      // General error handling
      console.error("Error creating institution: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   GET api/institutions/:institutionId
 * @desc    Get an institution by ID
 * @returns {400} - Bad request, invalid institution ID
 * @returns {404} - Institution not found
 * @returns {500} - Internal server error
 * @returns {200} - Institution found
 * @access  private
 */
router.get(
  "/:institutionId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Validate institution ID
      const { institutionId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Find institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Return institution details
      res.status(200).json({ success: true, institution });
      return;
    } catch (error) {
      // General error handling
      console.error("Error getting institution: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   PATCH api/institutions/:institutionId
 * @desc    Update an institution according to incoming body
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Institution not found
 * @returns {409} - Institution already exists
 * @returns {500} - Internal server error
 * @returns {201} - Institution created
 * @access  private
 */
router.patch(
  "/:institutionId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Validate institution ID
      const institutionId = req.params.institutionId;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Ensure user is an admin
      const user = await User.findById(req.user.id);
      if (!user || !user.admin) {
        res.status(403).json({ success: false, message: "Only admins can create institutions" });
        return;
      }

      // Validate request body
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: "Missing institution name" });
        return;
      }

      // Get institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Check if institution with the same name already exists
      const existingInstitution = await Institution.findOne({ name });
      if (existingInstitution && existingInstitution._id.toString() !== institutionId) {
        res.status(409).json({ success: false, message: "Institution already exists by given name" });
        return;
      }

      // Update institution
      institution.name = name;
      await institution.save();
      res.status(200).json({ success: true, message: "Institution updated successfully", institution });
      return;
    } catch (error) {
      // General error handling
      console.error("Error updating institution: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   DELETE api/institutions/:institutionId
 * @desc    Delete an institution by ID
 * @returns {204} - Institution deleted successfully
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Institution not found
 * @returns {403} - Forbidden, user is not an admin
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:institutionId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Ensure user is an admin
      const user = await User.findById(req.user.id);
      if (!user || !user.admin) {
        res.status(403).json({ success: false, message: "Only admins can delete institutions" });
        return;
      }

      // Validate institution ID
      const institutionId = req.params.institutionId;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Find institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Delete any associated labs
      await Lab.deleteMany({ institution: institutionId });

      // Delete institution
      await Institution.findByIdAndDelete(institutionId);
      res.status(204).json({ success: true, message: "Institution deleted successfully" });
      return;
    } catch (error) {
      // General error handling
      console.error("Error deleting institution: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   GET api/institutions/:institutionId/labs
 * @desc    Get all labs associated with an institution
 * @returns {200} - Labs retrieved successfully
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Institution not found
 * @returns {500} - Internal server error
 * @access  public
 */
router.get(
  "/:institutionId/labs",
  async (req, res) => {
    try {
      // Validate institution ID
      const institutionId = req.params.institutionId;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Find institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Get all labs associated with the institution
      const labs = await Lab.find({ institution: institutionId });
      res.status(200).json({ success: true, labs });
      return;
    } catch (error) {
      // General error handling
      console.error("Error getting labs: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   POST api/institutions/:institutionId/labs
 * @desc    Create a new lab associated with an institution
 * @returns {400} - Bad request, missing fields
 * @returns {403} - Forbidden, user is not an admin
 * @returns {404} - Institution not found
 * @returns {409} - Lab already exists
 * @returns {201} - Lab created successfully
 * @returns {500} - Internal server error
 * @access  private
 */
// TODO add auth
router.post(
  "/:institutionId/labs",
  //passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Ensure user is an admin
      /*
      const user = await User.findById(req.user.id);
      if (!user || !user.admin) {
        res.status(403).json({ success: false, message: "Only admins can create labs" });
        return;
      }*/

      // Validate institution ID
      const institutionId = req.params.institutionId;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Find institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Validate request body
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: "Missing lab name" });
        return;
      }

      // Check if lab already exists
      const existingLab = await Lab.findOne({ name, institution: institutionId });
      if (existingLab) {
        res.status(409).json({ success: false, message: "Lab already exists by given name" });
        return;
      }

      // Create new lab
      const newLab = new Lab({ name, institution: institutionId });
      await newLab.save();
      res.status(201).json({ success: true, message: "Lab created successfully", lab: newLab });
      return;
    } catch (error) {
      // General error handling
      console.error("Error creating lab: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   PATCH api/institutions/:institutionId/labs/:labId
 * @desc    Update a lab associated with an institution
 * @returns {400} - Bad request, missing fields
 * @returns {403} - Forbidden, user is not an admin
 * @returns {404} - Institution or lab not found
 * @returns {409} - Lab already exists
 * @returns {200} - Lab updated successfully
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/:institutionId/labs/:labId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Ensure user is an admin
      const user = await User.findById(req.user.id);
      if (!user || !user.admin) {
        res.status(403).json({ success: false, message: "Only admins can update labs" });
        return;
      }

      // Validate institution ID
      const institutionId = req.params.institutionId;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Find institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Get lab ID from request parameters
      const labId = req.params.labId;
      if (!mongoose.Types.ObjectId.isValid(labId)) {
        res.status(400).json({ success: false, message: "Invalid lab ID" });
        return;
      }

      // Find lab by ID
      const lab = await Lab.findById(labId);
      if (!lab || lab.institution.toString() !== institutionId) {
        res.status(404).json({ success: false, message: "Lab not found in the specified institution" });
        return;
      }

      // Validate request body
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: "Missing lab name" });
        return;
      }

      // Check if lab already exists
      const existingLab = await Lab.findOne({ name, institution: institutionId });
      if (existingLab) {
        res.status(409).json({ success: false, message: "Lab already exists by given name" });
        return;
      }

      // Update lab
      lab.name = name;
      await lab.save();
      res.status(200).json({ success: true, message: "Lab updated successfully", lab });
      return;
    } catch (error) {
      // General error handling
      console.error("Error updating lab: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



/**
 * @route   DELETE api/institutions/:institutionId/labs/:labId
 * @desc    Delete a lab associated with an institution
 * @returns {204} - Lab deleted successfully
 * @returns {400} - Bad request, missing fields
 * @returns {403} - Forbidden, user is not an admin
 * @returns {404} - Institution or lab not found
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:institutionId/labs/:labId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Ensure user is an admin
      const user = await User.findById(req.user.id);
      if (!user || !user.admin) {
        res.status(403).json({ success: false, message: "Only admins can delete labs" });
        return;
      }

      // Validate institution ID
      const institutionId = req.params.institutionId;
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json({ success: false, message: "Invalid institution ID" });
        return;
      }

      // Find institution by ID
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(404).json({ success: false, message: "Institution not found" });
        return;
      }

      // Get lab ID from request parameters
      const labId = req.params.labId;
      if (!mongoose.Types.ObjectId.isValid(labId)) {
        res.status(400).json({ success: false, message: "Invalid lab ID" });
        return;
      }

      // Find lab by ID
      const lab = await Lab.findById(labId);
      if (!lab || lab.institution.toString() !== institutionId) {
        res.status(404).json({ success: false, message: "Lab not found in the specified institution" });
        return;
      }

      // Delete lab
      await Lab.findByIdAndDelete(labId);
      res.status(204).json({ success: true, message: "Lab deleted successfully" });
      return;
    } catch (error) {
      // General error handling
      console.error("Error deleting lab: ", error);
      res.status(500).json({ success: false, message: "Internal server error" });
      return;
    }
  }
);



// export this to be used as middleware in express
export default router;
