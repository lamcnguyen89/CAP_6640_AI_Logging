import mongoose, { Schema, ObjectId } from "mongoose";

const CounterSchema = new Schema({
  experimentId: {
    type: Schema.Types.ObjectId,
    ref: "experiments",
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});


CounterSchema.index({ experimentId: 1 }, { unique: true });

export const Counter = mongoose.model("counters", CounterSchema);
