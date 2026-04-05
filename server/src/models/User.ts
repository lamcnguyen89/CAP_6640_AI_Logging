import mongoose, { Schema } from 'mongoose'

// create schema
const UserSchema = new Schema({
  firstName: {
    type: String,
    default: 'firstName',
    required: false
  },
  lastName: {
    type: String,
    default: 'lastName',
    required: false
  },
  type: {
    type: String,
    default: 'researcher',
    required: false
  },
  email: {
    type: String,
    required: true
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'institution',
    required: false
  },
  lab: {
    type: Schema.Types.ObjectId,
    ref: 'lab',
    required: false
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  admin: {
    type: Boolean,
    default: false
  },
  profileImage:{
    type: String,
    required: false
  },
  dropboxToken: {
    type: String,
    required: false,
  },
  setupIncomplete: {
    type: Boolean,
    required: false,
  }
})

export interface IUser extends mongoose.Document {
  firstName: string;
  lastName: string;
  email: string;
  institution: mongoose.Types.ObjectId;
  lab: mongoose.Types.ObjectId;
  password: string;
  date: Date;
  verified: boolean;
  admin: boolean;
  profileImage: String;
  dropboxToken?: string;
  setupIncomplete?: boolean;
}

UserSchema.index({ email: 1 }, { unique: true })
export default mongoose.model<IUser>('users', UserSchema)