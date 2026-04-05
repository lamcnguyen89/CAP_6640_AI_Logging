import mongoose, { Schema } from 'mongoose';

// Creating File Type Schema
const FileTypeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "experiments",
        required: true
    },
    extension: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    columnDefinition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "columnDefinitions",
        required: false
    },
});

export interface IFileType extends mongoose.Document {
    _id: string;
    name: string;
    experimentId: mongoose.Types.ObjectId;
    extension: string;
    description: string;
    columnDefinition: mongoose.Types.ObjectId;
}

export default mongoose.model<IFileType>('filetypes', FileTypeSchema)

