import {
  states,
  types,
  sources,
  severities,
  type Snapshot,
} from "../domain/model";
import { seed } from "./seed";
const KEY = "urbanrisk-es:v1";
export function validSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Snapshot;
  return (
    v.version === 1 &&
    Array.isArray(v.events) &&
    v.events.length <= 500 &&
    v.events.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.title === "string" &&
        typeof e.description === "string" &&
        typeof e.neighborhood === "string" &&
        typeof e.sourceName === "string" &&
        e.source in sources &&
        e.type in types &&
        e.state in states &&
        e.severity in severities &&
        Number.isFinite(e.people) &&
        Number.isFinite(e.latitude) &&
        Number.isFinite(e.longitude) &&
        !isNaN(Date.parse(e.observedAt)) &&
        Array.isArray(e.history) &&
        e.history.every(
          (h) =>
            h.state in states &&
            !isNaN(Date.parse(h.at)) &&
            typeof h.reason === "string",
        ),
    ) &&
    Array.isArray(v.notices) &&
    v.notices.every(
      (n) =>
        n &&
        typeof n.id === "string" &&
        typeof n.eventId === "string" &&
        typeof n.title === "string" &&
        typeof n.read === "boolean" &&
        Number.isFinite(n.score) &&
        !isNaN(Date.parse(n.createdAt)),
    ) &&
    !!v.preferences &&
    typeof v.preferences.neighborhood === "string" &&
    Number.isFinite(v.preferences.minScore) &&
    Array.isArray(v.preferences.categories) &&
    v.preferences.categories.every((c) => c in types) &&
    !isNaN(Date.parse(v.updatedAt))
  );
}
export function load(): { snapshot: Snapshot; warning: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { snapshot: seed(), warning: "" };
    const parsed: unknown = JSON.parse(raw);
    if (!validSnapshot(parsed)) throw new Error("invalid");
    return { snapshot: parsed, warning: "" };
  } catch {
    return {
      snapshot: seed(),
      warning:
        "O armazenamento local está indisponível ou inválido. A demonstração foi carregada; alterações podem não persistir.",
    };
  }
}
export function save(snapshot: Snapshot): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}
