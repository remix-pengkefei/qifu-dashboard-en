import { Header } from "./components/Header/Header";
import { ChinaMap } from "./components/ChinaMap/ChinaMap";
import { LiveBusiness } from "./components/LiveBusiness/LiveBusiness";
import { BankCloud } from "./components/BankCloud/BankCloud";
import { AppProvider } from "./store/AppContext";
import "./App.css";

const Shell = () => {
  return (
    <div className="app">
      <Header />
      <LiveBusiness />
      <main className="main">
        {/* 左：地图 */}
        <section className="col-c">
          <ChinaMap />
        </section>

        {/* 右：235 家银行词云 + 4 大智能体 */}
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
