export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readSessions, writeSessions } from "@/lib/persist";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const { texteReference } = await req.json();
  const sessions = readSessions();
  const sessionId = nanoid(6);

  sessions[sessionId] = {
    texteReference,
    submissions: [],
    createdAt: Date.now(),
  };

  writeSessions(sessions);

  return Response.json({ sessionId });
}
