export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readSessions } from "@/lib/persist";

type Submission = {
  erreurs?: number;
  score?: number;
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
    // 1️⃣ Moins d'erreurs = meilleur
    if ((a.erreurs ?? Infinity) !== (b.erreurs ?? Infinity)) {
      return (a.erreurs ?? Infinity) - (b.erreurs ?? Infinity);
    }

    // 2️⃣ Score le plus élevé
    if ((a.score ?? 0) !== (b.score ?? 0)) {
      return (b.score ?? 0) - (a.score ?? 0);
    }

    // 3️⃣ Premier arrivé
    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
  });

  return Response.json(rows, { status: 200 });
}
