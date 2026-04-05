// tests/Routes/survey.test.ts
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import router from "../../src/routes/api/survey";

import {
  Survey,
  SurveyQuestion,
  SurveyInstance,
  SurveyResponse,
} from "../../src/models/Survey";

function buildQuery<T>(result: T) {
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(result),
      }),
    }),
  };
}

jest.mock("../../src/models/Survey");

const app = express();
app.use(express.json());
app.use("/api/survey", router);

describe("Survey Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  SURVEY INSTANCES
  describe("Survey Instances", () => {
    describe("POST /instances/", () => {
      it("should return 400 if required fields are missing", async () => {
        const res = await request(app).post("/api/survey/instances/").send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe(
          "Missing required fields: studyId, survey, or participantId"
        );
      });

      it("should return 400 if survey ID is invalid", async () => {
        const payload = {
          studyId: "study1",
          survey: "invalid",
          participantId: "participant1",
        };
        const res = await request(app).post("/api/survey/instances/").send(payload);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey ID");
      });

      it("should return 400 if survey not found", async () => {
        const surveyId = (new mongoose.Types.ObjectId()).toHexString();
        const payload = {
          studyId: "study1",
          survey: surveyId,
          participantId: "participant1",
        };
        (Survey.findById as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).post("/api/survey/instances/").send(payload);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Survey not found in database");
      });
    });

    describe("GET /instances/:id", () => {
      it("should return 400 for an invalid survey instance ID", async () => {
        const res = await request(app).get("/api/survey/instances/invalid");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey instance ID");
      });
    });

    describe("PUT /instances/:id", () => {
      it("should return 400 for an invalid survey instance ID", async () => {
        const res = await request(app)
          .put("/api/survey/instances/invalid")
          .send({ participantId: "newParticipant" });
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey instance ID");
      });

      it("should return 400 if updated survey ID is invalid", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { survey: "invalid" };
        const res = await request(app).put(`/api/survey/instances/${validId}`).send(updates);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey ID");
      });

      it("should return 400 if any response ID is invalid", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { responses: ["invalid"] };
        const res = await request(app).put(`/api/survey/instances/${validId}`).send(updates);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid response ID: invalid");
      });

      it("should return 400 if a response is not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const responseId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { responses: [responseId] };
        (SurveyResponse.findById as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).put(`/api/survey/instances/${validId}`).send(updates);
        expect(res.status).toBe(400);
        expect(res.text).toBe(`SurveyResponse not found: ${responseId}`);
      });

      it("should update and return 200 if survey instance is found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { participantId: "newParticipant" };
        const updatedInstance = { _id: validId, participantId: "newParticipant" };
        (SurveyInstance.findByIdAndUpdate as jest.Mock).mockReturnValueOnce(buildQuery(updatedInstance));
        const res = await request(app).put(`/api/survey/instances/${validId}`).send(updates);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(updatedInstance);
      });

      it("should return 404 if survey instance to update is not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { participantId: "newParticipant" };
        (SurveyInstance.findByIdAndUpdate as jest.Mock).mockReturnValueOnce(buildQuery(null));
        const res = await request(app).put(`/api/survey/instances/${validId}`).send(updates);
        expect(res.status).toBe(404);
        expect(res.text).toBe("Survey instance not found");
      });
    });

    describe("DELETE /instances/:id", () => {
      it("should return 400 for an invalid survey instance ID", async () => {
        const res = await request(app).delete("/api/survey/instances/invalid");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey instance ID");
      });

      it("should return 404 if survey instance not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        (SurveyInstance.findById as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).delete(`/api/survey/instances/${validId}`);
        expect(res.status).toBe(404);
        expect(res.text).toBe("Survey instance not found");
      });

      it("should delete associated responses and the instance and return 200", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const instanceMock = { _id: validId, responses: ["resp1", "resp2"] };
        (SurveyInstance.findById as jest.Mock).mockResolvedValueOnce(instanceMock);
        (SurveyResponse.deleteMany as jest.Mock).mockResolvedValueOnce({ deletedCount: 2 });
        (SurveyInstance.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(instanceMock);
        const res = await request(app).delete(`/api/survey/instances/${validId}`);
        expect(res.status).toBe(200);
        expect(res.text).toBe("Survey instance and associated responses deleted successfully");
      });
    });
  });

  // SURVEY QUESTIONS
  describe("Survey Questions", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("POST /questions/", () => {
      it("should return 400 if parent survey not found", async () => {
        const payload = {
          surveyParent: (new mongoose.Types.ObjectId()).toHexString(),
          questionNumberInSurvey: 1,
          questionText: "What is your age?",
          questionType: "number",
        };
        (Survey.findById as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).post("/api/survey/questions/").send(payload);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Question's parent survey not found in database");
      });
    });

    describe("DELETE /questions/:id", () => {
      it("should return 400 if question ID is invalid", async () => {
        const res = await request(app).delete("/api/survey/questions/invalid");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid question ID");
      });

      it("should return 404 if survey question not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const { SurveyQuestion } = require("../../src/models/Survey");
        SurveyQuestion.findById = jest.fn().mockResolvedValueOnce(null);
        const res = await request(app).delete(`/api/survey/questions/${validId}`);
        expect(res.status).toBe(404);
        expect(res.text).toBe("Survey question not found");
      });
    });
  });

  //  SURVEYS 
  describe("Surveys", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("POST /", () => {
      it("should return 500 on error", async () => {
        const payload = {
          surveyName: "Test Survey",
          surveyDescription: "Test Description",
          surveyEndStatement: "Thank you",
        };
        jest.spyOn(Survey.prototype, "save").mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app).post("/api/survey/").send(payload);
        expect(res.status).toBe(500);
        expect(res.text).toBe("Error creating survey");
      });
    });

    describe("DELETE /:id", () => {
      it("should return 400 if survey id is invalid", async () => {
        const res = await request(app).delete("/api/survey/invalid");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey ID");
      });

      it("should return 404 if survey not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        (Survey.findById as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).delete(`/api/survey/${validId}`);
        expect(res.status).toBe(404);
        expect(res.text).toBe("Survey not found");
      });

      it("should delete the survey and its questions and return 200", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const surveyMock = { _id: validId, questions: ["q1", "q2"] };
        (Survey.findById as jest.Mock).mockResolvedValueOnce(surveyMock);
        const { SurveyQuestion } = require("../../src/models/Survey");
        SurveyQuestion.deleteMany = jest.fn().mockResolvedValueOnce({ deletedCount: 2 });
        (Survey.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(surveyMock);
        const res = await request(app).delete(`/api/survey/${validId}`);
        expect(res.status).toBe(200);
        expect(res.text).toBe("Survey and associated questions deleted successfully");
      });
    });

    describe("GET /:surveyId/instances", () => {
      it("should return 400 if survey id is invalid", async () => {
        const res = await request(app).get("/api/survey/invalid/instances");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey ID");
      });

      it("should return 200 with survey instances if found", async () => {
        const surveyId = (new mongoose.Types.ObjectId()).toHexString();
        const instancesMock = [{ _id: "i1" }, { _id: "i2" }];
        const { SurveyInstance } = require("../../src/models/Survey");
        SurveyInstance.find = jest.fn().mockResolvedValueOnce(instancesMock);
        const res = await request(app).get(`/api/survey/${surveyId}/instances`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(instancesMock);
      });
    });
  });

  //  SURVEY RESPONSES 
  describe("Survey Responses", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("POST /responses/", () => {
      it("should return 400 if required fields are missing", async () => {
        const res = await request(app).post("/api/survey/responses/").send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe("Request is missing a required field: question, instance, or answer");
      });

      it("should return 400 if question or surveyInstance id is invalid", async () => {
        const payload = { question: "invalid", surveyInstance: "invalid", answer: "42" };
        const res = await request(app).post("/api/survey/responses/").send(payload);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid question or instance ID");
      });
    });

    describe("GET /responses/:id", () => {
      it("should return 400 for an invalid survey response ID", async () => {
        const res = await request(app).get("/api/survey/responses/invalid");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey response ID");
      });

      it("should return 404 if survey response not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        SurveyResponse.findById = jest.fn().mockReturnValueOnce(buildQuery(null));
        const res = await request(app).get(`/api/survey/responses/${validId}`);
        expect(res.status).toBe(404);
        expect(res.text).toBe("Survey response not found");
      });

      it("should return 200 with the survey response if found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const responseMock = { _id: validId, answer: "42" };
        SurveyResponse.findById = jest.fn().mockReturnValueOnce(buildQuery(responseMock));
        const res = await request(app).get(`/api/survey/responses/${validId}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(responseMock);
      });
    });

    describe("PUT /responses/:id", () => {
      it("should return 400 for an invalid survey response ID", async () => {
        const res = await request(app).put("/api/survey/responses/invalid").send({ answer: "updated" });
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey response ID");
      });

      it("should return 400 if updated question ID is invalid", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { question: "invalid" };
        const res = await request(app).put(`/api/survey/responses/${validId}`).send(updates);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid question ID");
      });

      it("should return 400 if updated instance ID is invalid", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        const updates = { surveyInstance: "invalid" };
        const res = await request(app).put(`/api/survey/responses/${validId}`).send(updates);
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid surveyInstance ID");
      });
    });

    describe("DELETE /responses/:id", () => {
      it("should return 400 for an invalid survey response ID", async () => {
        const res = await request(app).delete("/api/survey/responses/invalid");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey response ID");
      });

      it("should return 404 if survey response not found", async () => {
        const validId = (new mongoose.Types.ObjectId()).toHexString();
        SurveyResponse.findByIdAndDelete = jest.fn().mockResolvedValueOnce(null);
        const res = await request(app).delete(`/api/survey/responses/${validId}`);
        expect(res.status).toBe(404);
        expect(res.text).toBe("Survey response not found");
      });
    });

    describe("GET /:surveyInstanceId/responses", () => {
      it("should return 400 if survey instance id is invalid", async () => {
        const res = await request(app).get("/api/survey/invalid/responses");
        expect(res.status).toBe(400);
        expect(res.text).toBe("Invalid survey instance ID");
      });

      it("should return 200 with responses if found", async () => {
        const instanceId = (new mongoose.Types.ObjectId()).toHexString();
        const responsesMock = [{ _id: "r1" }, { _id: "r2" }];
        SurveyResponse.find = jest.fn().mockResolvedValueOnce(responsesMock);
        const res = await request(app).get(`/api/survey/${instanceId}/responses`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(responsesMock);
      });

      it("should return 500 on error", async () => {
        const instanceId = (new mongoose.Types.ObjectId()).toHexString();
        SurveyResponse.find = jest.fn().mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app).get(`/api/survey/${instanceId}/responses`);
        expect(res.status).toBe(500);
        expect(res.text).toBe("Error retrieving survey responses");
      });
    });
  });
});
