import mongoose, { Schema } from "mongoose";

const SiteSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  shortName: {
    type: String,
    required: true,
  },
  parentExperiment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "experiments"
  },
  activeParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "participants",
    required: false,
  },
});

export interface ISite extends mongoose.Document {
  _id: string;
  name: string;
  shortName: string;
  description: string;
  parentExperiment: mongoose.Types.ObjectId;
  activeParticipant: mongoose.Types.ObjectId | null;
}

export default mongoose.model<ISite>("sites", SiteSchema);
