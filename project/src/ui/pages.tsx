import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  Clock3,
  Database,
  Activity,
} from "lucide-react";
import { useStore } from "../application/store";
import {
  analyze,
  confidence,
  createEvent,
  isActive,
  neighborhoods,
  processEvent,
  recommendations,
  severities,
  sources,
  states,
  transitions,
  types,
  validate,
  type EventInput,
  type RiskType,
  type Severity,
  type Source,
} from "../domain/model";
import { fetchWeather } from "../application/weather";
import {
  Badge,
  date,
  Empty,
  EventRow,
  Heading,
  PanelTitle,
  Provenance,
  RiskMap,
  SourceIcon,
  time,
  TypeIcon,
} from "./components";
export function Dashboard() {
  const { data, now } = useStore();
  const active = data.events.filter(isActive);
  const sorted = [...active].sort(
    (a, b) => analyze(b, now).score - analyze(a, now).score,
  );
  const priority = sorted.filter(
    (e) => e.state === "ALERTED" && analyze(e, now).score >= 60,
  );
  const sim = data.events.filter((e) => e.simulated).length;
  return (
    <>
      <Heading
        title="Um olhar atento à cidade"
        subtitle="Acompanhe os riscos, entenda os dados e saiba o que priorizar."
      >
        <Link className="button primary" to="/registrar">
          <Plus size={17} />
          Registrar ocorrência
        </Link>
      </Heading>
      <div className="demo-banner">
        <Info size={18} />
        <span>
          <strong>Ambiente de demonstração.</strong> {sim} de{" "}
          {data.events.length} registros são simulados. Alterações ficam neste
          navegador.
        </span>
        <Link to="/fontes">
          Entender as fontes <ArrowRight size={15} />
        </Link>
      </div>
      <div className="stats">
        <div className="stat">
          <span>Eventos em acompanhamento</span>
          <strong>{active.length.toString().padStart(2, "0")}</strong>
          <small>
            <span className="dot green" />
            Na área piloto de São Paulo
          </small>
          <Activity className="stat-icon" size={23} />
        </div>
        <div className="stat">
          <span>Alertas prioritários</span>
          <strong>{priority.length.toString().padStart(2, "0")}</strong>
          <small>Emitidos com pontuação ≥ 60</small>
          <Bell className="stat-icon amber-text" size={23} />
        </div>
        <div className="stat">
          <span>Origens de informação</span>
          <strong>
            {new Set(data.events.map((e) => e.source)).size
              .toString()
              .padStart(2, "0")}
          </strong>
          <small>Sensores, bases e comunidade</small>
          <Database className="stat-icon" size={23} />
        </div>
        <div className="stat">
          <span>Última alteração local</span>
          <strong className="stat-time">{time(data.updatedAt)}</strong>
          <small>Não representa atualização externa</small>
          <Clock3 className="stat-icon" size={23} />
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel map-panel">
          <PanelTitle
            title="O território em perspectiva"
            subtitle="Eventos ativos por bairro"
          >
            <span className="small-pill">{active.length} eventos</span>
          </PanelTitle>
          <RiskMap events={data.events} />
        </section>
        <section className="panel priorities">
          <PanelTitle
            title="Atenção prioritária"
            subtitle="Alertas emitidos, por pontuação"
          >
            <span className="small-pill amber-pill">{priority.length}</span>
          </PanelTitle>
          {priority.slice(0, 3).map((e) => (
            <EventRow key={e.id} event={e} compact />
          ))}
          {!priority.length && (
            <Empty
              title="Sem alertas prioritários"
              copy="Os eventos continuam disponíveis para acompanhamento."
            />
          )}
          <Link className="panel-link" to="/alertas">
            Explorar eventos e alertas <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel categories">
          <PanelTitle
            title="Riscos em acompanhamento"
            subtitle="Distribuição dos eventos ativos"
          />
          {Object.entries(types).map(([k, v]) => {
            const count = active.filter((e) => e.type === k).length;
            return (
              <Link to={`/alertas?tipo=${k}`} className="category-row" key={k}>
                <span className={`type-icon type-${k}`}>
                  <TypeIcon type={k as RiskType} />
                </span>
                <div>
                  <span>{v}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill type-${k}`}
                      style={{
                        width: `${active.length ? (count / active.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <strong>{count}</strong>
                <ChevronRight size={16} />
              </Link>
            );
          })}
        </section>
        <section className="community-callout">
          <div className="community-art">
            <Users size={37} />
            <span className="community-orbit">
              <Plus size={16} />
            </span>
          </div>
          <div>
            <h2>Quem vive a cidade também cuida dela.</h2>
            <p>
              Viu um ponto de alagamento, calor intenso ou um serviço
              interrompido? Seu relato ajuda a compor essa visão.
            </p>
            <Link to="/registrar">
              Compartilhar uma ocorrência <ArrowUpRight size={17} />
            </Link>
          </div>
          <span className="community-note">
            Sem cadastro e sem localização precisa.
          </span>
        </section>
      </div>
    </>
  );
}
export function Alerts() {
  const { data, now } = useStore();
  const [search, setSearch] = useState("");
  const [type, setType] = useState(
    new URLSearchParams(location.search).get("tipo") || "ALL",
  );
  const [status, setStatus] = useState("ACTIVE");
  const [source, setSource] = useState("ALL");
  const [sort, setSort] = useState("score");
  const filtered = data.events
    .filter(
      (e) =>
        (type === "ALL" || e.type === type) &&
        (source === "ALL" || e.source === source) &&
        (status === "ALL" ||
          (status === "ACTIVE" && isActive(e)) ||
          e.state === status) &&
        `${e.title} ${e.neighborhood}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) =>
      sort === "score"
        ? analyze(b, now).score - analyze(a, now).score ||
          b.observedAt.localeCompare(a.observedAt)
        : b.observedAt.localeCompare(a.observedAt),
    );
  return (
    <>
      <Heading
        title="Eventos e alertas"
        subtitle="Da observação ao acompanhamento, com a origem sempre visível."
      >
        <Link to="/registrar" className="button primary">
          <Plus size={17} />
          Registrar ocorrência
        </Link>
      </Heading>
      <section className="panel">
        <div className="filters">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar por título ou bairro"
              placeholder="Buscar por evento ou bairro"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ALL">Todos os riscos</option>
              {Object.entries(types).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Em acompanhamento</option>
              <option value="ALL">Todos os estados</option>
              {Object.entries(states).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Origem
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="ALL">Todas as origens</option>
              {Object.entries(sources).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="list-summary">
          <span>{filtered.length} eventos encontrados</span>
          <label className="sort-label">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Ordenar eventos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="score">Maior prioridade</option>
              <option value="date">Mais recentes</option>
            </select>
          </label>
        </div>
        {filtered.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
        {!filtered.length && (
          <Empty>
            <button
              className="button"
              onClick={() => {
                setSearch("");
                setType("ALL");
                setStatus("ALL");
                setSource("ALL");
              }}
            >
              Limpar filtros
            </button>
          </Empty>
        )}
      </section>
      <p className="footnote">
        Confiança é uma regra demonstrativa por origem. Relatos ainda não
        validados podem ter pontuação alta, mas só emitem notificação após
        confirmação.
      </p>
    </>
  );
}
export function Detail() {
  const { id } = useParams();
  const { data, now, move } = useStore();
  const [error, setError] = useState("");
  const e = data.events.find((e) => e.id === id);
  if (!e) return <NotFound />;
  const a = analyze(e, now);
  return (
    <>
      <Link className="back-link" to="/alertas">
        <ArrowLeft size={16} />
        Todos os eventos
      </Link>
      <Heading
        title={e.title}
        subtitle={`${types[e.type]} em ${e.neighborhood}`}
      >
        <Badge event={e} />
      </Heading>
      <div className="detail-grid">
        <div>
          <section className="panel detail-body">
            <div className="detail-top">
              <span className={`type-icon type-${e.type}`}>
                <TypeIcon type={e.type} size={25} />
              </span>
              <span className="small-pill">{states[e.state]}</span>
              {e.simulated && <span className="demo-tag">Dado simulado</span>}
            </div>
            <h2>O que foi observado</h2>
            <p>{e.description}</p>
            <div className="facts">
              <div>
                <span>Bairro</span>
                <strong>{e.neighborhood}</strong>
              </div>
              <div>
                <span>Observação</span>
                <strong>{date(e.observedAt)}</strong>
              </div>
              <div>
                <span>Severidade declarada</span>
                <strong>{severities[e.severity]}</strong>
              </div>
              <div>
                <span>Pessoas estimadas</span>
                <strong>
                  {e.people
                    ? e.people.toLocaleString("pt-BR")
                    : "Não informado"}
                </strong>
              </div>
              {e.reading !== undefined && (
                <div>
                  <span>Leitura da fonte</span>
                  <strong>
                    {e.reading} {e.unit}
                  </strong>
                </div>
              )}
            </div>
            <div className="recommendation">
              <ShieldCheck size={23} />
              <div>
                <strong>Orientação de cuidado</strong>
                <p>{recommendations[e.type]}</p>
                <small>
                  Informação educativa. Não substitui orientação oficial.
                </small>
              </div>
            </div>
            <h2>Origem e confiança</h2>
            <Provenance event={e} />
            <p className="muted">
              {e.sourceName}. Confiança de {confidence[e.source]}% atribuída
              pela categoria da fonte, sem validação de autenticidade.
              “Confirmado” indica aprovação no fluxo do protótipo.
            </p>
            <Link className="text-link" to="/fontes">
              Como calculamos a confiança <ArrowUpRight size={15} />
            </Link>
            <a
              className="text-link"
              href={`https://www.openstreetmap.org/?mlat=${e.latitude}&mlon=${e.longitude}#map=14/${e.latitude}/${e.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver centro aproximado do bairro <ExternalLink size={14} />
            </a>
          </section>
          <section className="panel timeline-panel">
            <PanelTitle
              title="Ciclo de vida do evento"
              subtitle="Transições registradas nesta demonstração"
            />
            <ol className="timeline">
              {e.history.map((h, i) => (
                <li key={i}>
                  <span className="timeline-node">
                    <Check size={12} />
                  </span>
                  <div>
                    <strong>{states[h.state]}</strong>
                    <p>{h.reason}</p>
                    <small>{date(h.at)}</small>
                  </div>
                </li>
              ))}
            </ol>
            <div className="agent-action">
              <strong>Ações do agente · demonstração</strong>
              <p>
                As ações abaixo alteram apenas este navegador. A versão de
                produção exige autenticação e auditoria no servidor.
              </p>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
              <div className="button-row">
                {transitions[e.state]
                  .filter((s) => s !== "ALERTED" || a.score >= 60)
                  .map((s) => (
                    <button
                      key={s}
                      className={`button ${s === "DISCARDED" ? "danger" : ""}`}
                      onClick={() => {
                        try {
                          move(e.id, s);
                          setError("");
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                    >
                      {s === "VALIDATING"
                        ? "Iniciar validação"
                        : s === "CONFIRMED"
                          ? "Confirmar evento"
                          : s === "ALERTED"
                            ? "Emitir alerta"
                            : s === "MONITORING"
                              ? "Acompanhar evento"
                              : s === "CLOSED"
                                ? "Encerrar evento"
                                : "Descartar evento"}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                {!transitions[e.state].length && (
                  <span className="muted">
                    Estado final. Histórico preservado.
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel analysis-panel">
            <h2>Prioridade explicável</h2>
            <div className="score-number">
              {a.score}
              <span>/100</span>
            </div>
            <Badge event={e} />
            <p>
              Severidade, origem, impacto estimado e recência compõem a triagem.
            </p>
            {(
              [
                ["severity", "Severidade", 45],
                ["confidence", "Confiança", 25],
                ["impact", "Impacto estimado", 20],
                ["recency", "Recência", 10],
              ] as const
            ).map(([key, label, max]) => (
              <div className="factor" key={key}>
                <div>
                  <span>{label}</span>
                  <strong>
                    {a.factors[key]}
                    <small>/{max}</small>
                  </strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(a.factors[key] / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!isActive(e) && (
              <p className="notice-banner">
                Evento finalizado: a prioridade é zero. Os fatores acima
                preservam o contexto.
              </p>
            )}
            <p className="footnote">
              Crítico ≥ 80 · Alto ≥ 60 · Moderado ≥ 40 · Baixo &lt; 40. Recência
              recalculada a cada 30 segundos.
            </p>
          </section>
          <section className="quiet-info">
            <Info size={19} />
            <p>
              Relatos são sinais para análise. A pontuação não prevê desastres
              nem comprova que um risco é real.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
export function Notifications() {
  const { data, read } = useStore();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const p = data.preferences;
  const notices = data.notices.filter(
    (n) =>
      (!onlyUnread || !n.read) &&
      (!filtered ||
        data.events.some(
          (e) =>
            e.id === n.eventId &&
            p.categories.includes(e.type) &&
            (p.neighborhood === "Todos" || p.neighborhood === e.neighborhood) &&
            n.score >= p.minScore,
        )),
  );
  return (
    <>
      <Heading
        title="Central de notificações"
        subtitle="Alertas emitidos no fluxo de validação, com histórico de leitura."
      >
        <button
          className="button"
          disabled={!data.notices.some((n) => !n.read)}
          onClick={() => read()}
        >
          <Check size={16} />
          Marcar todas como lidas
        </button>
      </Heading>
      <div className="notice-banner">
        <Bell size={18} />
        <span>
          Notificações internas deste navegador. Não há envio de SMS, e-mail ou
          push em segundo plano.
        </span>
        <Link to="/preferencias">Preferências</Link>
      </div>
      <div className="tabs">
        <button
          className={!onlyUnread ? "active" : ""}
          onClick={() => setOnlyUnread(false)}
        >
          Todas
        </button>
        <button
          className={onlyUnread ? "active" : ""}
          onClick={() => setOnlyUnread(true)}
        >
          Não lidas <span>{data.notices.filter((n) => !n.read).length}</span>
        </button>
        <label className="check-inline">
          <input
            type="checkbox"
            checked={filtered}
            onChange={(e) => setFiltered(e.target.checked)}
          />
          Aplicar minhas preferências
        </label>
      </div>
      <section className="panel">
        {notices.map((n) => {
          const e = data.events.find((e) => e.id === n.eventId);
          return (
            <article
              key={n.id}
              className={`notification ${!n.read ? "unread" : ""}`}
            >
              <span className="notification-icon">
                <Bell size={19} />
              </span>
              <div>
                <div className="event-title">
                  <h3>
                    <Link
                      to={`/alertas/${n.eventId}`}
                      onClick={() => read(n.id)}
                    >
                      {n.title}
                    </Link>
                  </h3>
                  <span className="muted">{date(n.createdAt)}</span>
                </div>
                <p>
                  Alerta emitido com prioridade {n.score}/100.{" "}
                  {e ? `Estado atual: ${states[e.state]}.` : ""}
                </p>
                {e && <Provenance event={e} />}
                <div className="notification-actions">
                  <Link to={`/alertas/${n.eventId}`} onClick={() => read(n.id)}>
                    Ver evento <ArrowRight size={14} />
                  </Link>
                  {!n.read && (
                    <button onClick={() => read(n.id)}>Marcar como lida</button>
                  )}
                  {n.read && (
                    <small>
                      <Check size={13} />
                      Lida
                    </small>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {!notices.length && (
          <Empty
            title="Tudo em dia por aqui"
            copy="Nenhuma notificação corresponde à seleção. Novos alertas confirmados aparecem nesta central."
          />
        )}
      </section>
    </>
  );
}
export function Report() {
  const { add } = useStore();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input: EventInput = {
      title: String(f.get("title")),
      description: String(f.get("description")),
      type: String(f.get("type")) as RiskType,
      severity: String(f.get("severity")) as Severity,
      neighborhood: String(f.get("neighborhood")),
      people: Number(f.get("people")),
    };
    const issues = validate(input);
    if (issues.length) {
      setErrors(issues);
      return;
    }
    setBusy(true);
    try {
      const event = createEvent(input);
      add(event);
      navigate(`/alertas/${event.id}`);
    } catch (err) {
      setErrors([(err as Error).message]);
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="Compartilhe o que você observou"
        subtitle="Um relato da comunidade é o primeiro passo para compreender um risco."
      />
      <div className="form-grid">
        <form className="panel form-panel" onSubmit={submit}>
          <h2>Registro comunitário</h2>
          <p className="muted">
            Campos com * são obrigatórios. O relato será salvo apenas neste
            navegador.
          </p>
          {!!errors.length && (
            <div className="error-box" role="alert">
              {errors.map((s) => (
                <p key={s}>{s}</p>
              ))}
            </div>
          )}
          <label>
            Título da ocorrência *
            <input
              name="title"
              required
              minLength={8}
              maxLength={100}
              placeholder="Ex.: Acúmulo de água próximo à praça"
            />
          </label>
          <div className="form-two">
            <label>
              Tipo de risco *
              <select name="type" required>
                {Object.entries(types).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bairro *
              <select name="neighborhood" required>
                <option value="">Selecione o bairro</option>
                {neighborhoods.map((n) => (
                  <option key={n.name}>{n.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-two">
            <label>
              Severidade observada *
              <select name="severity" defaultValue="MEDIUM">
                {Object.entries(severities).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pessoas afetadas (estimativa)
              <input
                type="number"
                name="people"
                defaultValue={0}
                min={0}
                max={1000000}
                step={1}
              />
            </label>
          </div>
          <label>
            O que está acontecendo? *
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={1000}
              rows={5}
              placeholder="Descreva o risco e um ponto de referência público. Não inclua nomes, telefones ou endereços residenciais."
            />
          </label>
          <small>
            Se não souber o impacto, mantenha 0. Não pedimos sua localização
            precisa.
          </small>
          <label className="check-inline">
            <input type="checkbox" required />
            Entendo que este é um protótipo acadêmico e que o relato não aciona
            serviços públicos. *
          </label>
          <div className="form-footer">
            <Link className="button" to="/alertas">
              Cancelar
            </Link>
            <button className="button primary" disabled={busy} type="submit">
              <Plus size={16} />
              Registrar ocorrência
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <div className="type-icon type-FLOOD">
            <Users size={24} />
          </div>
          <h2>Sua privacidade vem primeiro.</h2>
          <p>
            Não informe nome, CPF, telefone, fotos ou dados de outras pessoas. O
            bairro já é suficiente para esta demonstração.
          </p>
          <div className="aside-separator" />
          <h3>O que acontece depois?</h3>
          <ol className="steps">
            <li>
              O relato recebe origem “Comunidade” e confiança demonstrativa de
              60%.
            </li>
            <li>O evento fica reportado até a validação no fluxo do agente.</li>
            <li>
              Após confirmação, uma pontuação de 60 ou mais permite emitir a
              notificação.
            </li>
          </ol>
          <Link className="text-link" to="/sobre">
            Leia sobre dados e privacidade <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
    </>
  );
}
export function Sources() {
  const { data } = useStore();
  return (
    <>
      <Heading
        title="Todo dado tem uma origem"
        subtitle="Transparência para saber de onde vem cada informação e como interpretá-la."
      >
        <Link className="button primary" to="/ingestao">
          <Plus size={17} />
          Adicionar uma leitura
        </Link>
      </Heading>
      <div className="source-intro">
        <ShieldCheck size={25} />
        <p>
          <strong>Confiança orienta a triagem, não comprova o risco.</strong> Os
          percentuais são hipóteses fixas por categoria. Não são probabilidades
          calibradas, certificação de autenticidade ou confirmação oficial.
        </p>
      </div>
      <section className="panel source-list">
        {Object.entries(sources).map(([k, v]) => (
          <article className="source-row" key={k}>
            <span className="source-symbol">
              <SourceIcon source={k as Source} />
            </span>
            <div>
              <h2>{v}</h2>
              <p>
                {k === "SENSOR"
                  ? "Leituras de equipamentos. No protótipo, todos os sensores são simulados."
                  : k === "PUBLIC"
                    ? "Boletins demonstrativos e importação opcional do modelo Open-Meteo. Cada registro preserva essa distinção."
                    : "Relatos voluntários sem identificação pessoal, sujeitos à análise do agente no fluxo demonstrativo."}
              </p>
              <span className="muted">
                {data.events.filter((e) => e.source === k).length} registros
                nesta sessão
              </span>
            </div>
            <div className="source-confidence">
              <strong>{confidence[k as Source]}%</strong>
              <span>confiança por origem</span>
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <PanelTitle
          title="Rastreabilidade dos registros"
          subtitle="Origem, horário de observação e natureza do dado"
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fonte declarada</th>
                <th>Confiança</th>
                <th>Observado em</th>
                <th>Natureza</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link to={`/alertas/${e.id}`}>
                      {e.title}
                      <ArrowUpRight size={13} />
                    </Link>
                  </td>
                  <td>{e.sourceName}</td>
                  <td>{confidence[e.source]}%</td>
                  <td>{date(e.observedAt)}</td>
                  <td>
                    {e.simulated
                      ? "Simulado"
                      : e.source === "COMMUNITY"
                        ? "Relato não verificado"
                        : "Estimativa meteorológica"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="two-columns">
        <section className="quiet-info">
          <Database />
          <div>
            <h3>Sobre o Open-Meteo</h3>
            <p>
              Modelo meteorológico de temperatura a 2 m para a Sé. Não é um
              sensor de rua nem comprovação de ilha de calor.
            </p>
            <a
              className="text-link"
              href="https://open-meteo.com/en/docs"
              target="_blank"
              rel="noreferrer"
            >
              Documentação da fonte <ExternalLink size={14} />
            </a>
          </div>
        </section>
        <section className="quiet-info">
          <Clock3 />
          <div>
            <h3>Atualização sem falsas promessas</h3>
            <p>
              A fonte externa é consultada sob demanda. O relógio de recência
              atualiza a cada 30 segundos enquanto a página está ativa.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
export function Ingestion() {
  const { add, data } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sensor, setSensor] = useState<Source>("SENSOR");
  async function importWeather() {
    setLoading(true);
    setError("");
    try {
      const e = await fetchWeather();
      add(e);
      navigate(`/alertas/${e.id}`);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "TimeoutError"
          ? "A fonte não respondeu em 8 segundos. Tente novamente."
          : err instanceof Error
            ? err.message
            : "Não foi possível acessar a fonte.",
      );
    } finally {
      setLoading(false);
    }
  }
  function simulate() {
    setError("");
    try {
      const e = processEvent(
        createEvent(
          {
            title:
              sensor === "SENSOR"
                ? "Sensor demonstrativo: alagamento no Ipiranga"
                : "Boletim demonstrativo: calor intenso na Sé",
            description:
              "Leitura fictícia gerada pelo simulador acadêmico. Não representa equipamentos conectados nem um boletim oficial.",
            type: sensor === "SENSOR" ? "FLOOD" : "HEAT",
            severity: "CRITICAL",
            neighborhood: sensor === "SENSOR" ? "Ipiranga" : "Sé",
            people: 1200,
          },
          sensor,
          true,
        ),
      );
      add(e);
      navigate(`/alertas/${e.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      <Heading
        title="Da observação à informação"
        subtitle="Experimente o processamento de fontes externas e acompanhe o fluxo completo."
      />
      <div className="notice-banner">
        <Info size={18} />
        <span>
          A importação e o simulador gravam apenas neste navegador. Não existe
          servidor de ingestão compartilhado nesta versão.
        </span>
      </div>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <div className="two-columns">
        <section className="panel ingestion-panel">
          <div className="source-symbol">
            <Database size={25} />
          </div>
          <h2>Consultar uma base pública</h2>
          <span className="small-pill green-pill">
            Dado externo · sob demanda
          </span>
          <p>
            Importe a temperatura atual estimada pelo Open-Meteo na região da
            Sé, em São Paulo. A origem, leitura e horário ficam no detalhe.
          </p>
          <ul className="plain-list">
            <li>Timeout de 8 segundos e validação da resposta.</li>
            <li>Leituras repetidas no mesmo horário são rejeitadas.</li>
            <li>Abaixo de 30 °C: acompanhamento, sem alerta.</li>
          </ul>
          <button
            className="button primary"
            onClick={importWeather}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="spin" size={17} />
            ) : (
              <Download size={17} />
            )}{" "}
            {loading ? "Consultando fonte…" : "Importar temperatura da Sé"}
          </button>
          <small>
            Consulta com a coordenada fixa da Sé. O provedor recebe os metadados
            normais da conexão.
          </small>
        </section>
        <section className="panel ingestion-panel">
          <div className="source-symbol">
            <Radio size={25} />
          </div>
          <h2>Simular uma entrada</h2>
          <span className="small-pill amber-pill">
            Dado fictício · demonstração
          </span>
          <p>
            Gere um cenário prioritário e veja validação estrutural,
            classificação, persistência local e notificação acontecerem em
            sequência.
          </p>
          <label>
            Origem simulada
            <select
              value={sensor}
              onChange={(e) => setSensor(e.target.value as Source)}
            >
              <option value="SENSOR">Sensor de alagamento</option>
              <option value="PUBLIC">Boletim público de calor</option>
            </select>
          </label>
          <button className="button" onClick={simulate} disabled={loading}>
            <Plus size={17} />
            Gerar leitura simulada
          </button>
          <small>Não há dispositivos reais conectados.</small>
        </section>
      </div>
      <section className="panel">
        <PanelTitle
          title="Últimas entradas"
          subtitle={`${data.events.length} registros armazenados localmente`}
        />
        {[...data.events]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 4)
          .map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
      </section>
    </>
  );
}
function download(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Analytics() {
  const { data, now } = useStore();
  const active = data.events.filter(isActive);
  const bySource = Object.keys(sources) as Source[];
  function exportCsv() {
    const rows = [
      [
        "id",
        "titulo",
        "tipo",
        "bairro",
        "origem",
        "confianca",
        "simulado",
        "estado",
        "prioridade",
        "observado_em",
      ],
      ...data.events.map((e) => [
        e.id,
        e.title,
        types[e.type],
        e.neighborhood,
        sources[e.source],
        confidence[e.source],
        e.simulated,
        states[e.state],
        analyze(e, now).score,
        e.observedAt,
      ]),
    ];
    const escape = (v: unknown) =>
      `"${String(v)
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""')}"`;
    download(
      "urbanrisk-eventos.csv",
      "\uFEFF" + rows.map((r) => r.map(escape).join(";")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  return (
    <>
      <Heading
        title="Sinais que ajudam a decidir"
        subtitle="Uma leitura descritiva dos registros desta sessão, sem previsão de desastres."
      >
        <button className="button" onClick={exportCsv}>
          <Download size={16} />
          Exportar CSV
        </button>
      </Heading>
      <div className="two-columns">
        <section className="panel chart-panel">
          <PanelTitle
            title="Prioridade dos eventos ativos"
            subtitle={`${active.length} eventos em acompanhamento`}
          />
          {["Crítico", "Alto", "Moderado", "Baixo"].map((level, i) => {
            const count = active.filter(
              (e) => analyze(e, now).level === level,
            ).length;
            return (
              <div className="chart-row" key={level}>
                <span>{level}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill level-${i}`}
                    style={{
                      width: `${active.length ? (count / active.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            );
          })}
          <p className="footnote">
            Pontuação recalculada por recência. Estado final tem prioridade zero
            e sai desta distribuição.
          </p>
        </section>
        <section className="panel chart-panel">
          <PanelTitle
            title="Composição das fontes"
            subtitle="Todos os registros, incluindo encerrados"
          />
          {bySource.map((s) => {
            const n = data.events.filter((e) => e.source === s).length;
            return (
              <div className="chart-row" key={s}>
                <span>{sources[s]}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${data.events.length ? (n / data.events.length) * 100 : 0}%` }}
                  />
                </div>
                <strong>{n}</strong>
              </div>
            );
          })}
          <p className="footnote">
            {data.events.filter((e) => e.simulated).length} simulados ·{" "}
            {data.events.filter((e) => !e.simulated).length} registros externos
            ou comunitários. Categorias não indicam validação real.
          </p>
        </section>
      </div>
      <section className="panel">
        <PanelTitle
          title="Acompanhamento por bairro"
          subtitle="A soma de pessoas estimadas pode repetir indivíduos; não é população única"
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bairro</th>
                <th>Eventos ativos</th>
                <th>Maior pontuação</th>
                <th>Pessoas estimadas*</th>
              </tr>
            </thead>
            <tbody>
              {neighborhoods.map((n) => {
                const events = active.filter((e) => e.neighborhood === n.name);
                return (
                  <tr key={n.name}>
                    <td>
                      <MapPin size={14} />
                      {n.name}
                    </td>
                    <td>{events.length}</td>
                    <td>
                      {Math.max(0, ...events.map((e) => analyze(e, now).score))}
                      /100
                    </td>
                    <td>
                      {events
                        .reduce((sum, e) => sum + e.people, 0)
                        .toLocaleString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="source-intro">
        <Info size={23} />
        <p>
          <strong>Qualidade do alerta precisa ser validada.</strong> Os dados
          demonstrativos não permitem medir precisão, falsos positivos ou
          impacto real. Esses indicadores exigem uma base rotulada e avaliação
          com agentes locais.
        </p>
      </div>
    </>
  );
}
export function Settings() {
  const { data, preferences, reset } = useStore();
  const [p, setP] = useState(data.preferences);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Heading
        title="Sua forma de acompanhar"
        subtitle="Preferências e dados ficam somente neste navegador."
      />
      <div className="form-grid">
        <form
          className="panel form-panel"
          onSubmit={(e) => {
            e.preventDefault();
            preferences(p);
          }}
        >
          <h2>Filtros da central</h2>
          <p>
            Na central de notificações, selecione “Aplicar minhas preferências”
            para usar estes filtros. Eles não impedem o registro de novos
            alertas.
          </p>
          <label>
            Bairro de interesse
            <select
              value={p.neighborhood}
              onChange={(e) => setP({ ...p, neighborhood: e.target.value })}
            >
              <option>Todos</option>
              {neighborhoods.map((n) => (
                <option key={n.name}>{n.name}</option>
              ))}
            </select>
          </label>
          <label>
            Prioridade mínima
            <select
              value={p.minScore}
              onChange={(e) => setP({ ...p, minScore: Number(e.target.value) })}
            >
              <option value={60}>Alta e crítica (≥ 60)</option>
              <option value={80}>Somente crítica (≥ 80)</option>
            </select>
          </label>
          <fieldset>
            <legend>Tipos de risco</legend>
            {Object.entries(types).map(([k, v]) => (
              <label className="check-inline" key={k}>
                <input
                  type="checkbox"
                  checked={p.categories.includes(k as RiskType)}
                  onChange={(e) =>
                    setP({
                      ...p,
                      categories: e.target.checked
                        ? [...p.categories, k as RiskType]
                        : p.categories.filter((t) => t !== k),
                    })
                  }
                />
                {v}
              </label>
            ))}
          </fieldset>
          <button className="button primary" type="submit">
            <Check size={16} />
            Salvar preferências
          </button>
        </form>
        <aside className="panel form-panel">
          <h2>Gerenciar a demonstração</h2>
          <p>
            Exporte os registros antes de restaurar. O arquivo contém os textos
            digitados: evite informações pessoais.
          </p>
          <button
            className="button"
            onClick={() =>
              download(
                "urbanrisk-sessao.json",
                JSON.stringify(data, null, 2),
                "application/json",
              )
            }
          >
            <Download size={16} />
            Exportar dados da sessão
          </button>
          <div className="aside-separator" />
          <h3>Restaurar os dados de exemplo</h3>
          <p>
            Substitui os registros, notificações e preferências deste navegador
            pelos cenários iniciais.
          </p>
          {!confirm ? (
            <button className="button danger" onClick={() => setConfirm(true)}>
              <RefreshCw size={16} />
              Restaurar demonstração
            </button>
          ) : (
            <div className="error-box">
              <strong>Restaurar os dados locais?</strong>
              <p>Faça uma exportação se quiser preservar esta sessão.</p>
              <div className="button-row">
                <button
                  className="button danger"
                  onClick={() => {
                    reset();
                    setP({
                      neighborhood: "Todos",
                      minScore: 60,
                      categories: ["FLOOD", "HEAT", "SERVICE"],
                    });
                    setConfirm(false);
                  }}
                >
                  Confirmar restauração
                </button>
                <button className="button" onClick={() => setConfirm(false)}>
                  <X size={15} />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
export function About() {
  return (
    <>
      <Heading
        title="Tecnologia para cuidar da cidade"
        subtitle="Urban Risk Intelligence Platform · Engenharia de Software · Global Solution 2026.2"
      />
      <div className="about-hero">
        <span className="brand-mark">
          <Activity size={34} />
        </span>
        <div>
          <h2>Entender o risco é o primeiro passo.</h2>
          <p>
            Reunimos sinais de sensores, bases públicas e relatos comunitários
            em uma visão que explica suas prioridades. O objetivo é apoiar
            moradores e agentes locais, com transparência sobre cada informação.
          </p>
        </div>
      </div>
      <div className="two-columns">
        <section className="panel prose">
          <h2>Escopo do protótipo</h2>
          <p>
            Aplicação web funcional com processamento no navegador e
            armazenamento local. Os cenários iniciais e sensores são simulados.
            A consulta opcional ao Open-Meteo traz uma estimativa meteorológica
            externa.
          </p>
          <p>
            “Confirmado” representa uma etapa do fluxo demonstrativo, sem
            confirmação oficial. As ações do agente são abertas para permitir a
            avaliação acadêmica.
          </p>
          <h3>Limites de operação</h3>
          <p>
            Não há banco compartilhado, autenticação, integração com Defesa
            Civil, monitoramento contínuo, push remoto ou atendimento
            emergencial. Uma implantação de produção exige os controles
            descritos na arquitetura proposta.
          </p>
        </section>
        <section className="panel prose">
          <h2>Dados e privacidade</h2>
          <p>
            Não solicitamos cadastro, CPF, telefone ou localização do
            dispositivo. O relato usa o centro aproximado de um bairro. Campos
            livres podem conter dados pessoais por erro; não os inclua.
          </p>
          <p>
            Registros e preferências ficam no localStorage deste navegador, sem
            envio a uma API própria. A importação meteorológica transmite
            somente a coordenada pública fixa da Sé ao Open-Meteo; o provedor
            recebe os metadados normais da conexão.
          </p>
          <p>
            Você pode exportar ou substituir os registros em Preferências. A
            retenção local dura até a limpeza do navegador; não existe exclusão
            automática.
          </p>
          <Link className="text-link" to="/preferencias">
            Gerenciar meus dados locais <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section className="panel prose">
        <h2>Equipe</h2>
        <div className="team">
          <div>
            <strong>João Viviani Baldini</strong>
            <span>RM 558596</span>
          </div>
          <div>
            <strong>Giuliano Ferreira Venceslau</strong>
            <span>RM 558674</span>
          </div>
          <div>
            <strong>Enrico Nikolay Meirelles Zeronian</strong>
            <span>RM 558557</span>
          </div>
        </div>
        <a
          className="text-link"
          href="https://github.com/joao-baldini/GS2-Engenharia-de-Software"
          target="_blank"
          rel="noreferrer"
        >
          Repositório do projeto <ExternalLink size={14} />
        </a>
      </section>
    </>
  );
}
export function NotFound() {
  return (
    <>
      <Heading
        title="Página não encontrada"
        subtitle="O endereço pode ter mudado ou o evento não existe neste navegador."
      />
      <Empty
        title="Vamos retomar o caminho?"
        copy="Os registros de cada navegador são independentes."
      >
        <Link className="button primary" to="/">
          Voltar à visão geral
        </Link>
      </Empty>
    </>
  );
}
