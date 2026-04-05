import mongoose, { Schema, ObjectId } from 'mongoose'

const InstitutionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
})

export interface IInstitution extends mongoose.Document {
  _id: ObjectId;
  name: string;
}

export default mongoose.model<IInstitution>('institution', InstitutionSchema)
