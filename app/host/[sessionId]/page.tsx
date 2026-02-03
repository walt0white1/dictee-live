"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function severity(t: any) {
  if (!t) return 0;

  // sub = erreur de remplacement
  if (t.type === "sub") {
    const from = String(t.from ?? "");
    const to = String(t.to ?? "");

    // 🟠 "moyenne" si c'est très proche (ex: 1 seule lettre de différence)
    // ex: "et" vs "est" => proche => orange
    if (Math.abs(from.length - to.length) <= 1) return 1;

    // 🔴 sinon grave
    return 2;
  }

  // ins/del => pas de severity
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

// ✅ Petit helper: retourne toujours un nombre (0 si manquant)
// + accepte "erreurs" OU "errors" au cas où
function getFautes(r: any) {
  // 1) si l'API fournit erreurs, on l'utilise
  const v = r?.erreurs ?? r?.errors;
  if (Number.isFinite(v)) return v;

  // 2) sinon on calcule depuis diff
  const diff = r?.diff;
  if (!Array.isArray(diff)) return 0;

  // sub = mauvais mot (1 faute)
  // ins = mot en trop (1 faute)
  // del = mot manquant (1 faute)
  return diff.reduce((acc: number, t: any) => {
    if (!t) return acc;
    if (t.type === "sub" || t.type === "ins" || t.type === "del") return acc + 1;
    return acc;
  }, 0);
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
    console.log("rows", json);
    console.log("first diff", json?.[0]?.diff);
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
    // Hard redirect => garanti nouveau panel + nouveau lien + state reset
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

      <div style={{ height: 14 }} />

      {/* Link card (glow) */}
      <div className="card glowCard">
        <div className="glowInner" style={{ padding: 16 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                Lien à partager dans le chat
              </div>
              <div className="sub" style={{ marginTop: 4 }}>
                Les viewers ouvrent /play et soumettent à la fin.
              </div>
            </div>
            <span className="badge badgeRed">🔴 Session</span>
          </div>

          <div style={{ height: 12 }} />

          <div className="row">
            <input className="input mono" value={playLink} readOnly />
            <button
              className="btn btnGhost"
              onClick={() => navigator.clipboard.writeText(playLink)}
              style={{ whiteSpace: "nowrap" }}
            >
              Copier
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ height: 12 }} />
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
          <div className="value">{rows[0] ? getFautes(rows[0]) : "-"}</div>
        </div>
        <div className="kpi">
          <div className="label">Dernier participant</div>
          <div className="value">{rows.at(-1)?.pseudo ?? "-"}</div>
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 10 }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Podium</h2>
            <span className="badge">🏆 Top 3</span>
          </div>

          <div className="podiumWrap">
            {top3[0] && (
              <div
                className="podiumCard podium1 podiumGlow1"
                style={{ borderColor: "rgba(59,130,246,.25)" }}
              >
                <span className="podiumRank">🥇 #1</span>
                <div className="podiumName">{top3[0].pseudo}</div>
                <div className="podiumMeta">
                  <span>
                    Score <b>{top3[0].score}</b>
                  </span>
                  <span>
                    Fautes <b>{getFautes(top3[0])}</b>
                  </span>
                </div>
              </div>
            )}

            {top3[1] && (
              <div className="podiumCard podium2">
                <span className="podiumRank">🥈 #2</span>
                <div className="podiumName">{top3[1].pseudo}</div>
                <div className="podiumMeta">
                  <span>
                    Score <b>{top3[1].score}</b>
                  </span>
                  <span>
                    Fautes <b>{getFautes(top3[1])}</b>
                  </span>
                </div>
              </div>
            )}

            {top3[2] && (
              <div className="podiumCard podium3">
                <span className="podiumRank red">🥉 #3</span>
                <div className="podiumName">{top3[2].pseudo}</div>
                <div className="podiumMeta">
                  <span>
                    Score <b>{top3[2].score}</b>
                  </span>
                  <span>
                    Fautes <b>{getFautes(top3[2])}</b>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ranking list */}
      <h2 style={{ marginTop: 20, fontSize: 18, fontWeight: 900 }}>
        Classement ({rows.length})
      </h2>

      {rows.map((r, i) => (
        <div key={i} className="rankItem">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              #{i + 1} {r.pseudo}
            </div>

            <span className="badge">
              Score <b style={{ color: "rgba(15,23,42,0.92)" }}>{r.score}</b> •
              Fautes{" "}
              <b style={{ color: "rgba(185,28,28,.95)" }}>{getFautes(r)}</b>
            </span>
          </div>

          <details>
            <summary>Voir la copie corrigée</summary>

            {r.diff ? (
              <div style={{ marginTop: 10, lineHeight: 1.9 }}>
                {(() => {
                  const severeSet = buildSevereSet(r.diff);

                  // ✅ AFFICHAGE "VIEWER-ONLY"
                  // - ok: mot du viewer
                  // - ins: mot en trop du viewer
                  // - del: mot manquant -> on n'affiche rien (sinon ça réinjecte la référence)
                  // - sub: mauvais mot du viewer barré + bon mot à côté
                  return r.diff.map((t: any, idx: number) => {
                    const isSevere = severeSet.has(idx);
                    const extra = isSevere ? " severePulse" : "";

                    if (t.type === "ok") {
                      return (
                        <span key={idx} className="tOk">
                          {t.word}{" "}
                        </span>
                      );
                    }

                    if (t.type === "ins") {
                      // ❌ pas de pulse sur ins
                      return (
                        <span key={idx} className="tIns">
                          {t.word}{" "}
                        </span>
                      );
                    }

                   if (t.type === "del") {
  return (
    <span key={idx} className="tDel">
      {t.word}{" "}
    </span>
  );
}


                  if (t.type === "sub") {
  const cls =
    t.sev === "severe"
      ? "tSubWrong severePulse"
      : "tSubWrongMed";

  return (
    <span key={idx}>
      <span className={cls}>{t.to}</span>{" "}
      <span className="tSubCorrect">{t.from}</span>{" "}
    </span>
  );
}




                    return null;
                  });
                })()}
              </div>
            ) : (
              <pre
                className="mono"
                style={{ whiteSpace: "pre-wrap", marginTop: 10 }}
              >
                {r.texte}
              </pre>
            )}
          </details>
        </div>
      ))}
    </main>
  );
}
