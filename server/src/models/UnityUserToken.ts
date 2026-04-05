import mongoose, { Schema } from 'mongoose';

const UnityUserTokenSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "users"
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

export interface IUnityUserToken extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  token: String;
  createdAt: Date;
  lastUsed: Date;
  revoked: Boolean;
}

export default mongoose.model<IUnityUserToken>('UnityUserToken', UnityUserTokenSchema)

