import { createEvent, processEvent, type RiskEvent } from "../domain/model";
export const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current=temperature_2m&timezone=UTC";
export function normalizeWeather(data: unknown, now = Date.now()): RiskEvent {
  const d = data as {
    current?: { time?: string; temperature_2m?: number };
    current_units?: { temperature_2m?: string };
  };
  const temp = d?.current?.temperature_2m;
  const at = d?.current?.time;
  const observedAt = at ? (/Z$|[+-]\d{2}:\d{2}$/.test(at) ? at : `${at}Z`) : "";
  const time = Date.parse(observedAt);
  if (
    typeof temp !== "number" ||
    !Number.isFinite(temp) ||
    temp < -30 ||
    temp > 60 ||
    d?.current_units?.temperature_2m !== "°C" ||
    !Number.isFinite(time) ||
    time > now + 300000 ||
    now - time > 7200000
  )
    throw new Error(
      "A fonte retornou uma leitura inválida ou desatualizada. Nenhum evento foi importado.",
    );
  const event = createEvent(
    {
      title: `Temperatura de ${temp.toFixed(1)} °C na Sé`,
      description:
        "Estimativa do modelo meteorológico Open-Meteo para a região central. Não é sensor de rua nem comprovação de ilha de calor. Limiares demonstrativos, sem calibração científica.",
      type: "HEAT",
      severity:
        temp >= 38
          ? "CRITICAL"
          : temp >= 34
            ? "HIGH"
            : temp >= 30
              ? "MEDIUM"
              : "LOW",
      neighborhood: "Sé",
      people: 0,
    },
    "PUBLIC",
    false,
  );
  const e = processEvent({
    ...event,
    sourceName: "Open-Meteo · modelo meteorológico",
    observedAt,
    reading: temp,
    unit: "°C",
  });
  // Temperatura abaixo de 30 °C acompanha condições, sem emitir um alerta.
  return temp < 30
    ? {
        ...e,
        state: "MONITORING",
        history: [
          ...e.history.filter(
            (h) => h.state !== "ALERTED" && h.state !== "MONITORING",
          ),
          {
            state: "MONITORING",
            at: new Date(now).toISOString(),
            reason: "Temperatura abaixo do limiar demonstrativo de 30 °C",
          },
        ],
      }
    : e;
}
export async function fetchWeather(): Promise<RiskEvent> {
  const response = await fetch(WEATHER_URL, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw new Error(
      `Fonte indisponível (HTTP ${response.status}). Tente novamente.`,
    );
  return normalizeWeather(await response.json());
}
