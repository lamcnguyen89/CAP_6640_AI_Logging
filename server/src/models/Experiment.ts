import mongoose, { Schema } from "mongoose";

const ExperimentSchema = new Schema({
  name: {
    type: String,
    default: "Pilot Experiment",
    required: false,
  },
  description: {
    type: String,
    default: "This is a pilot experiment",
    required: false,
  },
  irbProtocolNumber: {
    type: String,
    required: false,
  },
  irbEmailAddress: {
    type: String,
    default: "irbemailaddress@institution.edu",
    required: false,
  },
  irbLetterName: {
    type: String,
    default: "",
    required: false,
  },
  irbLetter: {
    type: Schema.Types.Buffer,
    default: "",
    required: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  collaborators: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      permissionRole: {
        type: String,
        enum: ["Admin", "Developer", "Member"],
        default: "Member",
        required: true,
      },
    },
  ],
  conditions: {
    type: [
      {
        groupName: {
          type: String,
          required: true,
        },
        conditions: [
          {
            name: {
              type: String,
              required: true,
            },
            value: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    default: [],
    required: false,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "participants",
    },
  ],
  isMultiSite: {
    type: Boolean,
    default: false,
    required: false,
  },
  sites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sites",
      required: false,
    },
  ],
  draft: {
    type: Boolean,
    default: true,
    required: false,
  },
  webXrBuildNumber: {
    type: Number,
    default: 0,
    required: false,
  },
});

export interface ICollaborator {
  user: mongoose.Types.ObjectId;
  permissionRole: "Admin" | "Developer" | "Member";
}

export interface ICondition {
  name: string;
  value: string;
}

export interface IConditionGroup {
  groupName: string;
  conditions: ICondition[];
}

export interface IExperiment extends mongoose.Document {
  _id: string;
  name: string;
  description: string;
  irbProtocolNumber: string;
  irbEmailAddress: string;
  irbLetterName: string;
  irbLetter: Buffer;
  createdBy: mongoose.Types.ObjectId;
  collaborators: ICollaborator[];
  participants: mongoose.Types.ObjectId[];
  conditions: IConditionGroup[];
  isMultiSite: boolean;
  sites: mongoose.Types.ObjectId[];
  draft: boolean;
  webXrBuildNumber: number;
}

export default mongoose.model<IExperiment>("experiments", ExperimentSchema);
