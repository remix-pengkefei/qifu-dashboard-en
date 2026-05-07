import { Header } from "./components/Header/Header";
import { EventStream } from "./components/EventStream/EventStream";
import { ChinaMap } from "./components/ChinaMap/ChinaMap";
import { LiveBusiness } from "./components/LiveBusiness/LiveBusiness";
import { BankCloud } from "./components/BankCloud/BankCloud";
import { AppProvider } from "./store/AppContext";
import "./App.css";

const Shell = () => {
  return (
    <div className="app">
      <Header />
      <main className="main">
        {/* 左：事件流 */}
        <section className="col-l panel">
          <EventStream />
        </section>

        {/* 中：上为地图，下为业务实时进展 */}
        <section className="col-c">
          <div className="col-c-top">
            <ChinaMap />
          </div>
          <div className="col-c-bottom">
            <LiveBusiness />
          </div>
        </section>

        {/* 右：167 家银行词云 + 4 大智能体 */}
        <section className="col-r">
          <BankCloud />
        </section>
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
};
