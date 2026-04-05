import mongoose, { Schema } from "mongoose";

// How to reference other Schemas: https://alexanderzeitler.com/articles/mongoose-referencing-schema-in-properties-and-arrays/
// Nested objects and Interfaces: https://stackoverflow.com/questions/42216053/typescript-how-do-i-define-interfaces-for-nested-objects

const StudySchema = new Schema({
  name: {
    type: String,
    default: "Default Study",
    required: true,
  },
  description: {
    type: String,
    required: false, // optional
  },
  // able to modify experiment, add other users, etc... Creator of experiment will be here, and in users
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // user id
    ref: "users",
  },
  principalInvestigator: {
    type: mongoose.Schema.Types.ObjectId, // user id
    ref: "users",
  },
  irbProtocolNumber: {
    type: String,
    required: false
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId, // user ids
      ref: "users",
    },
  ],
  defaultExperiment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "experiments",
  },
});

export interface IStudy extends mongoose.Document {
  _id: string;
  name: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  principleInvestigator: mongoose.Types.ObjectId;
  irbProtocolNumber: string ;
  users: mongoose.Types.ObjectId[];
  defaultExperiment: mongoose.Types.ObjectId;
  experiments: mongoose.Types.ObjectId[];
}

export default mongoose.model<IStudy>("studies", StudySchema);
