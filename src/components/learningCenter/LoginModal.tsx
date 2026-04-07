import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Lock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enrolledCourses } from "@/data/learning";
import { mapRuntimeCourseToStage2CourseId } from "@/data/learningCenter/trackProgress";
import { setUserAuthenticated } from "@/data/sessionAuth";
import { setSessionRole, isTOStage3Role, type SessionRole } from "@/data/sessionRole";

type ModalView = "login" | "signup";

const resolveRoleFromEmail = (email: string): SessionRole => {
  const lower = email.toLowerCase().trim();
  if (lower === "admin@to.dtmp.com") return "to-admin";
  if (lower.endsWith("@to.dtmp.com")) return "to-ops";
  return "business-user";
};

interface LoginModalContext {
  marketplace: string;
  tab: string;
  cardId: string;
  serviceName: string;
  action: string;
  formData?: Record<string, string>;
  dashboardName?: string;
  requestDescription?: string;
  commentText?: string;
  requestMessage?: string;
  sectionRef?: string;
  requestType?: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: LoginModalContext;
  onLoginSuccess?: (email?: string) => void;
}

export function LoginModal({
  isOpen,
  onClose,
  context,
  onLoginSuccess,
}: LoginModalProps) {
  const navigate = useNavigate();

  const [view, setView] = useState<ModalView>("login");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign-up fields
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Reset to login view whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setView("login");
      setLoginEmail("");
      setLoginPassword("");
      setFullName("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setSignupErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Shared post-auth routing ──────────────────────────────────────────────
  const handleAuthenticatedAndRoute = (actorEmail: string) => {
    const role = resolveRoleFromEmail(actorEmail);
    setUserAuthenticated(true);
    setSessionRole(role);

    if (onLoginSuccess) {
      onLoginSuccess(actorEmail);
      return;
    }

    if (isTOStage3Role(role)) {
      navigate("/stage3/dashboard");
      return;
    }

    if (context.marketplace === "support-services" && context.action === "request-service") {
      navigate("/marketplaces/support-services/new-request", { state: context });
      return;
    }

    if (context.marketplace === "solution-specs") {
      navigate("/marketplaces/solution-specs/request", {
        state: { specId: context.cardId, serviceName: context.serviceName },
      });
      return;
    }

    if (context.marketplace === "learning-center") {
      const fallbackCourseId = enrolledCourses[0]?.id ?? "digital-transformation-fundamentals";
      const mappedCourseId =
        mapRuntimeCourseToStage2CourseId(context.cardId) ??
        (enrolledCourses.some((c) => c.id === context.cardId) ? context.cardId : fallbackCourseId);

      navigate(`/stage2/learning-center/course/${mappedCourseId}/user`, {
        state: { ...context, cardId: mappedCourseId, actorEmail, learningRole: "learner" },
      });
      return;
    }

    if (context.marketplace === "knowledge-center") {
      const targetTab = context.action === "save-to-workspace" ? "saved" : "overview";
      navigate(`/stage2/knowledge/${targetTab}`, { state: { ...context, actorEmail } });
      return;
    }

    if (
      context.marketplace === "digital-intelligence" &&
      context.action &&
      context.action !== "View Analytics"
    ) {
      navigate("/stage2/intelligence/requests", { state: { ...context, actorEmail } });
      return;
    }

    if (
      (context.marketplace === "templates" || context.marketplace === "document-studio") &&
      context.action === "request-service"
    ) {
      navigate("/stage2/templates/new-request", {
        state: { ...context, actorEmail, templateId: context.cardId },
      });
      return;
    }

    navigate("/stage2", { state: { ...context, actorEmail } });
  };

  // ── Login submit ──────────────────────────────────────────────────────────
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthenticatedAndRoute(loginEmail.trim());
  };

  // ── Sign-up submit ────────────────────────────────────────────────────────
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (signupPassword.length < 6) errors.signupPassword = "Password must be at least 6 characters.";
    if (signupPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length > 0) { setSignupErrors(errors); return; }
    handleAuthenticatedAndRoute(signupEmail.trim());
  };

  // ── View switching ────────────────────────────────────────────────────────
  const switchToSignup = () => {
    setView("signup");
    setSignupErrors({});
  };

  const switchToLogin = () => {
    setView("login");
  };

  // ── Overlay / keyboard helpers ────────────────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  // ── Derived display values ────────────────────────────────────────────────
  const isSignup = view === "signup";

  const description = isSignup
    ? context.marketplace === "solution-specs"
      ? `Create an account to request the specification package for "${context.serviceName}".`
      : "Create your account to get started."
    : context.marketplace === "solution-specs"
      ? `Log in to request the specification package for "${context.serviceName}".`
      : "Please log in to continue with your enrollment";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={isSignup ? "Create account" : "Login required"}
    >
      <div
        className="bg-white max-w-md w-full rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
          {isSignup
            ? <UserPlus className="w-8 h-8 text-orange-600" />
            : <Lock className="w-8 h-8 text-orange-600" />
          }
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          {isSignup ? "Create Account" : "Login Required"}
        </h2>

        {/* Description */}
        <p className="text-base text-muted-foreground text-center mb-8">
          {description}
        </p>

        {/* ── LOGIN FORM ── */}
        {!isSignup && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Log In
            </Button>
          </form>
        )}

        {/* ── SIGN-UP FORM ── */}
        {isSignup && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-sm font-medium text-foreground">
                Full Name
              </Label>
              <Input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setSignupErrors((p) => ({ ...p, fullName: "" })); }}
                placeholder="Your full name"
                required
                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {signupErrors.fullName && (
                <p className="text-xs text-red-600">{signupErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <Input
                id="signup-password"
                type="password"
                value={signupPassword}
                onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors((p) => ({ ...p, signupPassword: "" })); }}
                placeholder="At least 6 characters"
                required
                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {signupErrors.signupPassword && (
                <p className="text-xs text-red-600">{signupErrors.signupPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <Input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setSignupErrors((p) => ({ ...p, confirmPassword: "" })); }}
                placeholder="Re-enter your password"
                required
                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {signupErrors.confirmPassword && (
                <p className="text-xs text-red-600">{signupErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Create Account
            </Button>
          </form>
        )}

        {/* View toggle */}
        <p className="text-sm text-center text-muted-foreground">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchToSignup}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Sign up
              </button>
            </>
          )}
        </p>

        {/* Demo credential hints */}
        <div className="mt-5 border-t pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Demo credentials
          </p>
          {isSignup ? (
            <div className="space-y-1 text-xs text-gray-500">
              <p>Any email creates a <span className="font-medium text-gray-700">Business User</span> account.</p>
              <p>Use a <span className="font-medium text-gray-700">@to.dtmp.com</span> email for TO Ops access.</p>
              <p className="text-gray-400 mt-1">Password: any value (6+ characters)</p>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-gray-500">
              <p><span className="font-medium text-gray-700">TO Ops:</span> any@to.dtmp.com</p>
              <p><span className="font-medium text-gray-700">TO Admin:</span> admin@to.dtmp.com</p>
              <p><span className="font-medium text-gray-700">Business User:</span> any other email</p>
              <p className="text-gray-400 mt-1">Password: any value</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
