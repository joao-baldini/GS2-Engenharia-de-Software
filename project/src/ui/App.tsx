import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  CircleHelp,
  Database,
  LayoutDashboard,
  ListFilter,
  Menu,
  Plus,
  Radio,
  Settings2,
  Shield,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "../application/store";
import {
  Dashboard,
  Alerts,
  Detail,
  Notifications,
  Report,
  Sources,
  Ingestion,
  Analytics,
  Settings,
  About,
  NotFound,
} from "./pages";
const nav = [
  ["/", "Visão geral", LayoutDashboard],
  ["/alertas", "Eventos e alertas", ListFilter],
  ["/notificacoes", "Notificações", Bell],
  ["/analises", "Análises", ChartNoAxesCombined],
  ["/fontes", "Fontes e confiança", Database],
  ["/ingestao", "Entrada de dados", Radio],
] as const;
export default function App() {
  const { data, warning, message } = useStore();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(
    window.matchMedia("(max-width: 720px)").matches,
  );
  const [online, setOnline] = useState(navigator.onLine);
  const location = useLocation();
  const unread = data.notices.filter((n) => !n.read).length;
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus();
  }, [location.pathname]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const menu = document.querySelector<HTMLElement>(".sidebar");
    const focusable = () =>
      Array.from(menu?.querySelectorAll<HTMLElement>("a,button") ?? []);
    focusable()[0]?.focus();
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        document.querySelector<HTMLElement>(".mobile-menu")?.focus();
      }
      if (event.key === "Tab") {
        const items = focusable();
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keydown);
    };
  }, [open, mobile]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <div className="app">
      <a href="#main" className="skip">
        Pular para o conteúdo
      </a>
      {open && (
        <button
          className="nav-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Fechar navegação"
        />
      )}
      <aside
        inert={mobile && !open}
        className={`sidebar ${open ? "is-open" : ""}`}
      >
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Activity size={25} />
          </span>
          <span>
            urbanrisk
            <span className="brand-sub">Inteligência para a cidade</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X />
        </button>
        <nav aria-label="Navegação principal">
          {nav.map(([path, label, I]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <I size={19} />
              {label}
              {path === "/notificacoes" && unread > 0 && (
                <span className="nav-count">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <Link className="sidebar-register" to="/registrar">
          <Plus size={17} /> Registrar ocorrência
        </Link>
        <div className="sidebar-bottom">
          <div className="pilot">
            <span className="pilot-icon">
              <Shield size={19} />
            </span>
            <strong>Cidades mais resilientes</strong>
            <p>Informação compreensível para decisões mais conscientes.</p>
            <Link to="/sobre">
              Conheça o projeto <ArrowUpRight size={14} />
            </Link>
          </div>
          <nav aria-label="Navegação complementar">
            <NavLink to="/preferencias">
              <Settings2 size={18} />
              Preferências
            </NavLink>
            <NavLink to="/sobre">
              <CircleHelp size={18} />
              Sobre e privacidade
            </NavLink>
          </nav>
          <div className="workspace">
            <span className="workspace-avatar">SP</span>
            <div>
              <strong>Área piloto</strong>
              <span>São Paulo, Brasil</span>
            </div>
            <span className="dot green" />
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={mobile && open}>
        <header className="topbar">
          <div className="top-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Abrir menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span className="top-context">Monitoramento urbano</span>
            <span className="prototype">Protótipo acadêmico</span>
          </div>
          <div className="top-right">
            <span className="local-status">
              <span className={`dot ${online ? "green" : "amber"}`} />
              {online ? "Sessão local" : "Sem internet"}
            </span>
            <Link
              to="/notificacoes"
              className="bell icon-button"
              aria-label={`Notificações, ${unread} não lidas`}
            >
              <Bell size={21} />
              {unread > 0 && <i />}
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {!online && (
            <div className="notice-banner">
              Você está sem internet. Os dados salvos continuam disponíveis
              nesta página. Importar a fonte pública exige conexão.
            </div>
          )}
          {warning && (
            <div className="notice-banner" role="alert">
              {warning}
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alertas" element={<Alerts />} />
            <Route path="/alertas/:id" element={<Detail />} />
            <Route path="/notificacoes" element={<Notifications />} />
            <Route path="/registrar" element={<Report />} />
            <Route path="/fontes" element={<Sources />} />
            <Route path="/ingestao" element={<Ingestion />} />
            <Route path="/analises" element={<Analytics />} />
            <Route path="/preferencias" element={<Settings />} />
            <Route path="/sobre" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <footer className="page-footer">
            <span>UrbanRisk · Global Solution 2026.2</span>
            <span>Demonstração educacional. Consulte fontes oficiais.</span>
          </footer>
        </main>
      </div>
      <div
        className={`toast ${message ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}
