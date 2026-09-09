import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Features from "./components/Features";
import CategorySection from "./components/CategorySection";
import Faq from "./components/Faq";
import DownloadSection from "./components/DownloadSection";
import { BarraInstalarMobile } from "./components/InstallApp";
import Footer from "./components/Footer";
import { categorias } from "./data/apps";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-body text-ink">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Features />
        {categorias.map((categoria) => (
          <CategorySection key={categoria.id} categoria={categoria} />
        ))}
        <Faq />
        <DownloadSection />
      </main>
      <Footer />
      <BarraInstalarMobile />
    </div>
  );
}
