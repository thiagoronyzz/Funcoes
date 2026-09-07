import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Manifesto from "./components/Manifesto";
import CategorySection from "./components/CategorySection";
import DownloadSection from "./components/DownloadSection";
import { BarraInstalarMobile } from "./components/InstallApp";
import Footer from "./components/Footer";
import { categorias } from "./data/apps";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper font-body text-ink">
      <div className="grain" aria-hidden />
      <Cursor />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        {categorias.map((categoria, i) => (
          <CategorySection key={categoria.id} categoria={categoria} indice={i} />
        ))}
        <DownloadSection />
      </main>
      <Footer />
      <BarraInstalarMobile />
    </div>
  );
}
