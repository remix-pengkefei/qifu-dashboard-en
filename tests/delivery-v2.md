# 4 号主控网站 Demo · 第二轮交付

交付时间：2026-04-27 22:00
版本：v0.2 — 完整接入 GPT 出的全套视觉资产

---

## 一、本地运行

```bash
cd "/Users/fly/Desktop/奇富展厅/07_4号主控网站Demo"
npm run dev
```

访问：**http://127.0.0.1:5173/**

无 landing 页，打开即进入「总览态」运行状态。

---

## 二、相比第一轮的关键差异

| 维度 | v0.1（第一轮） | v0.2（本轮） |
|---|---|---|
| 中国地图 | GeoJSON 描边图 | **卫星夜光 PNG（china-map-glow）** |
| 全球外环 | CSS 虚线圆 | **global-orbit.png 装饰圈** |
| 银行 Logo | 色块 + 汉字占位 | **12 张定制 SVG 卡片（bank-*.svg）** |
| 智能体头像 | 通用 SVG path | **6 张定制 agent SVG** |
| 中央枢纽 | 平面圆 | **hub-bank.png / hub-agent.png 立体图** |
| 行业图标 | 字符方块 | **16 个场景 SVG（scene-*.svg）** |
| 状态指示器 | CSS 圆点 | **status-running/busy/calm/error.svg** |
| 智能体卡 sparkline | 无 | **5 种 spark SVG** |
| 智能体态侧边图 | 无 | **wave-realtime / wave-structured** |
| 风险评分环 | 单 SVG 圆 | **risk-gauge-frame 仪表盘外框** |
| 模式按钮图标 | code 画 SVG path | **mode-overview/bank/agent.svg** |
| 全局背景 | CSS gradient | **bg-starfield.jpg + 暗角叠加** |
| QFIN Logo | 文字 | **qifu-logo-full.svg** |
| 卡片角标 | CSS 边线 | **card-corner-bracket.svg** |
| 银行态布局 | 单中心椭圆环 | **多战线并行 — 左 6 / 右 6 银行 + 中枢 + 场景柱** |

---

## 三、改动的文件清单

### 新增（数据/工具）
- `src/data/sceneIcons.ts` — 场景文案 → SVG 文件映射

### 重写（核心组件）
- `src/components/Header/Header.tsx` + `Header.css` — 用 qifu-logo-full.svg
- `src/components/ModeBar/ModeBar.tsx` + `ModeBar.css` — 用 mode-*.svg
- `src/components/EventStream/EventStream.tsx` + `EventStream.css` — 接入 scene + status + alert-hex 图标
- `src/components/StatusPanel/StatusPanel.tsx` + `StatusPanel.css` — 接入 agents SVG + sparklines + status-icons + risk-gauge-frame
- `src/components/ChinaMap/ChinaMap.tsx` + `ChinaMap.css` — **重写**为 PNG 底图 + SVG 节点叠层
- `src/components/BankNetwork/BankNetwork.tsx` + `BankNetwork.css` — **重写**为多战线并行布局
- `src/components/AgentHub/AgentHub.tsx` + `AgentHub.css` — **重写**为编队中枢 + 任务分发 + 调用回传，含两侧 wave 图

### 修改
- `src/App.tsx` — 中区四角额外角标
- `src/App.css` — 全局加 bg-starfield + 中区四角 card-corner-bracket
- `public/assets/scenes/scene-*.svg` (×16) — 修正 viewBox `0 0 64 64` → `0 0 256 256`
- `public/assets/banks/bank-*.svg` (×12) — 调整 viewBox `0 0 256 256` → `0 40 256 160` 以匹配 1.6:1 卡片比例

---

## 四、本轮使用的资产清单（59 个文件全部接入）

### P0 必须（52 个）
- ✅ `maps/china-map-glow.png` — 总览态主图
- ✅ `maps/global-orbit.png` — 总览态外环装饰
- ✅ `banks/bank-{12 家}.svg` — 银行态卡片
- ✅ `agents/agent-{6 个}.svg` — 智能体态节点 + 右侧状态卡
- ✅ `hubs/hub-bank.png` — 银行态中枢
- ✅ `hubs/hub-agent.png` — 智能体态中枢
- ✅ `scenes/scene-{16 个}.svg` — 银行态场景柱 + 事件流图标
- ✅ `logo/qifu-logo-full.svg` — Header 主 Logo
- ✅ `sparklines/spark-{5 种}.svg` — 智能体卡 mini 趋势图
- ✅ `waves/wave-realtime.svg` + `wave-structured.svg` — 智能体态左右图
- ✅ `status/status-{4 状态}.svg` — 智能体卡 + 事件流
- ✅ `alert-hex.svg` — 事件流风险条目

### P1 建议（7 个）
- ✅ `risk-gauge-frame.svg` — 右侧风险评分环外框
- ✅ `modes/mode-{3 种}.svg` — 底部模式按钮
- ✅ `card-corner-bracket.svg` — 中区四角装饰
- ✅ `bg-starfield.jpg` — 全局背景

未直接使用：
- `link-flow-particle.png`：当前用 SVG strokeDasharray 实现流光效果，性能更好。可以后期再替换。
- `logo/qifu-logo-mark.svg`：备用，hubs 内已自带"核心点"，暂未在视觉中央替换。

---

## 五、三个模式的视觉差异（核心保证）

### 总览态
- 主体：发光中国地图 + 全球轨道环
- 6 条全球弧线连出"东京 / 新加坡 / 伦敦 / 纽约 / 迪拜 / 法兰克福"绿色国际节点
- 国内 33 个城市节点 4 级分层脉冲
- 26 条主链路青蓝流光
- 底部 5 个核心数字

### 银行态
- **没有**中国地图
- 12 家真实银行卡片，左 6 / 右 6 垂直分列
- 中央 hub-bank.png 智能体服务中枢
- 中下方 8 个产业 / 客群场景图标横列
- 多链路并行：银行 → 中枢（青蓝）+ 银行 → 场景（绿色）+ 中枢 → 场景（淡蓝）
- 底部 6 个数字 + 顶部双角标

### 智能体态
- **没有**中国地图，**没有**银行 Logo 主体
- 中央 hub-agent.png 编队作战中枢
- 6 个智能体节点环绕（用 agent-*.svg）
- 左右两块 wave 图（实时数据 / 结构化数据）
- 输入源条带：左 4 银行类型 / 右 4 客户类型
- 双向链路：中枢 → 智能体（任务分发）+ 智能体 → 输入源（调用回传，绿色）
- 底部 6 个智能体执行能力柱 + 4 个数字 stat

---

## 六、视觉验证截图

| 模式 | 1920×1080 | 移动端 |
|---|---|---|
| 总览 | 已截 | 已截 |
| 银行 | 已截 | （单列堆叠 mode-bar 粘底） |
| 智能体 | 已截 | （wave 图自动隐藏） |

控制台无报错，60 个素材网络请求 0 失败。

---

## 七、还需要你补的内容（如果有）

到目前为止 **不需要再补**，所有素材都用上了。

如果后续想升级，几个可选方向：
1. **银行真实彩色 Logo**：当前 SVG 是"近似 Logo 卡片"风格（带英文行号 + 中文行名 + 配色 + 抽象图标）。如果有官方 Logo PNG/SVG 文件，可以直接替换 `public/assets/banks/`。
2. **中国地图局部高亮**：china-map-glow.png 是固定全国版。如果想做"按区域亮"（比如华东时只华东亮），需要分省 PNG 切片。
3. **智能体态数据曲线动起来**：wave-realtime.svg 现在是静态图。如果想要真正的流动波形，可以前端逐帧渲染，但 demo 阶段不必要。

---

## 八、给老板演示的口径建议

- 默认进入「总览态」，10 秒不动作不要打断
- 强调：地图节点脉冲 = 全国实时业务 / 全球弧线 = 国际协同 / 5 个数字 = 当日量化结果
- 切到「银行态」：12 家真实合作银行 + 智能体服务调度 + 多业务场景并行
- 切到「智能体态」：6 个智能体编队执行 + 实时调用 + 数据回传
- 三态切换都不重置时钟和指标，"系统一直在跑"
