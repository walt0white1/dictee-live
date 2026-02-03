export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readSessions } from "@/lib/persist";

type Submission = {
  erreurs?: number;   // nb d'événements
  penalty?: number;   // points retirés (ex: 2.5)
  score?: number;     // note /20
  createdAt?: number;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  const sessions = readSessions();
  const session = sessions[sessionId];

  if (!session || !Array.isArray(session.submissions)) {
    return Response.json([], { status: 200 });
  }

  const rows: Submission[] = [...session.submissions];

  rows.sort((a, b) => {
    // 1️⃣ Score le plus élevé = meilleur
    if ((a.score ?? 0) !== (b.score ?? 0)) {
      return (b.score ?? 0) - (a.score ?? 0);
    }

    // 2️⃣ À score égal : moins de points retirés = meilleur
    if ((a.penalty ?? Infinity) !== (b.penalty ?? Infinity)) {
      return (a.penalty ?? Infinity) - (b.penalty ?? Infinity);
    }

    // 3️⃣ À égalité : moins d'erreurs = meilleur
    if ((a.erreurs ?? Infinity) !== (b.erreurs ?? Infinity)) {
      return (a.erreurs ?? Infinity) - (b.erreurs ?? Infinity);
    }

    // 4️⃣ Premier arrivé
    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
  });

  return Response.json(rows, { status: 200 });
}
