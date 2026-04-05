import mongoose, { Schema, ObjectId } from 'mongoose'

const ColumnDefinitionSchema = new Schema({
  fileTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'filetypes',
    required: true
  },
  columns: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "columns",
    },
  ],
})

export interface IColumnDefinition extends mongoose.Document {
  _id: ObjectId;
  fileTypeId: ObjectId;
  columns: ObjectId[];
}

export default mongoose.model<IColumnDefinition>('columnDefinitions', ColumnDefinitionSchema)
