"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function severity(t: any) {
  if (!t) return 0;
  if (t.type === "sub") return 2;
  return 0;
}

function buildSevereSet(diff: any[]) {
  if (!Array.isArray(diff)) return new Set<number>();
  const scored = diff
    .map((t, idx) => ({ idx, s: severity(t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.idx);
  return new Set(scored);
}

// ✅ helper UNIQUE pour le nombre de fautes
function getFautes(r: any) {
  const v = r?.erreurs ?? r?.errors;
  return Number.isFinite(v) ? v : 0;
}

export default function HostPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [rows, setRows] = useState<any[]>([]);

  const playLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/play/${sessionId}`;
  }, [sessionId]);

  async function load() {
    if (!sessionId) return;
    const res = await fetch(`/api/results/${sessionId}`, { cache: "no-store" });
    const json = await res.json();
    setRows(json);
  }

  async function resetSession() {
    const ok = confirm("Reset ? Toutes les copies seront supprimées.");
    if (!ok) return;

    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texteReference: "" }),
    });

    if (!res.ok) {
      const t = await res.text();
      alert("Erreur reset: " + t);
      return;
    }

    const json = await res.json();
    window.location.href = `/host/${json.sessionId}`;
  }

  useEffect(() => {
    if (!sessionId) return;
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const top3 = rows.slice(0, 3);

  return (
    <main className="container">
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="h1">ELM DICTE</h1>
          <p className="sub">Classement live + corrections + lien chat</p>
        </div>

        <div className="row">
          <span className="badge">🎤 Live</span>
          <button className="btn btnDanger" onClick={resetSession}>
            🔄 Reset
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="label">Participants</div>
          <div className="value">{rows.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Meilleur score</div>
          <div className="value">{rows[0]?.score ?? "-"}</div>
        </div>
        <div className="kpi">
          <div className="label">Fautes min</div>
          <div className="value">{getFautes(rows[0])}</div>
        </div>
        <div className="kpi">
          <div className="label">Dernier participant</div>
          <div className="value">{rows.at(-1)?.pseudo ?? "-"}</div>
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>Podium</h2>

          <div className="podiumWrap">
            {top3.map((p, i) => (
              <div key={i} className={`podiumCard podium${i + 1}`}>
                <span className="podiumRank">
                  {["🥇", "🥈", "🥉"][i]} #{i + 1}
                </span>
                <div className="podiumName">{p.pseudo}</div>
                <div className="podiumMeta">
                  <span>
                    Score <b>{p.score}</b>
                  </span>
                  <span>
                    Fautes <b>{getFautes(p)}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classement */}
      <h2 style={{ marginTop: 20, fontSize: 18, fontWeight: 900 }}>
        Classement ({rows.length})
      </h2>

      {rows.map((r, i) => (
        <div key={i} className="rankItem">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900 }}>
              #{i + 1} {r.pseudo}
            </div>

            <span className="badge">
              Score <b>{r.score}</b> • Fautes{" "}
              <b style={{ color: "rgba(185,28,28,.95)" }}>
                {getFautes(r)}
              </b>
            </span>
          </div>

          <details>
            <summary>Voir la copie corrigée</summary>

            {r.diff && (
              <div style={{ marginTop: 10, lineHeight: 1.9 }}>
                {(() => {
                  const severeSet = buildSevereSet(r.diff);
                  return r.diff.map((t: any, idx: number) => {
                    const extra = severeSet.has(idx) ? " severePulse" : "";
                    if (t.type === "ok")
                      return (
                        <span key={idx} className="tOk">
                          {t.word}{" "}
                        </span>
                      );
                    if (t.type === "ins")
                      return (
                        <span key={idx} className="tIns">
                          {t.word}{" "}
                        </span>
                      );
                    if (t.type === "sub")
                      return (
                        <span key={idx}>
                          <span className={"tSubWrong" + extra}>{t.to}</span>{" "}
                          <span className="tSubCorrect">{t.from}</span>{" "}
                        </span>
                      );
                    return null;
                  });
                })()}
              </div>
            )}
          </details>
        </div>
      ))}
    </main>
  );
}
