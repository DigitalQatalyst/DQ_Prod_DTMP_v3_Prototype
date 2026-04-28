import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MarketplacesPage from "./pages/MarketplacesPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import LearningCenterPage from "./pages/LearningCenterPage";
import LearningCenterDetailPage from "./pages/LearningCenterDetailPage";
import KnowledgeCenterPage from "./pages/KnowledgeCenterPage";
import KnowledgeCenterDetailPage from "./pages/KnowledgeCenterDetailPage";
import TransactAppPage from "./pages/TransactAppPage";
import Stage2AppPage from "./pages/Stage2AppPage";
import Stage3AppPage from "./pages/Stage3AppPage";
import LCGovernancePage from "./pages/LCGovernancePage";
import DocumentStudioPage from "./pages/TemplatesPage";
import DocumentStudioDetailPage from "./pages/TemplatesDetailPage";
import { SolutionSpecsPage } from "./pages/SolutionSpecsPage";
import { SolutionSpecDetailPage } from "./pages/SolutionSpecDetailPage";
import { SolutionBuildPage } from "./pages/SolutionBuildPage";
import { SolutionBuildDetailPage } from "./pages/SolutionBuildDetailPage";
import SupportServicesPage from "./pages/SupportServicesPage";
import SupportServicesDetailPage from "./pages/SupportServicesDetailPage";
import SupportServicesOverview from "./pages/stage2/support/SupportServicesOverview";
import MyTicketsPage from "./pages/stage2/support/MyTicketsPage";
import TicketDetailPage from "./pages/stage2/support/TicketDetailPage";
import ServiceRequestsPage from "./pages/stage2/support/ServiceRequestsPage";
import { default as SupportRequestDetailPage } from "./pages/stage2/support/RequestDetailPage";
import KnowledgeBasePage from "./pages/stage2/support/KnowledgeBasePage";
import ArticleDetailPage from "./pages/stage2/support/ArticleDetailPage";
import PortfolioManagementPage from "./pages/PortfolioManagementPage";
import PortfolioDetailPage from "./pages/PortfolioDetailPage";
import LifecycleManagementPage from "./pages/LifecycleManagementPage";
import LifecycleDetailPage from "./pages/LifecycleDetailPage";
import LCFrameworkDetailPage from "./pages/lifecycle/LCFrameworkDetailPage";
import LCInitiativeDetailPage from "./pages/lifecycle/LCInitiativeDetailPage";
import LCStage2Overview from "./pages/lifecycle/LCStage2Overview";
import LCStage3Page from "./pages/lifecycle/LCStage3Page";
import PMStage3Page from "./pages/portfolio/PMStage3Page";
import DivisionalLandingPage from "./pages/DivisionalLandingPage";
import NotFound from "./pages/NotFound";
import DigitalIntelligencePage from "./pages/DigitalIntelligencePage";
import DigitalIntelligenceDetailPage from "./pages/DigitalIntelligenceDetailPage";
import FourDModelPage from "./pages/FourDModelPage";
import MethodologyPage from "./pages/MethodologyPage";
import ExecutionStreamsPage from "./pages/ExecutionStreamsPage";
import TransformationOfficePage from "./pages/TransformationOfficePage";
import OnboardingPage from "./pages/OnboardingPage";
import { isUserAuthenticated } from "./data/sessionAuth";
import { getSessionRole, isTOStage3Role } from "./data/sessionRole";

const queryClient = new QueryClient();

const Stage3GuardedRoute = () => {
  const location = useLocation();
  const authenticated = isUserAuthenticated();
  const role = getSessionRole();
  const hasStage3Access = isTOStage3Role(role);

  if (!authenticated) {
    return (
      <Navigate
        to="/marketplaces"
        replace
        state={{ reason: "stage3-auth-required", from: location.pathname }}
      />
    );
  }

  if (!hasStage3Access) {
    return (
      <Navigate
        to="/stage2"
        replace
        state={{
          reason: "stage3-to-role-required",
          from: location.pathname,
          marketplace: "asset-capability",
          serviceName: "Service Hub",
        }}
      />
    );
  }

  return <Stage3AppPage />;
};

const LCStage3GuardedRoute = () => {
  const location = useLocation();
  const authenticated = isUserAuthenticated();
  const role = getSessionRole();
  const hasStage3Access = isTOStage3Role(role);

  if (!authenticated) {
    return (
      <Navigate
        to="/marketplaces/initiative-portfolio"
        replace
        state={{ reason: "stage3-auth-required", from: location.pathname }}
      />
    );
  }

  if (!hasStage3Access) {
    return (
      <Navigate
        to="/stage2/lifecycle-management"
        replace
        state={{ reason: "stage3-to-role-required", from: location.pathname }}
      />
    );
  }

  return <LCStage3Page />;
};

const LCStage2GuardedRoute = () => {
  const location = useLocation();
  const authenticated = isUserAuthenticated();

  if (!authenticated) {
    return (
      <Navigate
        to="/marketplaces/initiative-portfolio"
        replace
        state={{ reason: "stage2-auth-required", from: location.pathname }}
      />
    );
  }

  return <LCStage2Overview />;
};

const PMStage3GuardedRoute = () => {
  const location = useLocation();
  const authenticated = isUserAuthenticated();
  const role = getSessionRole();
  const hasStage3Access = isTOStage3Role(role);

  if (!authenticated) {
    return (
      <Navigate
        to="/marketplaces/asset-capability"
        replace
        state={{ reason: "stage3-auth-required", from: location.pathname }}
      />
    );
  }

  if (!hasStage3Access) {
    return (
      <Navigate
        to="/stage2/portfolio-management"
        replace
        state={{ reason: "stage3-to-role-required", from: location.pathname }}
      />
    );
  }

  return <PMStage3Page />;
};

const LegacyDocumentStudioRedirect = () => {
  const { requestId } = useParams<{ requestId?: string }>();
  if (requestId) {
    return <Navigate to={`/stage2/document-studio/my-requests/${requestId}`} replace />;
  }
  return <Navigate to="/stage2/document-studio/overview" replace />;
};

const KCDetailRedirect = () => {
  const { tab, cardId } = useParams<{ tab: string; cardId: string }>();
  return <Navigate to={`/marketplaces/knowledge/${tab}/${cardId}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplaces" element={<MarketplacesPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* ── Transformation Methodology & Learning ─────────────────────── */}
          <Route path="/marketplaces/learning" element={<LearningCenterPage />} />
          <Route path="/marketplaces/learning/:tab/:cardId" element={<LearningCenterDetailPage />} />
          {/* Legacy redirect */}
          <Route path="/marketplaces/learning-center" element={<Navigate to="/marketplaces/learning" replace />} />
          <Route path="/marketplaces/learning-center/:tab/:cardId" element={<Navigate to="/marketplaces/learning" replace />} />

          {/* ── Knowledge & Best Practices ────────────────────────────────── */}
          <Route path="/marketplaces/knowledge" element={<KnowledgeCenterPage />} />
          <Route path="/marketplaces/knowledge/:tab/:cardId" element={<KnowledgeCenterDetailPage />} />
          {/* Legacy redirects */}
          <Route path="/marketplaces/knowledge-center" element={<Navigate to="/marketplaces/knowledge" replace />} />
          <Route path="/marketplaces/knowledge-center/:tab/:cardId" element={<KCDetailRedirect />} />

          {/* ── Transformation Artefacts (Document Studio) ───────────────── */}
          <Route path="/marketplaces/document-studio" element={<DocumentStudioPage />} />
          <Route path="/marketplaces/document-studio/:tab/:cardId" element={<DocumentStudioDetailPage />} />

          {/* ── Solution Specifications ───────────────────────────────────── */}
          <Route path="/marketplaces/solution-specs" element={<SolutionSpecsPage />} />
          <Route path="/marketplaces/solution-specs/:id" element={<SolutionSpecDetailPage />} />
          {/* Legacy blueprints redirect */}
          <Route path="/marketplaces/blueprints" element={<Navigate to="/marketplaces/solution-specs" replace />} />
          <Route path="/marketplaces/blueprints/:tab/:blueprintId" element={<Navigate to="/marketplaces/solution-specs" replace />} />

          {/* ── Solution Build ────────────────────────────────────────────── */}
          <Route path="/marketplaces/solution-build" element={<SolutionBuildPage />} />
          <Route path="/marketplaces/solution-build/:id" element={<SolutionBuildDetailPage />} />

          {/* ── Initiative & Programme Portfolio ──────────────────────────── */}
          <Route path="/marketplaces/initiative-portfolio" element={<LifecycleManagementPage />} />
          <Route path="/marketplaces/initiative-portfolio/framework/:frameworkId" element={<LCFrameworkDetailPage />} />
          <Route path="/marketplaces/initiative-portfolio/initiative/:id" element={<LCInitiativeDetailPage />} />
          <Route path="/marketplaces/initiative-portfolio/:tab/:cardId" element={<LifecycleDetailPage />} />
          {/* Legacy redirect */}
          <Route path="/marketplaces/lifecycle-management" element={<Navigate to="/marketplaces/initiative-portfolio" replace />} />
          <Route path="/marketplaces/lifecycle-management/framework/:frameworkId" element={<Navigate to="/marketplaces/initiative-portfolio" replace />} />
          <Route path="/marketplaces/lifecycle-management/initiative/:id" element={<Navigate to="/marketplaces/initiative-portfolio" replace />} />
          <Route path="/marketplaces/lifecycle-management/:tab/:cardId" element={<Navigate to="/marketplaces/initiative-portfolio" replace />} />

          {/* ── Asset & Capability Portfolio ──────────────────────────────── */}
          <Route path="/marketplaces/asset-capability" element={<PortfolioManagementPage />} />
          <Route path="/marketplaces/asset-capability/:tab/:cardId" element={<PortfolioDetailPage />} />
          {/* Legacy redirect */}
          <Route path="/marketplaces/portfolio-management" element={<Navigate to="/marketplaces/asset-capability" replace />} />
          <Route path="/marketplaces/portfolio-management/:tab/:cardId" element={<Navigate to="/marketplaces/asset-capability" replace />} />

          {/* ── Transformation Intelligence ───────────────────────────────── */}
          <Route path="/marketplaces/intelligence" element={<DigitalIntelligencePage />} />
          <Route path="/marketplaces/intelligence/:tab/:cardId" element={<DigitalIntelligenceDetailPage />} />
          {/* Legacy redirect */}
          <Route path="/marketplaces/digital-intelligence" element={<Navigate to="/marketplaces/intelligence" replace />} />
          <Route path="/marketplaces/digital-intelligence/:tab/:cardId" element={<Navigate to="/marketplaces/intelligence" replace />} />

          {/* ── Support & Expert Services ─────────────────────────────────── */}
          <Route path="/marketplaces/support" element={<SupportServicesPage />} />
          <Route path="/marketplaces/support/:tab/:cardId" element={<SupportServicesDetailPage />} />
          {/* Legacy redirect */}
          <Route path="/marketplaces/support-services" element={<Navigate to="/marketplaces/support" replace />} />
          <Route path="/marketplaces/support-services/:tab/:cardId" element={<Navigate to="/marketplaces/support" replace />} />

          {/* ── Stage 0 orientation pages ─────────────────────────────────── */}
          <Route path="/4d-model" element={<FourDModelPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/execution-streams" element={<ExecutionStreamsPage />} />
          <Route path="/transformation-office" element={<TransformationOfficePage />} />
          <Route path="/dbp" element={<ComingSoonPage pageName="DBP" />} />

          {/* ── Stage 2 workspace ─────────────────────────────────────────── */}
          <Route path="/transact-app" element={<TransactAppPage />} />
          <Route path="/stage2" element={<Stage2AppPage />} />
          <Route path="/stage2/learning-center" element={<Stage2AppPage />} />
          <Route path="/stage2/learning-center/course/:courseId/:view" element={<Stage2AppPage />} />
          <Route path="/stage2/knowledge" element={<Navigate to="/stage2/knowledge/overview" replace />} />
          <Route path="/stage2/knowledge/:tab" element={<Stage2AppPage />} />
          <Route path="/stage2/knowledge/:tab/:cardId" element={<KnowledgeCenterDetailPage />} />
          <Route path="/stage2/portfolio-management" element={<Stage2AppPage />} />
          <Route path="/stage2/support/overview" element={<SupportServicesOverview />} />
          <Route path="/stage2/support/tickets" element={<MyTicketsPage />} />
          <Route path="/stage2/support/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/stage2/support/requests" element={<ServiceRequestsPage />} />
          <Route path="/stage2/support/requests/:requestId" element={<SupportRequestDetailPage />} />
          <Route path="/stage2/support/knowledge" element={<KnowledgeBasePage />} />
          <Route path="/stage2/support/knowledge/:articleId" element={<ArticleDetailPage />} />
          <Route path="/stage2/specs" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/overview" element={<Stage2AppPage />} />
          <Route path="/stage2/specs/my-requests" element={<Stage2AppPage />} />
          <Route path="/stage2/specs/my-specs" element={<Stage2AppPage />} />
          <Route path="/stage2/specs/revisions" element={<Stage2AppPage />} />
          <Route path="/stage2/specs/blueprints" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/blueprints/:blueprintId" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/templates" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/templates/:specTemplateId" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/patterns" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/patterns/:patternId" element={<Navigate to="/stage2/specs/overview" replace />} />
          <Route path="/stage2/specs/my-designs" element={<Navigate to="/stage2/specs/my-specs" replace />} />
          <Route path="/stage2/specs/my-designs/:designId" element={<Navigate to="/stage2/specs/my-specs" replace />} />
          <Route path="/stage2/templates" element={<LegacyDocumentStudioRedirect />} />
          <Route path="/stage2/templates/overview" element={<LegacyDocumentStudioRedirect />} />
          <Route path="/stage2/templates/library" element={<LegacyDocumentStudioRedirect />} />
          <Route path="/stage2/templates/library/:templateId" element={<LegacyDocumentStudioRedirect />} />
          <Route path="/stage2/templates/new-request" element={<Navigate to="/marketplaces/document-studio" replace />} />
          <Route path="/stage2/templates/my-requests" element={<Navigate to="/stage2/document-studio/my-requests" replace />} />
          <Route path="/stage2/templates/my-requests/:requestId" element={<LegacyDocumentStudioRedirect />} />
          <Route path="/stage2/document-studio" element={<Navigate to="/stage2/document-studio/overview" replace />} />
          <Route path="/stage2/document-studio/:view" element={<Stage2AppPage />} />
          <Route path="/stage2/document-studio/:view/:requestId" element={<Stage2AppPage />} />
          <Route path="/stage2/intelligence" element={<Navigate to="/stage2/intelligence/overview" replace />} />
          <Route path="/stage2/intelligence/:intelligenceTab" element={<Stage2AppPage />} />
          <Route path="/stage2/intelligence/:intelligenceTab/:intelligenceItemId" element={<Stage2AppPage />} />
          <Route path="/stage2/lifecycle-management" element={<LCStage2GuardedRoute />} />
          <Route path="/stage2/lifecycle-management/:initiativeId" element={<LCStage2GuardedRoute />} />
          <Route path="/stage2/lifecycle-management/:initiativeId/projects/:projectId" element={<LCStage2GuardedRoute />} />
          <Route path="/stage2/solution-build" element={<Navigate to="/stage2/solution-build/overview" replace />} />
          <Route path="/stage2/solution-build/:view" element={<Stage2AppPage />} />
          <Route path="/stage2/build" element={<Navigate to="/stage2/solution-build/overview" replace />} />
          <Route path="/stage2/build/overview" element={<Navigate to="/stage2/solution-build/overview" replace />} />
          <Route path="/stage2/build/requests" element={<Navigate to="/stage2/solution-build/my-requests" replace />} />
          <Route path="/stage2/build/deliverables" element={<Navigate to="/stage2/solution-build/deliverables" replace />} />
          <Route path="/stage2/build/revisions" element={<Navigate to="/stage2/solution-build/revisions" replace />} />

          {/* ── Stage 3 T-Office ──────────────────────────────────────────── */}
          <Route path="/stage3" element={<Navigate to="/stage3/dashboard" replace />} />
          <Route path="/stage3/:view" element={<Stage3GuardedRoute />} />
          <Route path="/stage3/document-studio" element={<Navigate to="/stage3/document-studio/overview" replace />} />
          <Route path="/stage3/document-studio/:view" element={<Stage3GuardedRoute />} />
          <Route path="/stage3/document-studio/:view/:requestId" element={<Stage3GuardedRoute />} />
          <Route path="/stage3/solution-specs" element={<Navigate to="/stage3/solution-specs/overview" replace />} />
          <Route path="/stage3/solution-specs/:view" element={<Stage3GuardedRoute />} />
          <Route path="/stage3/solution-build" element={<Navigate to="/stage3/solution-build/overview" replace />} />
          <Route path="/stage3/solution-build/:view" element={<Stage3GuardedRoute />} />
          <Route path="/stage3/learning-centre" element={<Navigate to="/stage3/learning-centre/dashboard" replace />} />
          <Route path="/stage3/learning-centre/:view" element={<LCGovernancePage />} />
          <Route path="/stage3/lifecycle-management" element={<Navigate to="/stage3/lifecycle-management/overview" replace />} />
          <Route path="/stage3/lifecycle-management/:view" element={<LCStage3GuardedRoute />} />
          <Route path="/stage3/portfolio-management" element={<Navigate to="/stage3/portfolio-management/overview" replace />} />
          <Route path="/stage3/portfolio-management/:view" element={<PMStage3GuardedRoute />} />

          {/* ── Division landing pages ────────────────────────────────────── */}
          <Route path="/divisions/:divisionId" element={<DivisionalLandingPage />} />

          {/* ── Resource & placeholder routes ─────────────────────────────── */}
          <Route path="/assets" element={<ComingSoonPage pageName="Assets" />} />
          <Route path="/user-groups" element={<ComingSoonPage pageName="User Groups" />} />
          <Route path="/visualization" element={<ComingSoonPage pageName="Visualization Dashboard" />} />
          <Route path="/best-practices" element={<ComingSoonPage pageName="Best Practices" />} />
          <Route path="/standards" element={<ComingSoonPage pageName="Architecture Standards" />} />
          <Route path="/support" element={<ComingSoonPage pageName="Support Center" />} />
          <Route path="/docs" element={<ComingSoonPage pageName="Documentation" />} />
          <Route path="/compliance" element={<ComingSoonPage pageName="Compliance Tracking" />} />
          <Route path="/faq" element={<ComingSoonPage pageName="FAQ" />} />
          <Route path="/contact" element={<ComingSoonPage pageName="Contact Us" />} />
          <Route path="/privacy" element={<ComingSoonPage pageName="Privacy Policy" />} />
          <Route path="/terms" element={<ComingSoonPage pageName="Terms of Service" />} />

          {/* ── Catch-all ─────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
