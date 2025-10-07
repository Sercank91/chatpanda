// core/ModuleRegistry.ts
import { ChatCore } from "./ChatCore";

type ModuleManifest = {
  name: string;
  version: string;
  enabled: boolean;
  init?: () => void;
};

export class ModuleRegistry {
  private static modules: Map<string, ModuleManifest> = new Map();

  static register(module: ModuleManifest) {
    if (this.modules.has(module.name)) {
      console.warn(`⚠️ Modul '${module.name}' bereits registriert.`);
      return;
    }

    this.modules.set(module.name, module);
    console.log(`✅ Modul '${module.name}' (v${module.version}) registriert.`);

    if (module.enabled && module.init) {
      module.init();
      ChatCore.emit("module:initialized", module.name);
    }
  }

  static getModules() {
    return Array.from(this.modules.values());
  }

  static get(name: string) {
    return this.modules.get(name);
  }
}
