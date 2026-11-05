import {
  ArrowUpRight,
  Droplets,
  Thermometer,
  Zap,
  MapPin,
  Radio,
  Database,
  Users,
  Search,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  analyze,
  confidence,
  isActive,
  sources,
  states,
  types,
  type RiskEvent,
  type RiskType,
  type Source,
} from "../domain/model";
import { useStore } from "../application/store";
import { useState, type ReactNode } from "react";
export const TypeIcon = ({
  type,
  size = 19,
}: {
  type: RiskType;
  size?: number;
}) => {
  const I = { FLOOD: Droplets, HEAT: Thermometer, SERVICE: Zap }[type];
  return <I size={size} />;
};
export const SourceIcon = ({ source }: { source: Source }) => {
  const I = { SENSOR: Radio, PUBLIC: Database, COMMUNITY: Users }[source];
  return <I size={15} />;
};
export const date = (s: string) =>
  new Date(s).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export const time = (s: string) =>
  new Date(s).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
export function Heading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Badge({ event }: { event: RiskEvent }) {
  const { score, level } = analyze(event, useStore().now);
  return (
    <span
      className={`badge risk-${score >= 80 ? "critical" : score >= 60 ? "high" : score >= 40 ? "medium" : "low"}`}
    >
      <span className="dot" />
      {level} <b>{score}</b>
    </span>
  );
}
export function Provenance({ event }: { event: RiskEvent }) {
  return (
    <div className="provenance">
      <span>
        <SourceIcon source={event.source} />
        {sources[event.source]}
      </span>
      <span className="trust">
        <ShieldCheck size={14} />
        {confidence[event.source]}% de confiança
      </span>
      {event.simulated && <span className="demo-tag">Simulado</span>}
    </div>
  );
}
export function Empty({
  title = "Nenhum evento encontrado",
  copy = "Experimente outros filtros ou registre uma ocorrência.",
  children,
}: {
  title?: string;
  copy?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Search size={30} />
      <h3>{title}</h3>
      <p>{copy}</p>
      {children}
    </div>
  );
}
export function EventRow({
  event,
  compact = false,
}: {
  event: RiskEvent;
  compact?: boolean;
}) {
  return (
    <Link
      className={`event-row ${compact ? "compact" : ""}`}
      to={`/alertas/${event.id}`}
    >
      <div className={`type-icon type-${event.type}`}>
        <TypeIcon type={event.type} />
      </div>
      <div className="event-content">
        <div className="event-title">
          <h3>{event.title}</h3>
          <Badge event={event} />
        </div>
        <div className="event-meta">
          <MapPin size={13} />
          {event.neighborhood}
          <span>{date(event.observedAt)}</span>
          {!compact && <span>{states[event.state]}</span>}
        </div>
        <Provenance event={event} />
      </div>
      <ArrowUpRight size={17} className="row-arrow" />
    </Link>
  );
}
export function RiskMap({ events }: { events: RiskEvent[] }) {
  const [zoom, setZoom] = useState(1);
  const active = events.filter(isActive);
  const groups = [...new Set(active.map((e) => e.neighborhood))].map((name) =>
    active.filter((e) => e.neighborhood === name),
  );
  return (
    <div className="territory">
      <div className="map-canvas">
        <svg
          viewBox="0 0 800 440"
          role="img"
          aria-label="Mapa esquemático dos bairros de São Paulo, sem escala geográfica"
        >
          <defs>
            <pattern
              id="blocks"
              width="92"
              height="74"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-22)"
            >
              <rect width="92" height="74" fill="#edf1ed" />
              <rect
                x="5"
                y="6"
                width="80"
                height="59"
                rx="7"
                fill="#e5ebe5"
                stroke="#f8faf6"
                strokeWidth="5"
              />
              <path d="M0 72h92M90 0v74" stroke="#fff" strokeWidth="4" />
            </pattern>
          </defs>
          <rect width="800" height="440" fill="url(#blocks)" />
          <g
            style={{
              transform: `translate(${400 - zoom * 400}px, ${220 - zoom * 220}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <path
              d="M-30 60C70 12 100 210 220 200S350 170 390 280 480 360 820 300"
              stroke="#c3dce1"
              strokeWidth="23"
              fill="none"
            />
            <path
              d="M-30 60C70 12 100 210 220 200S350 170 390 280 480 360 820 300"
              stroke="#dcecf0"
              strokeWidth="11"
              fill="none"
            />
            <path
              d="M300 -20 220 440M20 250 800 100M470 0 560 440M40 390 800 40"
              stroke="#fff"
              strokeWidth="12"
              fill="none"
            />
            <path
              d="M20 250 800 100M470 0 560 440"
              stroke="#dfd9bb"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="m570 20 140 30-20 74-110-15zm-420 280 65 10 20 72-98 23z"
              fill="#cdddc8"
            />
            <text x="615" y="85" className="map-park">
              Área verde
            </text>
            {[
              ["Lapa", 180, 70],
              ["Santana", 490, 60],
              ["Pinheiros", 250, 240],
              ["Sé", 467, 195],
              ["Mooca", 655, 240],
              ["Butantã", 100, 335],
              ["Vila Mariana", 420, 340],
              ["Ipiranga", 625, 363],
            ].map(([label, x, y]) => (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                className="map-label"
              >
                {label}
              </text>
            ))}
          </g>
        </svg>
        <div className="map-markers" style={{ transform: `scale(${zoom})` }}>
          {groups.map((group) => {
            const e = [...group].sort(
              (a, b) => analyze(b).score - analyze(a).score,
            )[0];
            const positions: Record<string, [number, number]> = {
              Lapa: [23, 22],
              Santana: [61, 25],
              Pinheiros: [31, 61],
              Sé: [58, 51],
              Mooca: [82, 62],
              Butantã: [13, 82],
              "Vila Mariana": [52, 84],
              Ipiranga: [78, 89],
            };
            const [x, y] = positions[e.neighborhood] ?? [50, 50];
            return (
              <Link
                key={e.neighborhood}
                to={`/alertas/${e.id}`}
                className={`map-pin type-${e.type}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`${e.neighborhood}: ${e.title}. ${group.length} eventos; abre o de maior prioridade.`}
              >
                <TypeIcon type={e.type} size={18} />
                {group.length > 1 && <b>{group.length}</b>}
              </Link>
            );
          })}
        </div>
        <span className="map-region">
          <MapPin size={14} /> São Paulo, SP
        </span>
        <div className="zoom">
          <button
            aria-label="Aproximar mapa"
            onClick={() => setZoom((v) => Math.min(1.8, v + 0.2))}
          >
            +
          </button>
          <button aria-label="Restaurar mapa" onClick={() => setZoom(1)}>
            {Math.round(zoom * 100)}%
          </button>
          <button
            aria-label="Afastar mapa"
            onClick={() => setZoom((v) => Math.max(1, v - 0.2))}
          >
            −
          </button>
        </div>
        <span className="map-disclaimer">
          Visão esquemática · posições aproximadas
        </span>
      </div>
      <div className="legend">
        {Object.entries(types).map(([key, label]) => (
          <span key={key}>
            <i className={`legend-dot type-${key}`} />
            {label}
          </span>
        ))}
        <Link to="/alertas">
          Ver todos os eventos <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
export function PanelTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
