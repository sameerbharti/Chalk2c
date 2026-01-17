import { motion } from "framer-motion";
import { GraduationCap, Github, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-xl">
              <GraduationCap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-chalk text-2xl text-foreground">Chalk2Chat</h3>
              <p className="text-sm text-muted-foreground">AI for Every Classroom</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Built with <Heart className="w-4 h-4 text-destructive fill-destructive" /> for the Hackathon
          </p>
        </div>
      </div>
    </footer>
  );
};
