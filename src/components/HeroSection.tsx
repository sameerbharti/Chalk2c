import { motion } from "framer-motion";
import { ChalkDust } from "./ChalkDust";
import { Camera, MessageCircle, Brain, ArrowDown } from "lucide-react";
import chalkboardHero from "@/assets/chalkboard-hero.jpg";

export const HeroSection = () => {
  const scrollToUpload = () => {
    document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${chalkboardHero})` }}
      >
        <div className="absolute inset-0 bg-chalkboard/70" />
      </div>
      
      <ChalkDust />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-chalk text-6xl md:text-8xl lg:text-9xl text-foreground mb-6 tracking-wide">
            Chalk2Chat
          </h1>
          <p className="font-sans text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Turn your blackboard into an AI tutor
          </p>
          <p className="font-sans text-base md:text-lg text-chalk-dust/70 max-w-xl mx-auto mb-12">
            Snap a photo of classroom notes, and get instant answers grounded only in what was taught.
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          <FeaturePill icon={<Camera className="w-4 h-4" />} text="Photo Upload" />
          <FeaturePill icon={<Brain className="w-4 h-4" />} text="Smart OCR" />
          <FeaturePill icon={<MessageCircle className="w-4 h-4" />} text="AI Chat" />
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onClick={scrollToUpload}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-all duration-300 animate-pulse-glow"
        >
          Get Started
          <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </motion.button>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

const FeaturePill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 backdrop-blur-sm border border-border rounded-full text-foreground text-sm">
    {icon}
    <span>{text}</span>
  </div>
);
