import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Manifesto from "./components/Manifesto";
import AppCatalogHub from "./components/AppCatalogHub";
import DownloadSection from "./components/DownloadSection";
import { BarraInstalarMobile } from "./components/InstallApp";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-body text-ink">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        <AppCatalogHub />
        <DownloadSection />
      </main>
      <Footer />
      <BarraInstalarMobile />
    </div>
  );
}
