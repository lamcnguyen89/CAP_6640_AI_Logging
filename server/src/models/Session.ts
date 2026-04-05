import mongoose, { Schema } from 'mongoose'

// create schema
const SessionSchema = new Schema({
  participants: {
    type: Array,
    required: true
  },
  sessionStart: {
    type: Date,
    required: true
  },
  checkedIn: {
    type: Array,
    required: true
  },
  state: {
    type: String,
    required: true
  }
})

export interface ISession extends mongoose.Document {
  participants: Array<string>
  sessionStart: Date
  checkedIn: Array<boolean>
}
export default mongoose.model<ISession>('sessions', SessionSchema)
