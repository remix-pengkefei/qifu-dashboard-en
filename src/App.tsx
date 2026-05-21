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
        {/* Left: Map */}
        <section className="col-c">
          <ChinaMap />
        </section>

        {/* Right: 235 Bank Cloud + 4 AI Agents */}
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
