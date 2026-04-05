import mongoose, { Schema, ObjectId } from 'mongoose'

const ColumnSchema = new Schema({
  columnDefinitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'columnDefinitions',
    required: true
  },
  dataType: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  transform: {
    type: String,
    required: false
  },
  order: {
    type: Number,
    required: true
  },
})

export interface IColumn extends mongoose.Document {
  _id: ObjectId;
  columnDefinitionId: ObjectId;
  dataType: string;
  name: string;
  description: string;
  transform: string;
  order: number;
}

export default mongoose.model<IColumn>('columns', ColumnSchema)
