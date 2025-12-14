import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ChevronRight,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
} from "lucide-react";
import { PROJECTS } from "./data/projects";

function App(): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const offset = 64;
      const elementPosition =
        ref.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "auto",
      });
    }
    setMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-sm z-50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 font-bold text-2xl hover:opacity-80 transition"
            >
              <img src="/logo.png" alt="Khawarizmi" className="h-10 w-auto" />
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8">
              <button
                onClick={scrollToTop}
                className="text-sm font-medium hover:text-indigo-400 transition"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection(showcaseRef)}
                className="text-sm font-medium hover:text-indigo-400 transition"
              >
                Showcase
              </button>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="text-sm font-medium hover:text-indigo-400 transition"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="text-sm font-medium hover:text-indigo-400 transition"
              >
                Contact
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden pb-4 border-t border-slate-700 pt-4"
            >
              <button
                onClick={scrollToTop}
                className="block w-full text-left px-4 py-2 hover:bg-slate-700/50 rounded transition"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection(showcaseRef)}
                className="block w-full text-left px-4 py-2 hover:bg-slate-700/50 rounded transition"
              >
                Showcase
              </button>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="block w-full text-left px-4 py-2 hover:bg-slate-700/50 rounded transition"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="block w-full text-left px-4 py-2 hover:bg-slate-700/50 rounded transition"
              >
                Contact
              </button>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* Personal Intro */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 inline-block"
          >
            <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-sm">
              <p className="text-indigo-400 font-medium text-sm">
                👋 Hi, I'm Khawarizmi
              </p>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            Building Websites That{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Drive Growth
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl sm:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto"
          >
            Fast, Affordable, High-Quality Websites for Small Businesses
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            I specialize in creating modern, responsive websites using React &
            TypeScript. Whether you need a beautiful online presence, e-commerce
            platform, or custom web application, I deliver professional
            solutions that help your business succeed online.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection(contactRef)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/50"
            >
              Get Started <ChevronRight size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection(showcaseRef)}
              className="border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 px-8 py-4 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-all"
            >
              View My Work <ExternalLink size={20} />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-8 max-w-md mx-auto text-center"
          >
            <div>
              <p className="text-3xl font-bold text-indigo-400">3+</p>
              <p className="text-slate-400 text-sm mt-1">Projects Done</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">100%</p>
              <p className="text-slate-400 text-sm mt-1">Satisfaction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-400">⚡</p>
              <p className="text-slate-400 text-sm mt-1">Fast Delivery</p>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <p className="text-sm">Scroll to explore</p>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Showcase Section */}
      <section
        ref={showcaseRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50 border-y border-slate-700"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Recent Projects
            </h2>
            <p className="text-lg text-slate-400">
              Websites that drive results for businesses like yours
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROJECTS.map((project, index) => (
              <motion.a
                key={project.id}
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden border border-slate-600 hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/20">
                  <div className="aspect-video bg-slate-600 overflow-hidden relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 text-indigo-400 group-hover:gap-3 transition-all">
                      <span className="text-sm font-semibold">View Live</span>
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">About Me</h2>
              <p className="text-lg text-slate-400 mb-4">
                I'm a full-stack JavaScript developer specializing in creating
                fast, modern websites for small businesses. With expertise in
                React, TypeScript, and modern web technologies, I deliver
                high-quality solutions that help businesses grow online.
              </p>
              <p className="text-lg text-slate-400 mb-6">
                Every project is built with attention to detail, optimized for
                performance, and designed to convert visitors into customers.
              </p>
              <ul className="space-y-3">
                {[
                  "⚡ Fast Delivery",
                  "💰 Affordable Pricing",
                  "🎯 Results-Driven Design",
                  "📱 Mobile-First Approach",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-2xl opacity-20" />
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 border border-slate-600">
                <p className="text-slate-300 text-center">
                  <span className="text-4xl font-bold text-indigo-400">3+</span>
                  <br />
                  <span className="text-sm text-slate-400">
                    Projects Delivered
                  </span>
                </p>
                <div className="mt-8 pt-8 border-t border-slate-600">
                  <p className="text-slate-300 text-center">
                    <span className="text-4xl font-bold text-purple-400">
                      100%
                    </span>
                    <br />
                    <span className="text-sm text-slate-400">
                      Client Satisfaction
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        ref={contactRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50 border-t border-slate-700"
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Let's Work Together
            </h2>
            <p className="text-lg text-slate-400">
              Ready to build your next website? Get in touch today.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            action="https://formspree.io/f/movgkkab"
            method="POST"
            className="space-y-6 bg-slate-700/30 border border-slate-600 rounded-xl p-8"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                placeholder="Tell me about your project..."
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-indigo-500/50"
            >
              Send Message
            </motion.button>
          </motion.form>

          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">Or reach out directly:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="tel:+60162078144"
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
              >
                📞 +60162078144
              </a>
              <a
                href="mailto:khawarizmijefri02@gmail.com"
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
              >
                <Mail size={18} /> khawarizmijefri02@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <img src="/logo.png" alt="Khawarizmi" className="h-8 w-auto" />
              </div>
              <p className="text-slate-400 text-sm">
                Fast, affordable, high-quality websites for small businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#"
                    onClick={scrollToTop}
                    className="hover:text-indigo-400 transition"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => scrollToSection(showcaseRef)}
                    className="hover:text-indigo-400 transition"
                  >
                    Projects
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => scrollToSection(aboutRef)}
                    className="hover:text-indigo-400 transition"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => scrollToSection(contactRef)}
                    className="hover:text-indigo-400 transition"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Social</h4>
              <div className="flex gap-4">
                <a
                  href="https://github.com/khawarizmi02"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-indigo-400 transition"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
                <a
                  href="https://www.linkedin.com/in/khawarizmi-jefri-268aab236/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-indigo-400 transition"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="mailto:khawarizmijefri02@gmail.com"
                  className="text-slate-400 hover:text-indigo-400 transition"
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024 Khawarizmi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
