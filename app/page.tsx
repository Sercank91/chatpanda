"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nickname.trim() || !gender) {
      setError("Bitte Nickname und Geschlecht auswählen.");
      return;
    }

    try {
      const res = await fetch("/api/chatpanda/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), gender }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nickname konnte nicht reserviert werden.");
        return;
      }

      if (!data.success) {
        setError("Nickname konnte nicht reserviert werden.");
        return;
      }

      localStorage.setItem("chatpanda_nickname", nickname.trim());
      localStorage.setItem("chatpanda_gender", gender);

      router.push("/chatpanda");
    } catch (err) {
      console.error("API Fehler:", err);
      setError("Serverfehler – bitte später erneut versuchen.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-gray-100 p-6">
      <section className="w-full max-w-md rounded-2xl bg-gray-900/70 backdrop-blur-xl shadow-2xl p-8 space-y-6 text-center animate-fadeIn">
        
        {/* Logo */}
        <div className="flex justify-center">
		  <div style={{ fontSize: "100px" }}>🐼</div>
		</div>

        {/* Headline */}
        <h1 className="text-3xl md:text-5xl font-extrabold">
          Willkommen bei <span className="font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">ChatPanda</span>
        </h1>

        <p className="opacity-80 text-sm md:text-base">
          Kostenlos chatten ohne Anmeldung – wähle einfach einen Nickname und starte sofort!
        </p>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Dein Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg bg-gray-800/70 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-gray-800 transition"
          />

          {/* Geschlecht Auswahl */}
          <div className="flex justify-center gap-4 text-sm md:text-base">
            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition">
              <input
                type="radio"
                value="m"
                checked={gender === "m"}
                onChange={(e) => setGender(e.target.value)}
                className="accent-indigo-500"
              />
              Männlich
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition">
              <input
                type="radio"
                value="w"
                checked={gender === "w"}
                onChange={(e) => setGender(e.target.value)}
                className="accent-indigo-500"
              />
              Weiblich
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition">
              <input
                type="radio"
                value="d"
                checked={gender === "d"}
                onChange={(e) => setGender(e.target.value)}
                className="accent-indigo-500"
              />
              Divers
            </label>
          </div>

          {/* Fehlermeldung */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-3 font-semibold text-white shadow-lg transition transform hover:scale-105"
          >
            🚀 Jetzt chatten
          </button>
        </form>
		<p>coded by Sercan K.</p>
      </section>
    </main>
  );
}
