import mongoose, { Schema, Document, Types } from "mongoose";

export interface Message {
  role: "user" | "assistant";
  content: string;
  diagramSvg?: string;   // optional: rendered diagram SVG
  diagramCode?: string;  // optional: mermaid/code reference
}

export interface ChatDocument extends Document {
  userId: Types.ObjectId;  // reference to User
  messages: Message[];
}

const MessageSchema = new Schema<Message>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  diagramSvg: { type: String },
  diagramCode: { type: String },
});

const ChatSchema = new Schema<ChatDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  messages: { type: [MessageSchema], default: [] },
});

export default mongoose.models.Chat || mongoose.model<ChatDocument>("Chat", ChatSchema);
