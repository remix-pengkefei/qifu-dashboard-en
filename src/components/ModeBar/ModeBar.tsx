import { useApp } from "../../store/AppContext";
import type { Mode } from "../../engine/eventGen";
import "./ModeBar.css";

const MODES: { id: Mode; label: string; en: string; icon: string }[] = [
  { id: "overview", label: "Overview", en: "OVERVIEW", icon: "/assets/modes/mode-overview.svg" },
  { id: "bank", label: "Bank", en: "BANK NETWORK", icon: "/assets/modes/mode-bank.svg" },
  { id: "agent", label: "Agent", en: "AGENT FLEET", icon: "/assets/modes/mode-agent.svg" },
];

export const ModeBar = () => {
  const { mode, setMode } = useApp();
  return (
    <nav className="mb">
      <div className="mb-bg" />
      <div className="mb-rail-wrap">
        <div className="mb-deco mb-deco-l" />
        <div className="mb-rail">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                className={`mb-btn ${active ? "on" : ""}`}
                onClick={() => setMode(m.id)}
                aria-pressed={active}
              >
                <span className="mb-corner mb-tl" />
                <span className="mb-corner mb-tr" />
                <span className="mb-corner mb-bl" />
                <span className="mb-corner mb-br" />
                <img className="mb-icon" src={m.icon} alt="" />
                <div className="mb-text">
                  <span className="mb-label">{m.label}</span>
                  <span className="mb-en">{m.en}</span>
                </div>
                {active && <span className="mb-glow" />}
              </button>
            );
          })}
        </div>
        <div className="mb-deco mb-deco-r" />
      </div>
      <div className="mb-side num">MODE SELECT</div>
    </nav>
  );
};
