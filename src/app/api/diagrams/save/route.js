import { connectDB } from "@/lib/db";
import Diagram from "@/models/Diagram";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, diagramType, diagramCode, messages } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "UserId required" }), { status: 400 });
    }

    const newDiagram = await Diagram.create({
      userId,
      diagramType,
      diagramCode,
      messages,
    });

    return new Response(JSON.stringify(newDiagram), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
