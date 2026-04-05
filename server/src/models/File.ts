import mongoose, { Schema } from "mongoose";

// creating File Schema
const FileSchema = new Schema({
  ts: {
    type: Date,
    required: true,
  },
  participantUID: {
    type: String,
    required: true,
  },
  fileType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "filetypes",
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,
    required: false,
  },
  size: {
    type: Number,
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  serverLocationFilePath: {
    type: String,
  },
  originalFileName: {
    type: String,
  },
  replacedAt: {
    type: Date,
  },
  //  THESE NEW FIELDS ARE FOR AUTHORSHIP TRACKING
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: false, // Optional for backwards compatibility
  },
  uploadedAt: {
    type: Date,
    required: false, // Optional for backwards compatibility
  },
});

export interface IFile extends mongoose.Document {
  _id: string;
  ts: Date;
  participantUID: string;
  mimetype: string;
  fileType: mongoose.Types.ObjectId;
  data: Buffer;
  size: number;
  version: number;
  isActive: boolean;
  serverLocationFilePath: string;
  originalFileName?: string;
  replacedAt?: Date;
  //authorship tracking fields
  uploadedBy?: mongoose.Types.ObjectId;
  uploadedAt?: Date;
}

export default mongoose.model<IFile>("files", FileSchema);
