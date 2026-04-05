// tests/Routes/sites.test.ts
import request from "supertest"
import express from "express"
import mongoose from "mongoose"
import router from "../../src/routes/api/sites"

import Experiment from "../../src/models/Experiment"
import Site from "../../src/models/Site"

function buildQuery(result: any) {
  return { exec: jest.fn().mockResolvedValue(result) }
}

const app = express()
app.use(express.json())

jest.mock("passport", () => ({
  authenticate: jest.fn(() => (req: any, res: any, next: any) => {
    req.user = { id: "testUserId" }
    next()
  }),
  initialize: jest.fn(),
}))

jest.mock("../../src/models/Experiment")
jest.mock("../../src/models/Site")

app.use("/api/sites", router)

describe("Sites Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ===== GET /api/sites/:siteId =====
  describe("GET /:siteId", () => {
    it("should return 400 if site ID is invalid", async () => {
      const res = await request(app).get("/api/sites/invalid")
      expect(res.status).toBe(400)
      expect(res.body.message).toBe(
        "Site ID is required, but was not provided or is not a valid ID."
      )
    })

    it("should return 404 if site not found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      jest.spyOn(Site, "findById").mockResolvedValueOnce(null)
      const res = await request(app).get(`/api/sites/${validId}`)
      expect(res.status).toBe(404)
      expect(res.body.message).toBe(
        "Site by provided ID could not be found in database."
      )
    })

    it("should return 200 with the site if found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      const siteMock = { _id: validId, name: "Site 1", parentExperiment: "exp1" }
      jest.spyOn(Site, "findById").mockResolvedValueOnce(siteMock)
      const res = await request(app).get(`/api/sites/${validId}`)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, site: siteMock })
    })
  })

  // ===== POST /api/sites/ =====
  describe("POST /", () => {
    it("should return 400 if site name or shortName is not provided", async () => {
      const payload = { parentExperiment: new mongoose.Types.ObjectId().toHexString() }
      const res = await request(app).post("/api/sites/").send(payload)
      expect(res.status).toBe(400)
      expect(res.body.message).toBe(
        "Site name and short name are required, but at least one was not provided."
      )
    })

    it("should return 400 if parent experiment is not provided or invalid", async () => {
      const payload = { name: "Test Site", shortName: "TS", parentExperiment: "invalid" }
      const res = await request(app).post("/api/sites/").send(payload)
      expect(res.status).toBe(400)
      expect(res.body.message).toBe(
        "Parent experiment is required, but was not provided or is not a valid ID."
      )
    })

    it("should return 404 if parent experiment not found", async () => {
      const validExpId = new mongoose.Types.ObjectId().toHexString()
      const payload = { name: "Test Site", shortName: "TS", parentExperiment: validExpId }
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce(null)
      const res = await request(app).post("/api/sites/").send(payload)
      expect(res.status).toBe(404)
      expect(res.body.message).toBe(
        "Parent experiment by provided ID could not be found in database."
      )
    })

    it("should return 409 if a site with the same name already exists", async () => {
      const validExpId = new mongoose.Types.ObjectId().toHexString()
      const payload = { name: "Test Site", shortName: "TS", parentExperiment: validExpId }
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce({ _id: validExpId, sites: [] })
      jest.spyOn(Site, "findOne").mockResolvedValueOnce({ _id: "site1", name: "Test Site" })
      const res = await request(app).post("/api/sites/").send(payload)
      expect(res.status).toBe(409)
      expect(res.body.message).toBe(
        "A site with name 'Test Site' already exists for the given parent experiment."
      )
    })

    it("should return 409 if a site with the same short name already exists", async () => {
      const validExpId = new mongoose.Types.ObjectId().toHexString()
      const payload = { name: "Unique Name", shortName: "TS", parentExperiment: validExpId }
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce({ _id: validExpId, sites: [] })
      const findOneSpy = jest.spyOn(Site, "findOne")
      findOneSpy.mockResolvedValueOnce(null)
      findOneSpy.mockResolvedValueOnce({ _id: "site1", shortName: "TS" })
      const res = await request(app).post("/api/sites/").send(payload)
      expect(res.status).toBe(409)
      expect(res.body.message).toBe(
        "A site with short name 'TS' already exists for the given parent experiment."
      )
    })

    it("should create a new site and update parent experiment", async () => {
      const validExpId = new mongoose.Types.ObjectId().toHexString()
      const payload = { name: "New Site", shortName: "NS", parentExperiment: validExpId }

      const experimentMock = {
        _id: validExpId,
        sites: [],
        save: jest.fn().mockResolvedValue(true),
      }
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce(experimentMock)
      const siteFindOneSpy = jest.spyOn(Site, "findOne")
      siteFindOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

      const newSiteMock = {
        _id: "siteNew",
        name: "New Site",
        shortName: "NS",
        parentExperiment: validExpId,
        toObject() {
          return {
            _id: this._id,
            name: this.name,
            shortName: this.shortName,
            parentExperiment: this.parentExperiment,
          }
        },
      }
      jest.spyOn(Site.prototype, "save").mockResolvedValueOnce(newSiteMock)
      experimentMock.sites.push(newSiteMock._id)

      const res = await request(app).post("/api/sites/").send(payload)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty("success", true)
      expect(res.body).toHaveProperty("message", "Site created successfully.")
    })
  })

  // ===== PATCH /api/sites/:siteId =====
  describe("PATCH /:siteId", () => {
    it("should return 400 if no field provided to update", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      const res = await request(app).patch(`/api/sites/${validId}`).send({})
      expect(res.status).toBe(400)
      expect(res.body.message).toBe("At least one field (name or shortName) must be provided to update")
    })

    it("should return 404 if site not found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      jest.spyOn(Site, "findById").mockResolvedValueOnce(null)
      const res = await request(app).patch(`/api/sites/${validId}`).send({ name: "Updated Site" })
      expect(res.status).toBe(404)
      expect(res.body).toBe("Site not found in database by given ID")
    })

    it("should return 409 if a site with the new name exists", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      const currentSite = { _id: validId, name: "Old Name", shortName: "OS", parentExperiment: "exp1" }
      jest.spyOn(Site, "findById").mockResolvedValueOnce(currentSite)
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce({ _id: "exp1" })
      jest.spyOn(Site, "findOne").mockResolvedValueOnce({ _id: "siteExisting", name: "New Name", parentExperiment: "exp1" })
      const res = await request(app).patch(`/api/sites/${validId}`).send({ name: "New Name" })
      expect(res.status).toBe(409)
      expect(res.body.message).toBe("A site with name 'New Name' already exists for its parent experiment.")
    })

    it("should update and return 200 if site is found and update is valid", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      const currentSite = {
        _id: validId,
        name: "Old Name",
        shortName: "OS",
        parentExperiment: "exp1",
        save: jest.fn().mockResolvedValue({ _id: validId, name: "New Name", shortName: "OS", parentExperiment: "exp1" }),
      }
      jest.spyOn(Site, "findById").mockResolvedValueOnce(currentSite)
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce({ _id: "exp1" })
      const res = await request(app).patch(`/api/sites/${validId}`).send({ name: "New Name" })
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, updatedSite: { _id: validId, name: "New Name", shortName: "OS", parentExperiment: "exp1" } })
    })
  })

  // ===== DELETE /api/sites/:siteId =====
  describe("DELETE /:siteId", () => {
    it("should return 404 if site not found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      jest.spyOn(Site, "findById").mockResolvedValueOnce(null)
      const res = await request(app).delete(`/api/sites/${validId}`)
      expect(res.status).toBe(404)
      expect(res.body.message).toBe("Site by provided ID could not be found in database.")
    })

    it("should delete the site and update parent experiment", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString()
      const siteMock = {
        _id: validId,
        name: "Site to delete",
        parentExperiment: "exp1",
        deleteOne: jest.fn().mockResolvedValue(true),
      }
      jest.spyOn(Site, "findById").mockResolvedValueOnce(siteMock)
      const experimentMock = { _id: "exp1", sites: [validId], save: jest.fn().mockResolvedValue(true) }
      jest.spyOn(Experiment, "findById").mockResolvedValueOnce(experimentMock)
      const res = await request(app).delete(`/api/sites/${validId}`)
      expect(res.status).toBe(200)
      expect(res.body.message).toBe("Site deleted successfully.")
    }, 10000) // Increase timeout to 10 seconds
  })
})
