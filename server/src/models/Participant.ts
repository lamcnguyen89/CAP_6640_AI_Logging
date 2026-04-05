import mongoose, { Schema, ObjectId } from 'mongoose'
import type { CallbackError } from "mongoose";
import { Counter } from "./Counter";

// create schema
const ParticipantSchema = new Schema({
  uid: {
    type: String,
    required: false
  },
  experimentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'experiments',
    required: true
  },
  exclude: {
    type: Boolean,
    required: false
  },
  sessionStart: {
    type: Date,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  note: {
    type: String,
    required: false
  },
  files: {
    type: [], // Contains the file ID to search the file model
    required: false
  },
  state: {
    type: String,
    required: false
  },
  communications: {
    type: [],
    required: false
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sites",
    required: false
  },
  pID: {
    type: Number,
    required: false
  },
  lastSyncedTimestamp: {
    type: Date,
    default: null 
  }
})

ParticipantSchema.index({ experimentId: 1, pID: 1 }, { unique: true });

ParticipantSchema.pre<IParticipant>("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const updatedCounter = await Counter.findOneAndUpdate(
      { experimentId: this.experimentId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.pID = updatedCounter.seq;
  } catch (error: any) {
    return next(error as CallbackError);
  }

  next();
});

export interface IParticipant extends mongoose.Document {
  _id: string
  uid: string
  participantName: string
  experimentId: ObjectId
  exclude: boolean
  email: string
  note: string
  state: string
  files: Array<string>
  sessionStart: Date
  communications: Array<string>
  comments: Array<any>
  site: ObjectId
  pID?: number
  lastSyncedTimestamp: Date
}

export default mongoose.model<IParticipant>('participants', ParticipantSchema)
