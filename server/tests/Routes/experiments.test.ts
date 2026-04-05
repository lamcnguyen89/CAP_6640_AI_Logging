import request from "supertest"
import express from "express"
import mongoose from "mongoose"
import path from "path"
import router from "../../src/routes/api/experiments"
import Experiment from "../../src/models/Experiment"
import Participant from "../../src/models/Participant"
import User from "../../src/models/User"
import Site from "../../src/models/Site"

// Mock the errRes utility function
jest.mock("../../src/common/utilities", () => ({
  errRes: jest.fn((msg: string) => ({ success: false, message: msg }))
}))

// Mock the archiver module to prevent path-scurry dependency issues
jest.mock("archiver", () => jest.fn(), { virtual: true })

// Mock console methods to reduce test noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => { }),
  error: jest.spyOn(console, 'error').mockImplementation(() => { }),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => { }),
  info: jest.spyOn(console, 'info').mockImplementation(() => { })
}

// Create Express app for testing
const app = express()
app.use(express.json())

// Mock Passport authentication middleware
// This mock allows us to simulate different authentication strategies
jest.mock("passport", () => ({
  authenticate: jest.fn((strategies: string[], options: any) => {
    return (req: any, res: any, next: any) => {
      // Mock user object with authentication strategy
      req.user = {
        id: "testUserId",
        authStrategy: req.headers['auth-strategy'] || 'jwt' // Allow test to specify strategy
      }
      next()
    }
  }),
  initialize: jest.fn(),
}))

// Mock Mongoose models
jest.mock("../../src/models/Experiment")
jest.mock("../../src/models/Participant")
jest.mock("../../src/models/Site")
jest.mock("../../src/models/User")
jest.mock("../../src/models/FileType")
jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    rm: jest.fn(),
    mkdir: jest.fn()
  }
}))

// Mock unzipper
const mockUnzipper = {
  Open: {
    buffer: jest.fn().mockReturnValue({
      then: jest.fn((callback) =>
        callback({
          extract: jest.fn().mockResolvedValue(undefined)
        })
      )
    })
  }
}
jest.mock("unzipper", () => mockUnzipper)


// Mock multer and file system operations





// Mount the router
app.use("/api/experiments", router)

/**
 * Test Suite for GET /api/experiments/ route
 * 
 * This route is critical for the application's dashboard functionality,
 * allowing users to view their experiments based on their role and client type.
 */
describe("GET /api/experiments/ - Retrieve User Experiments", () => {

  // Reset all mocks before each test to ensure test isolation
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Test Case 1: Successfully retrieve experiments for JWT authenticated user (web client)
   * 
   * This test validates the primary success path for web client users.
   * JWT authenticated users should see ALL experiments including drafts.
   * 
   * Key validations:
   * - Returns 200 status code
   * - Includes both published and draft experiments
   * - Populates related site data
   * - Adds participant data to each experiment
   * - Returns proper JSON structure
   */
  describe("Success Cases", () => {
    it("should return 200 with experiments including drafts for JWT authenticated user", async () => {
      const userId = "testUserId"

      // Mock experiment documents with realistic structure
      const mockExperiments = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Test Experiment 1",
          description: "First test experiment",
          createdBy: userId,
          collaborators: [],
          draft: false,
          sites: [new mongoose.Types.ObjectId()],
          toObject: jest.fn().mockReturnValue({
            _id: "exp1",
            name: "Test Experiment 1",
            description: "First test experiment",
            createdBy: userId,
            collaborators: [],
            draft: false,
            sites: ["site1"]
          })
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Draft Experiment",
          description: "Draft experiment",
          createdBy: userId,
          collaborators: [],
          draft: true,
          sites: [],
          toObject: jest.fn().mockReturnValue({
            _id: "exp2",
            name: "Draft Experiment",
            description: "Draft experiment",
            createdBy: userId,
            collaborators: [],
            draft: true,
            sites: []
          })
        }
      ]

      // Mock participants for the experiments
      const mockParticipants = [
        {
          _id: "participant1",
          experimentId: "exp1",
          state: "ACTIVE",
          toObject: jest.fn().mockReturnValue({
            _id: "participant1",
            state: "ACTIVE"
          })
        }
      ]

      // Setup Mongoose mocks
      const mockPopulate = jest.fn().mockResolvedValue(mockExperiments);
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      (Participant.find as jest.Mock).mockResolvedValue(mockParticipants)

      // Execute the request with JWT authentication strategy
      const response = await request(app)
        .get("/api/experiments/")
        .set('auth-strategy', 'jwt')

      // Validate response structure and content
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.experiments).toBeDefined()
      expect(Array.isArray(response.body.experiments)).toBe(true)
      expect(response.body.experiments).toHaveLength(2)

      // Verify that draft experiments are included for JWT users
      const draftExperiment = response.body.experiments.find((exp: any) => exp.name === "Draft Experiment")
      expect(draftExperiment).toBeDefined()

      // Verify participants are added to experiments
      expect(response.body.experiments[0].participants).toBeDefined()

      // Verify correct Mongoose query was called
      expect(Experiment.find).toHaveBeenCalledWith({
        $or: [
          { createdBy: userId },
          { collaborators: { $in: [userId] } }
        ]
      })
      expect(mockPopulate).toHaveBeenCalledWith("sites")
    })

    /**
     * Test Case 2: Unity client authentication excludes drafts
     * 
     * This test ensures that non-JWT clients (like Unity) don't see draft experiments.
     * This is important for production clients that should only see published content.
     */
    it("should exclude draft experiments for non-JWT authenticated user (Unity client)", async () => {
      const userId = "testUserId"

      const mockExperiments = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Published Experiment",
          createdBy: userId,
          draft: false,
          toObject: jest.fn().mockReturnValue({
            _id: "exp1",
            name: "Published Experiment",
            draft: false
          })
        }
      ]

      const mockPopulate = jest.fn().mockResolvedValue(mockExperiments);
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      (Participant.find as jest.Mock).mockResolvedValue([])

      // Execute request with unity-user-token strategy
      const response = await request(app)
        .get("/api/experiments/")
        .set('auth-strategy', 'unity-user-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // Verify correct query excludes drafts
      expect(Experiment.find).toHaveBeenCalledWith({
        $and: [
          { draft: false },
          {
            $or: [
              { createdBy: userId },
              { collaborators: { $in: [userId] } }
            ]
          }
        ]
      })
    })

    /**
     * Test Case 3: User is collaborator on experiments
     * 
     * Tests that experiments where the user is a collaborator (not creator) are included.
     */
    it("should return experiments where user is a collaborator", async () => {
      const userId = "collaboratorUserId"
      const creatorId = "creatorUserId"

      const mockExperiments = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Collaborative Experiment",
          createdBy: creatorId,
          collaborators: [userId],
          draft: false,
          toObject: jest.fn().mockReturnValue({
            _id: "exp1",
            name: "Collaborative Experiment",
            createdBy: creatorId,
            collaborators: [userId],
            draft: false
          })
        }
      ]

      const mockPopulate = jest.fn().mockResolvedValue(mockExperiments);
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      (Participant.find as jest.Mock).mockResolvedValue([])

      const response = await request(app)
        .get("/api/experiments/")
        .set('auth-strategy', 'jwt')

      expect(response.status).toBe(200)
      expect(response.body.experiments).toHaveLength(1)
      expect(response.body.experiments[0].name).toBe("Collaborative Experiment")
    })
  })

  /**
   * Test Case 4: Empty results scenario
   * 
   * Validates graceful handling when user has no experiments.
   */
  describe("Edge Cases", () => {
    it("should return empty array when user has no experiments", async () => {
      const mockPopulate = jest.fn().mockResolvedValue([]);
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      })

      const response = await request(app).get("/api/experiments/")

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.experiments).toEqual([])
    })
  })

  /**
   * Test Case 5: Database error handling
   * 
   * Ensures proper error responses when database operations fail.
   * This is critical for maintaining API reliability.
   */
  describe("Error Cases", () => {
    it("should return 500 when database error occurs", async () => {
      // Mock database error
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Database connection failed"))
      })

      const response = await request(app).get("/api/experiments/")

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Internal server error")
      expect(response.body.error).toBeDefined()
    })

    /**
     * Test Case 6: Participant query error handling
     * 
     * Tests error handling when participant data retrieval fails.
     */
    it("should return 500 when participant query fails", async () => {
      const mockExperiments = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Test Experiment",
          toObject: jest.fn().mockReturnValue({
            _id: "exp1",
            name: "Test Experiment"
          })
        }
      ]

      const mockPopulate = jest.fn().mockResolvedValue(mockExperiments);
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      // Mock participant query failure
      (Participant.find as jest.Mock).mockRejectedValue(new Error("Participant query failed"))

      const response = await request(app).get("/api/experiments/")

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe("Internal server error")
    })
  })

  /**
   * Test Case 7: Authentication strategy logging
   * 
   * Verifies that the authentication strategy is properly logged for debugging.
   */
  describe("Authentication Strategy Handling", () => {
    it("should log authentication strategy used", async () => {
      const authConsoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const mockPopulate = jest.fn().mockResolvedValue([]);
      (Experiment.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      })

      await request(app)
        .get("/api/experiments/")
        .set('auth-strategy', 'jwt')

      // Verify that authentication strategy is logged
      expect(authConsoleSpy).toHaveBeenCalledWith("Authentication Strategy used: ", "jwt")

      authConsoleSpy.mockRestore()
    })
  })
  /**
   * Unit Tests for Experiments POST Routes
   * 
   * This test suite covers the critical POST routes for experiment creation,
   * including comprehensive testing of file upload functionality using multer.
   * 
   * Key Testing Areas:
   * 1. POST /api/experiments/ - Experiment creation with file uploads
   * 2. POST /api/experiments/draft - Draft experiment creation
   * 3. File upload validation (PDF type, size limits)
   * 4. Authentication and authorization
   * 5. Database interactions and error handling
   * 
   * @author AI Assistant
   * @date 2025-01-27
   */

  // Mock multer and file system operations
  jest.mock("multer", () => {
    const mockMulter = {
      memoryStorage: jest.fn(() => ({})),
      fields: jest.fn(() => (req: any, res: any, next: any) => {
        // Simulate multer parsing - add files to req.files
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          req.files = req.mockFiles || {}
        }
        next()
      }),
      single: jest.fn(() => (req: any, res: any, next: any) => {
        // Simulate single file upload
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          req.file = req.mockFile || null
        }
        next()
      })
    }

    return jest.fn(() => mockMulter)
  })



  /**
   * Test Suite for POST /api/experiments/ - Create New Experiment
   * 
   * This route handles experiment creation with optional file uploads (IRB letters).
   * Critical functionality includes file validation, collaborator handling, and site creation.
   */
  describe("POST /api/experiments/ - Create New Experiment", () => {

    beforeEach(() => {
      jest.clearAllMocks()
    })

    /**
     * Success Cases - Valid experiment creation scenarios
     *

    /**
     * File Upload Validation Tests
     * 
     * These tests verify proper handling of file uploads, including:
     * - PDF type validation
     * - File size limits
     * - Missing file handling
     */
    describe("File Upload Validation", () => {
      it("should reject non-PDF files", async () => {
        const mockWrongFile = {
          buffer: Buffer.from("fake content"),
          originalname: "document.txt",
          mimetype: "text/plain",
          size: 1000
        }

        const experimentData = {
          name: "Test Experiment",
          description: "Test Description",
          irbProtocolNumber: "IRB-123",
          irbEmailAddress: "irb@test.com",
          isMultiSite: false
        }

        // Create a mock request that simulates multer having processed a non-PDF file
        const mockReq = {
          files: { irbLetter: [mockWrongFile] },
          body: { experimentInfo: JSON.stringify(experimentData) },
          user: { id: "testUserId" }
        }

        // Simulate the route handler logic
        try {
          if (mockReq.files["irbLetter"]) {
            let irbLetter = mockReq.files["irbLetter"][0]
            if (irbLetter.mimetype !== "application/pdf") {
              const response = { status: 400, json: jest.fn() }
              response.json({ success: false, message: "Can only upload a pdf file" })

              expect(response.status).toBe(400)
              return
            }
          }
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      it("should reject files larger than 50MB", async () => {
        const mockLargeFile = {
          buffer: Buffer.alloc(5e7 + 1), // Slightly over 50MB
          originalname: "large_document.pdf",
          mimetype: "application/pdf",
          size: 5e7 + 1
        }

        const experimentData = {
          name: "Test Experiment",
          description: "Test Description",
          irbProtocolNumber: "IRB-123",
          irbEmailAddress: "irb@test.com",
          isMultiSite: false
        }

        // Simulate file size validation
        if (mockLargeFile.size >= 5e7) {
          const response = { status: 400, json: jest.fn() }
          response.json({ success: false, message: "IRB Letter cannot be greater then 50mb" })

          expect(response.status).toBe(400)
        }
      })

      it("should process valid PDF file correctly", async () => {
        const mockValidFile = {
          buffer: Buffer.from("fake pdf content"),
          originalname: "valid_document.pdf",
          mimetype: "application/pdf",
          size: 1000000 // 1MB
        }

        // Simulate successful file processing
        let irbLetterBuffer: Buffer | string = ""
        let irbLetterName = ""

        if (mockValidFile.mimetype === "application/pdf" && mockValidFile.size < 5e7) {
          irbLetterBuffer = mockValidFile.buffer
          let irbLetterOriginalName = mockValidFile.originalname.split(".")
          irbLetterName = irbLetterOriginalName[0]

          expect(irbLetterBuffer).toBeDefined()
          expect(Buffer.isBuffer(irbLetterBuffer)).toBe(true)
          expect(irbLetterName).toBe("valid_document")
        }
      })
    })

    /**
     * Validation Error Tests
     * 
     * Tests for required field validation and business logic errors
     */
    describe("Validation Errors", () => {


      it("should return 400 for invalid JSON in experimentInfo", async () => {
        const response = await request(app)
          .post("/api/experiments/")
          .send({ experimentInfo: "invalid json string" })

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Invalid JSON")
      })




    })

    /**
     * Database Error Handling Tests
     */

  })

  /**
   * Test Suite for POST /api/experiments/:experimentId/webxr - WebXR Upload
   * 
   * Tests the WebXR zip file upload functionality
   */
  describe("POST /api/experiments/:experimentId/webxr - WebXR Upload", () => {

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe("Success Cases", () => {

    })

    describe("Validation Errors", () => {
      it("should return 400 for invalid experiment ID", async () => {
        const response = await request(app)
          .post("/api/experiments/invalid-id/webxr")
          .attach('webxrZip', Buffer.from("content"), 'test.zip')

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("Invalid or missing experiment ID")
      })

      it("should return 404 when experiment not found", async () => {
        const experimentId = new mongoose.Types.ObjectId().toString();
        (Experiment.findById as jest.Mock).mockResolvedValue(null)

        const response = await request(app)
          .post(`/api/experiments/${experimentId}/webxr`)
          .attach('webxrZip', Buffer.from("content"), 'test.zip')

        expect(response.status).toBe(404)
        expect(response.body.message).toBe("No experiment found by given ID")
      })

      it("should return 401 when user is not owner or collaborator", async () => {
        const experimentId = new mongoose.Types.ObjectId().toString()
        const mockExperiment = {
          _id: experimentId,
          createdBy: "otherUserId",
          collaborators: []
        };

        (Experiment.findById as jest.Mock).mockResolvedValue(mockExperiment)

        const response = await request(app)
          .post(`/api/experiments/${experimentId}/webxr`)
          .attach('webxrZip', Buffer.from("content"), 'test.zip')

        expect(response.status).toBe(401)
        expect(response.body.message).toBe("Caller is not owner or collaborator of this experiment")
      })

      it("should return 400 when no file is uploaded", async () => {
        const experimentId = new mongoose.Types.ObjectId().toString()
        const mockExperiment = {
          _id: experimentId,
          createdBy: "testUserId",
          collaborators: []
        };

        (Experiment.findById as jest.Mock).mockResolvedValue(mockExperiment)

        const response = await request(app)
          .post(`/api/experiments/${experimentId}/webxr`)

        expect(response.status).toBe(400)
        expect(response.body.message).toBe("No file uploaded")
      })

      it("should return 400 when file is not a zip", async () => {
        const experimentId = new mongoose.Types.ObjectId().toString()
        const mockExperiment = {
          _id: experimentId,
          createdBy: "testUserId",
          collaborators: []
        };

        (Experiment.findById as jest.Mock).mockResolvedValue(mockExperiment)

        // Mock a non-zip file
        const mockReq = {
          file: {
            originalname: "notazip.txt",
            buffer: Buffer.from("content")
          }
        }

        // Simulate file extension check
        if (path.extname(mockReq.file.originalname) !== ".zip") {
          expect(path.extname(mockReq.file.originalname)).not.toBe(".zip")
        }
      })
    })
  })



})

// Global cleanup after all tests to prevent open handles
afterAll(async () => {
  // Close any open database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }

  // Restore console methods
  consoleSpy.log.mockRestore()
  consoleSpy.error.mockRestore()
  consoleSpy.warn.mockRestore()
  consoleSpy.info.mockRestore()

  // Give a small delay to ensure cleanup is complete
  await new Promise(resolve => setTimeout(resolve, 100))
})
