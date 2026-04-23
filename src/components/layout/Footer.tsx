import { Link } from "react-router-dom";

// Column 2 — all 9 marketplaces with approved spec names
const platformLinks = [
  { name: "Marketplace Hub", path: "/marketplaces" },
  { name: "Transformation Methodology & Learning", path: "/marketplaces/learning" },
  { name: "Knowledge & Best Practices", path: "/marketplaces/knowledge" },
  { name: "Transformation Artefacts (Document Studio)", path: "/marketplaces/document-studio" },
  { name: "Solution Specifications", path: "/marketplaces/solution-specs" },
  { name: "Solution Build", path: "/marketplaces/solution-build" },
  { name: "Initiative & Programme Portfolio", path: "/marketplaces/initiative-portfolio" },
  { name: "Asset & Capability Portfolio", path: "/marketplaces/asset-capability" },
  { name: "Transformation Intelligence", path: "/marketplaces/intelligence" },
  { name: "Support & Expert Services", path: "/marketplaces/support" },
];

// Column 3 — all 10 DEWA divisions
const divisionLinks = [
  { name: "Generation", path: "/divisions/generation" },
  { name: "Transmission", path: "/divisions/transmission" },
  { name: "Distribution", path: "/divisions/distribution" },
  { name: "Water & Civil", path: "/divisions/water-civil" },
  { name: "Billing Services", path: "/divisions/billing-services" },
  { name: "Innovation & The Future", path: "/divisions/innovation-future" },
  { name: "Power & Water Planning", path: "/divisions/power-water-planning" },
  { name: "Business Support & HR", path: "/divisions/business-support-hr" },
  { name: "Corporate & Strategy", path: "/divisions/corporate" },
  { name: "DEWA Group Subsidiaries", path: "/divisions/subsidiaries" },
];

// Column 4 — Resources (placeholders as per spec)
const resourceLinks = [
  { name: "EA Charter", path: "/marketplaces/knowledge", active: true },
  { name: "User Guides", path: null },
  { name: "Support", path: "/marketplaces/support", active: true },
  { name: "Release Notes", path: null },
  { name: "FAQs", path: null },
];

// Column 5 — Governance (placeholders as per spec)
const governanceLinks = [
  { name: "EA Standards", path: "/marketplaces/knowledge", active: true },
  { name: "Compliance", path: null },
  { name: "Privacy Policy", path: null },
  { name: "Contact EA Office", path: "/marketplaces/support", active: true },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t border-primary-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Column 1 — Logo & Description */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                <img src="/dewa-logo.webp" alt="DEWA logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-2xl font-bold text-primary-foreground">DEWA</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Digital Transformation Management Platform — governed by DEWA's Corporate Enterprise Architecture Office.
            </p>
          </div>

          {/* Column 2 — Platform (Marketplaces) */}
          <div>
            <h3 className="text-sm uppercase font-semibold text-primary-foreground mb-4 tracking-wide">Platform</h3>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors leading-tight block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Divisions */}
          <div>
            <h3 className="text-sm uppercase font-semibold text-primary-foreground mb-4 tracking-wide">Divisions</h3>
            <ul className="space-y-2.5">
              {divisionLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Resources */}
          <div>
            <h3 className="text-sm uppercase font-semibold text-primary-foreground mb-4 tracking-wide">Resources</h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  {link.active && link.path ? (
                    <Link
                      to={link.path}
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-primary-foreground/35 cursor-default">
                      {link.name} <span className="text-[10px]">(coming soon)</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 — Governance */}
          <div>
            <h3 className="text-sm uppercase font-semibold text-primary-foreground mb-4 tracking-wide">Governance</h3>
            <ul className="space-y-2.5">
              {governanceLinks.map((link) => (
                <li key={link.name}>
                  {link.active && link.path ? (
                    <Link
                      to={link.path}
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-primary-foreground/35 cursor-default">
                      {link.name} <span className="text-[10px]">(coming soon)</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/55">
              DEWA | DigitalQatalyst | {new Date().getFullYear()}
            </p>
            <p className="text-sm text-primary-foreground/40">
              Dubai Electricity and Water Authority — Enterprise Architecture Platform
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
