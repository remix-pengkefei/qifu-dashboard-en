# 奇富科技 · 4 号主控网站 Demo

奇富展厅第二篇章「实时金融作战平台」可运行 Web Demo。打开即运行的单页应用。

## 启动

```bash
npm install
npm run dev
```

访问 `http://127.0.0.1:5173/`

## 功能

- 三模式：**总览态 / 银行态 / 智能体态**
- 默认进入总览态，无 landing 页
- 三栏布局：左事件流 / 中主战情区 / 右状态区 + 底部模式切换条
- 模拟实时数据：事件流 800–1500ms 一条；指标每 2.4s 波动；时钟每秒
- 桌面优先（≥1366px），平板/手机自动重排为单列堆叠

## 模式说明

### 总览态
- 中国主地图（GeoJSON 渲染 35 省 / 直辖市 / 自治区）
- 全球外环弧线 6 条（东京 / 新加坡 / 伦敦 / 纽约 / 迪拜 / 法兰克福）
- 国内主链路 26 条流光
- 城市节点分 4 级：核心金融 / 区域运营 / 产业场景 / 国际映射

### 银行态
- 中央 QFIN 智能体服务中枢
- 12 家合作银行椭圆环绕（浦发/光大/江苏/广州/盛京/南海农商/中原消金/邮储/佛山农商/南京/北京/杭州）
- 银行 → 中枢 调用链路 + 银行 → 产业/小微 放贷链路

### 智能体态
- 中央 QFIN 智能体作战中枢
- 6 个智能体环绕：AI 审批官 / 风控助手 / 合规助手 / 营销助手 / 贷后助手 / 服务助手
- 中枢 → 智能体 任务分发 + 智能体 → 输入源 调用回传

## 目录

```
src/
├── App.tsx                  # 三栏 + 底部 + 三模式 stage
├── store/AppContext.tsx     # 状态 + tick 引擎
├── engine/
│   ├── eventGen.ts          # 事件生成器
│   └── random.ts            # 工具
├── data/
│   ├── banks.ts             # 12 家银行
│   ├── agents.ts            # 6 个智能体
│   ├── regions.ts           # 33 个城市节点
│   └── scenes.ts            # 业务场景模板
├── components/
│   ├── Header/              # 顶部 Logo + 标题 + 时钟
│   ├── EventStream/         # 左侧事件流
│   ├── StatusPanel/         # 右侧状态区（运行总览 + 智能体 + 风险）
│   ├── ModeBar/             # 底部模式切换
│   ├── ChinaMap/            # 总览态中区
│   ├── BankNetwork/         # 银行态中区
│   └── AgentHub/            # 智能体态中区
└── styles/
    ├── tokens.css           # CSS 变量（颜色、字体、布局）
    └── globals.css          # 全局基础样式 + 关键帧动画
public/geo/china.json        # 中国 GeoJSON（DataV.GeoAtlas）
```

## 技术栈

- Vite 5 + React 18 + TypeScript
- d3-geo（中国地图墨卡托投影）
- 纯 SVG + CSS 动画（无 WebGL，无重型图表库）

## 测试报告

详见 `tests/test-report.md`
