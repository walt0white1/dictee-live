import { tokenize, wordDistance } from "@/lib/diff";
import { diffWords } from "@/lib/diff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readSessions, writeSessions } from "@/lib/persist";

export async function POST(req: Request) {
  const { sessionId, pseudo, texte } = await req.json();
  const sessions = readSessions();

  if (!sessions[sessionId]) {
    return new Response("Session inconnue", { status: 404 });
  }
const ref = sessions[sessionId].texteReference || "";
const diff = diffWords(ref, texte);

const erreurs = diff.reduce((acc, t) => (t.type === "ok" ? acc : acc + 1), 0);
const score = Math.max(0, 1000 - erreurs * 10);

sessions[sessionId].submissions.push({
  pseudo,
  texte,
  score,
  erreurs,
  diff,
  createdAt: Date.now(),
});


  writeSessions(sessions);

  return Response.json({ success: true });
}
