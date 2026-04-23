import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles, MessageCircle } from "lucide-react";
import { landingColors, landingGradients } from "@/components/landing/theme";

const examplePrompts = [
  "What marketplaces are available?",
  "Explain the 4D Governance Model",
  "How do I submit an EA request?",
  "Take me to the Knowledge Centre",
  "How do I get access?",
];

export function HeroSection() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <section
      className="relative py-10 lg:py-14 flex items-center overflow-hidden"
      style={{
        background: landingGradients.hero,
        minHeight: 580,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: landingGradients.heroGlow,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10 text-center w-full">
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              DTMP — The Transformation Hub
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            The EA Platform{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #bbf7d0 0%, #5eead4 55%, #7dd3fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              for DEWA&apos;s Digital Transformation.
            </span>
          </h1>

          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Governed architecture tools, knowledge resources, and delivery marketplaces —
            empowering DEWA to design, align, and accelerate enterprise-wide digital transformation.
          </p>
        </div>

        <div
          ref={containerRef}
          className={`max-w-2xl mx-auto w-full mb-8 bg-white/95 transition-all overflow-hidden ${
            focused ? "rounded-2xl ring-2 ring-emerald-700 shadow-xl" : "rounded-2xl shadow-lg"
          }`}
        >
          <div className={`px-6 py-5 flex items-center gap-4 ${focused ? "border-b border-slate-100" : ""}`}>
            <Sparkles size={20} className="flex-shrink-0" style={{ color: landingColors.primary }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Ask me anything about DTMP... What do you need help with?"
              className="text-slate-700 text-base flex-1 text-left bg-transparent outline-none placeholder:text-slate-400"
            />
            <span className="flex items-center gap-1.5 text-xs font-semibold shrink-0" style={{ color: landingColors.primary }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: landingColors.primary }} />
              EA Ready
            </span>
            <div className="w-px h-5 bg-slate-200 shrink-0" />
            <MessageCircle
              size={20}
              className="text-slate-400 transition-colors cursor-pointer shrink-0"
              onMouseEnter={(e) => (e.currentTarget.style.color = landingColors.teal)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            />
          </div>

          {focused && (
            <div className="px-6 pt-4 pb-5 text-left">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-3">
                <Sparkles size={13} style={{ color: landingColors.teal }} />
                EA Assistant Examples:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onMouseDown={() => {
                      setQuery(prompt);
                      setFocused(false);
                    }}
                    className="text-sm text-slate-700 font-medium px-4 py-2 rounded-xl border border-slate-200 transition-all"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#86efac";
                      e.currentTarget.style.background = "#f0fdf4";
                      e.currentTarget.style.color = landingColors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.background = "";
                      e.currentTarget.style.color = "";
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <p className="text-xs flex items-center gap-1.5" style={{ color: landingColors.teal }}>
                <Sparkles size={12} />
                Powered by AI — I can explain features, guide you, and help you find what you need
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/marketplaces/learning"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              color: "#fff",
            }}
          >
            <BookOpen size={16} /> Learn to work with DTMP today
          </Link>
          <Link
            to="/marketplaces"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: landingGradients.primary }}
          >
            Explore Marketplaces <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
