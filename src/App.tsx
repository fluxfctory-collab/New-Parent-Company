import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ServiceSelector } from "./components/ServiceSelector";

/**
 * Where the legacy QME link sits. The document says both "top right corner" and
 * "stays where it is, separate and below" — see HANDOVER.md. One-line switch.
 */
export type QmePlacement = "header" | "below-selector";
export const qmePlacement: QmePlacement = "header";

export function App() {
  return (
    <>
      <Header showQme={qmePlacement === "header"} />
      <main>
        <Hero />
        <ServiceSelector showQme={qmePlacement === "below-selector"} />
      </main>
      <Footer />
    </>
  );
}
