import mongoose, { Schema } from 'mongoose';

const UnityBuildTokenSchema = new Schema({
  experiment: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "experiments"
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
  },
  revoked: {
    type: Boolean,
    default: false,
  },
});

export interface IUnityBuildToken extends mongoose.Document {
  experiment: mongoose.Types.ObjectId;
  token: String;
  createdAt: Date;
  lastUsed: Date;
  revoked: Boolean;
}

export default mongoose.model<IUnityBuildToken>('UnityBuildToken', UnityBuildTokenSchema)

