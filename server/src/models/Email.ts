import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false

    }
})

export const Email = mongoose.model("email", userSchema);