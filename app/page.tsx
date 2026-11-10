import LandingFX from "@/components/landing/LandingFX";
import PhoneQR from "@/components/landing/PhoneQR";
import {
  Audience,
  Channels,
  Extras,
  Faq,
  Features,
  FinalCta,
  Footer,
  ForClients,
  GrowScene,
  Hero,
  Ladder,
  Nav,
  Numbers,
  Safety,
} from "@/components/landing/sections";

// Leash home: a chaptered, scroll-driven page. White chapters for detail, sky chapters for big ideas,
// a navy chapter for the client side. Everything shown is the real product.
// Each chapter lives in components/landing/sections; LandingFX wires up the scroll and tab behaviour.
export default function Home() {
  return (
    <div className="lp" data-aud="pro">
      <LandingFX />
      <Nav />
      <Hero />
      <GrowScene />
      <Features />
      <Channels />
      <Numbers />
      <Ladder />
      <Safety />
      <ForClients />
      <Extras />
      <Audience />
      <Faq />
      <FinalCta />
      <PhoneQR />
      <Footer />
    </div>
  );
}
