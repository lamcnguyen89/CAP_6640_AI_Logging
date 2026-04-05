import express, { Request, Response } from "express";
import { Survey, SurveyQuestion, SurveyInstance, SurveyResponse } from "../../models/Survey";
import mongoose from "mongoose";

const router = express.Router();



// SURVEY INSTANCES

// Create a new survey instance
router.post("/instances/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { studyId, survey, participantId, responses } = req.body;

    // Validate required fields
    if (!studyId || !survey || !participantId) {
      res.status(400).send("Missing required fields: studyId, survey, or participantId");
      return;
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(survey)) {
      res.status(400).send("Invalid survey ID");
      return;
    }

    // Verify that the survey exists
    const existingSurvey = await Survey.findById(survey);
    if (!existingSurvey) {
      res.status(400).send("Survey not found in database");
      return;
    }

    let surveyInstance;
    // If responses are provided, validate and add them
    if (responses && Array.isArray(responses)) {
      for (const responseId of responses) {
        // Validate response ID
        if (!mongoose.Types.ObjectId.isValid(responseId)) {
          res.status(400).send(`Invalid response ID: ${responseId}`);
          return;
        }

        // Verify that the response exists
        const existingResponse = await SurveyResponse.findById(responseId);
        if (!existingResponse) {
          res.status(400).send(`SurveyResponse not found: ${responseId}`);
          return;
        }
      }

      // Create survey instance with responses
      surveyInstance = new SurveyInstance({
        studyId,
        survey,
        participantId,
        responses,
      });
    }
    // If there are no responses given, initialize with an empty array
    else {
      surveyInstance = new SurveyInstance({
        studyId,
        survey,
        participantId,
        responses: [], // Initialize with an empty array
      });
    }

    await surveyInstance.save();
    res.status(201).json(surveyInstance);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating survey instance");
  }
});

// Get all survey instances
router.get("/instances/", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyInstances = await SurveyInstance.find()
      .populate("survey")
      .populate("responses");

    res.status(200).json(surveyInstances);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey instances");
  }
});

// Get a survey instance by ID
router.get("/instances/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyInstanceId = req.params.id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(surveyInstanceId)) {
      res.status(400).send("Invalid survey instance ID");
      return;
    }

    // Get instance
    const surveyInstance = await SurveyInstance.findById(surveyInstanceId)
      .populate("survey")
      .populate("responses");

    if (!surveyInstance) {
      res.status(404).send("Survey instance not found");
      return;
    }

    res.status(200).json(surveyInstance);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey instance");
  }
});

// Update survey instance by ID
router.put("/instances/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyInstanceId = req.params.id;
    const updates = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(surveyInstanceId)) {
      res.status(400).send("Invalid survey instance ID");
      return;
    }

    // Validate and verify updated survey ID if provided
    if (updates.survey) {
      if (!mongoose.Types.ObjectId.isValid(updates.survey)) {
        res.status(400).send("Invalid survey ID");
        return;
      }
      const existingSurvey = await Survey.findById(updates.survey);
      if (!existingSurvey) {
        res.status(400).send("Survey not found in database");
        return;
      }
    }

    // Validate and verify updated responses if provided
    if (updates.responses) {
      if (!Array.isArray(updates.responses)) {
        res.status(400).send("Responses must be an array of SurveyResponse IDs");
        return;
      }

      for (const responseId of updates.responses) {
        if (!mongoose.Types.ObjectId.isValid(responseId)) {
          res.status(400).send(`Invalid response ID: ${responseId}`);
          return;
        }

        const existingResponse = await SurveyResponse.findById(responseId);
        if (!existingResponse) {
          res.status(400).send(`SurveyResponse not found: ${responseId}`);
          return;
        }
      }
    }

    // Update the survey instance
    const updatedSurveyInstance = await SurveyInstance.findByIdAndUpdate(
      surveyInstanceId,
      updates,
      { new: true }
    )
      .populate("survey")
      .populate("responses")
      .exec();

    if (!updatedSurveyInstance) {
      res.status(404).send("Survey instance not found");
      return;
    }

    res.status(200).json(updatedSurveyInstance);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating survey instance");
  }
});

// Delete a survey instance by ID (and delete all associated survey responses)
router.delete("/instances/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyInstanceId = req.params.id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(surveyInstanceId)) {
      res.status(400).send("Invalid survey instance ID");
      return;
    }

    // Find the survey instance
    const surveyInstance = await SurveyInstance.findById(surveyInstanceId);

    if (!surveyInstance) {
      res.status(404).send("Survey instance not found");
      return;
    }

    const responseIds = surveyInstance.responses;

    // Delete all associated survey responses
    await SurveyResponse.deleteMany({ _id: { $in: responseIds } });

    // Delete the survey instance
    await SurveyInstance.findByIdAndDelete(surveyInstanceId);

    res.status(200).send("Survey instance and associated responses deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting survey instance");
  }
});



// SURVEY QUESTIONS

// Create a new survey question
router.post('/questions/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      surveyParent,
      questionNumberInSurvey,
      questionText,
      questionType,
      questionOptions,
      leftSliderText,
      rightSliderText,
      matrixColumnNames,
    } = req.body;

    // Verify that the parent survey exists
    const existingSurvey = await Survey.findById(surveyParent);
    if (!existingSurvey) {
      res.status(400).send("Question's parent survey not found in database");
      return;
    }

    // Create the survey question
    const surveyQuestion = new SurveyQuestion({
      surveyParent,
      questionNumberInSurvey,
      questionText,
      questionType,
      questionOptions,
      leftSliderText,
      rightSliderText,
      matrixColumnNames,
    });

    await surveyQuestion.save();

    // Update the parent survey
    await Survey.findByIdAndUpdate(
      surveyParent,
      { $addToSet: { questions: surveyQuestion._id } },
      { new: true }
    );

    res.status(201).json(surveyQuestion);
  } catch (error) {
    console.error('Error creating survey question:', error);
    res.status(500).send('Error creating survey question');
  }
});

// Get a survey question by ID
router.get("/questions/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await SurveyQuestion.findById(req.params.id).populate('surveyParent');
    if (!question) {
      res.status(404).send("Survey question not found");
      return;
    }
    res.status(200).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey question");
  }
});

// Update a survey question by ID
router.put("/questions/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    const question = await SurveyQuestion.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!question) {
      res.status(404).send("Survey question not found");
      return;
    }
    res.status(200).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating survey question");
  }
});

// Delete a survey question by ID (and remove from parent survey's questions array)
router.delete("/questions/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const questionId = req.params.id;

    // Validate the questionId
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      res.status(400).send("Invalid question ID");
      return;
    }

    // Find the survey question
    const question = await SurveyQuestion.findById(questionId);
    if (!question) {
      res.status(404).send("Survey question not found");
      return;
    }

    const surveyId = question.surveyParent;

    // Delete the survey question
    await SurveyQuestion.findByIdAndDelete(questionId);

    // Remove the question ID from the parent survey's questions array
    await Survey.findByIdAndUpdate(surveyId, {
      $pull: { questions: questionId },
    });

    res.status(200).send("Survey question deleted and parent survey updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting survey question");
  }
});



// SURVEYS

// Create a new survey
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { surveyName, surveyDescription, surveyEndStatement } = req.body;

    // Create the survey
    const survey = new Survey({
      surveyName,
      surveyDescription,
      surveyEndStatement,
      questions: [],
    });

    await survey.save();
    res.status(201).json(survey);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating survey");
  }
});

// Get all surveys
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveys = await Survey.find().populate('questions');
    res.status(200).json(surveys);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving surveys");
  }
});

// Get a survey by ID
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const survey = await Survey.findById(req.params.id).populate('questions');
    if (!survey) {
      res.status(404).send("Survey not found");
      return;
    }
    res.status(200).json(survey);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey");
  }
});

// Update a survey by ID
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body;

    // If 'questions' is being updated, validate the IDs
    if (updates.questions) {
      if (Array.isArray(updates.questions) && updates.questions.length != 0) {
        // Verify that all provided question IDs exist
        const existingQuestions = await SurveyQuestion.find({ _id: { $in: updates.questions } });
        const existingQuestionIds = existingQuestions.map((q) => q._id.toString());

        // Find IDs that do not exist
        const invalidQuestionIds = updates.questions.filter((id: string) => !existingQuestionIds.includes(id));

        if (invalidQuestionIds.length > 0) {
          res.status(400).send(`The following SurveyQuestion IDs do not exist: ${invalidQuestionIds.join(", ")}`);
          return;
        }
      }      
    }

    // Update the survey
    const survey = await Survey.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!survey) {
      res.status(404).send("Survey not found");
      return;
    }
    res.status(200).json(survey);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating survey");
  }
});

// Delete a survey by ID and its associated survey questions
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyId = req.params.id;

    // Validate the surveyId
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      res.status(400).send('Invalid survey ID');
      return;
    }

    // Find the survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      res.status(404).send('Survey not found');
      return;
    }

    const questionIds = survey.questions;

    // Delete each survey question associated with this survey
    if (questionIds && questionIds.length > 0) {
      const deleteQuestionsResult = await SurveyQuestion.deleteMany({ _id: { $in: questionIds } });
      console.log('Deleted survey questions:', deleteQuestionsResult);
    }

    // Delete the survey itself
    const deleteSurveyResult = await Survey.findByIdAndDelete(surveyId);
    console.log('Deleted survey:', deleteSurveyResult);

    res.status(200).send('Survey and associated questions deleted successfully');
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).send('Error deleting survey');
  }
});

// Get all questions associated with a given survey ID
router.get("/:surveyId/questions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { surveyId } = req.params;

    // Validate the surveyId
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      res.status(400).send("Invalid survey ID");
      return;
    }

    // Find all survey questions where surveyParent matches the surveyId
    const questions = await SurveyQuestion.find({ surveyParent: surveyId })
      .sort({ questionNumberInSurvey: 1 });

    res.status(200).json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey questions");
  }
});

// Get all instances associated with a given survey ID
router.get("/:surveyId/instances", async (req: Request, res: Response): Promise<void> => {
  try {
    const { surveyId } = req.params;

    // Validate the surveyId
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      res.status(400).send("Invalid survey ID");
      return;
    }

    // Find all survey questions where surveyParent matches the surveyId
    const instances = await SurveyInstance.find({ survey: surveyId });

    res.status(200).json(instances);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey questions");
  }
});



// SURVEY RESPONSES

// Create a new survey response
router.post("/responses/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, surveyInstance, answer } = req.body;

    // Validate required fields
    if (!question || !surveyInstance || !answer) {
      res.status(400).send("Request is missing a required field: question, instance, or answer");
      return;
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(question) || !mongoose.Types.ObjectId.isValid(surveyInstance)) {
      res.status(400).send("Invalid question or instance ID");
      return;
    }

    // Verify that the question exists
    const existingQuestion = await SurveyQuestion.findById(question);
    if (!existingQuestion) {
      res.status(400).send("SurveyQuestion associated with response was not found in database");
      return;
    }

    // Verify that the instance exists
    const existingInstance = await SurveyInstance.findById(surveyInstance);
    if (!existingInstance) {
      res.status(400).send("SurveyInstance associated with response was not found in database");
      return;
    }

    // Create survey response
    const surveyResponse = new SurveyResponse({
      question,
      surveyInstance,
      answer,
    });

    await surveyResponse.save();

    // Add the survey response to the associated SurveyInstance's responses array
    await SurveyInstance.findByIdAndUpdate(surveyInstance, {
      $push: { responses: surveyResponse._id },
    });

    res.status(201).json(surveyResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating survey response");
  }
});

// Get all survey responses
router.get("/responses/", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyResponses = await SurveyResponse.find()
      .populate("question")
      .populate("instance")
      .exec();

    res.status(200).json(surveyResponses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey responses");
  }
});

// Get a survey response by ID
router.get("/responses/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyResponseId = req.params.id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(surveyResponseId)) {
      res.status(400).send("Invalid survey response ID");
      return;
    }
    
    // Find survey response
    const surveyResponse = await SurveyResponse.findById(surveyResponseId)
      .populate("question")
      .populate("instance")
      .exec();

    // Check if survey response exists
    if (!surveyResponse) {
      res.status(404).send("Survey response not found");
      return;
    }

    res.status(200).json(surveyResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey response");
  }
});

// Update a survey response by ID
router.put("/responses/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyResponseId = req.params.id;
    const updates = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(surveyResponseId)) {
      res.status(400).send("Invalid survey response ID");
      return;
    }

    // Validate and verify updated question ID if provided
    if (updates.question) {
      if (!mongoose.Types.ObjectId.isValid(updates.question)) {
        res.status(400).send("Invalid question ID");
        return;
      }
      const existingQuestion = await SurveyQuestion.findById(updates.question);
      if (!existingQuestion) {
        res.status(400).send("SurveyQuestion not found in database");
        return;
      }
    }

    // Validate and verify updated instance ID if provided
    if (updates.surveyInstance) {
      if (!mongoose.Types.ObjectId.isValid(updates.surveyInstance)) {
        res.status(400).send("Invalid surveyInstance ID");
        return;
      }
      const existingInstance = await SurveyInstance.findById(updates.surveyInstance);
      if (!existingInstance) {
        res.status(400).send("SurveyInstance not found in database");
        return;
      }
    }

    // Update response
    const updatedSurveyResponse = await SurveyResponse.findByIdAndUpdate(
      surveyResponseId,
      updates,
      { new: true }
    )
      .populate("question")
      .populate("instance")
      .exec();

    // Check for failure
    if (!updatedSurveyResponse) {
      res.status(404).send("Survey response not found");
      return;
    }

    res.status(200).json(updatedSurveyResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating survey response");
  }
});

// Delete a survey response by ID
router.delete("/responses/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const surveyResponseId = req.params.id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(surveyResponseId)) {
      res.status(400).send("Invalid survey response ID");
      return;
    }

    // Find and delete the survey response
    const deletedSurveyResponse = await SurveyResponse.findByIdAndDelete(surveyResponseId);

    if (!deletedSurveyResponse) {
      res.status(404).send("Survey response not found");
      return;
    }

    // Remove the survey response from the associated SurveyInstance's responses array
    await SurveyInstance.findByIdAndUpdate(deletedSurveyResponse.surveyInstance, {
      $pull: { responses: surveyResponseId },
    });

    res.status(200).send("Survey response deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting survey response");
  }
});

// Get all responses associated with a given survey instance ID
router.get("/:surveyInstanceId/responses", async (req: Request, res: Response): Promise<void> => {
  try {
    const { surveyInstanceId } = req.params;

    // Validate the surveyInstanceId
    if (!mongoose.Types.ObjectId.isValid(surveyInstanceId)) {
      res.status(400).send("Invalid survey instance ID");
      return;
    }

    // Find all survey questions where surveyInstance matches the surveyInstanceId
    const responses = await SurveyResponse.find({ surveyInstance: surveyInstanceId });

    res.status(200).json(responses);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving survey responses");
  }
});

export default router;