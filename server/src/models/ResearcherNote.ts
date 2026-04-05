import mongoose, { Schema, Document } from 'mongoose';

export interface IResearcherNote extends Document {
  participant: string;
  researcher: mongoose.Types.ObjectId;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearcherNoteSchema = new Schema<IResearcherNote>(
  {
    participant: {
      type: String,
      required: true,
    },
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IResearcherNote>('ResearcherNote', ResearcherNoteSchema);
