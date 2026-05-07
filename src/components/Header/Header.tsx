import { useApp } from "../../store/AppContext";
import "./Header.css";

const KPIS_FIXED = [
  { label: "服务省份", value: "26", unit: "" },
  { label: "服务城市", value: "70", unit: "" },
  { label: "海外合作", value: "4", unit: "国" },
];

export const Header = () => {
  const { clock, date, metrics, agents } = useApp();
  return (
    <header className="hdr">
      {/* 左：Logo */}
      <div className="hdr-l">
        <img src="/assets/logo/qifu-official.png" alt="奇富科技" className="hdr-logo-img" />
        <span className="hdr-l-tag">奇富科技</span>
      </div>

      {/* 中：运行总览核心数据（紧贴 Logo 之后） */}
      <div className="hdr-kpis">
        <div className="hdr-kpi">
          <span className="hdr-kpi-label">活跃机构</span>
          <span className="hdr-kpi-value num">{metrics.activeOrgs}</span>
        </div>
        <div className="hdr-kpi">
          <span className="hdr-kpi-label">智能体在岗</span>
          <span className="hdr-kpi-value num">{agents.length}</span>
        </div>
        {KPIS_FIXED.map((k) => (
          <div className="hdr-kpi" key={k.label}>
            <span className="hdr-kpi-label">{k.label}</span>
            <span className="hdr-kpi-value num">
              {k.value}
              {k.unit && <em>{k.unit}</em>}
            </span>
          </div>
        ))}
      </div>

      {/* 右：状态 + 时钟 */}
      <div className="hdr-r">
        <span className="hdr-stat">
          <i className="dot" /> 系统在线
        </span>
        <span className="hdr-clock num">
          <span className="hdr-date">{date}</span>
          <span className="hdr-time">{clock}</span>
        </span>
      </div>
    </header>
  );
};
