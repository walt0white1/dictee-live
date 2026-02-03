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

  // ✅ penalty = points retirés (ex: 1 grosse faute = 1, faute moyenne = 0.5, etc.)
  // ✅ erreurs = nombre d'événements d'erreur (sub/ins/del)
  const { penalty, erreurs } = computePenalty(diff);

  // Note sur 20, arrondie au demi-point, min 0
const score = Math.max(0, Math.round((20 - penalty) * 4) / 4);

  sessions[sessionId].submissions.push({
    pseudo,
    texte,
    score,
    penalty,
    erreurs, // ✅ important pour l'affichage "Fautes"
    diff,
    createdAt: Date.now(),
  });

  writeSessions(sessions);

  return Response.json({ success: true, score, penalty, erreurs });
}
