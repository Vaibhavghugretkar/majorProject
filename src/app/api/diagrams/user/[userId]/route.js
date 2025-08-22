import { connectDB } from "@/lib/mongodb";
import Diagram from "@/models/Diagram";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { userId } = params;

    const diagrams = await Diagram.find({ userId }).sort({ createdAt: -1 });

    return new Response(JSON.stringify(diagrams), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
