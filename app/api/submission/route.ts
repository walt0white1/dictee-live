import { diffWords, computePenalty } from "@/lib/diff";

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

  // Barème /20 : -1 grosse faute, -0.5 petite faute
  const penalty = computePenalty(diff);

  // Note sur 20, arrondie au demi-point, min 0
  const score = Math.max(0, Math.round((20 - penalty) * 2) / 2);

  sessions[sessionId].submissions.push({
    pseudo,
    texte,
    score,
    penalty, // remplace "erreurs" (tu peux garder erreurs aussi si tu veux)
    diff,
    createdAt: Date.now(),
  });

  writeSessions(sessions);

  return Response.json({ success: true, score, penalty });
}
