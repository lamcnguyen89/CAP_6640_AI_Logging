import request from "supertest"
import express from "express"
import mongoose from "mongoose"

// Mock mongoose ObjectId before importing other modules
jest.mock("mongoose", () => ({
    ...jest.requireActual("mongoose"),
    Types: {
        ObjectId: jest.fn().mockImplementation((id) => id || "mock-object-id")
    }
}))

// Import standardized mock utilities
import {
    createMockUser,
    createMockToken,
    createMockExperiment,
    createMockSite,
    resetAllMocks,
    cleanupAfterTests,
    type MockUser,
    type MockToken,
    type MockExperiment,
    type MockSite
} from "../utils/mockUtils"

// Mock Models and Dependencies using standardized patterns
jest.mock("../../src/models/User")
jest.mock("../../src/models/Token")
jest.mock("../../src/models/Experiment")
jest.mock("../../src/models/ColumnDefinition")
jest.mock("../../src/models/FileType")
jest.mock("../../src/models/Column")
jest.mock("../../src/models/Site")

// Import mocked modules with proper typing
import User from "../../src/models/User"
import Token from "../../src/models/Token"
import Experiment from "../../src/models/Experiment"
import ColumnDefinition from "../../src/models/ColumnDefinition"
import FileType from "../../src/models/FileType"
import Column from "../../src/models/Column"
import Site from "../../src/models/Site"

// Import router AFTER models are mocked
import router from "../../src/routes/api/emailroute"

// Type-safe mock declarations
const mockUser = User as any
const mockToken = Token as any
const mockExperiment = Experiment as any
const mockColumnDefinition = ColumnDefinition as any
const mockFileType = FileType as any
const mockColumn = Column as any
const mockSite = Site as any

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
app.use("/api/email", router)

describe("Email Routes", () => {
    beforeEach(() => {
        resetAllMocks()
    })

    afterAll(async () => {
        // Restore console methods
        consoleSpy.log.mockRestore()
        consoleSpy.error.mockRestore()
        consoleSpy.warn.mockRestore()
        consoleSpy.info.mockRestore()

        await cleanupAfterTests()
    })

    describe("PATCH /:id/verify/:token", () => {
        const userId = "mock-user-id"
        const tokenValue = "mock-verification-token"

        it("should return 404 if user not found", async () => {
            mockUser.findOne.mockResolvedValue(null)

            const res = await request(app)
                .patch(`/api/email/${userId}/verify/${tokenValue}`)

            expect(res.status).toBe(404)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("User not found")
        })

        it("should return 404 if token not found", async () => {
            const testUser = createMockUser({ _id: userId, id: userId })
            mockUser.findOne.mockResolvedValue(testUser)
            mockToken.findOne.mockResolvedValue(null)

            const res = await request(app)
                .patch(`/api/email/${userId}/verify/${tokenValue}`)

            expect(res.status).toBe(404)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("No token found")
        })

        it("should verify user and return success if experiment already exists", async () => {
            const testUser = createMockUser({
                _id: userId,
                id: userId,
                email: "test@example.com"
            })
            const testToken = createMockToken({
                _id: "mock-token-id",
                userId: userId,
                token: tokenValue
            })
            const existingExperiment = createMockExperiment({
                createdBy: userId
            })

            mockUser.findOne.mockResolvedValue(testUser)
            mockToken.findOne.mockResolvedValue(testToken)
            mockUser.updateOne.mockResolvedValue({})
            mockToken.deleteOne.mockResolvedValue({})
            mockExperiment.findOne.mockResolvedValue(existingExperiment)

            const res = await request(app)
                .patch(`/api/email/${userId}/verify/${tokenValue}`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.message).toBe("User verified successfully")

            // Verify the correct model methods were called
            expect(mockUser.updateOne).toHaveBeenCalledWith(
                { _id: testUser._id },
                { verified: true }
            )
            expect(mockToken.deleteOne).toHaveBeenCalledWith({ _id: testToken._id })
        })

        it("should create demo experiment with file types when user has no existing experiment", async () => {
            const testUser = createMockUser({
                _id: userId,
                id: userId,
                email: "test@example.com"
            })
            const testToken = createMockToken({
                _id: "mock-token-id",
                userId: userId,
                token: tokenValue
            })

            // Mock the experiment creation flow with complete mock instances
            const mockNewExperiment = {
                _id: "mock-new-experiment-id",
                sites: [],
                save: jest.fn().mockResolvedValue(undefined)
            }
            const mockSiteInstance = {
                _id: "mock-site-id",
                name: "Default Site"
            }

            // Create complete mock instances for FileType creation
            const mockPlayerTransformsFileType = {
                _id: "mock-player-transforms-filetype-id",
                name: 'PlayerTransforms',
                experimentId: "mock-new-experiment-id",
                extension: 'csv',
                description: 'Transforms of various tracked player components',
                columnDefinition: undefined,
                save: jest.fn().mockResolvedValue(undefined)
            }
            const mockCubeFileType = {
                _id: "mock-cube-rotation-filetype-id",
                name: 'CubeRotation',
                experimentId: "mock-new-experiment-id",
                extension: 'csv',
                description: 'The rotation of a demonstrative cube',
                columnDefinition: undefined,
                save: jest.fn().mockResolvedValue(undefined)
            }

            // Create complete mock instances for ColumnDefinition
            const mockPlayerTransformsColDef = {
                _id: "mock-player-transforms-coldef-id",
                fileTypeId: "mock-player-transforms-filetype-id",
                columns: [],
                save: jest.fn().mockResolvedValue(undefined)
            }
            const mockCubeColDef = {
                _id: "mock-cube-coldef-id",
                fileTypeId: "mock-cube-rotation-filetype-id",
                columns: [],
                save: jest.fn().mockResolvedValue(undefined)
            }

            // Create complete mock instances for Column creation
            const mockColumns = [
                { _id: "mock-column-1", save: jest.fn() },
                { _id: "mock-column-2", save: jest.fn() },
                { _id: "mock-column-3", save: jest.fn() },
                { _id: "mock-column-4", save: jest.fn() },
                { _id: "mock-column-5", save: jest.fn() },
                { _id: "mock-column-6", save: jest.fn() },
                { _id: "mock-column-7", save: jest.fn() }
            ]

            // Setup mock implementations
            mockUser.findOne.mockResolvedValue(testUser)
            mockToken.findOne.mockResolvedValue(testToken)
            mockUser.updateOne.mockResolvedValue({})
            mockToken.deleteOne.mockResolvedValue({})
            mockExperiment.findOne.mockResolvedValue(null) // No existing experiment

            // Mock Experiment constructor and save
            mockExperiment.mockImplementation(() => mockNewExperiment)

            mockSite.create.mockResolvedValue(mockSiteInstance)

            // Mock FileType creation calls - return the correct instances in order
            mockFileType.create
                .mockResolvedValueOnce(mockPlayerTransformsFileType)
                .mockResolvedValueOnce(mockCubeFileType)

            // Mock ColumnDefinition creation calls - return the correct instances in order
            mockColumnDefinition.create
                .mockResolvedValueOnce(mockPlayerTransformsColDef)
                .mockResolvedValueOnce(mockCubeColDef)

            // Mock Column creation calls - return columns in sequence for both file types
            // PlayerTransforms has 3 columns, CubeRotation has 4 columns
            mockColumn.create
                .mockResolvedValueOnce(mockColumns[0])  // PlayerTransforms col 1
                .mockResolvedValueOnce(mockColumns[1])  // PlayerTransforms col 2
                .mockResolvedValueOnce(mockColumns[2])  // PlayerTransforms col 3
                .mockResolvedValueOnce(mockColumns[3])  // CubeRotation col 1
                .mockResolvedValueOnce(mockColumns[4])  // CubeRotation col 2
                .mockResolvedValueOnce(mockColumns[5])  // CubeRotation col 3
                .mockResolvedValueOnce(mockColumns[6])  // CubeRotation col 4

            const res = await request(app)
                .patch(`/api/email/${userId}/verify/${tokenValue}`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.message).toBe("User verified successfully")

            // Verify experiment creation
            expect(mockExperiment).toHaveBeenCalledWith({
                createdBy: testUser._id,
                collaborators: [],
                name: `Demo Experiment (${testUser.email})`,
                description: "A default demonstrative experiment for new users",
                irbProtocolNumber: "1234",
                isMultiSite: false,
            })

            // Verify site creation
            expect(mockSite.create).toHaveBeenCalledWith({
                name: "Default Site",
                shortName: "SITE",
                parentExperiment: mockNewExperiment._id,
            })

            // Verify FileType creation was called (2 file types)
            expect(mockFileType.create).toHaveBeenCalledTimes(2)
            expect(mockColumnDefinition.create).toHaveBeenCalledTimes(2)
            // Verify Column creation was called (3 + 4 = 7 columns total)
            expect(mockColumn.create).toHaveBeenCalledTimes(7)
        })

        it("should handle errors gracefully", async () => {
            mockUser.findOne.mockRejectedValue(new Error("Database error"))

            const res = await request(app)
                .patch(`/api/email/${userId}/verify/${tokenValue}`)

            expect(res.status).toBe(500)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Internal server error")
            expect(res.body.error).toBeDefined()
        })
    })

    describe("GET /:id/verificationstatus", () => {
        const userId = "mock-user-id"

        it("should return 404 if user not found", async () => {
            mockUser.findOne.mockResolvedValue(null)

            const res = await request(app)
                .get(`/api/email/${userId}/verificationstatus`)

            expect(res.status).toBe(404)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Invalid User")
        })

        it("should return verification status for verified user", async () => {
            const testUser = createMockUser({
                _id: userId,
                id: userId,
                verified: true
            })

            mockUser.findOne.mockResolvedValue(testUser)

            const res = await request(app)
                .get(`/api/email/${userId}/verificationstatus`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.verified).toBe(true)
        })

        it("should return verification status for unverified user", async () => {
            const testUser = createMockUser({
                _id: userId,
                id: userId,
                verified: false
            })

            mockUser.findOne.mockResolvedValue(testUser)

            const res = await request(app)
                .get(`/api/email/${userId}/verificationstatus`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.verified).toBe(false)
        })

        it("should handle errors gracefully", async () => {
            mockUser.findOne.mockRejectedValue(new Error("Database error"))

            const res = await request(app)
                .get(`/api/email/${userId}/verificationstatus`)

            expect(res.status).toBe(500)
            expect(res.body.success).toBe(false)
            expect(res.body.message).toBe("Internal server error")
            expect(res.body.error).toBeDefined()
        })
    })

    describe("Helper Functions", () => {
        describe("File Type Creation", () => {
            it("should verify that file type creation functions are called during experiment setup", async () => {
                // This test verifies the file type creation is part of the verification flow
                // The actual creation details are tested indirectly through the main verification test
                const testUser = createMockUser({ _id: "user-id", email: "test@example.com" })
                const testToken = createMockToken({ userId: "user-id", token: "token" })
                const mockExperimentInstance = {
                    _id: "experiment-id",
                    sites: [],
                    save: jest.fn().mockResolvedValue(undefined)
                }

                // Setup mocks for successful flow
                mockUser.findOne.mockResolvedValue(testUser)
                mockToken.findOne.mockResolvedValue(testToken)
                mockUser.updateOne.mockResolvedValue({})
                mockToken.deleteOne.mockResolvedValue({})
                mockExperiment.findOne.mockResolvedValue(null)
                mockExperiment.mockImplementation(() => mockExperimentInstance)
                mockSite.create.mockResolvedValue({ _id: "site-id" })

                // Mock the file type creation chain with complete instances
                const mockFileTypeInstance = {
                    _id: "filetype-id",
                    columnDefinition: undefined,
                    save: jest.fn().mockResolvedValue(undefined)
                }
                const mockColumnDefinitionInstance = {
                    _id: "coldef-id",
                    columns: [],
                    save: jest.fn().mockResolvedValue(undefined)
                }
                const mockColumnInstance = {
                    _id: "column-id"
                }

                mockFileType.create.mockResolvedValue(mockFileTypeInstance)
                mockColumnDefinition.create.mockResolvedValue(mockColumnDefinitionInstance)
                mockColumn.create.mockResolvedValue(mockColumnInstance)

                const res = await request(app)
                    .patch(`/api/email/user-id/verify/token`)

                expect(res.status).toBe(200)

                // Verify that the file type creation functions are called as part of the flow
                expect(mockFileType.create).toHaveBeenCalled()
                expect(mockColumnDefinition.create).toHaveBeenCalled()
                expect(mockColumn.create).toHaveBeenCalled()
            })
        })
    })
})
