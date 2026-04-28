import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, ArrowRight, ChevronDown, HelpCircle, UserPlus, Navigation,
  MessageSquare, Phone, AlertCircle, GraduationCap, BookOpen, FileText,
  Layout, Hammer, RefreshCw, Briefcase, BarChart3, Search, Bell,
  Mail, MapPin, ChevronLeft, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/learningCenter/LoginModal";
import { isUserAuthenticated } from "@/data/sessionAuth";
import { getSessionRole, isTOStage3Role } from "@/data/sessionRole";
import { useToast } from "@/hooks/use-toast";
import GlobalSearch from "@/components/layout/GlobalSearch";
import NotificationsCenter from "@/components/layout/NotificationsCenter";
import { landingColors, landingGradients } from "@/components/landing/theme";

// ── Marketplace groups ────────────────────────────────────────────────────────
const exploreGroups = [
  {
    phase: "DISCERN",
    color: "#6d28d9",
    items: [
      { icon: GraduationCap, name: "Transformation Methodology & Learning", desc: "Courses, learning tracks, and EA literacy pathways", path: "/marketplaces/learning" },
      { icon: BookOpen, name: "Knowledge & Best Practices", desc: "Standards, governance references, and published architecture outputs", path: "/marketplaces/knowledge" },
    ],
  },
  {
    phase: "DESIGN",
    color: "#0369A1",
    items: [
      { icon: FileText, name: "Transformation Artefacts (Document Studio)", desc: "AI-powered document generation with EA Office fulfilment", path: "/marketplaces/document-studio" },
      { icon: Layout, name: "Solution Specifications", desc: "Architecture blueprints and solution specifications", path: "/marketplaces/solution-specs" },
    ],
  },
  {
    phase: "DEPLOY",
    color: "#16A34A",
    items: [
      { icon: Hammer, name: "Solution Build", desc: "Implementation resources and delivery support", path: "/marketplaces/solution-build" },
    ],
  },
  {
    phase: "DRIVE",
    color: "#D97706",
    items: [
      { icon: RefreshCw, name: "Initiative & Programme Portfolio", desc: "Stage-gated initiative governance across enterprise programmes", path: "/marketplaces/initiative-portfolio" },
      { icon: Briefcase, name: "Asset & Capability Portfolio", desc: "IT/OT asset landscape mapped to EA capability domains", path: "/marketplaces/asset-capability" },
      { icon: BarChart3, name: "Transformation Intelligence", desc: "Programme health, maturity intelligence, and EA reports", path: "/marketplaces/intelligence" },
      { icon: HelpCircle, name: "Support & Expert Services", desc: "Platform support, data corrections, and EA advisory", path: "/marketplaces/support" },
    ],
  },
];

// ── Help option definitions ───────────────────────────────────────────────────
type HelpModalKey = "register" | "navigation" | "complaint" | "bug";

const helpOptions: {
  icon: React.ElementType;
  label: string;
  desc: string;
  action: HelpModalKey | "contact";
}[] = [
  { icon: UserPlus,     label: "Register / Request Access", desc: "Get access to the DEWA EA Platform",       action: "register"   },
  { icon: Navigation,   label: "Navigation Issue",          desc: "Something isn't where you expected",       action: "navigation" },
  { icon: MessageSquare,label: "Submit a Complaint",        desc: "Report a problem or raise a concern",      action: "complaint"  },
  { icon: Phone,        label: "Contact the EA Office",     desc: "Speak directly with the EA team",          action: "contact"    },
  { icon: AlertCircle,  label: "Something Isn't Working",   desc: "Report a technical issue",                 action: "bug"        },
];

// ── Shared modal shell ────────────────────────────────────────────────────────
function ModalShell({
  title, subtitle, onClose, onSubmit, submitLabel = "Submit", children,
}: {
  title: string; subtitle: string; onClose: () => void;
  onSubmit: () => void; submitLabel?: string; children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,40,0.7)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-base font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors ml-4 mt-0.5">
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-4">{children}</div>
        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg inline-flex items-center gap-2 transition-colors"
            style={{ background: landingGradients.secondary }}
          >
            <Send size={14} /> {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared field components ───────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors";
const selectCls = inputCls + " bg-white";
const textareaCls = inputCls + " resize-none";

// ─────────────────────────────────────────────────────────────────────────────
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAccessLogin, setShowAccessLogin]   = useState(false);
  const [showExplore, setShowExplore]           = useState(false);
  const [showHelp, setShowHelp]                 = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [showSearch, setShowSearch]             = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled]                 = useState(false);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<HelpModalKey | null>(null);

  // Register form
  const [reg, setReg] = useState({ name: "", email: "", division: "", role: "", reason: "" });
  // Navigation feedback form
  const [nav, setNav] = useState({ looking: "", expected: "", page: "" });
  // Complaint form
  const [complaint, setComplaint] = useState({ type: "", description: "", email: "" });
  // Bug report form
  const [bug, setBug] = useState({ url: "", tried: "", happened: "" });

  const location  = useLocation();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const exploreRef = useRef<HTMLDivElement>(null);
  const helpRef    = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  const authenticated = isUserAuthenticated();

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 10); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setShowExplore(false);
      if (helpRef.current    && !helpRef.current.contains(e.target as Node))    { setShowHelp(false); setShowContactPanel(false); }
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
      if (e.key === "Escape") { setActiveModal(null); setShowSearch(false); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowExplore(false);
    setShowHelp(false);
    setShowContactPanel(false);
  }, [location.pathname]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleExploreNav = (path: string) => {
    navigate(path);
    setShowExplore(false);
    setIsMobileMenuOpen(false);
  };

  const handleAccessPlatform = () => {
    if (isUserAuthenticated()) {
      const role = getSessionRole();
      if (isTOStage3Role(role)) { navigate("/stage3/dashboard"); return; }
      navigate("/stage2"); return;
    }
    setShowAccessLogin(true);
  };

  const openHelpOption = (action: HelpModalKey | "contact") => {
    setShowHelp(false);
    setIsMobileMenuOpen(false);
    if (action === "contact") {
      // Re-open help dropdown in contact-panel mode
      setShowHelp(true);
      setShowContactPanel(true);
      return;
    }
    if (action === "bug") {
      setBug({ url: window.location.href, tried: "", happened: "" });
    }
    setActiveModal(action);
  };

  const closeModal = () => {
    setActiveModal(null);
    setReg({ name: "", email: "", division: "", role: "", reason: "" });
    setNav({ looking: "", expected: "", page: "" });
    setComplaint({ type: "", description: "", email: "" });
    setBug({ url: "", tried: "", happened: "" });
  };

  const submitToast = (message: string) => {
    toast({ title: "Request received", description: message });
    closeModal();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          background: scrolled ? "rgba(4, 47, 46, 0.92)" : "#042f2e",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.05)",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">

            {/* Left — Logo + Explore */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 shrink-0">
                <img src="/dewa-logo-v2.png" alt="DEWA logo" className="w-9 h-9 object-contain" />
                <span className="text-2xl font-bold text-white tracking-tight">DEWA</span>
              </Link>

              {/* Desktop — Explore dropdown */}
              <div className="hidden lg:flex items-center" ref={exploreRef}>
                <button
                  onClick={() => { setShowExplore((v) => !v); setShowHelp(false); setShowContactPanel(false); }}
                  className="flex items-center gap-1.5 text-base font-semibold text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Explore
                  <ChevronDown size={17} className={`transition-transform ${showExplore ? "rotate-180" : ""}`} />
                </button>

                {showExplore && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                      <p className="text-base font-bold text-slate-900">EA Navigation</p>
                      <p className="text-xs text-slate-500 mt-0.5">Marketplaces and reference pages organised by 4D governance phase</p>
                    </div>
                    <div className="py-2 max-h-[520px] overflow-y-auto">
                      {exploreGroups.map((group) => (
                        <div key={group.phase}>
                          <div className="px-5 pt-3 pb-1.5 flex items-center gap-2">
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                              style={{ color: group.color, background: group.color + "18" }}
                            >
                              {group.phase}
                            </span>
                          </div>
                          {group.items.map((item) => (
                            <button
                              key={item.path}
                              onClick={() => handleExploreNav(item.path)}
                              className="w-full flex items-start gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors text-left"
                            >
                              <item.icon size={16} className="mt-0.5 shrink-0" style={{ color: group.color }} />
                              <div>
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 px-5 py-3">
                      <button
                        onClick={() => handleExploreNav("/marketplaces")}
                        className="text-xs font-semibold transition-colors flex items-center gap-1"
                        style={{ color: landingColors.teal }}
                      >
                        View all marketplaces <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Desktop */}
            <div className="hidden lg:flex items-center gap-2">

              {/* Search icon */}
              <button
                onClick={() => setShowSearch(true)}
                title="Search (Ctrl+K)"
                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <Search size={17} />
              </button>

              {/* Notification bell — authenticated only */}
              {authenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setShowNotifications((v) => !v); setShowHelp(false); }}
                    className="relative flex items-center text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                    title="Notifications"
                  >
                    <Bell size={17} />
                    <span id="notif-badge" className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full hidden" />
                  </button>
                  {showNotifications && (
                    <NotificationsCenter onClose={() => setShowNotifications(false)} />
                  )}
                </div>
              )}

              {/* Get Help button + dropdown */}
              <div className="relative" ref={helpRef}>
                <button
                  onClick={() => { setShowHelp((v) => !v); setShowExplore(false); if (showHelp) setShowContactPanel(false); }}
                  className="flex items-center gap-1.5 text-base font-semibold text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <HelpCircle size={16} />
                  Get Help
                </button>

                {showHelp && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
                    {!showContactPanel ? (
                      /* ── Options list ── */
                      <>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 pb-2">
                          How can we help?
                        </p>
                        {helpOptions.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => openHelpOption(opt.action)}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                          >
                            <opt.icon size={16} className="mt-0.5 shrink-0" style={{ color: landingColors.teal }} />
                            <div>
                              <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      /* ── Contact sub-panel ── */
                      <>
                        <button
                          onClick={() => setShowContactPanel(false)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 pb-3 transition-colors"
                        >
                          <ChevronLeft size={13} /> Back
                        </button>
                        <div className="px-4 pb-2">
                          <p className="text-sm font-bold text-slate-900 mb-1">EA Office Contact</p>
                          <p className="text-xs text-slate-500 mb-4">
                            Reach out directly for governance queries, access requests, or delivery discussions.
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Mail size={15} className="mt-0.5 shrink-0" style={{ color: landingColors.teal }} />
                              <div>
                                <p className="text-xs font-semibold text-slate-700">Email</p>
                                <p className="text-xs text-slate-500">ea-office@dewa.gov.ae</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <MessageSquare size={15} className="mt-0.5 shrink-0" style={{ color: landingColors.teal }} />
                              <div>
                                <p className="text-xs font-semibold text-slate-700">Microsoft Teams</p>
                                <p className="text-xs text-slate-500">DEWA EA Platform — General Channel</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: landingColors.teal }} />
                              <div>
                                <p className="text-xs font-semibold text-slate-700">Office</p>
                                <p className="text-xs text-slate-500">DEWA HQ, Innovation Hub, Level 4</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Phone size={15} className="mt-0.5 shrink-0" style={{ color: landingColors.teal }} />
                              <div>
                                <p className="text-xs font-semibold text-slate-700">Response Time</p>
                                <p className="text-xs text-slate-500">Within 2 working days for all enquiries</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Enter the Platform */}
              <Button
                variant="default"
                onClick={handleAccessPlatform}
                className="bg-accent hover:bg-orange-hover text-accent-foreground px-5 py-2.5 rounded-lg font-semibold inline-flex items-center gap-2 text-base"
              >
                Enter the Platform
                <ArrowRight size={15} />
              </Button>
            </div>

            {/* Mobile — search + hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <button onClick={() => setShowSearch(true)} className="text-white/80 p-2 hover:text-white transition-colors">
                <Search size={18} />
              </button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAccessPlatform}
                className="bg-accent hover:bg-orange-hover text-accent-foreground rounded-lg font-semibold text-xs px-3"
              >
                Enter
              </Button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2" aria-label="Toggle menu">
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, #064e3b 0%, #0f766e 58%, #164e63 100%)" }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src="/dewa-logo-new.webp" alt="DEWA logo" className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-xl font-bold text-white">DEWA</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2">
                  <X size={22} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 overflow-y-auto">
                {exploreGroups.map((group) => (
                  <div key={group.phase} className="mb-4">
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-2 px-2" style={{ color: group.color }}>
                      {group.phase}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleExploreNav(item.path)}
                          className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
                        >
                          <item.icon size={15} style={{ color: group.color }} className="shrink-0" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2 px-2">Get Help</p>
                  <div className="space-y-0.5">
                    {helpOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => openHelpOption(opt.action)}
                        className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>

              <div className="px-4 pb-8 space-y-3">
                {authenticated && (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setShowNotifications(true); }}
                    className="w-full flex items-center justify-center gap-2 border border-white/20 text-white py-3 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors"
                  >
                    <Bell size={16} /> Notifications
                  </button>
                )}
                <Button
                  onClick={() => { setIsMobileMenuOpen(false); handleAccessPlatform(); }}
                  className="w-full bg-accent hover:bg-orange-hover text-accent-foreground py-4 rounded-lg font-semibold text-base inline-flex items-center justify-center gap-2"
                >
                  Enter the Platform <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Global overlays ────────────────────────────────────────────────────── */}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      <LoginModal
        isOpen={showAccessLogin}
        onClose={() => setShowAccessLogin(false)}
        context={{ marketplace: "platform", tab: "overview", cardId: "access-platform", serviceName: "DEWA EA Platform", action: "access-platform" }}
      />

      {/* ── Register / Request Access ──────────────────────────────────────────── */}
      {activeModal === "register" && (
        <ModalShell
          title="Register / Request Access"
          subtitle="The EA Office will review your request and respond within 2 working days."
          onClose={closeModal}
          submitLabel="Submit Request"
          onSubmit={() => submitToast("Your access request has been received. The EA Office will be in touch within 2 working days.")}
        >
          <Field label="Full Name">
            <input className={inputCls} placeholder="e.g. Ahmed Al Rashidi" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
          </Field>
          <Field label="Work Email">
            <input className={inputCls} type="email" placeholder="name@dewa.gov.ae" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
          </Field>
          <Field label="Division">
            <select className={selectCls} value={reg.division} onChange={(e) => setReg({ ...reg, division: e.target.value })}>
              <option value="">Select your division</option>
              <option>Generation</option>
              <option>Transmission</option>
              <option>Distribution</option>
              <option>Water &amp; Civil Division</option>
              <option>Billing Services Division</option>
              <option>Innovation &amp; The Future Division</option>
              <option>Power &amp; Water Planning</option>
              <option>Business Support &amp; HR</option>
              <option>Corporate &amp; Strategy</option>
              <option>DEWA Group Subsidiaries</option>
              <option>Transformation Office</option>
            </select>
          </Field>
          <Field label="Your Role">
            <select className={selectCls} value={reg.role} onChange={(e) => setReg({ ...reg, role: e.target.value })}>
              <option value="">Select your role</option>
              <option>Enterprise Architect / EA Office</option>
              <option>Senior Leadership &amp; Executive</option>
              <option>Divisional Transformation Lead</option>
              <option>Project Manager / Programme Lead</option>
              <option>Transformation Office — Delivery &amp; Admin</option>
              <option>General Staff</option>
            </select>
          </Field>
          <Field label="Why do you need access?">
            <textarea className={textareaCls} rows={3} placeholder="Briefly describe your use case or the work you'll be doing on the platform..." value={reg.reason} onChange={(e) => setReg({ ...reg, reason: e.target.value })} />
          </Field>
        </ModalShell>
      )}

      {/* ── Navigation Issue ──────────────────────────────────────────────────── */}
      {activeModal === "navigation" && (
        <ModalShell
          title="Navigation Issue"
          subtitle="Help us understand where the platform fell short so we can fix it."
          onClose={closeModal}
          submitLabel="Send Feedback"
          onSubmit={() => submitToast("Navigation feedback submitted. Thank you — this helps us improve the platform.")}
        >
          <Field label="What were you looking for?">
            <input className={inputCls} placeholder="e.g. The stage gate compliance dashboard" value={nav.looking} onChange={(e) => setNav({ ...nav, looking: e.target.value })} />
          </Field>
          <Field label="Where did you expect to find it?">
            <input className={inputCls} placeholder="e.g. Under the Lifecycle marketplace, Drive phase" value={nav.expected} onChange={(e) => setNav({ ...nav, expected: e.target.value })} />
          </Field>
          <Field label="Which page were you on?">
            <input className={inputCls} placeholder="Page URL or name" value={nav.page || location.pathname} onChange={(e) => setNav({ ...nav, page: e.target.value })} />
          </Field>
        </ModalShell>
      )}

      {/* ── Submit a Complaint ────────────────────────────────────────────────── */}
      {activeModal === "complaint" && (
        <ModalShell
          title="Submit a Complaint"
          subtitle="Your complaint will be logged and reviewed by the EA Office within 3 working days."
          onClose={closeModal}
          submitLabel="Submit Complaint"
          onSubmit={() => submitToast("Your complaint has been received. The EA Office will review and respond within 3 working days.")}
        >
          <Field label="Issue Type">
            <select className={selectCls} value={complaint.type} onChange={(e) => setComplaint({ ...complaint, type: e.target.value })}>
              <option value="">Select issue type</option>
              <option>Platform Issue</option>
              <option>Content Issue</option>
              <option>Process Issue</option>
              <option>Access / Permissions Issue</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Description">
            <textarea className={textareaCls} rows={4} placeholder="Describe the issue clearly, including any relevant context or steps that led to it..." value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} />
          </Field>
          <Field label="Your Contact Email (optional)">
            <input className={inputCls} type="email" placeholder="name@dewa.gov.ae" value={complaint.email} onChange={(e) => setComplaint({ ...complaint, email: e.target.value })} />
          </Field>
        </ModalShell>
      )}

      {/* ── Something Isn't Working ───────────────────────────────────────────── */}
      {activeModal === "bug" && (
        <ModalShell
          title="Something Isn't Working"
          subtitle="Report a technical issue and the platform team will investigate."
          onClose={closeModal}
          submitLabel="Send Report"
          onSubmit={() => submitToast("Bug report submitted. The technical team will investigate and follow up if needed.")}
        >
          <Field label="Page URL">
            <input className={inputCls} value={bug.url} onChange={(e) => setBug({ ...bug, url: e.target.value })} />
          </Field>
          <Field label="What were you trying to do?">
            <textarea className={textareaCls} rows={2} placeholder="e.g. Clicking 'Submit' on the initiative request form..." value={bug.tried} onChange={(e) => setBug({ ...bug, tried: e.target.value })} />
          </Field>
          <Field label="What happened instead?">
            <textarea className={textareaCls} rows={2} placeholder="e.g. Page went blank / error message appeared / nothing happened..." value={bug.happened} onChange={(e) => setBug({ ...bug, happened: e.target.value })} />
          </Field>
        </ModalShell>
      )}
    </>
  );
}
