import BiographySection from "../landing/sections/BiographySection";
import CtaSection from "../landing/sections/CtaSection";
import FamilySpaceSection from "../landing/sections/FamilySpaceSection";
import FamilyTreeSection from "../landing/sections/FamilyTreeSection";
import Footer from "../landing/sections/Footer";
import HeroSection from "../landing/sections/HeroSection";
import Navbar from "../landing/sections/Navbar";
import ProblemSection from "../landing/sections/ProblemSection";
import RelationshipSection from "../landing/sections/RelationshipSection";
import TimelineSection from "../landing/sections/TimelineSection";

export const LandingPage = () => {
  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-bg font-body text-ink selection:bg-sage-light selection:text-primary">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FamilySpaceSection />
      <FamilyTreeSection />
      <BiographySection />
      <RelationshipSection />
      <TimelineSection />
      <CtaSection />
      <Footer />
    </main>
  );
};
