import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Step1Assessment from "./pages/Step1Assessment";
import Step1Results from "./pages/Step1Results";
import MBTIAssessment from "./pages/MBTIAssessment";
import MBTIResults from "./pages/MBTIResults";
import DISCAssessment from "./pages/DISCAssessment";
import DISCResults from "./pages/DISCResults";
import StrengthsAssessment from "./pages/StrengthsAssessment";
import StrengthsResults from "./pages/StrengthsResults";
import SkillPath from "./pages/SkillPath";
import PhasePage from "./pages/PhasePage";
import TaskPage from "./pages/TaskPage";
import AssessmentJourney from "./pages/AssessmentJourney";
import EmailCapture from "./pages/EmailCapture";
import FreeResults from "./pages/FreeResults";
import Paywall from "./pages/Paywall";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import FullAssessment from "./pages/FullAssessment";
import FullResults from "./pages/FullResults";
import Results from "./pages/Results";
import Account from "./pages/Account";
import HumanCoaching from "./pages/HumanCoaching";
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
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/assessment/step1" element={<Step1Assessment />} />
            <Route path="/assessment/step1/results" element={<Step1Results />} />
            <Route path="/assessment/mbti" element={<MBTIAssessment />} />
            <Route path="/assessment/mbti/results" element={<MBTIResults />} />
            <Route path="/assessment/disc" element={<DISCAssessment />} />
            <Route path="/assessment/disc/results" element={<DISCResults />} />
            <Route path="/assessment/strengths" element={<StrengthsAssessment />} />
            <Route path="/assessment/strengths/results" element={<StrengthsResults />} />
            <Route path="/path" element={<SkillPath />} />
            <Route path="/path/phase/:id" element={<PhasePage />} />
            <Route path="/path/task/:id" element={<TaskPage />} />
            {/* Redirects for deprecated routes */}
            <Route path="/strategy" element={<Navigate to="/path" replace />} />
            <Route path="/skill-plan" element={<Navigate to="/path" replace />} />
            <Route path="/weekly" element={<Navigate to="/path" replace />} />
            <Route path="/coaching" element={<Navigate to="/path" replace />} />
            <Route path="/task/today" element={<Navigate to="/path" replace />} />
            <Route path="/history" element={<Navigate to="/welcome" replace />} />
            <Route path="/weekly-execution" element={<Navigate to="/path" replace />} />
            <Route path="/email-capture" element={<EmailCapture />} />
            <Route path="/results/free" element={<FreeResults />} />
            <Route path="/paywall" element={<Paywall />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/assessment/full" element={<FullAssessment />} />
            <Route path="/results/full" element={<FullResults />} />
            <Route path="/results" element={<Results />} />
            <Route path="/account" element={<Account />} />
            <Route path="/human-coaching" element={<HumanCoaching />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
