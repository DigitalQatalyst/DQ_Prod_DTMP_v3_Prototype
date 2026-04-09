import ServiceDashboardPage from "@/pages/stage2/intelligence/ServiceDashboardPage";
import type {
  SystemsPortfolioService,
  DigitalMaturityService,
  ProjectsPortfolioService,
} from "@/data/digitalIntelligence";
import type { DIServiceTab } from "@/data/digitalIntelligence/requestState";

type IntelligenceServiceCard =
  | SystemsPortfolioService
  | DigitalMaturityService
  | ProjectsPortfolioService;

interface IntelligenceDashboardViewProps {
  service: IntelligenceServiceCard;
  tab: DIServiceTab;
}

export function IntelligenceDashboardView({
  service,
  tab,
}: IntelligenceDashboardViewProps) {
  return <ServiceDashboardPage serviceId={service.id} serviceTab={tab} />;
}

