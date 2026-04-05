import express, { Request, Response, NextFunction } from "express";
import { Dropbox } from "dropbox";
import fetch from "node-fetch";
import User from "../../models/User";
import passport from "passport";
import { errRes } from "../../common/utilities";
import { processCsvLogs } from "../../utils/csvHelper";

const router = express.Router();

/**
 * @route   GET api/dropbox/callback
 * @desc    After setting up the OAuth 2.0 Authorization flow in the front end, this route handles the OAuth 2.0 callback from Dropbox after user that owns the Dropbox App grants permission to the Vera Project
 * @returns {400} -
 * @returns {404} -
 * @returns {409} -
 * @returns {500} -
 * @returns {201} -
 * @access  private
 */
router.get("/callback", async (req: any, res: any, next: NextFunction) => {
  // Extract query parameters
  // code: is the short-lived auth code from the Dropbox redirect done on the front end
  // state: Originally passed to Dropbox as auth.user.id (npw returned for verification)
  const { code, state: userId } = req.query as Record<string, string>;
  if (!code || !userId) {
    console.error("Missing Dropbox OAuth code or state");
    const redirectTo = `${process.env.BASE_URL}/Account`;
    return res.redirect(redirectTo);
    // return res.status(400).json(errRes("Missing Dropbox OAuth code or state"));
  }

  // Configure Dropbox SDK
  try {
    console.log("CLIENT_BASE_URL=", process.env.BASE_URL);
    console.log("ClientID: ", process.env.DROPBOX_CLIENT_ID);

    // redirectUri must match exactly what was registered in Dropbox's App Settings
    const redirectUri = `${req.protocol}://${req.get(
      "host"
    )}/vera-portal/api/dropbox/callback`;

    // The Dropbox SDK is initialized with the Client Secret Key
    const dbx = new Dropbox({
      clientId: process.env.DROPBOX_CLIENT_ID!, // Client ID for Dropbox app
      clientSecret: process.env.DROPBOX_CLIENT_SECRET!, // Secret Key to access Dopbox app
      fetch, // Polyfill for Node.js (Dropbox SDK uses Fetch API)
    });

    // Calls Dropbox's /oauth2/token endpoint internally to swap code for an access token
    const tokenRes = await (dbx as any).auth.getAccessTokenFromCode(
      redirectUri,
      code
    );
    // Set returned long-lived access token as a variable
    const accessToken: string = tokenRes.result.access_token;

    // Find the user and save the long-lived access token to the User's database entry
    await User.findByIdAndUpdate(userId, { dropboxToken: accessToken });

    // After Saving, redirect back to the dashboard
    const redirectTo = `${process.env.BASE_URL}/Dashboard`;
    return res.redirect(redirectTo);
  } catch (err) {
    console.error("Dropbox OAuth failed:", err);
    return next(err);
  }
});

/**
 * @route   GET api/dropbox/account
 * @desc  attempts to connect to dropbox account with Authentication token stored in database
 * @returns {400} -
 * @returns {404} -
 * @returns {409} -
 * @returns {500} -
 * @returns {201} -
 * @access  private
 */
router.get(
  "/account",
  passport.authenticate("jwt", { session: false }),
  async (req: any, res: any, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user?.dropboxToken) {
        return res.status(404).json({ error: "Dropbox not connected" });
      }

      const dbx = new Dropbox({ accessToken: user.dropboxToken, fetch });
      const info = await dbx.usersGetCurrentAccount();
      res.json(info.result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route  DELETE  api/dropbox/account
 * @desc   Deletes dropbox token
 * @returns {200} - Profile updated
 * @returns {400} - Password requirements not met
 * @returns {403} - Current password not matching
 * @returns {409} - Email already exists
 * @returns {500} - Internal server error
 * @access private
 */
router.delete(
  "/account",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let userId = req.user.id;
    console.log("User ID:", userId)
    try {
      // Update user

      try {
        await User.findByIdAndUpdate(userId, { dropboxToken: "" });
        console.log("User Profile Updated");
        res.status(200).json({ success: true, message: "Dropbox Unlinked" });
        return;
      } catch (error) {
        console.error("Error while patching user: ", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error });
        return;
      }
    } catch (error) {
      console.error("Error while patching user: ", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error });
      return;
    }
  }
);



export default router;
