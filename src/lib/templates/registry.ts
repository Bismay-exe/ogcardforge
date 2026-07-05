import { modern } from "@/lib/templates/modern";
import { glass } from "@/lib/templates/glass";
import { minimal } from "@/lib/templates/minimal";
import { terminal } from "@/lib/templates/terminal";
import { github } from "@/lib/templates/github";
import type { Template, TemplateId } from "@/lib/templates/types";

/**
 * Template registry — Phase 4 includes all 5 templates.
 */
class TemplateRegistry {
  private map = new Map<TemplateId, Template>();

  register(template: Template): void {
    this.map.set(template.id, template);
  }

  get(id: TemplateId): Template | undefined {
    return this.map.get(id);
  }

  list(): Template[] {
    return Array.from(this.map.values());
  }

  has(id: TemplateId): boolean {
    return this.map.has(id);
  }
}

const _registry = new TemplateRegistry();
_registry.register(modern);
_registry.register(glass);
_registry.register(minimal);
_registry.register(terminal);
_registry.register(github);

export const registry = _registry;
