"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TwitchCallback() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (!token) {
      alert("Erreur de connexion Twitch");
      router.push("/");
      return;
    }

    fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || ""
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data[0]) {
          const user = {
            username: data.data[0].login,
            avatar: data.data[0].profile_image_url
          };
          
          localStorage.setItem("twitch_user", JSON.stringify(user));
          localStorage.setItem("twitch_token", token);
          
          const returnUrl = localStorage.getItem("twitch_return_url") || "/";
          localStorage.removeItem("twitch_return_url");
          router.push(returnUrl);
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erreur lors de la récupération des données Twitch");
        router.push("/");
      });
  }, [router]);

  return (
    <main className="container" style={{ textAlign: "center", paddingTop: 100 }}>
      <h1>Connexion à Twitch...</h1>
      <p className="sub">Redirection en cours...</p>
    </main>
  );
}