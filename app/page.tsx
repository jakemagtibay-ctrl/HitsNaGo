import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { ServiceCards } from "@/components/landing/service-cards"
import { CityMapSection } from "@/components/landing/city-map-section"
import { TrustSection } from "@/components/landing/trust-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { WhyHitsNaGo } from "@/components/landing/why-hitsnago"
import { PartnerSection } from "@/components/landing/partner-section"
import { CtaSection } from "@/components/landing/cta-section"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ServiceCards />
        <CityMapSection />
        <TrustSection />
        <HowItWorks />
        <WhyHitsNaGo />
        <PartnerSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
