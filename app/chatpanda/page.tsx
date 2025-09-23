import { currentUser } from "@clerk/nextjs/server";
export default async function ChatPanda() {
  const user = await currentUser();
  const name = user?.firstName ?? user?.username ?? "Nutzer";
  return (
    <main className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Willkommen im ChatPanda, {name} 🐼</h1>
      <p>Hier bauen wir gleich den Realtime-Chat ein.</p>
    </main>
  );
}
