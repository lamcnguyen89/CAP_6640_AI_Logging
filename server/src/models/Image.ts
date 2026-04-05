import mongoose, { Schema } from 'mongoose'

// creating project schema
const ImageSchema = new Schema({
  ts: {
    type: Date,
    required: true
  },
  player: {
    type: String,
    required: true
  },
  experiment: {
    type: String,
  },
  data: {
    type: Buffer,
  }
})

export interface IImage extends mongoose.Document {
  _id: string 
  ts: Date
  player: string
  experiment: string
  data: Buffer
}

export default mongoose.model<IImage>('images', ImageSchema)
