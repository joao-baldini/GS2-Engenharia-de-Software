import { describe, it, expect, vi } from "vitest";
import {
  analyze,
  createEvent,
  noticeFor,
  processEvent,
  transition,
  validate,
  type EventInput,
} from "./model";
import { normalizeWeather } from "../application/weather";
import { validSnapshot } from "../data/repository";
import { seed } from "../data/seed";
const input: EventInput = {
  title: "Alagamento no Ipiranga",
  description: "Acúmulo de água próximo a uma praça pública.",
  type: "FLOOD",
  severity: "CRITICAL",
  neighborhood: "Ipiranga",
  people: 1800,
};
describe("prioridade e confiança", () => {
  it("calcula o exemplo de sensor com 98 pontos e quatro fatores", () => {
    const e = createEvent(input, "SENSOR", true);
    const a = analyze(e);
    expect(a.score).toBe(98);
    expect(a.factors).toEqual({
      severity: 45,
      confidence: 23,
      impact: 20,
      recency: 10,
    });
  });
  it("fixa a contribuição comunitária e não confunde relato com alerta emitido", () => {
    const e = createEvent(input);
    expect(analyze(e).factors.confidence).toBe(15);
    expect(noticeFor(e)).toBeNull();
  });
  it.each([
    [30, 10],
    [31, 7],
    [120, 7],
    [121, 3],
    [1440, 3],
    [1441, 0],
  ])("aplica recência de %i minutos", (age, expected) => {
    const now = Date.now();
    const e = {
      ...createEvent(input),
      observedAt: new Date(now - age * 60000).toISOString(),
    };
    expect(analyze(e, now).factors.recency).toBe(expected);
  });
  it("zera eventos finais", () => {
    const e = { ...createEvent(input), state: "CLOSED" as const };
    expect(analyze(e).score).toBe(0);
  });
});
describe("ciclo de vida e validação", () => {
  it("processa entrada externa e cria notificação somente após classificação", () => {
    const e = processEvent(createEvent(input, "SENSOR", true));
    expect(e.history.map((h) => h.state)).toEqual([
      "REPORTED",
      "VALIDATING",
      "CONFIRMED",
      "ALERTED",
    ]);
    expect(noticeFor(e)?.score).toBe(98);
  });
  it("proíbe salto de estado e reabertura de evento encerrado", () => {
    expect(() => transition(createEvent(input), "CLOSED")).toThrow();
    expect(() =>
      transition({ ...createEvent(input), state: "CLOSED" }, "MONITORING"),
    ).toThrow();
  });
  it("mantém sinais de baixo impacto em monitoramento", () => {
    const e = processEvent(
      createEvent({ ...input, severity: "LOW", people: 0 }),
    );
    expect(e.state).toBe("MONITORING");
    expect(noticeFor(e)).toBeNull();
    expect(e.history.filter((h) => h.state === "MONITORING")).toHaveLength(1);
  });
  it("não emite alerta abaixo do limiar", () => {
    const e = {
      ...createEvent({ ...input, severity: "LOW", people: 0 }),
      state: "CONFIRMED" as const,
    };
    expect(() => transition(e, "ALERTED")).toThrow();
  });
  it("rejeita dados fora do contrato", () => {
    expect(
      validate({
        ...input,
        title: "",
        description: "",
        people: -1,
        neighborhood: "Inválido",
      }),
    ).toHaveLength(4);
    expect(() => createEvent({ ...input, people: 1.5 })).toThrow();
  });
});
describe("fonte pública e persistência", () => {
  it("preserva horário UTC e impede alerta de temperatura amena", () => {
    const now = Date.now();
    const time = new Date(now).toISOString().slice(0, 19);
    const e = normalizeWeather(
      {
        current: { time, temperature_2m: 24 },
        current_units: { temperature_2m: "°C" },
      },
      now,
    );
    expect(e.observedAt).toBe(time + "Z");
    expect(e.simulated).toBe(false);
    expect(e.state).toBe("MONITORING");
    expect(noticeFor(e)).toBeNull();
    expect(e.history.filter((h) => h.state === "MONITORING")).toHaveLength(1);
  });
  it("rejeita leitura antiga, unidade errada e valores inválidos", () => {
    for (const v of [NaN, 100, undefined])
      expect(() =>
        normalizeWeather({
          current: { time: new Date().toISOString(), temperature_2m: v },
          current_units: { temperature_2m: "°C" },
        }),
      ).toThrow();
    expect(() =>
      normalizeWeather({
        current: { time: "2020-01-01T00:00", temperature_2m: 32 },
        current_units: { temperature_2m: "°C" },
      }),
    ).toThrow();
    expect(() =>
      normalizeWeather({
        current: { time: new Date().toISOString(), temperature_2m: 32 },
        current_units: { temperature_2m: "F" },
      }),
    ).toThrow();
  });
  it("aceita snapshot consistente e rejeita estrutura incompleta", () => {
    const s = seed();
    expect(validSnapshot(s)).toBe(true);
    expect(validSnapshot({ ...s, events: [{ id: "bad" }] })).toBe(false);
    expect(validSnapshot(null)).toBe(false);
  });
  it("respeita limite exato do alerta de calor sem inferir pessoas afetadas", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
    const e = normalizeWeather({
      current: { time: "2026-11-05T12:00", temperature_2m: 38 },
      current_units: { temperature_2m: "°C" },
    });
    expect(e.people).toBe(0);
    expect(e.state).toBe("ALERTED");
    expect(noticeFor(e)?.score).toBe(79);
    vi.useRealTimers();
  });
});
