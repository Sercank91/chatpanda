// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold">Willkommen bei ChatPanda 🐼</h1>
        <p className="text-gray-400">
          Echtzeit-Chat mit Supabase (Realtime) + Clerk (Auth).
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/chatpanda" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500">Zum Chat</a>
          <a href="/sign-in" className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700">Anmelden</a>
          <a href="/sign-up" className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700">Registrieren</a>
        </div>
      </div>
    </main>
  );
}
