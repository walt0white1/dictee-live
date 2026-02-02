"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [texteReference, setTexteReference] = useState("");

  async function createSession() {
    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texteReference }),
    });
    const { sessionId } = await res.json();
    router.push(`/host/${sessionId}`);
  }

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="h1">Dictée Live</h1>
          <p className="sub">Ambiance chill • Bleu & rouge • Classement instant</p>
        </div>
        <span className="badge">🎤 Mode Stream</span>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Texte de référence</div>
            <div className="sub" style={{ marginTop: 4 }}>
              Colle ici le texte exact de la dictée (sert à corriger le chat).
            </div>
          </div>

          <button className="btn btnRed" onClick={createSession}>
            Générer un lien
          </button>
        </div>

        <div style={{ height: 12 }} />

        <textarea
          className="textarea"
          value={texteReference}
          onChange={(e) => setTexteReference(e.target.value)}
          placeholder="Ex : Aujourd’hui, nous allons écrire une dictée..."
        />
      </div>

      <div style={{ height: 12 }} />

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Déroulé</div>
          <p className="sub" style={{ marginTop: 6 }}>
            Tu génères un lien → tu le postes dans le chat → tout le monde écrit → ils soumettent → tu affiches le classement.
          </p>
        </div>
        <div className="card">
          <div style={{ fontWeight: 900 }}>Prochaines features</div>
          <p className="sub" style={{ marginTop: 6 }}>
            Bouton “Clôturer”, overlay OBS Top 5, et correction plus fine (ponctuation/accents).
          </p>
        </div>
      </div>
    </main>
  );
}
