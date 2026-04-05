import User from "../../models/User";
import Token from "../../models/Token";
import express, { Router, Request, Response, NextFunction } from "express";
import Experiment from "../../models/Experiment";
import ColumnDefinition from "../../models/ColumnDefinition";
import mongoose from "mongoose";
import FileType from "../../models/FileType";
import Column from "../../models/Column";
import { IColumn } from "../../models/Column";
import Site from "../../models/Site";

let router: Router = express.Router();

// Define the parameter types for requests
interface VerifyParams {
  id: string;
  token: string;
}

interface StatusParams {
  id: string;
}



async function createPlayerTransformsFileType(experimentId: String): Promise<String> {
  // Create the FileType first
  const fileType = await FileType.create({
    name: 'PlayerTransforms',
    experimentId: experimentId,
    extension: 'csv',
    description: 'Transforms of various tracked player components, including the XR headset and controllers',
  });

  // Create the ColumnDefinition for this FileType
  const colDef = await ColumnDefinition.create({
    fileTypeId: fileType._id,
    columns: [],
  });

  // Define the Columns to create
  const colsToCreate: Array<Partial<IColumn>> = [
    {
      columnDefinitionId: colDef._id,
      dataType: 'Date',
      name: 'ts',
      description: 'Time when the event occurred',
      order: 1,
    },
    {
      columnDefinitionId: colDef._id,
      dataType: 'String',
      name: 'eventId',
      description: 'Unique identifier for each event',
      order: 2,
    },
    {
      columnDefinitionId: colDef._id,
      dataType: 'Transform',
      name: 'Transform',
      description: 'Transform of the player component',
      order: 3,
    },
  ];

  // Create each Column and collect their IDs
  const createdCols = await Promise.all(
    colsToCreate.map(colData => Column.create(colData))
  );
  const colIds = createdCols.map(c => c._id);

  // Update ColumnDefinition with the new Column IDs
  colDef.columns = colIds;
  await colDef.save();

  // Update FileType with the ColumnDefinition ID
  fileType.columnDefinition = new mongoose.Types.ObjectId(colDef._id.toString());
  await fileType.save();

  // 7) Return the new FileType’s ID
  return fileType._id.toString();
}

async function createCubeRotationFileType(experimentId: String): Promise<String> {
  // Create the FileType first
  const fileType = await FileType.create({
    name: 'CubeRotation',
    experimentId: experimentId,
    extension: 'csv',
    description: 'The rotation of a demonstrative cube, alongside a simple per-frame message log',
  });

  // Create the ColumnDefinition for this FileType
  const colDef = await ColumnDefinition.create({
    fileTypeId: fileType._id,
    columns: [],
  });

  // Define the Columns to create
  const colsToCreate: Array<Partial<IColumn>> = [
    {
      columnDefinitionId: colDef._id,
      dataType: 'Date',
      name: 'ts',
      description: 'Time when the event occurred',
      order: 1,
    },
    {
      columnDefinitionId: colDef._id,
      dataType: 'String',
      name: 'eventId',
      description: 'Unique identifier for each event',
      order: 2,
    },
    {
      columnDefinitionId: colDef._id,
      dataType: 'String',
      name: 'Message',
      description: 'Simple demonstrative per-frame message log',
      order: 3,
    },
    {
      columnDefinitionId: colDef._id,
      dataType: 'String',
      name: 'Rotation',
      description: 'The rotation of the demonstrative cube',
      order: 4,
    },
  ];

  // Create each Column and collect their IDs
  const createdCols = await Promise.all(
    colsToCreate.map(colData => Column.create(colData))
  );
  const colIds = createdCols.map(c => c._id);

  // Update ColumnDefinition with the new Column IDs
  colDef.columns = colIds;
  await colDef.save();

  // Update FileType with the ColumnDefinition ID
  fileType.columnDefinition = new mongoose.Types.ObjectId(colDef._id.toString());
  await fileType.save();

  // 7) Return the new FileType’s ID
  return fileType._id.toString();
}

/**
 * @route   PATCH  api/email/:id/verify/:token
 * @desc    Verifies user account with a token
 * @returns {200} - User verified successfully
 * @returns {400} - Invalid User
 * @access  public
 */
router.patch(
  "/:id/verify/:token",
  async (req: Request<VerifyParams>, res: Response): Promise<void> => {
    try {
      // Get user and ensure they exist
      const user = await User.findOne({ _id: req.params.id });
      if (!user) {
        res.status(404).send({ success: false, message: "User not found" });
        return;
      }

      // Get token and ensure it exists
      // Use `user._id` to ensure it's consistent with how MongoDB handles ObjectId
      const token = await Token.findOne({
        userId: user._id, // Ensuring the correct field
        token: req.params.token,
      });
      if (!token) {
        res.status(404).send({ success: false, message: "No token found" });
        return;
      }

      // Verify user and delete token
      await User.updateOne({ _id: user._id }, { verified: true });
      await Token.deleteOne({ _id: token._id });

      console.log("Checking to see if experiment exists")
      // Check if we already have an existing experiment
      const existingExp = await Experiment.findOne({ createdBy: user._id });
      if (existingExp) {
        console.log("Experiment already exists")
        res.status(200).send({ success: true, message: "User verified successfully" });
        return;
      }

      const newExp = new Experiment({
        createdBy: user._id,
        collaborators: [],
        name: "Demo Experiment (" + user.email + ")",
        description: "A default demonstrative experiment for new users",
        irbProtocolNumber: "1234",
        irbLetter: "",
        irbLetterName: "",
        isMultiSite: false,
      });
      await newExp.save();

      // Create default site
      const defaultSite = {
        name: "Default Site",
        shortName: "SITE",
        parentExperiment: newExp._id,
      };
      const site = await Site.create(defaultSite);

      newExp.sites.push(new mongoose.Types.ObjectId(site._id));
      await newExp.save();

      // Create the file types for the experiment
      const transformsFileType = await createPlayerTransformsFileType(newExp._id.toString());
      const cubeFileType = await createCubeRotationFileType(newExp._id.toString());

      res.status(200).send({ success: true, message: "User verified successfully" });
      return;
    } catch (error) {
      // General error handling
      console.error("Error while verifying: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   GET  api/email/:id/verificationstatus
 * @desc    Check Verification Status of user.
 * @returns {200} - User verification status
 * @returns {404} - User not found
 * @returns {500} - Internal Server Error
 * @access  public
 */
router.get(
  "/:id/verificationstatus",
  async (req: Request<StatusParams>, res: Response): Promise<void> => {
    try {
      // Ensure user exists
      const user = await User.findOne({ _id: req.params.id });
      if (!user) {
        res.status(404).send({ success: false, message: "Invalid User" });
        return;
      }

      // Return verification status
      res.status(200).json({ success: true, verified: user.verified });
      return;
    } catch (error) {
      // General error handling
      console.error("Error while checking verification status: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);

export default router;
