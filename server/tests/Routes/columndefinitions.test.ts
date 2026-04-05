import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'

// Mock modules before importing
jest.mock('../../src/models/ColumnDefinition')
jest.mock('../../src/models/Column')
jest.mock('../../src/models/FileType')
jest.mock('passport', () => ({
    authenticate: jest.fn((strategy: string, options?: any) => {
        return jest.fn((req: any, res: any, next: any) => {
            req.user = { _id: 'mock-user-id' }
            next()
        })
    })
}))

import passport from 'passport'
import {
    createMockUser,
    createMockRequest,
    createMockResponse,
    createMockNext,
    createMockColumnDefinition,
    createMockColumn,
    createMockFileType,
    mockPassportAuth,
    resetAllMocks,
    cleanupAfterTests
} from '../utils/mockUtils'

// Import the router and models after mocking
import columnDefinitionsRouter from '../../src/routes/api/columndefinitions'
import ColumnDefinition from '../../src/models/ColumnDefinition'
import Column from '../../src/models/Column'
import FileType from '../../src/models/FileType'

// Type the mocked models
const MockColumnDefinition = ColumnDefinition as jest.Mocked<typeof ColumnDefinition>
const MockColumn = Column as jest.Mocked<typeof Column>
const MockFileType = FileType as jest.Mocked<typeof FileType>

// Create Express app for testing
const app = express()
app.use(express.json())
app.use('/api/columndefinitions', columnDefinitionsRouter)

describe('Column Definitions API Routes', () => {
    let mockUser: any
    let mockFileType: any
    let mockColumnDefinition: any
    let mockColumn: any

    beforeEach(() => {
        resetAllMocks()

        // Setup standard mocks using factory functions
        mockUser = createMockUser({ _id: 'mock-user-id', email: 'test@example.com' })
        mockFileType = createMockFileType()
        mockColumnDefinition = createMockColumnDefinition()
        mockColumn = createMockColumn()

        // Mock mongoose ObjectId validation
        jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
    })

    afterAll(async () => {
        await cleanupAfterTests()
    })

    describe('POST /api/columndefinitions/', () => {
        it('should create a new column definition with columns successfully', async () => {
            // Arrange
            const requestBody = {
                fileTypeId: 'mock-file-type-id',
                columns: [
                    {
                        name: 'Column 1',
                        description: 'First column',
                        dataType: 'string',
                        transform: ''
                    },
                    {
                        name: 'Column 2',
                        description: 'Second column',
                        dataType: 'number',
                        transform: 'parseInt'
                    }
                ]
            }

            MockFileType.findById.mockResolvedValue(mockFileType)

            // Mock ColumnDefinition constructor and save
            const savedColumnDef = { ...mockColumnDefinition, _id: 'mock-column-def-id' }
                ; (MockColumnDefinition as any).mockImplementation(() => ({
                    ...mockColumnDefinition,
                    save: jest.fn().mockResolvedValue(savedColumnDef)
                }))

                // Mock Column constructor and save
                ; (MockColumn as any).mockImplementation((data: any) => ({
                    ...mockColumn,
                    ...data,
                    _id: `mock-column-${data.name.replace(' ', '-').toLowerCase()}`,
                    save: jest.fn().mockResolvedValue({ ...mockColumn, ...data, _id: `mock-column-${data.name.replace(' ', '-').toLowerCase()}` })
                }))

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.columnDefinition).toBeDefined()
            expect(response.body._id).toBeDefined()
            expect(MockFileType.findById).toHaveBeenCalledWith('mock-file-type-id')
            expect(MockColumnDefinition).toHaveBeenCalledWith({
                fileTypeId: 'mock-file-type-id',
                columns: []
            })
            expect(MockColumn).toHaveBeenCalledTimes(2)
            expect(mockFileType.save).toHaveBeenCalled()
        })

        it('should return 400 for missing file type ID', async () => {
            // Arrange
            const requestBody = {
                columns: []
            }

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid file type ID')
        })

        it('should return 400 for invalid file type ID', async () => {
            // Arrange
            const requestBody = {
                fileTypeId: 'invalid-id',
                columns: []
            }

            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid file type ID')
        })

        it('should return 404 when file type not found', async () => {
            // Arrange
            const requestBody = {
                fileTypeId: 'mock-file-type-id',
                columns: []
            }

            MockFileType.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('File type not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            const requestBody = {
                fileTypeId: 'mock-file-type-id',
                columns: []
            }

            MockFileType.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('GET /api/columndefinitions/:columnDefinitionId', () => {
        it('should get column definition by ID successfully', async () => {
            // Arrange
            const populatedColumnDef = {
                ...mockColumnDefinition,
                columns: [mockColumn]
            }

            MockColumnDefinition.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(populatedColumnDef)
            } as any)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.columnDefinition).toBeDefined()
            expect(response.body.columnDefinition._id).toBe('mock-column-def-id')
            expect(response.body.columnDefinition.fileTypeId).toBe('mock-file-type-id')
            expect(response.body.columnDefinition.columns).toHaveLength(1)
            expect(MockColumnDefinition.findById).toHaveBeenCalledWith('mock-column-def-id')
        })

        it('should return 400 for invalid column definition ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/invalid-id')

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column definition ID')
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            } as any)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            MockColumnDefinition.findById.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Database error'))
            } as any)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('PATCH /api/columndefinitions/:columnDefinitionId', () => {
        it('should update column order successfully', async () => {
            // Arrange
            const requestBody = {
                columns: [
                    { _id: 'column-1', order: 1 },
                    { _id: 'column-2', order: 2 }
                ]
            }

            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.bulkWrite.mockResolvedValue({ modifiedCount: 2 } as any)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Column definition updated successfully')
            expect(MockColumn.bulkWrite).toHaveBeenCalledWith([
                { updateOne: { filter: { _id: 'column-1' }, update: { order: 1 } } },
                { updateOne: { filter: { _id: 'column-2' }, update: { order: 2 } } }
            ])
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            const requestBody = { columns: [] }
            MockColumnDefinition.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            const requestBody = { columns: [] }
            MockColumnDefinition.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('DELETE /api/columndefinitions/:columnDefinitionId', () => {
        it('should delete column definition and all columns successfully', async () => {
            // Arrange
            const columnDefWithColumns = {
                ...mockColumnDefinition,
                columns: ['column-1', 'column-2']
            }

            MockColumnDefinition.findById.mockResolvedValue(columnDefWithColumns)
            MockFileType.findById.mockResolvedValue(mockFileType)
            MockColumn.findByIdAndDelete.mockResolvedValue(mockColumn)
            MockColumnDefinition.findByIdAndDelete.mockResolvedValue(columnDefWithColumns)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Column definition deleted')
            expect(MockColumn.findByIdAndDelete).toHaveBeenCalledTimes(2)
            expect(MockColumnDefinition.findByIdAndDelete).toHaveBeenCalledWith('mock-column-def-id')
            expect(mockFileType.save).toHaveBeenCalled()
        })

        it('should return 400 for invalid column definition ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/invalid-id')

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column definition ID')
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should return 404 when file type not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockFileType.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe("File type not found by column definition's file type ID")
        })

        it('should handle internal server error', async () => {
            // Arrange
            MockColumnDefinition.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id')

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('POST /api/columndefinitions/:columnDefinitionId/columns/', () => {
        it('should create a new column successfully', async () => {
            // Arrange
            const requestBody = {
                name: 'New Column',
                description: 'New column description',
                dataType: 'string',
                transform: ''
            }

            const columnDefWithColumns = {
                ...mockColumnDefinition,
                columns: ['existing-column']
            }

            MockColumnDefinition.findById.mockResolvedValue(columnDefWithColumns)

            const mockNewColumn = {
                ...mockColumn,
                name: 'New Column',
                description: 'New column description',
                order: 2,
                save: jest.fn().mockResolvedValue({ ...mockColumn, _id: 'new-column-id' })
            }

                ; (MockColumn as any).mockImplementation(() => mockNewColumn)

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/mock-column-def-id/columns/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.column).toBeDefined()
            expect(response.body._id).toBeDefined()
            expect(MockColumn).toHaveBeenCalledWith({
                columnDefinitionId: 'mock-column-def-id',
                name: 'New Column',
                description: 'New column description',
                dataType: 'string',
                transform: '',
                order: 2
            })
        })

        it('should return 400 for missing required fields', async () => {
            // Arrange
            const requestBody = {
                description: 'Missing name and dataType'
            }

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/mock-column-def-id/columns/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing required fields (name or dataType)')
        })

        it('should return 400 for invalid column definition ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/invalid-id/columns/')
                .send({ name: 'test', dataType: 'string' })

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column definition ID')
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            const requestBody = { name: 'test', dataType: 'string' }
            MockColumnDefinition.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/mock-column-def-id/columns/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            const requestBody = { name: 'test', dataType: 'string' }
            MockColumnDefinition.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .post('/api/columndefinitions/mock-column-def-id/columns/')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('GET /api/columndefinitions/:columnDefinitionId/columns/:columnId', () => {
        it('should get column by ID successfully', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.findById.mockResolvedValue(mockColumn)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.column).toBeDefined()
            expect(response.body.column._id).toBe('mock-column-id')
            expect(response.body.column.name).toBe('Test Column')
            expect(response.body.column.dataType).toBe('string')
            expect(response.body.column.columnDefinitionId).toBe('mock-column-def-id')
        })

        it('should return 400 for invalid column definition ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/invalid-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column definition ID')
        })

        it('should return 400 for invalid column ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid')
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id/columns/invalid-id')

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column ID')
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should return 404 when column not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            MockColumnDefinition.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .get('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('PATCH /api/columndefinitions/:columnDefinitionId/columns/:columnId', () => {
        it('should update column successfully', async () => {
            // Arrange
            const requestBody = {
                name: 'Updated Column',
                description: 'Updated description',
                dataType: 'number',
                transform: 'parseInt'
            }

            const updatedColumn = {
                ...mockColumn,
                name: 'Updated Column',
                description: 'Updated description',
                dataType: 'number',
                transform: 'parseInt',
                save: jest.fn().mockResolvedValue(undefined)
            }

            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.findById.mockResolvedValue(updatedColumn)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Column updated successfully.')
            expect(updatedColumn.save).toHaveBeenCalled()
        })

        it('should return 400 for invalid column definition ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/invalid-id/columns/mock-column-id')
                .send({ name: 'test' })

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column definition ID')
        })

        it('should return 400 for invalid column ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid')
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id/columns/invalid-id')
                .send({ name: 'test' })

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column ID')
        })

        it('should return 400 when no fields to update', async () => {
            // Arrange
            const requestBody = {}

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')
                .send(requestBody)

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('At least one field is required to update (name, description, dataType, or transform)')
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')
                .send({ name: 'test' })

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should return 404 when column not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')
                .send({ name: 'test' })

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            MockColumnDefinition.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .patch('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')
                .send({ name: 'test' })

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })

    describe('DELETE /api/columndefinitions/:columnDefinitionId/columns/:columnId', () => {
        it('should delete column successfully', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.findById.mockResolvedValue(mockColumn)
            MockColumn.findByIdAndDelete.mockResolvedValue(mockColumn)
            MockColumnDefinition.findByIdAndUpdate.mockResolvedValue(mockColumnDefinition)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Column deleted successfully.')
            expect(MockColumn.findByIdAndDelete).toHaveBeenCalledWith('mock-column-id')
            expect(MockColumnDefinition.findByIdAndUpdate).toHaveBeenCalledWith(
                'mock-column-def-id',
                { $pull: { columns: 'mock-column-id' } },
                { new: true }
            )
        })

        it('should return 400 for invalid column definition ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/invalid-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column definition ID')
        })

        it('should return 400 for invalid column ID', async () => {
            // Arrange
            jest.spyOn(mongoose.Types.ObjectId, 'isValid')
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id/columns/invalid-id')

            // Assert
            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing or invalid column ID')
        })

        it('should return 404 when column definition not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column definition not found by given ID')
        })

        it('should return 404 when column not found', async () => {
            // Arrange
            MockColumnDefinition.findById.mockResolvedValue(mockColumnDefinition)
            MockColumn.findById.mockResolvedValue(null)

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Column not found by given ID')
        })

        it('should handle internal server error', async () => {
            // Arrange
            MockColumnDefinition.findById.mockRejectedValue(new Error('Database error'))

            // Act
            const response = await request(app)
                .delete('/api/columndefinitions/mock-column-def-id/columns/mock-column-id')

            // Assert
            expect(response.status).toBe(500)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Internal server error')
        })
    })
})
