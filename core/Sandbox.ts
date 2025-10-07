// core/Sandbox.ts
import { ChatCore } from "./ChatCore";
import { ModuleRegistry } from "./ModuleRegistry";

export function runSandbox() {
  console.log("🧪 Sandbox gestartet...");

  ModuleRegistry.register({
    name: "test-module",
    version: "1.0.0",
    enabled: true,
    init() {
      console.log("✅ Testmodul initialisiert");
      ChatCore.emit("test:event", "Hallo Welt!");
    },
  });

  ChatCore.on("test:event", (msg) => {
    console.log("📨 Event empfangen:", msg);
  });
}