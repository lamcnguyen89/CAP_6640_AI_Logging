
import request from "supertest"
import express from "express"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import sendEmail from "../../src/utils/sendEmail"

// Import standardized mock utilities
import {
  createMockUser,
  createMockToken,
  createMockUnityUserToken,
  mockBcrypt,
  mockSendEmail,
  mockCrypto,
  resetAllMocks,
  cleanupAfterTests,
  type MockUser,
  type MockToken,
  type MockUnityUserToken
} from "../utils/mockUtils"

// Mock Models and Dependencies using standardized patterns
jest.mock("../../src/models/User")
jest.mock("../../src/models/Token")
jest.mock("../../src/models/Experiment")
jest.mock('../../src/models/UnityToken')
jest.mock("../../src/utils/sendEmail")
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('crypto')
jest.mock("../../src/common/utilities", () => ({
  errRes: jest.fn((msg: string) => ({ success: false, error: msg }))
}))

// Mock passport BEFORE importing router - this is critical!
jest.mock('passport', () => ({
  authenticate: jest.fn((strategy: string, options?: any) => {
    // Return middleware function that adds req.user and calls next()
    return jest.fn((req: any, res: any, next: any) => {
      // Default authenticated user (will be overridden in individual tests)
      req.user = { id: "testUserId", admin: true }
      next()
    })
  }),
  initialize: jest.fn(() => (req: any, res: any, next: any) => next())
}))

// Import mocked modules with proper typing
import passport from "passport"
import User from "../../src/models/User"
import Token from "../../src/models/Token"
import UnityToken from '../../src/models/UnityUserToken'

// Import router AFTER passport is mocked
import router from "../../src/routes/api/users"

// Type-safe mock declarations
const mockUser = User as any
const mockToken = Token as any
const mockUnityToken = UnityToken as any
const mockSendEmailFn = sendEmail as jest.MockedFunction<typeof sendEmail>
const mockBcryptGenSalt = bcrypt.genSalt as jest.MockedFunction<typeof bcrypt.genSalt>
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>
const mockCryptoRandomBytes = crypto.randomBytes as jest.MockedFunction<typeof crypto.randomBytes>
const mockPassportAuthenticate = passport.authenticate as jest.MockedFunction<typeof passport.authenticate>

// Setup crypto mock
const cryptoMock = mockCrypto();
(crypto.randomBytes as jest.MockedFunction<typeof crypto.randomBytes>) = cryptoMock.randomBytes;
(crypto.createHash as jest.MockedFunction<typeof crypto.createHash>) = cryptoMock.createHash

// Mock console methods to reduce test noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => { }),
  error: jest.spyOn(console, 'error').mockImplementation(() => { }),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => { }),
  info: jest.spyOn(console, 'info').mockImplementation(() => { })
}

// Setup Express app for testing
const app = express()
app.use(express.json())
app.use("/api/users", router)

describe("Users Routes", () => {
  beforeEach(() => {
    resetAllMocks()

    // Setup default passport authentication (authorized user with admin privileges)
    const testUser = createMockUser({
      id: "testUserId",
      admin: true,
      email: "admin@example.com"
    })

    mockPassportAuthenticate.mockImplementation((strategy: string, options?: any) => {
      return jest.fn((req: any, res: any, next: any) => {
        req.user = testUser
        next()
      })
    })
  })

  afterAll(async () => {
    // Restore console methods
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.info.mockRestore()

    await cleanupAfterTests()
  })

  describe("POST /register", () => {
    it("should return 400 if password does not meet requirements", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({ email: "test@example.com", password: "weak", captchaToken: "dummy" })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Hard Password requirements not met")
    })

    it("should return 409 if email already exists", async () => {
      const existingUser = createMockUser({ id: "existing", email: "test@example.com" })
      mockUser.findOne.mockResolvedValue(existingUser)

      const res = await request(app)
        .post("/api/users/register")
        .send({ email: "test@example.com", password: "StrongPass1!", captchaToken: "dummy" })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe("Email already exists")
    })

    it("should register user and send email if all validations pass", async () => {
      // Setup mocks for successful registration
      mockUser.findOne.mockResolvedValue(null)
      mockBcryptGenSalt.mockResolvedValue("mock-salt")
      mockBcryptHash.mockResolvedValue("mock-hashed-password")

      const testUser = createMockUser({
        id: "user1",
        email: "test@example.com"
      })
      const testToken = createMockToken({
        token: "mock-token-123",
        userId: "user1"
      })

      mockUser.prototype.save.mockResolvedValue(testUser)
      mockToken.prototype.save.mockResolvedValue(testToken)
      mockSendEmailFn.mockImplementation(async (mailOptions, callback) => {
        callback(undefined, { response: "Mock email sent successfully" })
        return true
      })

      const res = await request(app)
        .post("/api/users/register")
        .send({ email: "test@example.com", password: "StrongPass1!", captchaToken: "dummy" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe("User registered and email sent")
    })
  })

  describe("POST /invitenewuser", () => {
    it("should return 401 if caller is not admin", async () => {
      // Setup a non-admin user for this test
      const nonAdminUser = createMockUser({
        id: "regularUserId",
        admin: false,
        email: "user@example.com"
      })

      // Mock User.findById to return the non-admin user
      mockUser.findById.mockResolvedValue(nonAdminUser)

      // Mock passport to authenticate but with a non-admin user
      mockPassportAuthenticate.mockImplementation((strategy: string, options?: any) => {
        return jest.fn((req: any, res: any, next: any) => {
          req.user = nonAdminUser
          next()
        })
      })

      const res = await request(app)
        .post("/api/users/invitenewuser")
        .send({ email: "invite@example.com" })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe("Unauthorized")
    })
  })

  describe("POST /forgotpassword", () => {
    it("should return 400 if no email provided", async () => {
      const res = await request(app)
        .post("/api/users/forgotpassword/")
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("No email provided")
    })

    it("should return 404 if user not found", async () => {
      mockUser.findOne.mockResolvedValue(null)

      const res = await request(app)
        .post("/api/users/forgotpassword/")
        .send({ email: "notfound@example.com" })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe("No user found")
    })

    it("should send reset password email if user exists", async () => {
      const testUser = createMockUser({
        id: "user1",
        email: "test@example.com"
      })
      const testToken = createMockToken({
        token: "reset-token-123",
        userId: "user1"
      })

      mockUser.findOne.mockResolvedValue(testUser)
      mockToken.findOne.mockResolvedValue(null)
      mockToken.prototype.save.mockResolvedValue(testToken)
      mockSendEmailFn.mockImplementation(async (mailOptions, callback) => {
        callback(undefined, { response: "Mock reset email sent" })
        return true
      })

      const res = await request(app)
        .post("/api/users/forgotpassword/")
        .send({ email: "test@example.com" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe("Reset password email sent to user")
    })
  })

  describe("GET /:userId/checktoken/:tokenId", () => {
    it("should return 404 if token not found", async () => {
      mockToken.findOne.mockResolvedValue(null)

      const res = await request(app)
        .get(`/api/users/testUserId/checktoken/token123`)

      expect(res.status).toBe(404)
      expect(res.body.error).toBe("No token found")
    })

    it("should return 200 if token is found", async () => {
      const validToken = createMockToken({ token: "token123" })
      mockToken.findOne.mockResolvedValue(validToken)

      const res = await request(app)
        .get(`/api/users/testUserId/checktoken/token123`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe("Token is okay")
    })
  })

  describe("POST /:userId/resetpassword", () => {
    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/users/testUserId/resetpassword")
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.message).toBe("Missing required fields")
    })

    it("should return 400 if password requirements not met", async () => {
      const res = await request(app)
        .post("/api/users/testUserId/resetpassword")
        .send({ password: "weak", token: "dummy" })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe("Password requirements not met")
    })

    it("should return 401 if token not found", async () => {
      mockToken.findOne.mockResolvedValue(null)

      const res = await request(app)
        .post("/api/users/testUserId/resetpassword")
        .send({ password: "StrongPass1!", token: "dummy" })

      expect(res.status).toBe(401)
      expect(res.body.message).toBe("No token found")
    })

    it("should reset password and delete token if successful", async () => {
      const userId = "testUserId"
      const validToken = createMockToken({
        _id: "tokenid1",
        token: "dummy",
        userId
      })

      mockToken.findOne.mockResolvedValue(validToken)
      mockBcryptGenSalt.mockResolvedValue("mock-salt")
      mockBcryptHash.mockResolvedValue("mock-hashed-password")
      mockUser.findByIdAndUpdate.mockResolvedValue({})
      mockToken.deleteOne.mockResolvedValue({})

      const res = await request(app)
        .post(`/api/users/${userId}/resetpassword`)
        .send({ password: "StrongPass1!", token: "dummy" })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe("Password reset successfully")
    })
  }); describe("GET / (profile)", () => {
    it("should return 404 if user not found", async () => {
      // Mock User.findOne to return null (user not found)
      mockUser.findOne.mockResolvedValue(null)

      const res = await request(app).get("/api/users/")

      expect(res.status).toBe(404)
      expect(res.body.error).toBe("User not found")
    })

    it("should return 200 with user profile if found", async () => {
      const testUser = createMockUser({
        id: "testUserId",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com"
      })

      // Mock User.findOne to return the test user
      mockUser.findOne.mockResolvedValue(testUser)

      const res = await request(app).get("/api/users/")

      expect(res.status).toBe(200)

      // Check specific user properties instead of deep equality to avoid serialization issues
      expect(res.body.user.id).toBe(testUser.id)
      expect(res.body.user.firstName).toBe(testUser.firstName)
      expect(res.body.user.lastName).toBe(testUser.lastName)
      expect(res.body.user.email).toBe(testUser.email)
      expect(res.body.user.type).toBe(testUser.type)
    })
  })

  describe("PATCH / (update user)", () => {
    it("should return 400 if password requirements not met", async () => {
      const res = await request(app)
        .patch("/api/users/")
        .send({ password: "weak" })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Password requirements not met")
    })

    it("should return 409 if email already exists", async () => {
      const existingUser = createMockUser({
        id: "otherUser",
        email: "duplicate@example.com"
      })

      // Mock User.findOne to return an existing user with the duplicate email
      mockUser.findOne.mockResolvedValue(existingUser)

      const res = await request(app)
        .patch("/api/users/")
        .send({ email: "duplicate@example.com" })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe("Email already exists")
    })

    it("should update user profile successfully", async () => {
      const updates = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com"
      }

      // Mock User.findOne to return null (email is unique)
      mockUser.findOne.mockResolvedValue(null)

      // Mock User.findByIdAndUpdate to succeed
      mockUser.findByIdAndUpdate.mockResolvedValue({})

      const res = await request(app)
        .patch("/api/users/")
        .send(updates)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe("Profile updated")
    })
  })
})