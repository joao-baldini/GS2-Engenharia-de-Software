import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { load, save } from "../data/repository";
import { seed } from "../data/seed";
import {
  noticeFor,
  transition,
  type EventState,
  type Preferences,
  type RiskEvent,
  type Snapshot,
} from "../domain/model";
interface Store {
  data: Snapshot;
  now: number;
  warning: string;
  message: string;
  add: (event: RiskEvent) => void;
  move: (id: string, state: EventState) => void;
  read: (id?: string) => void;
  preferences: (p: Preferences) => void;
  reset: () => void;
  toast: (s: string) => void;
}
const Context = createContext<Store | null>(null);
const initial = load();
export function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initial.snapshot);
  const [warning, setWarning] = useState(initial.warning);
  const [message, toast] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!save(data))
      setWarning(
        "Não foi possível salvar neste navegador. Mantenha a página aberta para preservar esta sessão.",
      );
  }, [data]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => toast(""), 6000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === "urbanrisk-es:v1" && e.newValue) {
        const next = load();
        setData(next.snapshot);
        setWarning(next.warning);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function add(event: RiskEvent) {
    if (data.events.length >= 500)
      throw new Error(
        "Limite demonstrativo de 500 eventos atingido. Exporte os dados e restaure a demonstração.",
      );
    if (
      event.source === "PUBLIC" &&
      event.sourceName.startsWith("Open-Meteo") &&
      data.events.some(
        (e) =>
          e.sourceName === event.sourceName &&
          e.observedAt === event.observedAt,
      )
    )
      throw new Error(
        "Esta leitura já foi importada. Aguarde uma nova observação da fonte.",
      );
    const notice = noticeFor(event);
    setData((d) => ({
      ...d,
      events: [event, ...d.events],
      notices: notice ? [notice, ...d.notices].slice(0, 500) : d.notices,
      updatedAt: new Date().toISOString(),
    }));
    toast(
      event.state === "REPORTED"
        ? "Relato registrado. Aguardando validação demonstrativa."
        : "Leitura processada. Painel e central atualizados.",
    );
  }
  function move(id: string, state: EventState) {
    const event = data.events.find((e) => e.id === id);
    if (!event) throw new Error("Evento não encontrado.");
    const next = transition(event, state);
    const notice = noticeFor(next);
    setData((d) => ({
      ...d,
      events: d.events.map((e) => (e.id === id ? next : e)),
      notices:
        notice && !d.notices.some((n) => n.eventId === id)
          ? [notice, ...d.notices].slice(0, 500)
          : d.notices,
      updatedAt: new Date().toISOString(),
    }));
    toast("Estado do evento atualizado.");
  }
  return (
    <Context.Provider
      value={{
        data,
        now,
        warning,
        message,
        add,
        move,
        toast,
        read: (id) =>
          setData((d) => ({
            ...d,
            notices: d.notices.map((n) =>
              !id || n.id === id ? { ...n, read: true } : n,
            ),
          })),
        preferences: (p) => {
          setData((d) => ({ ...d, preferences: p }));
          toast("Preferências salvas neste navegador.");
        },
        reset: () => {
          setData(seed());
          setNow(Date.now());
          toast("Demonstração restaurada.");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("Provider ausente");
  return store;
}
