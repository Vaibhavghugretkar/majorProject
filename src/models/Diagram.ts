import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const DiagramSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  diagramType: { type: String, default: "uml" },
  diagramCode: { type: String, required: true },
  messages: [MessageSchema],
}, { timestamps: true });

export default mongoose.models.Diagram || mongoose.model("Diagram", DiagramSchema);
