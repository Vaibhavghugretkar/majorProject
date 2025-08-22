import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// ✅ GET /api/chats/[userId]
export async function GET(req: Request, context: any) {
  await connectDB();

  // await params before using
  const { params } = await context;
  const { userId } = await params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const chat = await Chat.findOne({ userId: userObjectId });

  return NextResponse.json(chat || { messages: [] });
}

// ✅ POST /api/chats/[userId]
export async function POST(req: Request, context: any) {
  await connectDB();

  const { params } = await context;
  const { userId } = params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const body = await req.json();

  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
  }

  try {
    const chat = await Chat.findOneAndUpdate(
      { userId: userObjectId },
      { messages: body.messages, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    return NextResponse.json(chat);
  } catch (err) {
    console.error("Error saving chat:", err);
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
  }
}
