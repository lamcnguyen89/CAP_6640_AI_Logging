import mongoose, { Schema, ObjectId } from 'mongoose'

const LabSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'institution',
    required: true
  }
})

export interface ILab extends mongoose.Document {
  _id: ObjectId;
  name: string;
  institution: ObjectId;
}

export default mongoose.model<ILab>('lab', LabSchema)
