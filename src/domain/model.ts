export const types = {
  FLOOD: "Alagamento",
  HEAT: "Calor intenso",
  SERVICE: "Serviço essencial",
} as const;
export const sources = {
  SENSOR: "Sensor",
  PUBLIC: "Base pública",
  COMMUNITY: "Comunidade",
} as const;
export const severities = {
  LOW: "Baixa",
  MEDIUM: "Moderada",
  HIGH: "Alta",
  CRITICAL: "Crítica",
} as const;
export const states = {
  REPORTED: "Reportado",
  VALIDATING: "Em validação",
  CONFIRMED: "Confirmado",
  ALERTED: "Alerta emitido",
  MONITORING: "Em monitoramento",
  CLOSED: "Encerrado",
  DISCARDED: "Descartado",
} as const;
export type RiskType = keyof typeof types;
export type Source = keyof typeof sources;
export type Severity = keyof typeof severities;
export type EventState = keyof typeof states;
export interface History {
  state: EventState;
  at: string;
  reason: string;
}
export interface RiskEvent {
  id: string;
  title: string;
  description: string;
  type: RiskType;
  severity: Severity;
  neighborhood: string;
  people: number;
  source: Source;
  sourceName: string;
  simulated: boolean;
  observedAt: string;
  createdAt: string;
  state: EventState;
  latitude: number;
  longitude: number;
  reading?: number;
  unit?: string;
  history: History[];
}
export interface Notice {
  id: string;
  eventId: string;
  title: string;
  createdAt: string;
  read: boolean;
  score: number;
}
export interface Preferences {
  neighborhood: string;
  minScore: number;
  categories: RiskType[];
}
export interface Snapshot {
  version: 1;
  events: RiskEvent[];
  notices: Notice[];
  preferences: Preferences;
  updatedAt: string;
}
export const neighborhoods = [
  { name: "Sé", lat: -23.5505, lon: -46.6333 },
  { name: "Mooca", lat: -23.558, lon: -46.598 },
  { name: "Ipiranga", lat: -23.592, lon: -46.605 },
  { name: "Vila Mariana", lat: -23.588, lon: -46.637 },
  { name: "Pinheiros", lat: -23.567, lon: -46.691 },
  { name: "Santana", lat: -23.505, lon: -46.625 },
  { name: "Lapa", lat: -23.525, lon: -46.701 },
  { name: "Butantã", lat: -23.571, lon: -46.728 },
];
export const confidence = { SENSOR: 90, PUBLIC: 95, COMMUNITY: 60 } as const;
export const isActive = (e: RiskEvent) =>
  !["CLOSED", "DISCARDED"].includes(e.state);
export function analyze(e: RiskEvent, now = Date.now()) {
  const age = Math.max(0, Math.floor((now - Date.parse(e.observedAt)) / 60000));
  const factors = {
    severity: { LOW: 10, MEDIUM: 22, HIGH: 34, CRITICAL: 45 }[e.severity],
    confidence: Math.round((confidence[e.source] / 100) * 25),
    impact: Math.min(20, Math.round(Math.log10(Math.max(1, e.people)) * 6)),
    recency: age <= 30 ? 10 : age <= 120 ? 7 : age <= 1440 ? 3 : 0,
  };
  const score = isActive(e)
    ? Object.values(factors).reduce((a, b) => a + b, 0)
    : 0;
  const level =
    score >= 80
      ? "Crítico"
      : score >= 60
        ? "Alto"
        : score >= 40
          ? "Moderado"
          : "Baixo";
  return { score, level, factors, age };
}
export const transitions: Record<EventState, EventState[]> = {
  REPORTED: ["VALIDATING"],
  VALIDATING: ["CONFIRMED", "DISCARDED"],
  CONFIRMED: ["ALERTED", "MONITORING", "DISCARDED"],
  ALERTED: ["MONITORING"],
  MONITORING: ["CLOSED"],
  CLOSED: [],
  DISCARDED: [],
};
export function transition(
  event: RiskEvent,
  state: EventState,
  now = new Date().toISOString(),
): RiskEvent {
  if (!transitions[event.state].includes(state))
    throw new Error("Transição de estado não permitida.");
  if (state === "ALERTED" && analyze(event, Date.parse(now)).score < 60)
    throw new Error("A pontuação mínima para emitir alerta é 60.");
  return {
    ...event,
    state,
    history: [
      ...event.history,
      { state, at: now, reason: "Ação demonstrativa do agente local" },
    ],
  };
}
export interface EventInput {
  title: string;
  description: string;
  type: RiskType;
  severity: Severity;
  neighborhood: string;
  people: number;
}
export function validate(input: EventInput): string[] {
  const errors: string[] = [];
  if (input.title.trim().length < 8 || input.title.length > 100)
    errors.push("O título precisa ter entre 8 e 100 caracteres.");
  if (input.description.trim().length < 20 || input.description.length > 1000)
    errors.push("Descreva a situação em 20 a 1.000 caracteres.");
  if (!(input.type in types) || !(input.severity in severities))
    errors.push("Selecione tipo e severidade válidos.");
  if (!neighborhoods.some((n) => n.name === input.neighborhood))
    errors.push("Selecione um bairro da área piloto.");
  if (
    !Number.isInteger(input.people) ||
    input.people < 0 ||
    input.people > 1000000
  )
    errors.push("Pessoas estimadas deve ser um inteiro entre 0 e 1.000.000.");
  return errors;
}
export function createEvent(
  input: EventInput,
  source: Source = "COMMUNITY",
  simulated = false,
): RiskEvent {
  const errors = validate(input);
  if (errors.length) throw new Error(errors.join(" "));
  const n = neighborhoods.find((n) => n.name === input.neighborhood)!;
  const at = new Date().toISOString();
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    id: crypto.randomUUID(),
    source,
    sourceName:
      source === "COMMUNITY"
        ? "Relato comunitário não verificado"
        : source === "SENSOR"
          ? "Sensor demonstrativo UR-SP"
          : "Boletim público demonstrativo",
    simulated,
    observedAt: at,
    createdAt: at,
    state: "REPORTED",
    latitude: n.lat,
    longitude: n.lon,
    history: [
      { state: "REPORTED", at, reason: "Recebido e validado estruturalmente" },
    ],
  };
}
export function processEvent(event: RiskEvent): RiskEvent {
  let next = transition(event, "VALIDATING");
  next = transition(next, "CONFIRMED");
  next = transition(next, analyze(next).score >= 60 ? "ALERTED" : "MONITORING");
  return {
    ...next,
    history: next.history.map((h, i) =>
      i === 0
        ? h
        : {
            ...h,
            reason:
              h.state === "VALIDATING"
                ? "Validação automática do contrato da fonte"
                : h.state === "CONFIRMED"
                  ? "Contrato aceito no fluxo demonstrativo, sem verificação oficial"
                  : h.state === "ALERTED"
                    ? "Classificação automática: prioridade de pelo menos 60 pontos"
                    : "Classificação automática: acompanhamento sem emissão",
          },
    ),
  };
}
export function noticeFor(e: RiskEvent): Notice | null {
  const { score } = analyze(e);
  return e.state === "ALERTED" && score >= 60
    ? {
        id: crypto.randomUUID(),
        eventId: e.id,
        title: e.title,
        createdAt: new Date().toISOString(),
        read: false,
        score,
      }
    : null;
}
export const recommendations: Record<RiskType, string> = {
  FLOOD:
    "Evite atravessar áreas alagadas. Consulte os canais oficiais antes de se deslocar.",
  HEAT: "Procure locais ventilados, hidrate-se e acompanhe pessoas mais vulneráveis.",
  SERVICE:
    "Confira a situação nos canais da concessionária e planeje alternativas para o serviço afetado.",
};
