import mongoose, { Schema, Document, Model } from 'mongoose';

// Schemas

// Survey Schema - overall survey structure, containing a list of questions
const SurveySchema = new Schema({
  surveyName: {
    type: String,
    required: true,
  },
  surveyDescription: {
    type: String,
    required: true,
  },
  surveyEndStatement: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  questions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'SurveyQuestion',
    },
  ],
});

// Survey Question Schema - a single question of a certain type, with optional additional data
// Belongs to a single survey
const SurveyQuestionSchema = new Schema({
  // General info
  surveyParent: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
  },
  questionNumberInSurvey: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    required: true,
  },
  // For multiple choice, selection, and matrix (optional)
  questionOptions: {
    type: [String],
    required: false,
  },
  // For sliders (optional)
  leftSliderText: {
    type: String,
    required: false,
  },
  rightSliderText: {
    type: String,
    required: false,
  },
  // For matrix (optional)
  matrixColumnNames: {
    type: [String],
    required: false,
  },
  // Date
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Survey Response Schema - a single response to a single question in a survey instance
const SurveyResponseSchema = new Schema({
  question: {
    type: Schema.Types.ObjectId,
    ref: 'SurveyQuestion',
    required: true,
  },
  surveyInstance: {
    type: Schema.Types.ObjectId,
    ref: 'SurveyInstance',
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Survey Instance Schema - a single instance of a survey, containing a list of responses
const SurveyInstanceSchema = new Schema({
  studyId: {
    type: String,
    required: true,
  },
  survey: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
  },
  participantId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  responses: [
    {
      type: Schema.Types.ObjectId,
      ref: 'SurveyResponse',
    },
  ],
});



// TypeScript interfaces for Mongoose documents

export interface ISurvey extends Document {
  _id: string;
  surveyName: string;
  createdAt: Date;
  questions: Array<string>;
}

export interface ISurveyQuestion extends Document {
  _id: string;
  surveyParent: string;
  questionText: string;
  questionType: string;
  questionOptions: Array<string>;
  leftSliderText: string;
  rightSliderText: string;
  matrixColumnNames: Array<string>;
  createdAt: Date;
}

export interface ISurveyInstance extends Document {
  _id: string;
  studyId: string;
  survey: string;
  participantId: string;
  createdAt: Date;
  responses: Array<string>;
}

export interface ISurveyResponse extends Document {
  _id: string;
  question: string;
  surveyInstance: string;
  answer: string;
  createdAt: Date;
}



// Mongoose models creation

export const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', SurveySchema);
export const SurveyQuestion: Model<ISurveyQuestion> = mongoose.model<ISurveyQuestion>('SurveyQuestion', SurveyQuestionSchema);
export const SurveyInstance: Model<ISurveyInstance> = mongoose.model<ISurveyInstance>('SurveyInstance', SurveyInstanceSchema);
export const SurveyResponse: Model<ISurveyResponse> = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);