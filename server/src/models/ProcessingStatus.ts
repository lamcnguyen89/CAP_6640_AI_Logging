import mongoose from "mongoose";

const { Schema } = mongoose;

interface IProcessingStatus {
  participantId: string;
  fileTypeId: string;
  versionId?: string;
  status: "processing" | "completed" | "error";
  progress: {
    processed: number;
    total: number;
    percentage: number;
  };
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

const ProcessingStatusSchema = new Schema<IProcessingStatus>(
  {
    participantId: {
      type: String,
      required: true,
      index: true,
    },
    fileTypeId: {
      type: String,
      required: true,
      index: true,
    },
    versionId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["processing", "completed", "error"],
      required: true,
      default: "processing",
    },
    progress: {
      processed: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
    error: {
      type: String,
      required: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ProcessingStatusSchema.index({ participantId: 1, fileTypeId: 1, versionId: 1 });

const ProcessingStatus = mongoose.model<IProcessingStatus>(
  "ProcessingStatus",
  ProcessingStatusSchema
);

export default ProcessingStatus;
export type { IProcessingStatus };
