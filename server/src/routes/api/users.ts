import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import keys from "../../config/keys"
import { logger } from "../../utils/logger"
import passport from "passport"
import { errRes } from "../../common/utilities"
import crypto from "crypto"
import User from "../../models/User"
import Token from "../../models/Token"
import Experiment from "../../models/Experiment"
import sendEmail from "../../utils/sendEmail"
import mongoose from "mongoose"
import deleteMethods2 from "../../common/deleteMethods2"
import { Request, Response } from "express"
import UnityUserToken from "../../models/UnityUserToken"
import Institution from "../../models/Institution"
import Lab from "../../models/Lab"

const passwordRestrictions =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const emailIsValid = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}

/**
 * @desc    Generates a random string for use in password (ensures generation of a valid password)
 * @access  private
 */
const generateRandomString = () => {
  // Set up alphabet for password generation
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const specialCharacters = "!@#$%^&*()_+[]{}|;:,.<>?/"
  const allCharacters = lowercase + uppercase + numbers + specialCharacters

  let result = ""

  // Ensure at least one of each required character type
  result += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  result += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  result += numbers.charAt(Math.floor(Math.random() * numbers.length))
  result += specialCharacters.charAt(Math.floor(Math.random() * specialCharacters.length))

  // Fill the remaining length with random characters
  for (let i = 4; i < 15; i++) {
    result += allCharacters.charAt(Math.floor(Math.random() * allCharacters.length))
  }

  // Shuffle the string to avoid predictable character placement
  result = result.split('').sort(() => 0.5 - Math.random()).join('')

  return result
}

// parse all JSON coming into these routes
const router = express.Router()
router.use(express.json())



/**
 * @route   POST  api/users/register
 * @desc    Registers user and sends verification email, creates user in simple "setup" mode (no name, institution, etc.)
 * @returns {200} - Successful registration and email sent
 * @returns {400} - Password requirements not met
 * @returns {401} - ReCaptcha failure
 * @returns {409} - Email already exists
 * @returns {500} - Internal server error
 * @access  public
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Registration attempted")

    // Verify the reCAPTCHA token
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY
    const captchaToken = req.body.captchaToken
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${captchaToken}`
    // const recaptchaResponse = await fetch(verifyUrl, { method: "POST" });
    // const recaptchaResult = await recaptchaResponse.json();

    const recaptchaResult = {
      "success": true,
      // "2025-02-04T17:30:02Z" format
      "challenge_ts": new Date().toISOString(),
      "hostname": "sreal.ucf.edu",
      "score": 0.9,
      "action": "login"
    }


    let success = recaptchaResult.success
    if (process.env.MODE == "development") {
      success = true
    }

    if (!success) {
      logger.error("reCAPTCHA verification failed", recaptchaResult)
      res.status(401).json(errRes("reCAPTCHA verification failed"))
      return
    }

    // Password validation
    if (!passwordRestrictions.test(req.body.password)) {
      logger.error("Hard Password requirements not met")
      res.status(400).json(errRes("Hard Password requirements not met"))
      return
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email: req.body.email })
    if (existingUser) {
      console.log("User found")
      logger.error("Email already exists", { email: req.body.email })
      res.status(409).json(errRes("Email already exists"))
      return
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(req.body.password, salt)

    // Create and save the user
    // NOTE: In incomplete state, cannot login until verified
    const user = new User({ ...req.body, password: hashPassword, setupIncomplete: true })
    await user.save()

    // Create and save the token
    const token = new Token({
      userId: user.id,
      token: crypto.randomBytes(32).toString("hex"),
    })
    await token.save()
    logger.info("Verification token created for user", { userId: user._id })

    // Create and save a Unity token
    const unityToken = new UnityUserToken({
      user: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    })
    await unityToken.save()
    logger.info("Unity token created for user", { userId: user._id })

    // Construct the verification URL
    const url = `${process.env.BASE_URL}/users/${user.id}/verify/${token.token}`

    // Email content
    const subject = "VERA Account Verification"
    const textBody = `Dear User,\n\nThank you for registering with VERA.\n\nPlease click on the link below to verify your account:\n${url}\n\nIf you did not create an account, please ignore this email.\n\nBest regards,\nThe VERA Team`

    const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VERA Account Verification</title></head><body style="font-family: Arial, sans-serif; margin: 0; padding: 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f2f2;"><tr><td align="center"><table width="600" cellpadding="20" cellspacing="0" border="0" style="background-color: #ffffff;"><tr><td align="center" style="background-color: #1a73e8; color: #ffffff;"><h1>Welcome to VERA!</h1></td></tr><tr><td><p>Dear User,</p><p>Thank you for registering with VERA. Please verify your email address to complete your registration.</p><p style="text-align: center;"><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Your Account</a></p><p>If you did not create an account, please ignore this email.</p><p>Best regards,<br>The VERA Team</p></td></tr><tr><td align="center" style="font-size: 12px; color: #999999;"><p>&copy; ${new Date().getFullYear()} VERA. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`

    // Send the email
    sendEmail(
      {
        from: process.env.EMAIL_SENDER,
        to: user.email,
        subject: subject,
        text: textBody,
        html: htmlBody,
      },
      (error, info) => {

        console.log("Received email callback")
        if (error) {
          console.error("Error sending email: ", error)
          logger.error("Error sending email for user registration", { email: user.email, error: error })
          res.status(500).json({ success: false, message: "Error sending email", error: error })
          return
        } else {
          console.log("Email sent successfully:", info)
          logger.info("User registered and email sent", { email: user.email, info: info })
          res.status(200).json({ success: true, message: "User registered and email sent" })
          return
        }
      }
    )
  } catch (error) {
    // General error handling
    console.error("Registration error:", error)
    logger.error("Error during user registration", { error: error })
    res.status(500).json({ success: false, message: "Internal server error", error: error })
  }
})



/**
 * @route   POST  api/users/invitenewuser
 * @desc    Lets an administrator create a new user and sends verification email
 * @returns {200} - User invited and email sent
 * @returns {401} - Caller is not an admin
 * @returns {409} - Email already exists by ID
 * @returns {500} - Internal server error
 * @access  private
 */
router.post(
  "/invitenewuser",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Check if caller is an admin
      const caller = await User.findById(req.user.id)
      if (!caller.admin) {
        res.status(401).json(errRes("Unauthorized"))
        return
      }

      User.findOne({ email: req.body.email }).then(async (user) => {
        // Ensure email does not exist for a user
        if (user) {
          res.status(409).json(errRes("User already exists with provided email"))
          return
        } else {
          // Generate random password for new user
          const generatedPassword = generateRandomString()
          const salt = await bcrypt.genSalt(10)
          const hashPassword = await bcrypt.hash(generatedPassword, salt)

          // Create new user and new token
          user = await new User({ ...req.body, password: hashPassword })

          const token = await new Token({
            userId: user.id,
            token: crypto.randomBytes(32).toString("hex"),
          })

          // Prepare verification email
          const url = `${process.env.BASE_URL}/users/${user.id}/verify/${token.token}`

          try {
            const textBody = `Dear User,

You've been invited to create an account on the VERA server for testing and feedback.

Your temporary password is: ${generatedPassword}

Please click on the link below to verify your account and log in:
${url}

Best regards,
The VERA Team`
            const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VERA Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Dear User,</p>
  <p>You've been invited to create an account on the VERA server for testing and feedback.</p>
  <p>Your temporary password is: <strong>${generatedPassword}</strong></p>
  <p>Please click on the link below to verify your account and log in:</p>
  <p><a href="${url}" style="color: #1a73e8;">Set Your Password</a></p>
  <p>Best regards,<br>The VERA Team</p>
</body>
</html>
`

            // Send verification email
            await sendEmail(
              {
                from: process.env.EMAIL_SENDER,
                to: user.email,
                subject: "VERA: Reset Password",
                text: textBody,
                html: htmlBody,
              },
              (error, info) => {
                if (error == undefined) {
                  user.save()
                  token.save()
                  res.status(200).json({ success: true, message: "User invited and email sent" })
                  return
                } else {
                  console.error("Error while inviting user: ", error)
                  res.status(500).json({ success: false, message: "Error sending verification email", error: error })
                  return
                }
              }
            )
          } catch (error) {
            console.error("Error while inviting user: ", error)
            res.status(500).json({ success: false, message: "Error sending verification email", error: error })
            return
          }
        }
      })
    } catch (error) {
      console.error("Error while inviting user: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)



/**
 * @route   POST  api/users/forgotpassword
 * @desc    Resets password for a user and sends verification email
 * @returns {200} - User invited and email sent
 * @returns {401} - Caller is not an admin
 * @returns {409} - Email already exists by ID
 * @returns {500} - Internal server error
 * @access  public
 */
router.post("/forgotpassword/", async (req, res) => {
  // Ensure email is given
  const email = req.body.email
  if (!email) {
    res.status(400).json(errRes("No email provided"))
    return
  }

  try {
    // Ensure user exists
    const existingUser = await User.findOne({ email: req.body.email })
    if (!existingUser) {
      res.status(404).json(errRes("No user found"))
      return
    } else {
      // Get token, or save new token
      let token = await Token.findOne({ userId: existingUser.id })
      if (!token) {
        token = await new Token({
          userId: existingUser.id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save()
      }

      // Prepare email
      const url = `${process.env.BASE_URL}/users/${existingUser.id}/forgotpassword/${token.token}`

      try {
        const textBody = `Dear User,
  
          We received a request to reset your password.
          
          Please click on the link below to change your password and log in:
          ${url}
          This link is valid for 10 minutes.
          If you did not request a password reset, please ignore this email.
          
          Best regards,
          The VERA Team`
        const htmlBody = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>VERA Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Dear User,</p>
            <p>We received a request to reset your password.</p>
            <p>Please click on the link below to change your password and log in:</p>
            <p><a href="${url}" style="color: #1a73e8;">Reset Your Password</a></p>
            <p>This link is valid for 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The VERA Team</p>
          </body>
          </html>
          `

        // Send email
        await sendEmail(
          {
            from: process.env.EMAIL_SENDER,
            to: existingUser.email,
            subject: "VERA: Reset Password",
            text: textBody,
            html: htmlBody,
          },
          (error, info) => {
            if (error == undefined) {
              res.status(200).json({ success: true, message: "Reset password email sent to user" })
              return
            } else {
              console.error("Error while sending email: ", error)
              res.status(500).json({ success: false, message: "Error while sending email", error: error })
              return
            }
          }
        )
      } catch (error) {
        console.error("Error while sending email: ", error)
        res.status(500).json({ success: false, message: "Error while sending email", error: error })
        return
      }
    }
  } catch (error) {
    console.error("Error during forgot password: ", error)
    res.status(500).json({ success: false, message: "Internal server error", error: error })
  }
})



/**
 * @route   GET  api/users/:userId/checktoken/:tokenId
 * @desc    Check if token is valid for user
 * @returns {200} - Token is valid
 * @returns {404} - Token not found
 * @returns {500} - Internal server error
 * @access public
 */
router.get("/:userId/checktoken/:tokenId", async (req, res) => {
  let userId = req.params.userId
  let userToken = req.params.tokenId

  console.log("User ID: ", userId)
  console.log("User Token: ", userToken)

  try {
    // Get token for user
    const token = await Token.findOne({
      userId: userId,
      token: userToken,
    })

    // Return whether the token was found
    if (!token) {
      res.status(404).send(errRes("No token found"))
      return
    } else {
      res.status(200).json({ success: true, message: "Token is okay" })
      return
    }
  } catch (error) {
    // General error catch
    console.error("Error while checking token: ", error)
    res.status(500).json({ success: false, message: "Internal server error", error: error })
    return
  }
})



/**
 * @route   GET  api/users/unitytoken
 * @desc    Gets the Unity token for the caller
 * @returns {200} - Token is valid, returns token
 * @returns {404} - Token not found
 * @returns {500} - Internal server error
 * @access public
 */
router.get("/unitytoken", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    console.log("Getting Unity token for user: ", req.user.id)
    // Get Unity token
    const unityToken = await UnityUserToken.findOne({
      user: req.user.id,
    }).populate("user")

    if (!unityToken || unityToken.revoked) {
      res.status(401).send(errRes("Unity token does not exist or has been revoked"))
      return
    }

    // Return whether the token was found
    if (!unityToken) {
      res.status(404).send(errRes("No Unity token found for user"))
      return
    } else {
      res.status(200).json({ success: true, unityToken })
      return
    }
  } catch (error) {
    // General error catch
    console.error("Error while getting Unity token: ", error)
    res.status(500).json({ success: false, message: "Error while getting Unity token", error: error })
    return
  }
})



/**
 * @route   POST  api/users/resetpassword
 * @desc    Resets password from verification email
 * @returns {200} - Successful reset to new pwd
 * @returns {400} - Missing required fields, or invalid pwd
 * @returns {401} - Unauthorized - Token not found
 * @returns {500} - Internal server error
 * @access public
 */
router.post("/:userId/resetpassword", async (req, res) => {
  const userId = req.params.userId
  const { password, token: usertoken } = req.body

  // Validate fields
  if (!userId || !password || !usertoken) {
    res.status(400).json({ message: "Missing required fields" })
    return
  }

  try {
    // Ensure password meets requirements
    if (!passwordRestrictions.test(password)) {
      res.status(400).json({ message: "Password requirements not met" })
      return
    }

    // Check token
    const token = await Token.findOne({
      userId: userId,
      token: usertoken,
    })

    if (!token) {
      res.status(401).send({ message: "No token found" })
      return
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)

    // Save
    await User.findByIdAndUpdate(userId, { password: hashPassword })
    await Token.deleteOne({ _id: token._id })
    res.status(200).json({ success: true, message: "Password reset successfully" })
  } catch (error) {
    // General error catch
    console.error("Error while resetting password: ", error)
    res.status(500).json({ success: false, message: "Internal server error", error: error })
    return
  }
})



/**
 * @route  GET  api/users/self
 * @desc   Gets caller's user profile
 * @returns {200} - User profile found
 * @returns {404} - User not found
 * @returns {500} - Internal server error
 * @access private
 */
router.get(
  "/self",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let userId = req.user.id

    try {
      // Get user profile
      await User.findOne({ _id: userId }).populate("institution").populate("lab").then((retrievedUserData) => {
        if (!retrievedUserData) {
          res.status(404).json(errRes("User not found"))
          return
        }
        console.log("User profile found: ", retrievedUserData)

        let userData

        userData = {
          id: retrievedUserData._id,
          firstName: retrievedUserData.firstName,
          lastName: retrievedUserData.lastName,
          email: retrievedUserData.email,
          institution: retrievedUserData.institution,
          lab: retrievedUserData.lab,
          profileImage: retrievedUserData.profileImage,
          dropboxSynced: retrievedUserData.dropboxToken ? true : false, // Return boolean showing whether Dropbox Token Exists or not
        }



        res.status(200).json({ success: true, user: userData })
        return
      })
    } catch (error) {
      // General error catch
      console.error("Error while getting user: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)

/**
 * @route  GET  api/users or api/users?search={search}
 * @desc   Gets caller's profile or searches users by a given query
 * @returns {200} - User profile found or users found by search
 * @returns {400} - Invalid query format
 * @returns {404} - User not found or no users found by search criteria
 * @returns {500} - Internal server error
 * @access private
 */
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const searchQuery = req.query.search

      if (!searchQuery) {
        // If no search query, return the current user's profile
        const userId = req.user.id
        const userData = await User.findOne({ _id: userId })

        if (!userData) {
          res.status(404).json(errRes("User not found"))
          return
        }

        res.status(200).json({ success: true, user: userData })
        return
      }

      // Ensure search query is a string
      if (typeof searchQuery !== 'string') {
        res.status(400).json({ success: false, message: "Invalid query format" })
        return
      }

      // Find the users matching the search query
      // Search across email, firstName, and lastName fields
      // Exclude the caller's own account from results
      // Limit to 20 results for performance
      const q = searchQuery.trim()
      const users = await User.find({
        $and: [
          { _id: { $ne: req.user.id } }, // Exclude caller's account
          {
            $or: [
              { email: { $regex: q, $options: 'i' } },
              { firstName: { $regex: q, $options: 'i' } },
              { lastName: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      }).limit(20).populate("institution").populate("lab")

      if (users.length === 0) {
        res.status(404).json({ success: true, message: "No users found by search criteria", users: [] })
        return
      }

      // Return the found users
      res.status(200).json({ success: true, users: users })
      return
    } catch (error) {
      // General error catch
      console.error("Error while getting user or searching users: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)

/**
 * @route  PATCH  api/users/
 * @desc   Update user account info
 * @returns {200} - Profile updated
 * @returns {400} - Password requirements not met
 * @returns {403} - Current password not matching
 * @returns {409} - Email already exists
 * @returns {500} - Internal server error
 * @access private
 */
router.patch(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let firstName = req.body.firstName
    let lastName = req.body.lastName
    let email = req.body.email
    let institutionId = req.body.institutionId
    let labId = req.body.labId
    let currentPassword = req.body.currentPassword
    let userId = req.user.id
    let newPassword = req.body.password
    let profileImage = req.body.profileImage

    try {
      // Password Validation
      if (newPassword) {
        if (!passwordRestrictions.test(newPassword)) {
          res.status(400).json(errRes("Password requirements not met"))
          return
        }
      }

      // Check if Email already exists
      if (email) {
        const existingUser = await User.findOne({ email: req.body.email })
        if (existingUser && existingUser.id != userId) {
          res.status(409).json(errRes("Email already exists"))
          return
        }
      }
      // Check if email is valid
      if (email && !emailIsValid(email)) {
        res.status(400).json(errRes("Invalid Email Format"))
        return
      }

      if (newPassword && currentPassword) {
        try {
          // Search for the user and get their password in the database.
          await User.findOne({ _id: userId }).then(async (existingUser) => {
            //Check if the user's set password matches the current password verification that the user sent from the client
            // If they match, continue with code, else return response error
            bcrypt
              .compare(currentPassword, existingUser.password)
              .then(async (isMatch) => {
                console.log("Is Match: ", isMatch)
                if (isMatch == false) {
                  console.log(
                    "The current password you entered does not match the existing account password"
                  )
                  res.status(403).json(errRes("Current password not matching"))
                  return
                }
              })
          })
        } catch (error) {
          console.error("Error while patching user: ", error)
          res.status(500).json({ success: false, message: "Internal server error", error: error })
          return
        }
      }

      // If institutionId is provided, ensure it exists and is valid
      if (institutionId) {
        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
          res.status(400).json(errRes("Invalid institution ID"))
          return
        }
        const institution = await Institution.findById(institutionId)
        if (!institution) {
          res.status(404).json(errRes("Institution not found"))
          return
        }
      }

      // If labId is provided, ensure it exists and is valid
      if (labId) {
        if (!mongoose.Types.ObjectId.isValid(labId)) {
          res.status(400).json(errRes("Invalid lab ID"))
          return
        }
        const lab = await Lab.findById(labId)
        if (!lab) {
          res.status(404).json(errRes("Lab not found"))
          return
        }
      }

      const obj = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        institution: institutionId,
        lab: labId,
        password: newPassword,
        profileImage: profileImage,
      }

      // delete any input fields that are empty
      Object.keys(obj).forEach((k) => obj[k] == "" && delete obj[k])

      // Encrypt password
      if (obj.password) {
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(obj.password, salt)
        obj["password"] = hashPassword
        console.log("Password Exists, salted password: ", obj.password)
      }

      // Update user
      try {
        await User.findByIdAndUpdate(userId, obj)
        console.log("User Profile Updated")
        res.status(200).json({ success: true, message: "Profile updated" })
        return
      } catch (error) {
        console.error("Error while patching user: ", error)
        res.status(500).json({ success: false, message: "Internal server error", error: error })
        return
      }
    } catch (error) {
      console.error("Error while patching user: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)


// Tests the connection to Google
const https = require('https')
function testGoogleConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/',
      method: 'GET'
    }

    const req = https.request(options, res => {
      if (res.statusCode === 200) {
        resolve(true)
      } else {
        reject(new Error(`Failed to connect to Google. Status code: ${res.statusCode}`))
      }
    })

    req.on('error', error => {
      reject(error)
    })

    req.end()
  })
}



// Helper function, verifies the reCAPTCHA token
// Returns true if the token is valid, false otherwise
const captchaVerify = async (captchaToken) => {
  try {
    // Verify the reCAPTCHA token
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${captchaToken}`

    // ReCaptcha verification
    let recaptchaResponse
    // try {
    //   // Catch timeout for this node fetch request

    //   recaptchaResponse = await fetch(verifyUrl, { method: "POST" })
    // } catch {
    //   recaptchaResponse = {
    //     "success": true,
    //     "challenge_ts": "2025-02-04T17:30:02Z",
    //     "hostname": "sreal.ucf.edu",
    //     "score": 0.9,
    //     "action": "login"
    //   }
    // }
    // const recaptchaResult = await recaptchaResponse.json();

    const recaptchaResult = {
      "success": true,
      // "2025-02-04T17:30:02Z" format
      "challenge_ts": new Date().toISOString(),
      "hostname": "sreal.ucf.edu",
      "score": 0.9,
      "action": "login"
    }

    console.log(recaptchaResult)
    console.log(recaptchaSecretKey)

    let success = recaptchaResult.success
    if (process.env.MODE == "development") {
      console.log("We are in dev!")
      success = true // Disable reCAPTCHA in development mode
    }

    return success
  } catch (error) {
    console.error("Error during reCAPTCHA verification: ", error)
    return false // Return false if there's an error
  }
}



// Helper function, sends verification email
// Returns true if the email was sent successfully, false otherwise
const sendVerificationEmail = async (userId: string, userEmail: string) => {
  let token = await Token.findOne({ userId: userId })
  if (!token) {
    token = await new Token({
      userId: userId,
      token: crypto.randomBytes(32).toString("hex"),
    }).save()

  } else if (token) {
    console.log("Old token deleted and new token created")
    await Token.deleteOne({ _id: token._id })
    token = await new Token({
      userId: userId,
      token: crypto.randomBytes(32).toString("hex"),
    }).save()
  }

  const url = `${process.env.BASE_URL}/users/${userId}/verify/${token.token}`

  try {
    const subject = "VERA Account Verification"

    const textBody = `Dear User,

Thank you for registering with VERA.

Please click on the link below to verify your account:
${url}

If you did not create an account, please ignore this email.

Best regards,
The VERA Team`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VERA Account Verification</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f2f2;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="20" cellspacing="0" border="0" style="background-color: #ffffff;">
          <tr>
            <td align="center" style="background-color: #1a73e8; color: #ffffff;">
              <h1>Welcome to VERA!</h1>
            </td>
          </tr>
          <tr>
            <td>
              <p>Dear User,</p>
              <p>Thank you for registering with VERA. Please verify your email address to complete your registration.</p>
              <p style="text-align: center;">
                <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Your Account</a>
              </p>
              <p>If you did not create an account, please ignore this email.</p>
              <p>Best regards,<br>The VERA Team</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 12px; color: #999999;">
              <p>&copy; ${new Date().getFullYear()} VERA. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    await sendEmail(
      {
        from: process.env.EMAIL_SENDER,
        to: userEmail, // Recipient's email
        subject: subject,
        text: textBody,
        html: htmlBody,
      },
      (error, info) => {
        if (error == undefined) {
          return true // Successfully sent email
        }
      }
    )
  } catch (error) {
    console.error("Error while sending email: ", error)
    return false // Failed to send email
  }
}



// Helper function, ensures Unity token exists for user, if it does not, creates one
const ensureUnityToken = async (userId) => {
  // Ensure user has a Unity token; if not, create one
  let unityToken = null
  UnityUserToken.findOne({ user: userId }).then(async (token) => {
    if (!token) {
      unityToken = await new UnityUserToken({
        user: userId,
        token: crypto.randomBytes(32).toString("hex"),
      }).save()
    } else {
      unityToken = token
    }
  })

  return unityToken
}



/**
 * @route  POST  api/users/login
 * @desc   logs in a user
 * @returns {200} - User logged in
 * @returns {400} - Email or password not found / ReCaptcha failure
 * @returns {401} - User is not verified
 * @returns {404} - No user found
 * @returns {500} - Internal server error
 * @access public
 */
router.post("/login", async (req, res) => {
  try {
    // Test connection to Google
    // await testGoogleConnection();
    const email = req.body.email
    const password = req.body.password

    // Verify captcha
    const captchaToken = req.body.captchaToken
    let success = await captchaVerify(captchaToken)
    if (!success) {
      res.status(400).json({ message: "reCAPTCHA verification failed" })
      return
    }

    let verificationEmailSent = false
    logger.info("User login attempt", { email: email })
    console.log("Logging in...", email.toLowerCase())

    // find user by email
    User.findOne({
      email: { $regex: new RegExp("^" + email.toLowerCase() + "$", "i") },
    })
      .then(async (user) => {
        // Ensure user exists
        console.log(user)
        if (!user) {
          logger.warn("User not found during login attempt", { email: email })
          res.status(404).json(errRes("No user found"))
          return
        }

        console.log("User found")
        console.log(user)

        // If user is not verified, send verification email
        if (!user.verified) {
          const emailSent = await sendVerificationEmail(user.id, user.email)
          if (!emailSent) {
            logger.error("Error sending verification email during login", { userId: user.id, email: user.email })
            res.status(500).json(errRes("Error sending verification email"))
            return
          } else {
            logger.info("User is not verified, verification email sent", { userId: user.id, email: user.email })
            res.status(401).json(errRes("User is not verified, verification email sent"))
            return
          }
        } else if (user.setupIncomplete) {
          // If user is verified but setup is incomplete, send such
          logger.warn("User setup is incomplete during login attempt", { userId: user.id, email: user.email })
          res.status(401).json({ success: false, error: "User setup is incomplete", userId: user.id })
          return
        } else {
          bcrypt.compare(password, user.password).then(async (isMatch) => {
            if (isMatch) {
              // Ensure user has a Unity token; if not, create one
              await ensureUnityToken(user.id)

              // user matched, create jwt payload
              const payload = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                dropboxSynced: user.dropboxToken !== undefined && user.dropboxToken !== null,
              }

              // sign token
              jwt.sign(
                payload,
                keys.secretOrKey,
                { expiresIn: "8h" },
                (error, token) => {
                  if (error) {
                    console.error("Error while logging in: ", error)
                    logger.error("Error while logging in user", { userId: user.id, email: user.email, error: error })
                    res.status(500).json({ success: false, message: "Internal server error", error: error })
                    return
                  }

                  logger.info("User logged in successfully", { userId: user.id, email: user.email })
                  res.status(200).json({
                    success: true,
                    token: "Bearer " + token,
                    payload: payload,
                  })
                }
              )
            } else {
              logger.warn("Password mismatch during login attempt", { userId: user.id, email: user.email })
              res.status(400).json(errRes("Email or password not found"))
              return
            }
          })
        }
      })
  } catch (error) {
    logger.error("Error while logging in user", { error: error })
    console.error("Error while logging in user: ", error)
    res.status(500).json({ success: false, message: "Internal server error", error: error })
    return
  }
})



/**
 * @route  PATCH  api/users/:userId/finalizesetup
 * @desc   Finalizes the setup of a particular user (name, institution, etc.) then logs that user in
 * @returns {200} - User finalized and logged in
 * @returns {400} - Invalid input or reCAPTCHA failure
 * @returns {401} - User is not verified
 * @returns {404} - No user, institution, or lab found
 * @returns {500} - Internal server error
 * @access public
 */
router.patch("/:userId/finalizesetup", async (req, res) => {
  try {
    const firstName = req.body.firstName
    const lastName = req.body.lastName
    const institutionId = req.body.institutionId
    const labId = req.body.labId

    const userId = req.params.userId
    console.log("Finalizing setup for user: ", userId)

    // Verify captcha
    const captchaToken = req.body.captchaToken
    let success = await captchaVerify(captchaToken)
    if (!success) {
      res.status(400).json({ message: "reCAPTCHA verification failed" })
      return
    }

    // find user by ID
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json(errRes("No user found"))
      return
    }

    // If user is not verified, send verification email
    if (!user.verified) {
      const emailSent = await sendVerificationEmail(user.id, user.email)
      if (!emailSent) {
        console.error("Error sending verification email")
        res.status(500).json(errRes("Error sending verification email"))
        return
      } else {
        console.log("User is not verified, verification email sent")
        res.status(401).json(errRes("User is not verified, verification email sent"))
        return
      }
    } else {
      // Validate input
      if (!firstName || !lastName) {
        res.status(400).json(errRes("First name and last name are required"))
        return
      }
      if (!mongoose.Types.ObjectId.isValid(institutionId)) {
        res.status(400).json(errRes("Invalid institution ID"))
        return
      }
      if (!mongoose.Types.ObjectId.isValid(labId)) {
        res.status(400).json(errRes("Invalid lab ID"))
        return
      }

      // Ensure institution and lab exist
      const institution = await Institution.findById(institutionId)
      if (!institution) {
        res.status(404).json(errRes("Institution not found"))
        return
      }
      const lab = await Lab.findById(labId)
      if (!lab) {
        res.status(404).json(errRes("Lab not found"))
        return
      }

      // Info is okay, push to user
      user.firstName = firstName
      user.lastName = lastName
      user.institution = institutionId
      user.lab = labId
      user.setupIncomplete = undefined // Unset the incompleteSetup field

      await user.save()

      // Ensure user has a Unity token; if not, create one
      await ensureUnityToken(user.id)

      // Create JWT payload
      const payload = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dropboxSynced: user.dropboxToken !== undefined && user.dropboxToken !== null,
      }

      // sign token
      jwt.sign(
        payload,
        keys.secretOrKey,
        { expiresIn: "8h" },
        (error, token) => {
          if (error) {
            console.error("Error while logging in: ", error)
            res.status(500).json({ success: false, message: "Internal server error", error: error })
            return
          }
          res.status(200).json({
            success: true,
            token: "Bearer " + token,
            payload: payload,
          })
        }
      )
    }
  } catch (error) {
    console.error("Error while logging in user: ", error)
    res.status(500).json({ success: false, message: "Internal server error", error: error })
    return
  }
})




/**
 * @route  GET  api/users/:userId/checkadmin
 * @desc   check admin status of current user
 * @returns {200} - Admin status found
 * @returns {404} - User not found
 * @returns {500} - Internal server error
 * @access private
 */
router.get(
  "/:userId/checkadmin",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      User.findById(req.user.id).then(async (user) => {
        // Ensure user exists
        if (!user) {
          res.status(404).json(errRes("User not found"))
          return
        }
        // Return admin status
        res.status(200).json({ success: true, admin: user.admin })
        return
      })
    } catch (error) {
      // General error catch
      console.error("Error while checking admin status: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)



/**
 * @route  DELETE  api/users/:userId
 * @desc   Deletes user
 * @returns {204} - User deleted
 * @returns {401} - Unauthorized (not admin)
 * @returns {403} - Cannot delete self
 * @returns {404} - User not found
 * @returns {500} - Internal server error
 * @access private
 */
router.delete(
  "/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res): Promise<void> => {
    try {
      // Ensure user exists
      const user = await User.findById(req.user.id)
      if (!user) {
        res.status(404).json(errRes("User not found"))
        return
      }

      if (user.admin) {
        const userIdToDelete = req.params.userId

        // Ensure we are not deleting self
        if (req.user.id === userIdToDelete) {
          res.status(403).json(errRes("Cannot delete logged in user"))
          return
        }

        // Delete Unity token
        const unityToken = await UnityUserToken.findOne({ user: userIdToDelete })
        if (unityToken) {
          await UnityUserToken.findByIdAndDelete(unityToken._id)
        }

        // Get all the user's experiments
        const experiments = await Experiment.find({ userId: userIdToDelete })
        await deleteMethods2.deleteExperiments(experiments, req.user.id, req.serverConfig)

        // Delete user
        try {
          await User.findByIdAndDelete(userIdToDelete)
          console.log("User Deleted")
          res.status(204).json({ success: true, message: "User deleted" })
          return
        } catch (error) {
          console.error("Error while deleting user: ", error)
          res.status(500).json({ success: false, message: "Internal server error", error: error })
          return
        }
      } else {
        res.status(401).json(errRes("Unauthorized, user is not admin"))
        return
      }
    } catch (error) {
      // General error catch
      console.error("Error while deleting user: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)



/**
 * @route  GET  api/users/getallusers
 * @desc   Gets all users
 * @returns {200} - Returns users
 * @returns {500} - Internal server error
 * @access private
 */
router.get(
  "/getallusers",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Get all users
      const allUsers = await User.find()
      res.status(200).json({ success: true, users: allUsers })
    } catch (error) {
      // General error catch
      console.error("Error while getting all users: ", error)
      res.status(500).json({ success: false, message: "Internal server error", error: error })
      return
    }
  }
)

export default router
