import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LoginModal } from '@/components/learningCenter';
import { isUserAuthenticated } from '@/data/sessionAuth';
import { createDIStage3Intake } from '@/data/stage3/intake';
import type { DIServiceTab } from '@/data/digitalIntelligence/requestState';
import ServiceDashboardPage from '@/pages/stage2/intelligence/ServiceDashboardPage';
import { intelligenceServices } from '@/data/digitalIntelligence/stage2';

export default function DigitalIntelligenceDashboardPage() {
  const { tab, cardId } = useParams<{ tab: string; cardId: string }>();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(() => isUserAuthenticated());
  const [showLoginModal, setShowLoginModal] = useState(() => !isUserAuthenticated());

  const service = intelligenceServices.find(s => s.id === cardId);
  const serviceTitle = service?.title || 'Dashboard';

  useEffect(() => {
    const hasAccess = isUserAuthenticated();
    setAuthenticated(hasAccess);
    setShowLoginModal(!hasAccess);
  }, [cardId, tab]);

  if (!cardId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No service specified.</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Login Required</h1>
            <p className="mt-3 text-gray-600">
              Sign in to access the {serviceTitle} analytics dashboard.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Log In
              </button>
              <button
                onClick={() =>
                  navigate(
                    tab && cardId
                      ? `/marketplaces/digital-intelligence/${tab}/${cardId}`
                      : '/marketplaces/digital-intelligence'
                  )
                }
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </main>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            navigate(
              tab && cardId
                ? `/marketplaces/digital-intelligence/${tab}/${cardId}`
                : '/marketplaces/digital-intelligence'
            );
          }}
          context={{
            marketplace: 'digital-intelligence',
            tab: (tab as DIServiceTab) || 'systems-portfolio',
            cardId: cardId || '',
            serviceName: serviceTitle,
            action: 'View Analytics',
            dashboardName: serviceTitle,
          }}
          onLoginSuccess={(email) => {
            if (service) {
              createDIStage3Intake({
                serviceId: service.id,
                serviceTitle: service.title,
                tab: (tab as DIServiceTab) || 'systems-portfolio',
                requesterName: email?.split('@')[0] || 'Platform User',
                requesterEmail: email || 'unknown@dtmp.local',
                requesterRole: 'Business User',
                message: `Analytics access request for: ${service.title}`,
              });
            }

            setAuthenticated(true);
            setShowLoginModal(false);
          }}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1600px] mx-auto px-6 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
              <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors">Home</button>
              <ChevronRight size={14} className="text-gray-400" />
              <button onClick={() => navigate('/marketplaces')} className="hover:text-gray-900 transition-colors">Marketplaces</button>
              <ChevronRight size={14} className="text-gray-400" />
              <button onClick={() => navigate('/marketplaces/digital-intelligence')} className="hover:text-gray-900 transition-colors">Digital Intelligence</button>
              <ChevronRight size={14} className="text-gray-400" />
              <button onClick={() => navigate(`/marketplaces/digital-intelligence/${tab}/${cardId}`)} className="hover:text-gray-900 transition-colors">{serviceTitle}</button>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-gray-900 font-medium" aria-current="page">Dashboard</span>
            </nav>
          </div>
        </div>

        {/* Full-width dashboard */}
        <div className="max-w-[1600px] mx-auto">
          <ServiceDashboardPage serviceId={cardId} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
