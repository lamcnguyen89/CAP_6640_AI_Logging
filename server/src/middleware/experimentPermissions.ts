import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Experiment from "../models/Experiment";

/**
 * Middleware to check whether the caller has a specific collaboration permission level for an experiment.
 * 
 * @param requiredRole - The minimum permission level required to access the route ("Creator" | "Admin" | "Developer" | "Member").
 * @param allowCreator - If true, the creator of the experiment is allowed access; if false, the creator is denied access.
 * 
 * Uses the experimentId from the request parameters to find the experiment.
 */
export const requireExperimentPermission = (
  requiredRole: "Creator" | "Admin" | "Developer" | "Member",
  allowCreator: boolean = true
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get experiment ID from request parameters
      const experimentId = req.params.experimentId || req.params.id;

      // Ensure experimentId is provided
      if (!experimentId) {
        res
          .status(400)
          .json({ success: false, message: "Experiment ID not provided" });
        return;
      }

      // Ensure experimentId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(experimentId)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid experiment ID format" });
        return;
      }

      // Get the authenticated user
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Calling user is not authenticated",
        });
        return;
      }

      // Find the experiment and ensure it exists, populating collaborators
      const experiment = await Experiment.findById(experimentId).populate(
        "collaborators.user"
      );

      if (!experiment) {
        res.status(404).json({
          success: false,
          message: "Experiment not found by given ID",
        });
        return;
      }

      // Check if user is the creator
      if (experiment.createdBy.toString() === userId) {
        // Check if creator access is allowed
        if (allowCreator) {
          // Attach experiment to request for potential use in route handler
          (req as any).experiment = experiment;
          (req as any).userRole = 'Creator';
          next();
          return;
        } else {
          res.status(403).json({ success: false, message: "Access denied: Creator access not allowed for this route", });
          return;
        }
      }

      // Ensure user is a collaborator on the experiment
      const collaborator = experiment.collaborators.find(
        (collab) => collab.user.id.toString() === userId
      );

      if (!collaborator) {
        res.status(403).json({ success: false, message: "Access denied: User is not a collaborator on this experiment", });
        return;
      }

      // Define permission hierarchy (Admin > Developer > Member)
      const permissionHierarchy = {
        Member: 1,
        Developer: 2,
        Admin: 3,
      };

      const userPermissionLevel = permissionHierarchy[collaborator.permissionRole];
      const requiredPermissionLevel = permissionHierarchy[requiredRole];

      // Check if collaborator has the required permission level
      if (userPermissionLevel < requiredPermissionLevel) {
        res.status(403).json({
          success: false,
          message: `Access denied: ${requiredRole} permission required, user has ${collaborator.permissionRole} permission`,
        });
        return;
      }

      // User has proper permissions; attach experiment and user's role to request for potential use in route handler
      (req as any).experiment = experiment;
      (req as any).userRole = collaborator.permissionRole;

      next();
    } catch (error) {
      console.error("Error checking experiment permissions:", error);
      res.status(500).json({ success: false, message: "Internal server error while checking permissions", });
      return;
    }
  };
};

// Additional middleware functions for specific permission levels
export const requireExperimentAdmin = requireExperimentPermission("Admin"); // User is an admin collaborator or creator
export const requireExperimentDeveloper = requireExperimentPermission("Developer"); // User is a developer collaborator (or greater) or creator
export const requireExperimentMember = requireExperimentPermission("Member"); // User is a collaborator of any level, or creator
export const requireExperimentCollaboratorNoOwner = requireExperimentPermission("Member", false); // User is a collaborator of any level, not the owner
export const requireExperimentCreator = requireExperimentPermission("Creator"); // User is the creator of the experiment
