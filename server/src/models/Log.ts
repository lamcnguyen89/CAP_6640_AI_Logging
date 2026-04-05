import mongoose, { Schema } from 'mongoose'

// creating project schema
const LogSchema = new Schema({
  ts: {
    type: Date,
    required: true
  },
  participant: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: false
  },
  eventId: {
    type: Number,
    required: true
  },
  data: {
    type: Object
  }
})

export interface ILog extends mongoose.Document {
  _id: string
  ts: Date
  participant: string
  fileType: string
  content: string
  eventId: number
  data: any
}

export default mongoose.model<ILog>('logs', LogSchema)
