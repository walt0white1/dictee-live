"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function PlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [pseudo, setPseudo] = useState("");
  const [texte, setTexte] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!pseudo.trim()) return alert("Mets ton pseudo Twitch 🙂");
    if (!texte.trim()) return alert("Écris la dictée avant d’envoyer 🙂");

    setLoading(true);
    const res = await fetch("/api/submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, pseudo, texte }),
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
          <h1 className="h1" style={{ fontSize: 30 }}>Écris la dictée</h1>
          <p className="sub">Pseudo Twitch + texte, puis “Soumettre”.</p>
        </div>
        <span className="badge badgeRed">🟥 Live</span>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="row">
          <input
            className="input"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Pseudo Twitch"
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
          <span className="sub">
            Astuce : relis vite avant d’envoyer 😉
          </span>

          <button className="btn btnRed" onClick={submit} disabled={loading}>
            {loading ? "Envoi..." : "Soumettre"}
          </button>
        </div>
      </div>
    </main>
  );
}
