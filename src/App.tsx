import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuraFlow from "./pages/AuraFlow";
import Welcome from "./pages/Welcome";
import SkillPath from "./pages/SkillPath";
import PhasePage from "./pages/PhasePage";
import TaskPage from "./pages/TaskPage";
import Results from "./pages/Results";
import Account from "./pages/Account";
import DISCAssessment from "./pages/DISCAssessment";
import DISCResults from "./pages/DISCResults";
import StrengthsAssessment from "./pages/StrengthsAssessment";
import StrengthsResults from "./pages/StrengthsResults";
import WheelOfLifeAssessment from "./pages/WheelOfLifeAssessment";
import WheelOfLifeResults from "./pages/WheelOfLifeResults";
import BlobTreeAssessment from "./pages/BlobTreeAssessment";
import BlobTreeResults from "./pages/BlobTreeResults";
import ValueMapAssessment from "./pages/ValueMapAssessment";
import ValueMapResults from "./pages/ValueMapResults";
import MyCoach from "./pages/MyCoach";
import BecomeACoach from "./pages/BecomeACoach";
import CoachDashboard from "./pages/CoachDashboard";
import CoachUserProfile from "./pages/CoachUserProfile";
import CoachMessages from "./pages/CoachMessages";
import CoachPathBuilder from "./pages/CoachPathBuilder";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCoachApplications from "./pages/AdminCoachApplications";
import AdminCoaching from "./pages/AdminCoaching";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* Aura onboarding: goal → check-ins → report → path → commit.
                Deep-dive assessments are taken afterwards from /welcome. */}
            <Route path="/aura" element={<AuraFlow />} />
            <Route path="/aura/*" element={<Navigate to="/aura" replace />} />
            {/* Dashboard and skill path */}
            <Route path="/welcome" element={<RequireRole><Welcome /></RequireRole>} />
            <Route path="/path" element={<RequireRole><SkillPath /></RequireRole>} />
            <Route path="/path/phase/:id" element={<RequireRole><PhasePage /></RequireRole>} />
            <Route path="/path/task/:id" element={<RequireRole><TaskPage /></RequireRole>} />
            <Route path="/results" element={<Results />} />
            <Route path="/account" element={<Account />} />
            {/* Deep-dive assessments */}
            <Route path="/assessment/disc" element={<DISCAssessment />} />
            <Route path="/assessment/disc/results" element={<DISCResults />} />
            <Route path="/assessment/strengths" element={<StrengthsAssessment />} />
            <Route path="/assessment/strengths/results" element={<StrengthsResults />} />
            <Route path="/assessment/wheel-of-life" element={<WheelOfLifeAssessment />} />
            <Route path="/assessment/wheel-of-life/results" element={<WheelOfLifeResults />} />
            <Route path="/assessment/blob-tree" element={<BlobTreeAssessment />} />
            <Route path="/assessment/blob-tree/results" element={<BlobTreeResults />} />
            <Route path="/assessment/value-map" element={<ValueMapAssessment />} />
            <Route path="/assessment/value-map/results" element={<ValueMapResults />} />
            {/* Coaching (client side) */}
            <Route path="/my-coach" element={<MyCoach />} />
            <Route path="/become-a-coach" element={<BecomeACoach />} />
            {/* Coach portal */}
            <Route path="/coach" element={<RequireRole role="coach"><CoachDashboard /></RequireRole>} />
            <Route path="/coach/user/:userId" element={<RequireRole role="coach"><CoachUserProfile /></RequireRole>} />
            <Route path="/coach/messages/:userId" element={<RequireRole role="coach"><CoachMessages /></RequireRole>} />
            <Route path="/coach/user/:userId/path" element={<RequireRole role="coach"><CoachPathBuilder /></RequireRole>} />
            {/* Admin */}
            <Route path="/admin/dashboard" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
            <Route path="/admin/coach-applications" element={<RequireRole role="admin"><AdminCoachApplications /></RequireRole>} />
            <Route path="/admin/coaching" element={<RequireRole role="admin"><AdminCoaching /></RequireRole>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
