export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { readSessions } from "@/lib/persist";

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const sessions = readSessions();
  const session = sessions[params.sessionId];
const rows = session.submissions;

rows.sort((a: any, b: any) => {
  // plus fort = moins d'erreurs
  if ((a.erreurs ?? 999999) !== (b.erreurs ?? 999999)) {
    return (a.erreurs ?? 999999) - (b.erreurs ?? 999999);
  }
  // tie-breaker: plus gros score
  if ((a.score ?? 0) !== (b.score ?? 0)) {
    return (b.score ?? 0) - (a.score ?? 0);
  }
  // tie-breaker final: premier arrivé
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
});

return Response.json(rows);

  return Response.json(session ? session.submissions : []);
}
