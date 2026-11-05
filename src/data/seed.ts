import {
  createEvent,
  processEvent,
  noticeFor,
  type Snapshot,
  type RiskType,
  type Severity,
  type Source,
} from "../domain/model";
export function seed(): Snapshot {
  const records: [
    string,
    RiskType,
    Severity,
    string,
    number,
    Source,
    number,
  ][] = [
    [
      "Alagamento na região do Ipiranga",
      "FLOOD",
      "CRITICAL",
      "Ipiranga",
      1800,
      "SENSOR",
      8,
    ],
    ["Temperatura elevada na Sé", "HEAT", "HIGH", "Sé", 3200, "PUBLIC", 18],
    [
      "Interrupção de energia na Mooca",
      "SERVICE",
      "HIGH",
      "Mooca",
      950,
      "COMMUNITY",
      24,
    ],
    [
      "Acúmulo de água em Pinheiros",
      "FLOOD",
      "MEDIUM",
      "Pinheiros",
      180,
      "COMMUNITY",
      45,
    ],
    [
      "Abastecimento de água em manutenção",
      "SERVICE",
      "MEDIUM",
      "Santana",
      420,
      "PUBLIC",
      74,
    ],
    [
      "Calor intenso na Vila Mariana",
      "HEAT",
      "MEDIUM",
      "Vila Mariana",
      600,
      "SENSOR",
      90,
    ],
    ["Ponto de alagamento na Lapa", "FLOOD", "LOW", "Lapa", 60, "SENSOR", 140],
    [
      "Transporte regularizado no Butantã",
      "SERVICE",
      "LOW",
      "Butantã",
      200,
      "PUBLIC",
      180,
    ],
  ];
  const events = records.map(
    ([title, type, severity, neighborhood, people, source, minutes], i) => {
      let e = createEvent(
        {
          title,
          type,
          severity,
          neighborhood,
          people,
          description:
            "Cenário simulado para demonstração acadêmica. As condições e as pessoas estimadas não representam uma ocorrência real.",
        },
        source,
        true,
      );
      const at = new Date(Date.now() - minutes * 60000).toISOString();
      e = {
        ...e,
        id: `demo-${i + 1}`,
        observedAt: at,
        createdAt: at,
        history: [{ state: "REPORTED", at, reason: "Cenário de demonstração" }],
      };
      e = processEvent(e);
      e.history = e.history.map((h) => ({ ...h, at }));
      if (i === 7) {
        e.state = "CLOSED";
        e.history.push({
          state: "CLOSED",
          at,
          reason: "Serviço regularizado no cenário simulado",
        });
      }
      return e;
    },
  );
  return {
    version: 1,
    events,
    notices: events.map(noticeFor).filter((n) => n !== null),
    preferences: {
      neighborhood: "Todos",
      minScore: 60,
      categories: ["FLOOD", "HEAT", "SERVICE"],
    },
    updatedAt: new Date().toISOString(),
  };
}
