// src/models/User.ts
import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hash in real apps!
  displayName: { type: String },
  photoURL: { type: String },
});

export default models.User || model("User", UserSchema);
