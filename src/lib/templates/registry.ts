import { modern } from "@/lib/templates/modern";
import type { Template, TemplateId } from "@/lib/templates/types";

/**
 * Template registry — Phase 3 starts with just `modern`.
 * Phase 4 will add glass, minimal, terminal, github here.
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

export const registry = _registry;
