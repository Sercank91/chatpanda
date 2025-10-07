// core/AdminCore.tsx
"use client";
import { useEffect, useState } from "react";
import { ModuleRegistry } from "./ModuleRegistry";

export function AdminCore() {
  const [modules, setModules] = useState(() => ModuleRegistry.getModules());

  useEffect(() => {
    const update = () => setModules(ModuleRegistry.getModules());
    // Wenn Modul aktiviert wird
    // ChatCore.on("module:initialized", update);
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">🧩 Modulverwaltung</h1>
      <ul className="space-y-2">
        {modules.map((m) => (
          <li key={m.name} className="border border-gray-700 p-3 rounded-lg">
            <b>{m.name}</b> <span className="text-gray-400">v{m.version}</span>
            {m.enabled ? (
              <span className="ml-2 text-green-400">● Aktiv</span>
            ) : (
              <span className="ml-2 text-red-400">● Inaktiv</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}