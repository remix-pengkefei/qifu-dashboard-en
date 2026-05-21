import { useApp } from "../../store/AppContext";
import type { LiveEvent } from "../../engine/eventGen";
import { sceneIconUrl } from "../../data/sceneIcons";
import "./EventStream.css";

const levelLabel: Record<LiveEvent["level"], string> = {
  normal: "Running",
  ok: "Completed",
  warn: "Reviewing",
  risk: "Risk Blocked",
};

const levelStatusIcon: Record<LiveEvent["level"], string> = {
  normal: "/assets/status/status-running.svg",
  ok: "/assets/status/status-running.svg",
  warn: "/assets/status/status-busy.svg",
  risk: "/assets/status/status-error.svg",
};

export const EventStream = () => {
  const { events, counters, mode } = useApp();
  return (
    <aside className="es panel">
      <span className="panel-corner tl" />
      <span className="panel-corner tr" />
      <span className="panel-corner bl" />
      <span className="panel-corner br" />

      <div className="es-head">
        <div className="es-title">
          <i className="es-bar" />
          Live Event Stream
        </div>
        <div className="es-tabs num">
          <span className="es-tab on">
            All <em>{counters.totalEvents.toLocaleString()}</em>
          </span>
          <span className="es-tab">
            Trade <em>{counters.trade}</em>
          </span>
          <span className="es-tab tab-warn">
            Risk <em>{counters.risk}</em>
          </span>
          <span className="es-tab">
            Service <em>{counters.service}</em>
          </span>
          <span className="es-tab tab-amber">
            Alert <em>{counters.alert}</em>
          </span>
        </div>
      </div>

      <div className="es-list" key={mode}>
        {events.map((e, i) => (
          <div
            key={e.id}
            className={`es-item lvl-${e.level}`}
            style={{ opacity: Math.max(0.4, 1 - i * 0.035) }}
          >
            <div className="es-time num">{e.time}</div>
            <div className="es-icon">
              {e.level === "risk" ? (
                <img src="/assets/alert-hex.svg" alt="" />
              ) : (
                <img src={sceneIconUrl(e.scene)} alt="" />
              )}
            </div>
            <div className="es-body">
              <div className="es-line1">
                {e.bank && (
                  <span
                    className="es-bank"
                    style={{ color: e.bankColor, borderColor: `${e.bankColor}66` }}
                  >
                    {e.bank}
                  </span>
                )}
                <span className="es-zone">{e.zone}</span>
              </div>
              <div className="es-line2">
                <span className="es-action">{e.action}</span>
                <span className="es-scene">· {e.scene}</span>
              </div>
            </div>
            <div className={`es-tag tag-${e.level}`}>
              <img src={levelStatusIcon[e.level]} alt="" className="es-tag-icon" />
              {levelLabel[e.level]}
            </div>
          </div>
        ))}
      </div>

      <div className="es-foot">
        <div className="es-scan" />
        <div className="es-foot-text">Data updates per second</div>
      </div>
    </aside>
  );
};
