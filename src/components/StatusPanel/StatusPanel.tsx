import { useApp } from "../../store/AppContext";
import "./StatusPanel.css";

const fmt = (n: number) => n.toLocaleString();

const sparkUrlForLoad = (load: number, status: string): string => {
  if (status === "busy") return "/assets/sparklines/spark-uptrend.svg";
  if (status === "calm") return "/assets/sparklines/spark-stable.svg";
  if (load > 70) return "/assets/sparklines/spark-volatile.svg";
  return "/assets/sparklines/spark-pulse.svg";
};

export const StatusPanel = () => {
  const { agents } = useApp();
  return (
    <aside className="sp">
      <section className="sp-card sp-agents">
        <div className="sp-card-h">
          <span className="sp-bar" />
          AI 智能体
          <span className="sp-card-r">{agents.length} 在岗</span>
        </div>
        <div className="sp-agent-grid">
          {agents.map((a) => (
            <div key={a.id} className={`ag ag-${a.status}`}>
              <div className="ag-h">
                <img className="ag-icon" src={`/assets/agents/agent-${a.id}.svg`} alt="" />
                <div className="ag-name">{a.name}</div>
                <img
                  className="ag-status-ic"
                  src={`/assets/status/status-${a.status === "busy" ? "busy" : a.status === "calm" ? "calm" : "running"}.svg`}
                  alt=""
                />
              </div>
              <div className="ag-tasks num">
                {fmt(a.tasks)}
                <em>任务</em>
              </div>
              <img className="ag-spark" src={sparkUrlForLoad(a.load, a.status)} alt="" />
              <div className="ag-bar-meta num">
                <span>{a.load}%</span>
                <span className="ag-bar-meta-r">
                  {a.status === "busy" ? "高负载" : a.status === "calm" ? "空闲中" : "运行中"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};
