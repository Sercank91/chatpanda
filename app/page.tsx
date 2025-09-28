"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !gender) return;

    // Nickname + Gender im Browser speichern
    localStorage.setItem("chatpanda_nickname", nickname.trim());
    localStorage.setItem("chatpanda_gender", gender);

    // Weiterleiten zum Chat (ohne ?nickname=... in URL)
    router.push("/chatpanda");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-100 p-6">
      <section className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold">
          Willkommen bei <span className="text-indigo-500">Chatpanda</span>
        </h1>
        <p className="opacity-80">
          Kostenlos chatten ohne Anmeldung – wähle einfach einen Nickname und starte sofort!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Dein Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="m"
                checked={gender === "m"}
                onChange={(e) => setGender(e.target.value)}
                className="accent-indigo-500"
              />
              Männlich
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="w"
                checked={gender === "w"}
                onChange={(e) => setGender(e.target.value)}
                className="accent-indigo-500"
              />
              Weiblich
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
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

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-3 font-semibold text-white transition"
          >
            Jetzt chatten
          </button>
        </form>
      </section>
    </main>
  );
}
