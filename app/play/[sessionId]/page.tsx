"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function PlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  // ✅ NextAuth session
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  // ✅ pseudo auto si connecté (fallback: "")
  const twitchPseudo = useMemo(() => {
    const name = session?.user?.name;
    return typeof name === "string" ? name : "";
  }, [session]);

  const [pseudo, setPseudo] = useState("");
  const [texte, setTexte] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ le pseudo envoyé : Twitch si connecté, sinon input
  const pseudoToSend = isAuthed ? twitchPseudo : pseudo;

  async function submit() {
    if (!pseudoToSend.trim()) return alert("Mets ton pseudo Twitch 🙂");
    if (!texte.trim()) return alert("Écris la dictée avant d’envoyer 🙂");

    setLoading(true);
    const res = await fetch("/api/submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, pseudo: pseudoToSend, texte }),
    });
    setLoading(false);

    if (!res.ok) {
      const t = await res.text();
      alert("Erreur: " + t);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="container">
        <div className="card" style={{ textAlign: "center", padding: 28 }}>
          <span className="badge">✅ Envoyé</span>
          <h1 className="h1" style={{ fontSize: 28, marginTop: 10 }}>
            Merci !
          </h1>
          <p className="sub">Ta dictée a été envoyée au streamer.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="h1" style={{ fontSize: 30 }}>
            Écris la dictée
          </h1>
          <p className="sub">Pseudo Twitch + texte, puis “Soumettre”.</p>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <span className="badge badgeRed">🟥 Live</span>

          {/* ✅ Auth Twitch */}
          {!isAuthed ? (
            <button
              className="btn btnGhost"
              onClick={() =>
                signIn("twitch", { callbackUrl: `/play/${sessionId}` })
              }
              disabled={status === "loading"}
              style={{ whiteSpace: "nowrap" }}
            >
              {status === "loading" ? "..." : "Se connecter Twitch"}
            </button>
          ) : (
            <button
              className="btn btnGhost"
              onClick={() => signOut({ callbackUrl: `/play/${sessionId}` })}
              style={{ whiteSpace: "nowrap" }}
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        {/* ✅ Petit bandeau état connexion */}
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          {!isAuthed ? (
            <span className="sub">
              Optionnel : connecte-toi avec Twitch pour auto-remplir ton pseudo.
            </span>
          ) : (
            <span className="sub">
              Connecté en tant que <b>{twitchPseudo || "Twitch"}</b>
            </span>
          )}

          {!isAuthed ? (
            <span className="badge">👤 Invité</span>
          ) : (
            <span className="badge">✅ Twitch</span>
          )}
        </div>

        <div className="row">
          <input
            className="input"
            value={isAuthed ? twitchPseudo : pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Pseudo Twitch"
            disabled={isAuthed}
            style={isAuthed ? { opacity: 0.9, cursor: "not-allowed" } : undefined}
          />
        </div>

        <div style={{ height: 10 }} />

        <textarea
          className="textarea"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écris ici pendant que le streamer dicte…"
        />

        <div style={{ height: 12 }} />

        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="sub">Astuce : relis vite avant d’envoyer 😉</span>

          <button className="btn btnRed" onClick={submit} disabled={loading}>
            {loading ? "Envoi..." : "Soumettre"}
          </button>
        </div>
      </div>
    </main>
  );
}
