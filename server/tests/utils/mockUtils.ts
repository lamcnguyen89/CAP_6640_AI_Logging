/**
 * Standardized Mock Utilities for VERA Test Suite
 * 
 * This module provides standardized mock utility functions and type-safe mock factories
 * for consistent testing patterns across all test files. All mock functions use
 * jest.MockedFunction<T> typing for type safety and better IntelliSense support.
 * 
 * Key Features:
 * - Type-safe mock functions using jest.MockedFunction<T>
 * - Standardized mock factories for common models (User, Experiment, Token, etc.)
 * - Helper functions for common mock scenarios
 * - Consistent reset and cleanup utilities
 * 
 * Usage:
 * ```typescript
 * import { createMockUser, createMockExperiment, mockModelMethods } from '../utils/mockUtils';
 * 
 * // Create typed mock instances
 * const mockUser = createMockUser({ email: 'test@example.com' });
 * const mockExperiment = createMockExperiment({ name: 'Test Experiment' });
 * 
 * // Mock model methods with proper typing
 * const mockUserFind = mockModelMethods(User, ['findOne', 'find', 'save']);
 * ```
 * 
 * @author AI Assistant - VP1-956 Standardize Mock Usage Patterns
 * @date 2025-06-11
 */

import mongoose from 'mongoose'

// Type definitions for commonly used mock interfaces
export interface MockUser {
  _id?: string
  id?: string
  firstName?: string
  lastName?: string
  email: string
  type?: string
  institution?: string
  lab?: string
  password?: string
  isEmailVerified?: boolean
  admin?: boolean
  verified?: boolean
  dateCreated?: Date
  dropboxToken?: string
  save?: jest.MockedFunction<() => Promise<MockUser>>
  populate?: jest.MockedFunction<(field: string) => Promise<MockUser>>
}

export interface MockExperiment {
  _id?: string
  id?: string
  name?: string
  description?: string
  irbProtocolNumber?: string
  irbEmailAddress?: string
  createdBy?: string
  collaborators?: string[]
  isDraft?: boolean
  draft?: boolean
  sites?: string[]
  dateCreated?: Date
  dateModified?: Date
  isDeleted?: boolean
  save?: jest.MockedFunction<() => Promise<MockExperiment>>
  populate?: jest.MockedFunction<(field: string) => Promise<MockExperiment>>
}

export interface MockToken {
  _id?: string
  id?: string
  userId: string
  token: string
  createdAt?: Date
  save?: jest.MockedFunction<() => Promise<MockToken>>
}

export interface MockUnityUserToken {
  _id?: string
  id?: string
  userId: string
  token: string
  createdAt?: Date
  save?: jest.MockedFunction<() => Promise<MockUnityUserToken>>
}

export interface MockParticipant {
  _id?: string
  id?: string
  uid?: string
  experimentId?: string
  participantId?: string
  status?: string
  state?: string
  site?: string
  sessionStart?: Date
  dateCreated?: Date
  exclude?: boolean
  email?: string
  note?: string
  files?: string[]
  save?: jest.MockedFunction<() => Promise<MockParticipant>>
}

export interface MockSite {
  _id?: string
  id?: string
  name?: string
  shortName?: string
  experimentId?: string
  parentExperiment?: string
  save?: jest.MockedFunction<() => Promise<MockSite>>
}

export interface MockColumnDefinition {
  _id?: string
  id?: string
  fileTypeId?: string
  columns?: string[]
  save?: jest.MockedFunction<() => Promise<MockColumnDefinition>>
  populate?: jest.MockedFunction<(field: string) => Promise<MockColumnDefinition>>
}

export interface MockColumn {
  _id?: string
  id?: string
  columnDefinitionId?: string
  name?: string
  description?: string
  dataType?: string
  transform?: string
  order?: number
  save?: jest.MockedFunction<() => Promise<MockColumn>>
}

export interface MockFileType {
  _id?: string
  id?: string
  name?: string
  experimentId?: string
  extension?: string
  description?: string
  columnDefinition?: string | null
  save?: jest.MockedFunction<() => Promise<MockFileType>>
}

/**
 * Creates a mock user with default values and optional overrides
 * @param overrides - Partial user object to override defaults
 * @returns MockUser instance with jest.MockedFunction methods
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const defaultUser: MockUser = {
    _id: 'mock-user-id',
    id: 'mock-user-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    type: 'researcher',
    institution: 'mock-institution-id',
    lab: 'mock-lab-id',
    isEmailVerified: true,
    dateCreated: new Date('2025-01-01T00:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined)
  }

  const mockUser = { ...defaultUser, ...overrides }

  // Ensure save method returns the mock user instance
  if (mockUser.save) {
    mockUser.save.mockResolvedValue(mockUser)
  }

  if (mockUser.populate) {
    mockUser.populate.mockResolvedValue(mockUser)
  }

  return mockUser
}

/**
 * Creates a mock experiment with default values and optional overrides
 * @param overrides - Partial experiment object to override defaults
 * @returns MockExperiment instance with jest.MockedFunction methods
 */
export function createMockExperiment(overrides: Partial<MockExperiment> = {}): MockExperiment {
  const defaultExperiment: MockExperiment = {
    _id: 'mock-experiment-id',
    id: 'mock-experiment-id',
    name: 'Test Experiment',
    description: 'This is a test experiment',
    irbProtocolNumber: 'IRB-12345',
    irbEmailAddress: 'irb@institution.edu',
    createdBy: 'mock-user-id',
    collaborators: [],
    isDraft: false,
    dateCreated: new Date('2025-01-01T00:00:00.000Z'),
    dateModified: new Date('2025-01-01T00:00:00.000Z'),
    isDeleted: false,
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined)
  }

  const mockExperiment = { ...defaultExperiment, ...overrides }

  // Ensure save method returns the mock experiment instance
  if (mockExperiment.save) {
    mockExperiment.save.mockResolvedValue(mockExperiment)
  }

  if (mockExperiment.populate) {
    mockExperiment.populate.mockResolvedValue(mockExperiment)
  }

  return mockExperiment
}

/**
 * Creates a mock token with default values and optional overrides
 * @param overrides - Partial token object to override defaults
 * @returns MockToken instance with jest.MockedFunction methods
 */
export function createMockToken(overrides: Partial<MockToken> = {}): MockToken {
  const defaultToken: MockToken = {
    _id: 'mock-token-id',
    id: 'mock-token-id',
    userId: 'mock-user-id',
    token: 'mock-verification-token-12345',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined)
  }

  const mockToken = { ...defaultToken, ...overrides }

  // Ensure save method returns the mock token instance
  if (mockToken.save) {
    mockToken.save.mockResolvedValue(mockToken)
  }

  return mockToken
}

/**
 * Creates a mock Unity token with default values and optional overrides
 * @param overrides - Partial Unity token object to override defaults
 * @returns MockUnityToken instance with jest.MockedFunction methods
 */
export function createMockUnityUserToken(overrides: Partial<MockUnityUserToken> = {}): MockUnityUserToken {
  const defaultUnityUserToken: MockUnityUserToken = {
    _id: 'mock-unity-user-token-id',
    id: 'mock-unity-user-token-id',
    userId: 'mock-user-id',
    token: 'mock-unity-user-token-12345',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined)
  }

  const mockUnityUserToken = { ...defaultUnityUserToken, ...overrides }

  // Ensure save method returns the mock Unity token instance
  if (mockUnityUserToken.save) {
    mockUnityUserToken.save.mockResolvedValue(mockUnityUserToken)
  }

  return mockUnityUserToken
}

/**
 * Creates a mock participant with default values and optional overrides
 * @param overrides - Partial participant object to override defaults
 * @returns MockParticipant instance with jest.MockedFunction methods
 */
export function createMockParticipant(overrides: Partial<MockParticipant> = {}): MockParticipant {
  const defaultParticipant: MockParticipant = {
    _id: 'mock-participant-id',
    id: 'mock-participant-id',
    experimentId: 'mock-experiment-id',
    participantId: 'PART-001',
    status: 'active',
    dateCreated: new Date('2025-01-01T00:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined)
  }

  const mockParticipant = { ...defaultParticipant, ...overrides }

  // Ensure save method returns the mock participant instance
  if (mockParticipant.save) {
    mockParticipant.save.mockResolvedValue(mockParticipant)
  }

  return mockParticipant
}

/**
 * Creates a mock site with default values and optional overrides
 * @param overrides - Partial site object to override defaults
 * @returns MockSite instance with jest.MockedFunction methods
 */
export function createMockSite(overrides: Partial<MockSite> = {}): MockSite {
  const defaultSite: MockSite = {
    _id: 'mock-site-id',
    id: 'mock-site-id',
    name: 'Test Site',
    experimentId: 'mock-experiment-id',
    save: jest.fn().mockResolvedValue(undefined)
  }

  const mockSite = { ...defaultSite, ...overrides }

  // Ensure save method returns the mock site instance
  if (mockSite.save) {
    mockSite.save.mockResolvedValue(mockSite)
  }

  return mockSite
}

/**
 * Creates a mock column definition with default values and optional overrides
 * @param overrides - Partial column definition object to override defaults
 * @returns MockColumnDefinition instance with jest.MockedFunction methods
 */
export function createMockColumnDefinition(overrides: Partial<MockColumnDefinition> = {}): MockColumnDefinition {
  const defaultColumnDefinition: MockColumnDefinition = {
    _id: 'mock-column-def-id',
    id: 'mock-column-def-id',
    fileTypeId: 'mock-file-type-id',
    columns: [],
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined)
  }

  const mockColumnDefinition = { ...defaultColumnDefinition, ...overrides }

  // Ensure save method returns the mock column definition instance
  if (mockColumnDefinition.save) {
    mockColumnDefinition.save.mockResolvedValue(mockColumnDefinition)
  }

  if (mockColumnDefinition.populate) {
    mockColumnDefinition.populate.mockResolvedValue(mockColumnDefinition)
  }

  return mockColumnDefinition
}

/**
 * Creates a mock column with default values and optional overrides
 * @param overrides - Partial column object to override defaults
 * @returns MockColumn instance with jest.MockedFunction methods
 */
export function createMockColumn(overrides: Partial<MockColumn> = {}): MockColumn {
  const defaultColumn: MockColumn = {
    _id: 'mock-column-id',
    id: 'mock-column-id',
    columnDefinitionId: 'mock-column-def-id',
    name: 'Test Column',
    description: 'Test column description',
    dataType: 'string',
    transform: '',
    order: 1,
    save: jest.fn().mockResolvedValue(undefined)
  }

  const mockColumn = { ...defaultColumn, ...overrides }

  // Ensure save method returns the mock column instance
  if (mockColumn.save) {
    mockColumn.save.mockResolvedValue(mockColumn)
  }

  return mockColumn
}

/**
 * Creates a mock file type with default values and optional overrides
 * @param overrides - Partial file type object to override defaults
 * @returns MockFileType instance with jest.MockedFunction methods
 */
export function createMockFileType(overrides: Partial<MockFileType> = {}): MockFileType {
  const defaultFileType: MockFileType = {
    _id: 'mock-file-type-id',
    id: 'mock-file-type-id',
    name: 'Test File Type',
    experimentId: 'mock-experiment-id',
    extension: '.csv',
    description: 'Test file type description',
    columnDefinition: null,
    save: jest.fn().mockResolvedValue(undefined)
  }

  const mockFileType = { ...defaultFileType, ...overrides }

  // Ensure save method returns the mock file type instance
  if (mockFileType.save) {
    mockFileType.save.mockResolvedValue(mockFileType)
  }

  return mockFileType
}

/**
 * Type-safe helper to create mocked functions for model methods
 * @param model - The model to mock
 * @param methods - Array of method names to mock
 * @returns Object with mocked methods using jest.MockedFunction typing
 */
export function mockModelMethods<T extends Record<string, any>>(
  model: T,
  methods: Array<keyof T>
): Record<keyof T, jest.MockedFunction<any>> {
  const mockedMethods: Record<string, jest.MockedFunction<any>> = {}

  methods.forEach(method => {
    mockedMethods[method as string] = model[method] as jest.MockedFunction<any>
  })

  return mockedMethods as Record<keyof T, jest.MockedFunction<any>>
}

/**
 * Creates type-safe mock for Mongoose model static methods
 * @param methods - Object with method names and their mock implementations
 * @returns Mocked model with type-safe methods
 */
export function createMockModel<T>(methods: Record<string, jest.MockedFunction<any>>): T {
  const mockModel = jest.fn() as any

  // Add static methods
  Object.keys(methods).forEach(methodName => {
    mockModel[methodName] = methods[methodName]
  })

  // Add constructor-like behavior for new instances
  mockModel.prototype.save = jest.fn().mockResolvedValue(undefined)
  mockModel.prototype.populate = jest.fn().mockResolvedValue(undefined)

  return mockModel as T
}

/**
 * Standard mock setup for Passport authentication middleware
 * @param userOverrides - Optional user object overrides for req.user
 * @returns Mocked passport object with authenticate method
 */
export function mockPassportAuth(userOverrides: Partial<MockUser> = {}) {
  const mockUser = createMockUser(userOverrides)

  return {
    authenticate: jest.fn((strategies?: string | string[], options?: any) => {
      return jest.fn((req: any, res: any, next: any) => {
        req.user = mockUser
        next()
      })
    }) as jest.MockedFunction<typeof import('passport').authenticate>,
    initialize: jest.fn(() => (req: any, res: any, next: any) => next()) as jest.MockedFunction<any>
  }
}

/**
 * Mock setup for bcryptjs with consistent salt and hash values
 * @param saltValue - Custom salt value (default: 'mock-salt')
 * @param hashValue - Custom hash value (default: 'mock-hashed-password')
 * @returns Object with mocked bcrypt methods
 */
export function mockBcrypt(saltValue = 'mock-salt', hashValue = 'mock-hashed-password') {
  return {
    genSalt: jest.fn().mockResolvedValue(saltValue) as jest.MockedFunction<typeof import('bcryptjs').genSalt>,
    hash: jest.fn().mockResolvedValue(hashValue) as jest.MockedFunction<typeof import('bcryptjs').hash>,
    compare: jest.fn().mockResolvedValue(true) as jest.MockedFunction<typeof import('bcryptjs').compare>
  }
}

/**
 * Mock setup for sendEmail utility function
 * @param shouldSucceed - Whether email sending should succeed (default: true)
 * @returns Mocked sendEmail function
 */
export function mockSendEmail(shouldSucceed = true) {
  return jest.fn(async (mailOptions: any, callback: (error?: Error, info?: any) => void) => {
    if (shouldSucceed) {
      callback(undefined, { response: 'Mock email sent successfully' })
    } else {
      callback(new Error('Mock email sending failed'))
    }
    return true
  }) as jest.MockedFunction<any>
}

/**
 * Mock setup for crypto module
 * @param randomBytesValue - Custom random bytes value (default: 'mock-random-bytes')
 * @param hashValue - Custom hash digest value (default: 'mock-hash-digest')
 * @returns Object with mocked crypto methods
 */
export function mockCrypto(randomBytesValue = 'mock-random-bytes', hashValue = 'mock-hash-digest') {
  const mockHash = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue(hashValue)
  }

  return {
    randomBytes: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue(randomBytesValue)
    }) as jest.MockedFunction<typeof import('crypto').randomBytes>,
    createHash: jest.fn().mockReturnValue(mockHash) as jest.MockedFunction<typeof import('crypto').createHash>
  }
}

/**
 * Mock setup for jsonwebtoken
 * @param tokenValue - Custom JWT token value (default: 'mock-jwt-token')
 * @param decodedValue - Custom decoded JWT value
 * @returns Object with mocked JWT methods
 */
export function mockJWT(tokenValue = 'mock-jwt-token', decodedValue = { id: 'mock-user-id' }) {
  return {
    sign: jest.fn().mockReturnValue(tokenValue) as jest.MockedFunction<typeof import('jsonwebtoken').sign>,
    verify: jest.fn().mockReturnValue(decodedValue) as jest.MockedFunction<typeof import('jsonwebtoken').verify>,
    decode: jest.fn().mockReturnValue(decodedValue) as jest.MockedFunction<typeof import('jsonwebtoken').decode>
  }
}

/**
 * Utility to reset all mocks in a standardized way
 * Should be called in beforeEach hooks
 */
export function resetAllMocks() {
  jest.clearAllMocks()
}

/**
 * Utility to clean up resources after tests
 * Should be called in afterAll hooks
 */
export async function cleanupAfterTests() {
  await mongoose.disconnect()
  jest.restoreAllMocks()
}

/**
 * Creates a mock Express request object with common properties
 * @param overrides - Properties to override on the request object
 * @returns Mock request object
 */
export function createMockRequest(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides
  }
}

/**
 * Creates a mock Express response object with common methods
 * @returns Mock response object with jest.MockedFunction methods
 */
export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis()
  }

  return res as any
}

/**
 * Creates a mock Express next function
 * @returns Mock next function
 */
export function createMockNext() {
  return jest.fn() as jest.MockedFunction<() => void>
}
