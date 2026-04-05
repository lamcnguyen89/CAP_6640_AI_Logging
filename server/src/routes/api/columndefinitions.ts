import express from "express";
import passport from "passport";
import mongoose from "mongoose";
import ColumnDefinition from "../../models/ColumnDefinition";
import Column from "../../models/Column";
import FileType from "../../models/FileType";

const router = express.Router();
router.use(express.json());



/**
 * @route   POST api/columndefinitions/
 * @desc    Create a new column definition with given columns
 * @returns {400} - Bad request, missing fields
 * @returns {404} - File type not found by ID
 * @returns {403} - User is not authorized to create column definitions for this file type
 * @returns {500} - Internal server error
 * @returns {201} - Column def created
 * @access  private
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from body
    let { fileTypeId, columns } = req.body;

    try {
      // Validate file type ID
      if (!fileTypeId || !mongoose.Types.ObjectId.isValid(fileTypeId)) {
        res.status(400).json({ success: false, message: "Missing or invalid file type ID" });
        return;
      }

      // Ensure file type exists by ID
      const fileType = await FileType.findById(fileTypeId);
      if (!fileType) {
        res.status(404).json({ success: false, message: "File type not found by given ID" });
        return;
      }

      // Create empty column definition
      const columnDefInfo = new ColumnDefinition({
        fileTypeId: fileTypeId,
        columns: [],
      });

      let newColumnDef = await columnDefInfo.save();

      // Create columns from request body
      if (columns) {
        for (let col of columns) {
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
      fileType.columnDefinition = newColumnDef.id;
      await fileType.save();

      res.status(201).json({ success: true, columnDefinition: newColumnDef, _id: newColumnDef._id });
      return;
    } catch (error) {
      console.error("Error creating column definition: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   GET api/columndefinitions/:columnDefinitionId
 * @desc    Get column def by ID
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Column definition not found by ID
 * @returns {200} - Column definition found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:columnDefinitionId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params
    let { columnDefinitionId } = req.params;

    try {
      // Validate columnDefinitionId ID
      if (!columnDefinitionId || !mongoose.Types.ObjectId.isValid(columnDefinitionId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column definition ID" });
        return;
      }

      // Ensure column def exists by ID
      const columnDefinition = await ColumnDefinition.findById(columnDefinitionId).populate("columns");
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      res.status(200).json({ success: true, columnDefinition });
      return;
    } catch (error) {
      console.error("Error getting column definition: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   PATCH api/columndefinitions/:columnDefinitionId
 * @desc    Update column def by ID
 * @returns {404} - Column definition not found by ID
 * @returns {200} - Column definition updated
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/:columnDefinitionId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params and body
    const { columnDefinitionId } = req.params;
    const { columns } = req.body; // expected to be an array of { _id, order } objects

    try {
      // Ensure column def exists by ID
      let columnDefinition = await ColumnDefinition.findById(columnDefinitionId);
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      if (columns) {
        // Bulk update each Column’s order field
        const operations = columns.map(({ _id, order }) => ({
          updateOne: {
            filter: { _id },
            update: { order }
          }
        }));

        await Column.bulkWrite(operations);
      }

      res.status(200).json({ success: true, message: 'Column definition updated successfully' });
      return;
    } catch (error) {
      console.error("Error updating column definition: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   DELETE api/columndefinitions/:columnDefinitionId
 * @desc    Delete column def by ID, along with all associated columns
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Column definition not found by ID
 * @returns {200} - Column definition deleted
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:columnDefinitionId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params
    let { columnDefinitionId } = req.params;

    try {
      // Validate columnDefinitionId ID
      if (!columnDefinitionId || !mongoose.Types.ObjectId.isValid(columnDefinitionId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column definition ID" });
        return;
      }

      // Ensure column def exists by ID
      const columnDefinition = await ColumnDefinition.findById(columnDefinitionId);
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      // Get column definition's file type
      const fileType = await FileType.findById(columnDefinition.fileTypeId);

      if (!fileType) {
        res.status(404).json({ success: false, message: "File type not found by column definition's file type ID" });
        return;
      }

      // Delete each column
      for (let column of columnDefinition.columns) {
        await Column.findByIdAndDelete(column);
      }

      // Delete column definition
      await ColumnDefinition.findByIdAndDelete(columnDefinitionId);

      // Remove column definition from parent file type
      fileType.columnDefinition = null;
      await fileType.save();

      res.status(200).json({ success: true, message: "Column definition deleted" });
      return;
    } catch (error) {
      console.error("Error deleting column definition: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   POST api/columndefinitions/columns/
 * @desc    Create a new column
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Column definition not found by ID
 * @returns {403} - User is not authorized to edit this column definition
 * @returns {500} - Internal server error
 * @returns {201} - Column created
 * @access  private
 */
router.post(
  "/:columnDefinitionId/columns/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params and body
    let { columnDefinitionId } = req.params;
    let { name, description, dataType, transform } = req.body;

    try {
      // Validate columnDefinitionId
      if (!columnDefinitionId || !mongoose.Types.ObjectId.isValid(columnDefinitionId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column definition ID" });
        return;
      }

      // Validate fields
      if (!name || !dataType) {
        res.status(400).json({ success: false, message: "Missing required fields (name or dataType)" });
        return;
      }

      // Ensure column def exists by ID
      const columnDefinition = await ColumnDefinition.findById(columnDefinitionId);
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      // Create column
      const columnInfo = new Column({
        columnDefinitionId,
        name,
        description,
        dataType,
        transform,
        order: columnDefinition.columns.length + 1,
      });

      const newColumn = await columnInfo.save();

      // Update column definition with new column
      columnDefinition.columns.push(newColumn._id);
      await columnDefinition.save();

      res.status(201).json({ success: true, column: newColumn, _id: newColumn._id });
      return;
    } catch (error) {
      console.error("Error creating column: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   GET api/columndefinitions/:columnDefinitionId/columns/:columnId
 * @desc    Get column by ID
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Column definition not found by ID, Column not found by ID
 * @returns {200} - Column found
 * @returns {500} - Internal server error
 * @access  private
 */
router.get(
  "/:columnDefinitionId/columns/:columnId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params
    let { columnDefinitionId, columnId } = req.params;

    try {
      // Validate IDs
      if (!columnDefinitionId || !mongoose.Types.ObjectId.isValid(columnDefinitionId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column definition ID" });
        return;
      }
      if (!columnId || !mongoose.Types.ObjectId.isValid(columnId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column ID" });
        return;
      }

      // Ensure column def exists by ID
      const columnDefinition = await ColumnDefinition.findById(columnDefinitionId);
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      // Ensure column exists by ID
      const column = await Column.findById(columnId);
      if (!column) {
        res.status(404).json({ success: false, message: "Column not found by given ID" });
        return;
      }

      res.status(200).json({ success: true, column });
      return;
    } catch (error) {
      console.error("Error getting column: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   PATCH api/columndefinitions/:columnDefinitionId/columns/:columnId
 * @desc    Update column def by ID
 * @returns {404} - Column definition not found by ID, Column not found by ID
 * @returns {403} - User is not authorized to edit this column definition
 * @returns {400} - Bad request, missing fields
 * @returns {200} - Column updated
 * @returns {500} - Internal server error
 * @access  private
 */
router.patch(
  "/:columnDefinitionId/columns/:columnId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params and body
    const { columnDefinitionId, columnId } = req.params;
    const { name, description, dataType, transform } = req.body;

    try {
      // Validate IDs
      if (!columnDefinitionId || !mongoose.Types.ObjectId.isValid(columnDefinitionId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column definition ID" });
        return;
      }
      if (!columnId || !mongoose.Types.ObjectId.isValid(columnId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column ID" });
        return;
      }

      // Validate at least one field
      if (!name && !description && !dataType && !transform) {
        res.status(400).json({ success: false, message: "At least one field is required to update (name, description, dataType, or transform)" });
        return;
      }

      // Ensure column def exists by ID
      const columnDefinition = await ColumnDefinition.findById(columnDefinitionId);
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      // Ensure column exists by ID
      const column = await Column.findById(columnId);
      if (!column) {
        res.status(404).json({ success: false, message: "Column not found by given ID" });
        return;
      }

      // Update column
      if (name) column.name = name;
      if (description) column.description = description;
      if (dataType) column.dataType = dataType;
      if (transform) column.transform = transform;
      await column.save();

      res.status(200).json({ success: true, message: 'Column updated successfully.' });
      return;
    } catch (error) {
      console.error("Error updating column: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



/**
 * @route   DELETE api/columndefinitions/:columnDefinitionId/columns/:columnId
 * @desc    Delete column def by ID, along with all associated columns
 * @returns {400} - Bad request, missing fields
 * @returns {404} - Column definition not found by ID, Column not found by ID
 * @returns {200} - Column deleted
 * @returns {500} - Internal server error
 * @access  private
 */
router.delete(
  "/:columnDefinitionId/columns/:columnId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Get info from params and body
    const { columnDefinitionId, columnId } = req.params;

    try {
      // Validate IDs
      if (!columnDefinitionId || !mongoose.Types.ObjectId.isValid(columnDefinitionId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column definition ID" });
        return;
      }

      if (!columnId || !mongoose.Types.ObjectId.isValid(columnId)) {
        res.status(400).json({ success: false, message: "Missing or invalid column ID" });
        return;
      }

      // Ensure column def exists by ID
      const columnDefinition = await ColumnDefinition.findById(columnDefinitionId);
      if (!columnDefinition) {
        res.status(404).json({ success: false, message: "Column definition not found by given ID" });
        return;
      }

      // Ensure column exists by ID
      const column = await Column.findById(columnId);
      if (!column) {
        res.status(404).json({ success: false, message: "Column not found by given ID" });
        return;
      }

      // Delete column
      await Column.findByIdAndDelete(columnId);

      // Update column definition with removed column
      await ColumnDefinition.findByIdAndUpdate(
        columnDefinitionId,
        { $pull: { columns: columnId } },
        { new: true }
      );

      res.status(200).json({ success: true, message: 'Column deleted successfully.' });
      return;
    } catch (error) {
      console.error("Error deleting column: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



// export this to be used as middleware in express
export default router;
