import mongoose, { Schema, ObjectId } from 'mongoose'

const ShortCodeSchema = new Schema({
  code: {
    type: String,
    required: true
  },
  targetPath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Automatically delete after 1 hour (3600 seconds)
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
})

export interface IShortCode extends mongoose.Document {
  _id: ObjectId;
  code: string;
  targetPath: string;
  createdAt: Date;
  createdBy: ObjectId;
}

export default mongoose.model<IShortCode>('shortCodes', ShortCodeSchema)
