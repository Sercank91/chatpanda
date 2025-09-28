// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">Next.js</h1>
        <p className="opacity-80">
          Get started by editing <code>app/page.tsx</code>. Save and see your
          changes instantly.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/chatpanda"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2"
          >
            Zum Chat
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg bg-gray-800 hover:bg-gray-700 px-4 py-2"
          >
            Anmelden
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-gray-800 hover:bg-gray-700 px-4 py-2"
          >
            Registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}
