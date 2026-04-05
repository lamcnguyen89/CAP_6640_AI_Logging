// tests/Routes/study.test.ts
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import router from "../../src/routes/api/study";

import Study from "../../src/models/Study";
import Experiment from "../../src/models/Experiment";
import User from "../../src/models/User";
import deleteMethods2 from "../../src/common/deleteMethods2";

function buildQuery(result: any) {
  return {
    exec: jest.fn().mockResolvedValue(result),
  };
}

const app = express();
app.use(express.json());

jest.mock("passport", () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    req.user = { id: "testUserId" };
    next();
  }),
  initialize: jest.fn(),
}));

jest.mock("../../src/models/Study");
jest.mock("../../src/models/Experiment");
jest.mock("../../src/models/User");
jest.mock("../../src/common/deleteMethods2");

app.use("/api/studies", router);

describe("Study Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- GET /api/studies/:studyId ----------
  describe("GET /:studyId", () => {
    it("should return 400 if study ID is missing or invalid", async () => {
      const res = await request(app).get("/api/studies/invalid");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid study ID");
    });

    it("should return 404 if study not found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      (Study.findById as jest.Mock).mockResolvedValueOnce(null);
      const res = await request(app).get(`/api/studies/${validId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Study not found with ID ${validId}`);
    });

    it("should return 403 if caller is not creator or in users array", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      const studyMock = {
        _id: validId,
        createdBy: new mongoose.Types.ObjectId().toHexString(),
        users: [],
      };
      (Study.findById as jest.Mock).mockResolvedValueOnce(studyMock);
      const res = await request(app).get(`/api/studies/${validId}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Caller is not creator or user of study");
    });

    it("should return 200 with the study if caller is authorized", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      const studyMock = {
        _id: validId,
        createdBy: "testUserId",
        users: [],
      };
      (Study.findById as jest.Mock).mockResolvedValueOnce(studyMock);
      const res = await request(app).get(`/api/studies/${validId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, study: studyMock });
    });
  });

  // ---------- PATCH /api/studies/:studyId ----------
  describe("PATCH /:studyId", () => {
    it("should return 400 if studyId is invalid", async () => {
      const res = await request(app).patch("/api/studies/invalid").send({ name: "Updated" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid or missing study ID");
    });

    it("should return 400 if no update fields provided", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app).patch(`/api/studies/${validId}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("At least one field (name, description, irbProtocolNumber, or users) must be provided to update");
    });

    it("should return 404 if study not found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      (Study.findById as jest.Mock).mockResolvedValueOnce(null);
      const res = await request(app).patch(`/api/studies/${validId}`).send({ name: "Updated" });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Study not found");
    });

    it("should return 409 if updating name to one that already exists", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      const studyMock = { _id: validId, name: "Old Study", createdBy: "testUserId", users: ["testUserId"] };
      (Study.findById as jest.Mock).mockResolvedValueOnce(studyMock);
      (Study.findOne as jest.Mock).mockResolvedValueOnce({ _id: "other", name: "New Study" });
      const res = await request(app).patch(`/api/studies/${validId}`).send({ name: "New Study" });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Study name already exists");
    });

    it("should update and return 200 if study is found and update is valid", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      const studyMock = {
        _id: validId,
        name: "Old Study",
        createdBy: "testUserId",
        users: ["testUserId"],
        save: jest.fn().mockResolvedValue({
          _id: validId,
          name: "Updated Study",
          createdBy: "testUserId",
          users: ["testUserId"],
        }),
      };
      (Study.findById as jest.Mock).mockResolvedValueOnce(studyMock);
      (Study.findOne as jest.Mock).mockResolvedValueOnce(null);
      const res = await request(app).patch(`/api/studies/${validId}`).send({ name: "Updated Study" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, study: { _id: validId, name: "Updated Study", createdBy: "testUserId", users: ["testUserId"] } });
    });
  });

  // ---------- GET /api/studies ----------
  describe("GET /", () => {
    it("should return 200 with studies for the caller", async () => {
      const studiesMock = [{ _id: "study1" }, { _id: "study2" }];
      (Study.find as jest.Mock).mockResolvedValueOnce(studiesMock);
      const res = await request(app).get("/api/studies/");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, studies: studiesMock });
    });

    it("should return 500 on error", async () => {
      (Study.find as jest.Mock).mockRejectedValueOnce(new Error("DB error"));
      const res = await request(app).get("/api/studies/");
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
  });

  // ---------- DELETE /api/studies/:studyId ----------
  describe("DELETE /:studyId", () => {
    it("should return 400 if studyId is invalid", async () => {
      const res = await request(app).delete("/api/studies/invalid");
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid or missing study ID");
    });

    it("should return 404 if study not found", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      (Study.findById as jest.Mock).mockResolvedValueOnce(null);
      const res = await request(app).delete(`/api/studies/${validId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Study not found");
    });

    it("should delete the study and associated experiments and return 204", async () => {
      const validId = new mongoose.Types.ObjectId().toHexString();
      const studyMock = { _id: validId, createdBy: "testUserId" };
      (Study.findById as jest.Mock).mockResolvedValueOnce(studyMock);
      (Experiment.find as jest.Mock).mockResolvedValueOnce([{ _id: "exp1" }]);
      (deleteMethods2.deleteExperiment as jest.Mock).mockResolvedValueOnce({ success: true });
      (Study.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(studyMock);
      const res = await request(app).delete(`/api/studies/${validId}`);
      expect(res.status).toBe(204);
    });
  });
});
